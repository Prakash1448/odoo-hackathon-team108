from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Dict, Any

from app.database.session import get_db
from app.models.inventory import Inventory, Warehouse
from app.models.product import Product

router = APIRouter(prefix="/api/inventory", tags=["Inventory"])

@router.get("")
def get_inventory_map(db: Session = Depends(get_db)):
    """
    Returns inventory formatted as { productId: { warehouseName: availableQty } }
    matching the existing frontend initialInventory shape.
    """
    records = db.query(Inventory).all()
    inventory_map: Dict[str, Dict[str, int]] = {}
    for r in records:
        if r.product_id not in inventory_map:
            inventory_map[r.product_id] = {}
        inventory_map[r.product_id][r.warehouse_id] = r.quantity_available
    return inventory_map

@router.get("/summary")
def get_inventory_summary(db: Session = Depends(get_db)):
    records = db.query(Inventory).all()
    summary = []
    for r in records:
        summary.append({
            "warehouseId": r.warehouse_id,
            "productId": r.product_id,
            "productName": r.product.name if r.product else r.product_id,
            "available": r.quantity_available,
            "reserved": r.quantity_reserved
        })
    return summary
