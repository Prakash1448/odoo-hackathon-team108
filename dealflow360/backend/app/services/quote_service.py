from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from decimal import Decimal
import uuid
from datetime import datetime

from app.models.quote import Quote, QuoteItem
from app.models.product import Product
from app.models.customer import Customer, CustomerTier
from app.models.approval import Approval
from app.models.rules import ApprovalRule
from app.models.user import User

class QuoteService:
    @staticmethod
    def calculate_quote_financials(db: Session, lines_data: list, customer_tier: CustomerTier):
        """
        Authoritative calculation of subtotal, discount, amount, cost, and margin
        using database product pricing and costs.
        """
        subtotal = Decimal("0.00")
        total_discount_amount = Decimal("0.00")
        total_cost = Decimal("0.00")
        processed_lines = []

        for item in lines_data:
            product_id = getattr(item, "productId", None)
            if not product_id and hasattr(item, "product") and item.product:
                product_id = getattr(item.product, "id", None)
            elif not product_id and isinstance(item, dict):
                product_id = item.get("productId") or (item.get("product", {}).get("id") if isinstance(item.get("product"), dict) else None)

            if not product_id:
                continue

            product = db.query(Product).filter(Product.id == product_id).first()
            if not product:
                raise HTTPException(status_code=400, detail=f"Product not found: {product_id}")

            quantity = getattr(item, "quantity", 1) if not isinstance(item, dict) else item.get("quantity", 1)
            line_disc = getattr(item, "discount", 0.0) if not isinstance(item, dict) else item.get("discount", 0.0)
            
            quantity = max(1, int(quantity))
            line_disc = Decimal(str(max(0.0, min(100.0, float(line_disc)))))

            unit_price = Decimal(str(product.price))
            unit_cost = Decimal(str(product.cost))

            line_sub = unit_price * Decimal(quantity)
            line_disc_amt = line_sub * (line_disc / Decimal("100.00"))
            line_tot = line_sub - line_disc_amt
            line_cst = unit_cost * Decimal(quantity)
            line_mrg = ((line_tot - line_cst) / line_tot * Decimal("100.00")) if line_tot > 0 else Decimal("0.00")

            subtotal += line_sub
            total_discount_amount += line_disc_amt
            total_cost += line_cst

            processed_lines.append({
                "product": product,
                "quantity": quantity,
                "unit_price": unit_price,
                "unit_cost": unit_cost,
                "discount": line_disc,
                "line_subtotal": line_sub,
                "line_discount_amount": line_disc_amt,
                "line_total": line_tot,
                "line_cost": line_cst,
                "line_margin": line_mrg
            })

        final_total = subtotal - total_discount_amount
        blended_margin_amount = final_total - total_cost
        blended_margin_pct = ((blended_margin_amount / final_total) * Decimal("100.00")) if final_total > 0 else Decimal("0.00")
        avg_discount = ((total_discount_amount / subtotal) * Decimal("100.00")) if subtotal > 0 else Decimal("0.00")

        return {
            "subtotal": round(subtotal, 2),
            "discount_amount": round(total_discount_amount, 2),
            "final_total": round(final_total, 2),
            "total_cost": round(total_cost, 2),
            "margin_amount": round(blended_margin_amount, 2),
            "margin_percentage": round(blended_margin_pct, 2),
            "avg_discount": round(avg_discount, 2),
            "lines": processed_lines
        }

    @staticmethod
    def evaluate_approval_rules(db: Session, customer: Customer, discount_pct: Decimal, margin_pct: Decimal, amount: Decimal):
        """
        Data-driven approval routing (Outcome 1)
        Checks approval_rules table and customer tier limits.
        """
        tier = customer.tier
        is_approval_required = False
        required_role = "sales-manager"
        reasons = []

        # Check customer tier auto-approval limits
        if tier and discount_pct > tier.max_auto_approval_discount:
            is_approval_required = True
            reasons.append(f"Discount {discount_pct:.1f}% exceeds {tier.name} limit ({tier.max_auto_approval_discount:.1f}%)")

        if margin_pct < Decimal("20.00"):
            is_approval_required = True
            reasons.append(f"Blended margin {margin_pct:.1f}% falls below minimum 20.0% threshold")

        # Query database approval rules ordered by priority descending
        matching_rules = db.query(ApprovalRule).filter(
            ApprovalRule.is_active == True,
            ApprovalRule.min_discount <= discount_pct,
            ApprovalRule.max_discount >= discount_pct,
            ApprovalRule.min_amount <= amount
        ).order_by(ApprovalRule.priority.desc()).all()

        for rule in matching_rules:
            # If rule has a min_margin threshold, it only triggers if actual margin is below that threshold
            if rule.min_margin is not None and margin_pct >= rule.min_margin:
                continue

            if rule.customer_tier is None or (tier and rule.customer_tier == tier.id):
                is_approval_required = True
                required_role = rule.required_role
                reasons.append(f"Triggered rule: '{rule.name}' (Requires {rule.required_role.replace('-', ' ').title()})")
                break

        # High discount over 20% routes to finance or senior management
        if discount_pct > Decimal("20.00"):
            required_role = "finance"

        risk_level = "Low"
        risk_score = 10
        if is_approval_required:
            if discount_pct > Decimal("20.00") or margin_pct < Decimal("15.00"):
                risk_level = "High"
                risk_score = 85
            else:
                risk_level = "Moderate"
                risk_score = 50

        return {
            "is_approval_required": is_approval_required,
            "required_role": required_role,
            "reasons": reasons,
            "risk_level": risk_level,
            "risk_score": risk_score
        }

    @staticmethod
    def create_or_update_quote(db: Session, quote_data: dict, current_user: User):
        quote_id = quote_data.get("id") or f"QT-2026-{uuid.uuid4().hex[:4].upper()}"
        customer_name_or_id = quote_data.get("customer") or quote_data.get("customerId")

        customer = db.query(Customer).filter(
            (Customer.id == customer_name_or_id) | (Customer.name == customer_name_or_id)
        ).first()

        if not customer:
            raise HTTPException(status_code=400, detail=f"Customer not found: {customer_name_or_id}")

        lines = quote_data.get("lines", [])
        if not lines:
            raise HTTPException(status_code=400, detail="Cannot submit an empty quotation")

        # Calculate authoritative numbers
        calc = QuoteService.calculate_quote_financials(db, lines, customer.tier)
        
        # Evaluate approval routing
        eval_result = QuoteService.evaluate_approval_rules(
            db, customer, calc["avg_discount"], calc["margin_percentage"], calc["final_total"]
        )

        desired_status = quote_data.get("status")
        if eval_result["is_approval_required"]:
            final_status = "Pending Approval"
        else:
            final_status = "Sent" if desired_status == "Sent" else "Approved"

        # Check existing quote
        existing_quote = db.query(Quote).filter(Quote.id == quote_id).first()
        if existing_quote:
            existing_quote.customer_id = customer.id
            existing_quote.subtotal = calc["subtotal"]
            existing_quote.discount = calc["avg_discount"]
            existing_quote.discount_amount = calc["discount_amount"]
            existing_quote.amount = calc["final_total"]
            existing_quote.cost = calc["total_cost"]
            existing_quote.margin = calc["margin_percentage"]
            existing_quote.risk = eval_result["risk_level"]
            existing_quote.risk_score = eval_result["risk_score"]
            existing_quote.status = final_status
            existing_quote.updated_at = datetime.utcnow()
            quote = existing_quote

            # Clear existing items
            db.query(QuoteItem).filter(QuoteItem.quote_id == quote_id).delete()
        else:
            quote = Quote(
                id=quote_id,
                customer_id=customer.id,
                owner_user_id=current_user.id,
                subtotal=calc["subtotal"],
                discount=calc["avg_discount"],
                discount_amount=calc["discount_amount"],
                amount=calc["final_total"],
                cost=calc["total_cost"],
                margin=calc["margin_percentage"],
                risk=eval_result["risk_level"],
                risk_score=eval_result["risk_score"],
                status=final_status
            )
            db.add(quote)

        db.flush()

        # Insert line items
        for idx, line in enumerate(calc["lines"]):
            qi = QuoteItem(
                id=f"qi-{uuid.uuid4().hex[:8]}",
                quote_id=quote.id,
                product_id=line["product"].id,
                quantity=line["quantity"],
                unit_price=line["unit_price"],
                unit_cost=line["unit_cost"],
                discount=line["discount"],
                line_subtotal=line["line_subtotal"],
                line_discount_amount=line["line_discount_amount"],
                line_total=line["line_total"],
                line_cost=line["line_cost"],
                line_margin=line["line_margin"]
            )
            db.add(qi)

        # If approval required, create approval record
        if eval_result["is_approval_required"]:
            existing_app = db.query(Approval).filter(Approval.quote_id == quote.id, Approval.status == "Pending Approval").first()
            if not existing_app:
                approval = Approval(
                    id=f"app-{uuid.uuid4().hex[:6]}",
                    quote_id=quote.id,
                    requested_by_user_id=current_user.id,
                    required_role=eval_result["required_role"],
                    status="Pending Approval",
                    reason="; ".join(eval_result["reasons"])
                )
                db.add(approval)

        db.commit()
        db.refresh(quote)
        return quote
