
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
import sqlite3

router = APIRouter(
    prefix="/bag",
    tags=["Bag"]
)


conn = sqlite3.connect("DGCS.db", check_same_thread=False)
cursor = conn.cursor()

ALL_CLUBS = [
    "Driver", "3-Wood", "5-Wood", "3-Hybrid", "4-Hybrid", "5-Hybrid",
    "4-Iron", "5-Iron", "6-Iron", "7-Iron", "8-Iron", "9-Iron",
    "PW", "GW", "SW", "LW"
]


class ClubItem(BaseModel):
    name: str
    yardage: str
    dispersion: str


class BagRequest(BaseModel):
    player_id: str
    clubs: List[ClubItem]


@router.post("/save_bag")
def save_bag(data: BagRequest):
    cursor.execute("SELECT * FROM player_data WHERE player_id=?", (data.player_id,))
    existing = cursor.fetchone()

    if not existing:
        clubs_data = {club: "NaN" for club in ALL_CLUBS}
        clubs_disp = {f"{club}_Dispersion": "NaN" for club in ALL_CLUBS}

        for c in data.clubs:
            if c.name in ALL_CLUBS:
                clubs_data[c.name] = c.yardage
                clubs_disp[f"{c.name}_Dispersion"] = c.dispersion

        cursor.execute("""
            INSERT INTO player_data (
                player_id, 
                Age, Gender, HCP,
                Driver, Driver_Dispersion,
                "3-Wood", "3-Wood_Dispersion",
                "5-Wood", "5-Wood_Dispersion",
                "3-Hybrid", "3-Hybrid_Dispersion",
                "4-Hybrid", "4-Hybrid_Dispersion",
                "5-Hybrid", "5-Hybrid_Dispersion",
                "4-Iron", "4-Iron_Dispersion",
                "5-Iron", "5-Iron_Dispersion",
                "6-Iron", "6-Iron_Dispersion",
                "7-Iron", "7-Iron_Dispersion",
                "8-Iron", "8-Iron_Dispersion",
                "9-Iron", "9-Iron_Dispersion",
                "PW", "PW_Dispersion",
                "GW", "GW_Dispersion",
                "SW", "SW_Dispersion",
                "LW", "LW_Dispersion"
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        """, (
            data.player_id, None, None, 0,  # placeholders for Age/Gender/HCP
            clubs_data["Driver"], clubs_disp["Driver_Dispersion"],
            clubs_data["3-Wood"], clubs_disp["3-Wood_Dispersion"],
            clubs_data["5-Wood"], clubs_disp["5-Wood_Dispersion"],
            clubs_data["3-Hybrid"], clubs_disp["3-Hybrid_Dispersion"],
            clubs_data["4-Hybrid"], clubs_disp["4-Hybrid_Dispersion"],
            clubs_data["5-Hybrid"], clubs_disp["5-Hybrid_Dispersion"],
            clubs_data["4-Iron"], clubs_disp["4-Iron_Dispersion"],
            clubs_data["5-Iron"], clubs_disp["5-Iron_Dispersion"],
            clubs_data["6-Iron"], clubs_disp["6-Iron_Dispersion"],
            clubs_data["7-Iron"], clubs_disp["7-Iron_Dispersion"],
            clubs_data["8-Iron"], clubs_disp["8-Iron_Dispersion"],
            clubs_data["9-Iron"], clubs_disp["9-Iron_Dispersion"],
            clubs_data["PW"], clubs_disp["PW_Dispersion"],
            clubs_data["GW"], clubs_disp["GW_Dispersion"],
            clubs_data["SW"], clubs_disp["SW_Dispersion"],
            clubs_data["LW"], clubs_disp["LW_Dispersion"]
        ))
    else:
        clubs_data = {club: "NaN" for club in ALL_CLUBS}
        clubs_disp = {f"{club}_Dispersion": "NaN" for club in ALL_CLUBS}

        for c in data.clubs:
            if c.name in ALL_CLUBS:
                clubs_data[c.name] = c.yardage
                clubs_disp[f"{c.name}_Dispersion"] = c.dispersion

        cursor.execute("""
            UPDATE player_data
            SET
                Driver=?, Driver_Dispersion=?,
                "3-Wood"=?, "3-Wood_Dispersion"=?,
                "5-Wood"=?, "5-Wood_Dispersion"=?,
                "3-Hybrid"=?, "3-Hybrid_Dispersion"=?,
                "4-Hybrid"=?, "4-Hybrid_Dispersion"=?,
                "5-Hybrid"=?, "5-Hybrid_Dispersion"=?,
                "4-Iron"=?, "4-Iron_Dispersion"=?,
                "5-Iron"=?, "5-Iron_Dispersion"=?,
                "6-Iron"=?, "6-Iron_Dispersion"=?,
                "7-Iron"=?, "7-Iron_Dispersion"=?,
                "8-Iron"=?, "8-Iron_Dispersion"=?,
                "9-Iron"=?, "9-Iron_Dispersion"=?,
                "PW"=?, "PW_Dispersion"=?,
                "GW"=?, "GW_Dispersion"=?,
                "SW"=?, "SW_Dispersion"=?,
                "LW"=?, "LW_Dispersion"=?
            WHERE player_id=?
        """, (
            clubs_data["Driver"], clubs_disp["Driver_Dispersion"],
            clubs_data["3-Wood"], clubs_disp["3-Wood_Dispersion"],
            clubs_data["5-Wood"], clubs_disp["5-Wood_Dispersion"],
            clubs_data["3-Hybrid"], clubs_disp["3-Hybrid_Dispersion"],
            clubs_data["4-Hybrid"], clubs_disp["4-Hybrid_Dispersion"],
            clubs_data["5-Hybrid"], clubs_disp["5-Hybrid_Dispersion"],
            clubs_data["4-Iron"], clubs_disp["4-Iron_Dispersion"],
            clubs_data["5-Iron"], clubs_disp["5-Iron_Dispersion"],
            clubs_data["6-Iron"], clubs_disp["6-Iron_Dispersion"],
            clubs_data["7-Iron"], clubs_disp["7-Iron_Dispersion"],
            clubs_data["8-Iron"], clubs_disp["8-Iron_Dispersion"],
            clubs_data["9-Iron"], clubs_disp["9-Iron_Dispersion"],
            clubs_data["PW"], clubs_disp["PW_Dispersion"],
            clubs_data["GW"], clubs_disp["GW_Dispersion"],
            clubs_data["SW"], clubs_disp["SW_Dispersion"],
            clubs_data["LW"], clubs_disp["LW_Dispersion"],
            data.player_id
        ))

    conn.commit()
    return {"message": "Bag saved successfully"}
