
import sqlite3
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/bag", tags=["Bag"])


conn = sqlite3.connect("DGCS.db", check_same_thread=False)

CLUB_COLUMNS = [
    ("Driver", "Driver_Dispersion"),
    ("3-Wood", "3-Wood_Dispersion"),
    ("5-Wood", "5-Wood_Dispersion"),
    ("3-Hybrid", "3-Hybrid_Dispersion"),
    ("4-Hybrid", "4-Hybrid_Dispersion"),
    ("5-Hybrid", "5-Hybrid_Dispersion"),
    ("4-Iron", "4-Iron_Dispersion"),
    ("5-Iron", "5-Iron_Dispersion"),
    ("6-Iron", "6-Iron_Dispersion"),
    ("7-Iron", "7-Iron_Dispersion"),
    ("8-Iron", "8-Iron_Dispersion"),
    ("9-Iron", "9-Iron_Dispersion"),
    ("PW", "PW_Dispersion"),
    ("GW", "GW_Dispersion"),
    ("SW", "SW_Dispersion"),
    ("LW", "LW_Dispersion"),
]


@router.get("/{player_id}")
def get_bag(player_id: str):
    """
    Fetches the bag data for the given player_id.
    Returns an array of { name, yardage, dispersion } objects for each non-NaN club.
    """
    c = conn.cursor()
    try:

        columns_str = ", ".join(f'"{carry}", "{disp}"' for (carry, disp) in CLUB_COLUMNS)

        query = f"""
            SELECT {columns_str}
            FROM player_data  
            WHERE player_id = ?
        """
        c.execute(query, (player_id,))
        row = c.fetchone()
    finally:
        c.close()

    if not row:
        raise HTTPException(status_code=404, detail="No bag found for this player.")

    clubs_response = []
    idx = 0
    for (carry_col, disp_col) in CLUB_COLUMNS:
        carry_val = row[idx]
        dispersion_val = row[idx + 1]
        idx += 2

        if carry_val and carry_val != "NaN":
            clubs_response.append({
                "name": carry_col,
                "yardage": carry_val,
                "dispersion": "" if (not dispersion_val or dispersion_val == "NaN") else dispersion_val
            })

    return {"clubs": clubs_response}
