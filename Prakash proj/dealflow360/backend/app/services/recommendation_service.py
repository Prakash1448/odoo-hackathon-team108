from sqlalchemy.orm import Session
from typing import List, Dict, Any
from decimal import Decimal
from app.models.rules import UpsellRule
from app.models.product import Product

class RecommendationService:
    @staticmethod
    def get_live_recommendations(db: Session, cart_items: List[Dict[str, Any]], current_discount: float = 0.0) -> List[Dict[str, Any]]:
        """
        Outcome 2: Live upsell and cross-sell engine with real-time margin impact.
        Accepts unsaved quote preview items.
        """
        if not cart_items:
            return []

        # Extract product IDs and quantities in current quote lines
        current_product_ids = set()
        current_subtotal = Decimal("0.00")
        current_cost = Decimal("0.00")

        for item in cart_items:
            pid = item.get("productId") or (item.get("product", {}).get("id") if isinstance(item.get("product"), dict) else None)
            if pid:
                current_product_ids.add(pid)
                p = db.query(Product).filter(Product.id == pid).first()
                if p:
                    qty = Decimal(str(item.get("quantity", 1)))
                    line_disc = Decimal(str(item.get("discount", current_discount)))
                    price = Decimal(str(p.price))
                    cost = Decimal(str(p.cost))
                    
                    sub = price * qty
                    tot = sub - (sub * (line_disc / Decimal("100.00")))
                    cst = cost * qty

                    current_subtotal += tot
                    current_cost += cst

        current_margin_pct = ((current_subtotal - current_cost) / current_subtotal * Decimal("100.00")) if current_subtotal > 0 else Decimal("0.00")

        # Query active upsell rules from database
        active_rules = db.query(UpsellRule).filter(UpsellRule.active == True).all()
        recommendations = []

        # Check triggered rules
        for rule in active_rules:
            # If trigger product is in quote AND recommended product is not already added
            if rule.trigger_product_id in current_product_ids and rule.rec_product_id not in current_product_ids:
                rec_prod = db.query(Product).filter(Product.id == rule.rec_product_id).first()
                if not rec_prod:
                    continue

                add_rev = Decimal(str(rec_prod.price))
                add_cst = Decimal(str(rec_prod.cost))
                add_margin = add_rev - add_cst

                # Calculate simulated blended margin with this recommendation added
                new_subtotal = current_subtotal + add_rev
                new_cost = current_cost + add_cst
                new_margin_pct = ((new_subtotal - new_cost) / new_subtotal * Decimal("100.00")) if new_subtotal > 0 else Decimal("0.00")
                margin_impact_pct = new_margin_pct - current_margin_pct

                recommendations.append({
                    "id": f"rec-{rule.id}",
                    "type": rule.type,
                    "title": rule.title,
                    "explanation": rule.explanation or f"Pairing with {rule.trigger_product.name} improves system capability.",
                    "confidence": rule.confidence,
                    "impact": {
                        "revenue": float(add_rev),
                        "cost": float(add_cst),
                        "margin": float(add_margin),
                        "marginImpact": round(float(margin_impact_pct), 2)
                    },
                    "recommendedAction": "Add to Quote",
                    "productRef": rule.rec_product_id
                })

        # Fallback category-based recommendation if hardware exists and no rule hit
        has_hardware = any(
            (db.query(Product).filter(Product.id == pid, Product.category == "Hardware").first() is not None)
            for pid in current_product_ids
        )
        if has_hardware and "p-5" not in current_product_ids and not any(r["productRef"] == "p-5" for r in recommendations):
            p5 = db.query(Product).filter(Product.id == "p-5").first()
            if p5:
                add_rev = Decimal(str(p5.price))
                add_cst = Decimal(str(p5.cost))
                add_margin = add_rev - add_cst
                new_sub = current_subtotal + add_rev
                new_cst = current_cost + add_cst
                new_mrg = ((new_sub - new_cst) / new_sub * Decimal("100.00")) if new_sub > 0 else Decimal("0.00")

                recommendations.append({
                    "id": "rec-ai-hw-support",
                    "type": "Cross-sell",
                    "title": "Premium Support Plan (Annual)",
                    "explanation": "Customers purchasing hardware frequently pair with 24/7 Enterprise Support.",
                    "confidence": 89,
                    "impact": {
                        "revenue": float(add_rev),
                        "cost": float(add_cst),
                        "margin": float(add_margin),
                        "marginImpact": round(float(new_mrg - current_margin_pct), 2)
                    },
                    "recommendedAction": "Add to Quote",
                    "productRef": "p-5"
                })

        return recommendations
