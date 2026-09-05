from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import datetime, timedelta
from decimal import Decimal
import uuid

from app.models.order import Order
from app.models.subscription import Subscription
from app.models.invoice import Invoice, InvoiceItem
from app.models.product import Product

class BillingService:
    @staticmethod
    def generate_order_invoicing_and_subscriptions(db: Session, order_id: str):
        """
        Outcome 4: Processes mixed orders (one-time lines + recurring subscription lines).
        Generates initial invoice and recurring subscriptions.
        """
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")

        # Check existing invoice
        existing_invoice = db.query(Invoice).filter(Invoice.order_id == order_id).first()
        if not existing_invoice:
            invoice_id = f"INV-{order_id.replace('ORD-', '')}"
            subtotal = Decimal(str(order.amount))
            tax = subtotal * Decimal("0.08")  # standard 8% tax
            total_amount = subtotal + tax

            invoice = Invoice(
                id=invoice_id,
                order_id=order.id,
                quote_id=order.quote_id,
                customer_id=order.customer_id,
                subtotal=subtotal,
                tax=tax,
                amount=total_amount,
                status="Unpaid",
                issue_date=datetime.utcnow(),
                due_date=datetime.utcnow() + timedelta(days=30)
            )
            db.add(invoice)

            # Add invoice items from order items
            for oi in order.items:
                desc = f"{oi.product.name} ({'Subscription' if oi.is_recurring else 'One-time'})" if oi.product else "Order Item"
                inv_item = InvoiceItem(
                    id=f"ii-{uuid.uuid4().hex[:8]}",
                    invoice_id=invoice.id,
                    product_id=oi.product_id,
                    description=desc,
                    quantity=oi.quantity,
                    unit_price=oi.unit_price,
                    amount=oi.line_total,
                    is_prorated=False
                )
                db.add(inv_item)

        # Generate recurring subscriptions for subscription lines
        for oi in order.items:
            if oi.product and oi.product.category == "Subscriptions":
                existing_sub = db.query(Subscription).filter(
                    Subscription.order_id == order.id,
                    Subscription.product_id == oi.product_id
                ).first()

                if not existing_sub:
                    sub_id = f"SUB-{order_id.replace('ORD-', '')}-{oi.product_id}"
                    sub = Subscription(
                        id=sub_id,
                        order_id=order.id,
                        customer_id=order.customer_id,
                        product_id=oi.product_id,
                        plan_name=oi.product.name,
                        quantity=oi.quantity,
                        amount=oi.line_total,
                        billing_frequency="Monthly" if oi.billing_frequency == "monthly" else "Annual",
                        start_date=datetime.utcnow(),
                        next_billing_date=datetime.utcnow() + timedelta(days=30),
                        status="Active"
                    )
                    db.add(sub)

        db.commit()
        return {"success": True, "message": "Invoices and subscriptions processed successfully"}

    @staticmethod
    def modify_subscription_with_proration(db: Session, subscription_id: str, new_quantity: int):
        """
        Outcome 4: Proration Engine
        Formula:
          Days Remaining in Cycle = (next_billing_date - today).days
          Delta Units = new_quantity - old_quantity
          Unit Price = current_amount / old_quantity
          Prorated Charge = Delta Units * Unit Price * (Days Remaining / Total Days In Month)
        """
        sub = db.query(Subscription).filter(Subscription.id == subscription_id).first()
        if not sub:
            raise HTTPException(status_code=404, detail="Subscription not found")

        old_qty = sub.quantity
        if new_quantity == old_qty:
            return sub

        total_days_in_period = 30
        now = datetime.utcnow()
        days_remaining = max(1, (sub.next_billing_date - now).days)
        unit_price = Decimal(str(sub.amount)) / Decimal(str(old_qty))
        delta_qty = new_quantity - old_qty

        # Proration calculation
        prorated_adjustment = round((Decimal(delta_qty) * unit_price * Decimal(days_remaining) / Decimal(total_days_in_period)), 2)

        # Update subscription
        new_regular_amount = unit_price * Decimal(new_quantity)
        sub.quantity = new_quantity
        sub.amount = new_regular_amount
        sub.status = "Active"

        # Generate Prorated Invoice if quantity increased
        if prorated_adjustment > 0:
            prorated_inv_id = f"INV-PRORATE-{uuid.uuid4().hex[:6].upper()}"
            tax = prorated_adjustment * Decimal("0.08")
            inv = Invoice(
                id=prorated_inv_id,
                order_id=sub.order_id,
                customer_id=sub.customer_id,
                subtotal=prorated_adjustment,
                tax=tax,
                amount=prorated_adjustment + tax,
                status="Unpaid",
                issue_date=now,
                due_date=now + timedelta(days=15)
            )
            db.add(inv)

            inv_item = InvoiceItem(
                id=f"ii-{uuid.uuid4().hex[:8]}",
                invoice_id=inv.id,
                product_id=sub.product_id,
                description=f"Prorated upgrade: {sub.plan_name} (+{delta_qty} seats for {days_remaining} remaining days)",
                quantity=delta_qty,
                unit_price=unit_price,
                amount=prorated_adjustment,
                is_prorated=True
            )
            db.add(inv_item)

        db.commit()
        db.refresh(sub)
        return sub
