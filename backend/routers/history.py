"""
routers/history.py
Endpoint to fetch prediction history with pagination.
"""
from fastapi import APIRouter, Query
from typing import Optional

from services.database_service import get_prediction_history, get_prediction_count

router = APIRouter(prefix="/prediction_history", tags=["History"])


@router.get("")
def fetch_history(
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    category: Optional[str] = Query(None, description="Filter by Category"),
    commodity: Optional[str] = Query(None, description="Filter by Commodity"),
    food_type: str = Query("tomato", description="Filter by Food Type"),
):
    """
    Returns a paginated list of predictions saved in SQLite database.
    """
    try:
        target = commodity or food_type or "tomato"
        history = get_prediction_history(
            food_type=target,
            limit=limit,
            offset=offset,
            category=category,
        )
        total_count = get_prediction_count(target)
        return {
            "success": True,
            "commodity": target,
            "total": total_count,
            "limit": limit,
            "offset": offset,
            "data": history,
        }
    except Exception as e:
        return {"success": False, "error": str(e)}
