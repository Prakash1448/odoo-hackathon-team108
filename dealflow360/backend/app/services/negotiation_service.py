from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from decimal import Decimal
from datetime import datetime
import uuid

from app.models.quote import Quote
from app.models.negotiation import NegotiationLog
from app.models.approval import Approval
from app.models.order import Order, OrderItem
from app.models.user import User
from app.models.customer import Customer
from app.services.billing_service import BillingService

class NegotiationService:
    @staticmethod
    def verify_customer_access(quote: Quote, current_user: User):
        """
        Outcome 6 Security requirement:
        Ensures customer users can ONLY access quotes belonging to their company.
        """
        if current_user.role == "customer":
            customer_match = (
                (quote.customer and quote.customer.name.lower() == (current_user.company or "").lower()) or
                (quote.customer and current_user.email.lower() in quote.customer.contact_email.lower()) or
                (quote.customer_id == current_user.id)
            )
            if not customer_match:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied: You are not authorized to view or negotiate this quotation."
                )

    @staticmethod
    def submit_counter_offer(db: Session, quote_id: str, proposed_discount: float, comment: str, current_user: User):
        quote = db.query(Quote).filter(Quote.id == quote_id).first()
        if not quote:
            raise HTTPException(status_code=404, detail="Quotation not found")

        NegotiationService.verify_customer_access(quote, current_user)

        if proposed_discount <= 0 or proposed_discount >= 100:
            raise HTTPException(status_code=400, detail="Proposed discount must be between 1% and 99%")

        disc_dec = Decimal(str(proposed_discount))
        # Calculate proposed total
        original_base = Decimal(str(quote.subtotal))
        proposed_total = original_base - (original_base * (disc_dec / Decimal("100.00")))

        # Preserve negotiation history in database
        log_entry = NegotiationLog(
            quote_id=quote.id,
            sender_type="Customer",
            sender_name=current_user.name,
            message=comment or f"Proposed counter-offer discount of {proposed_discount}%",
            proposed_discount=disc_dec,
            proposed_amount=proposed_total,
            created_at=datetime.utcnow()
        )
        db.add(log_entry)

        # Check if counter-offer discount requires manager approval
        tier = quote.customer.tier if quote.customer else None
        tier_max = tier.max_auto_approval_discount if tier else Decimal("15.00")

        if disc_dec > Decimal("20.00") or disc_dec > tier_max:
            quote.status = "Pending Approval"
            # Create or update approval record
            approval = Approval(
                id=f"app-neg-{uuid.uuid4().hex[:6]}",
                quote_id=quote.id,
                requested_by_user_id=current_user.id,
                required_role="sales-manager",
                status="Pending Approval",
                reason=f"Customer requested counter-offer discount of {proposed_discount}% (Threshold: {tier_max}%)"
            )
            db.add(approval)
        else:
            quote.status = "Under Negotiation"

        quote.customer_proposed_discount = disc_dec
        quote.updated_at = datetime.utcnow()

        db.commit()
        return {
            "success": True,
            "message": "Counter offer submitted successfully and logged to negotiation history",
            "status": quote.status,
            "proposedAmount": float(proposed_total)
        }

    @staticmethod
    def accept_and_confirm_quote(db: Session, quote_id: str, current_user: User):
        quote = db.query(Quote).filter(Quote.id == quote_id).first()
        if not quote:
            raise HTTPException(status_code=404, detail="Quotation not found")

        NegotiationService.verify_customer_access(quote, current_user)

        quote.status = "Confirmed"
        quote.updated_at = datetime.utcnow()

        # Check existing order
        existing_order = db.query(Order).filter(Order.quote_id == quote.id).first()
        if not existing_order:
            order_id = f"ORD-{quote.id.replace('QT-', '')}"
            order = Order(
                id=order_id,
                quote_id=quote.id,
                customer_id=quote.customer_id,
                amount=quote.amount,
                status="Processing"
            )
            db.add(order)
            db.flush()

            for qi in quote.items:
                is_sub = qi.product.category == "Subscriptions" if qi.product else False
                oi = OrderItem(
                    id=f"oi-{uuid.uuid4().hex[:8]}",
                    order_id=order.id,
                    product_id=qi.product_id,
                    quantity=qi.quantity,
                    unit_price=qi.unit_price,
                    line_total=qi.line_total,
                    is_recurring=is_sub,
                    billing_frequency="monthly" if is_sub else "one_time"
                )
                db.add(oi)

            db.commit()
            # Initialize billing & invoices
            BillingService.generate_order_invoicing_and_subscriptions(db, order.id)

        db.commit()
        return {
            "success": True,
            "message": f"Quotation {quote.id} confirmed. Order created and sent to fulfillment.",
            "status": "Confirmed"
        }
