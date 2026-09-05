from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import List, Dict, Any
import uuid

from app.models.order import Order, OrderItem
from app.models.inventory import Warehouse, Inventory, InventoryAllocation
from app.models.product import Product

class FulfillmentService:
    @staticmethod
    def get_auto_allocation_split(db: Session, order_id: str) -> Dict[str, Any]:
        """
        Calculates automatic multi-warehouse split based on real inventory.
        """
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")

        recommended_splits = {}
        insufficient_items = []

        for item in order.items:
            # Skip non-physical items
            if item.product and item.product.category in ["Services", "Subscriptions"]:
                continue

            product_id = item.product_id
            remaining_to_fill = item.quantity

            # Query stock across all active warehouses
            inventory_records = db.query(Inventory).filter(
                Inventory.product_id == product_id,
                Inventory.quantity_available > 0
            ).all()

            split = {}
            for inv in inventory_records:
                if remaining_to_fill <= 0:
                    break
                alloc_qty = min(inv.quantity_available, remaining_to_fill)
                if alloc_qty > 0:
                    split[inv.warehouse_id] = alloc_qty
                    remaining_to_fill -= alloc_qty

            recommended_splits[product_id] = split
            if remaining_to_fill > 0:
                insufficient_items.append({
                    "productId": product_id,
                    "productName": item.product.name if item.product else product_id,
                    "requested": item.quantity,
                    "backordered": remaining_to_fill
                })

        return {
            "orderId": order_id,
            "recommendedSplits": recommended_splits,
            "hasBackorder": len(insufficient_items) > 0,
            "backorderItems": insufficient_items
        }

    @staticmethod
    def apply_warehouse_split(db: Session, order_id: str, splits: List[Dict[str, Any]], is_manual_override: bool = False):
        """
        Applies warehouse allocations and atomically deducts inventory.
        Validates available stock to prevent negative inventory.
        """
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")

        # Clear existing allocations for this order if re-allocating
        db.query(InventoryAllocation).filter(InventoryAllocation.order_id == order_id).delete()

        for split in splits:
            product_id = split.get("productId")
            warehouse_id = split.get("warehouse")
            quantity = int(split.get("quantity", 0))

            if quantity <= 0:
                continue

            inv = db.query(Inventory).filter(
                Inventory.product_id == product_id,
                Inventory.warehouse_id == warehouse_id
            ).with_for_update().first()

            if not inv:
                raise HTTPException(
                    status_code=400,
                    detail=f"No inventory record found for Product {product_id} in {warehouse_id}"
                )

            if inv.quantity_available < quantity:
                raise HTTPException(
                    status_code=400,
                    detail=f"Insufficient inventory in {warehouse_id} for Product {product_id}. Available: {inv.quantity_available}, Requested: {quantity}"
                )

            # Deduct stock atomically
            inv.quantity_available -= quantity
            inv.quantity_reserved += quantity

            allocation = InventoryAllocation(
                id=f"alloc-{uuid.uuid4().hex[:8]}",
                order_id=order_id,
                product_id=product_id,
                warehouse_id=warehouse_id,
                quantity=quantity,
                is_manual_override=is_manual_override
            )
            db.add(allocation)

        order.status = "Warehouse Allocation"
        db.commit()
        return {"success": True, "message": "Warehouse allocation applied successfully", "status": order.status}

    @staticmethod
    def ship_order(db: Session, order_id: str):
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")

        # Move reserved stock out of inventory
        allocations = db.query(InventoryAllocation).filter(InventoryAllocation.order_id == order_id).all()
        for alloc in allocations:
            inv = db.query(Inventory).filter(
                Inventory.product_id == alloc.product_id,
                Inventory.warehouse_id == alloc.warehouse_id
            ).first()
            if inv and inv.quantity_reserved >= alloc.quantity:
                inv.quantity_reserved -= alloc.quantity

        order.status = "Shipped"
        db.commit()
        return {"success": True, "message": "Order marked as shipped", "status": "Shipped"}
