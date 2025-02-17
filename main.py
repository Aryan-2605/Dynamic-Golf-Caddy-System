import sqlite3
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, Optional



#Run this in console before running SQL commands
#  uvicorn main:app --host 0.0.0.0 --port 8000 --reload
#  uvicorn main:app --host 192.168.97.22 --port 8000 --reload

app = FastAPI()



conn = sqlite3.connect("users.db", check_same_thread=False)
cursor = conn.cursor()

cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        player_id TEXT PRIMARY KEY,
        password TEXT NOT NULL
    )
""")
conn.commit()

cursor.execute("""
    CREATE TABLE IF NOT EXISTS player_data (
        player_id TEXT PRIMARY KEY,
        Age INTEGER,
        Gender TEXT,
        HCP REAL,
        Driver TEXT DEFAULT 'NaN', Driver_Dispersion TEXT DEFAULT 'NaN',
        "3-Wood" TEXT DEFAULT 'NaN', "3-Wood_Dispersion" TEXT DEFAULT 'NaN',
        "5-Wood" TEXT DEFAULT 'NaN', "5-Wood_Dispersion" TEXT DEFAULT 'NaN',
        "3-Hybrid" TEXT DEFAULT 'NaN', "3-Hybrid_Dispersion" TEXT DEFAULT 'NaN',
        "4-Hybrid" TEXT DEFAULT 'NaN', "4-Hybrid_Dispersion" TEXT DEFAULT 'NaN',
        "5-Hybrid" TEXT DEFAULT 'NaN', "5-Hybrid_Dispersion" TEXT DEFAULT 'NaN',
        "4-Iron" TEXT DEFAULT 'NaN', "4-Iron_Dispersion" TEXT DEFAULT 'NaN',
        "5-Iron" TEXT DEFAULT 'NaN', "5-Iron_Dispersion" TEXT DEFAULT 'NaN',
        "6-Iron" TEXT DEFAULT 'NaN', "6-Iron_Dispersion" TEXT DEFAULT 'NaN',
        "7-Iron" TEXT DEFAULT 'NaN', "7-Iron_Dispersion" TEXT DEFAULT 'NaN',
        "8-Iron" TEXT DEFAULT 'NaN', "8-Iron_Dispersion" TEXT DEFAULT 'NaN',
        "9-Iron" TEXT DEFAULT 'NaN', "9-Iron_Dispersion" TEXT DEFAULT 'NaN',
        "PW" TEXT DEFAULT 'NaN', "PW_Dispersion" TEXT DEFAULT 'NaN',
        "GW" TEXT DEFAULT 'NaN', "GW_Dispersion" TEXT DEFAULT 'NaN',
        "SW" TEXT DEFAULT 'NaN', "SW_Dispersion" TEXT DEFAULT 'NaN',
        "LW" TEXT DEFAULT 'NaN', "LW_Dispersion" TEXT DEFAULT 'NaN',
        FOREIGN KEY (player_id) REFERENCES users(player_id)
    )
""")
conn.commit()


class User(BaseModel):
    player_id: str
    password: str

class GolfBag(BaseModel):
    player_id: str
    Age: int
    Gender: str
    HCP: float
    clubs: Dict[str, Optional[str]]


def add_manual_users():
    users = [("2001", "1234"), ("2002", "1234"), ("2003", "1234")]
    cursor.executemany("INSERT OR IGNORE INTO users VALUES (?, ?)", users)
    conn.commit()


add_manual_users()


@app.post("/login")
def login(user: User):
    cursor.execute("SELECT password FROM users WHERE player_id=?", (user.player_id,))
    result = cursor.fetchone()

    if not result or result[0] != user.password:
        raise HTTPException(status_code=400, detail="Invalid username or password")

    return {
        "message": "Login successful",
        "player_id": user.player_id  # Include player_id in response
    }

@app.post("/save_golf_bag")
def save_golf_bag(data: GolfBag):
    cursor.execute("SELECT * FROM player_data WHERE player_id=?", (data.player_id,))
    existing_data = cursor.fetchone()

    # Ensure all clubs and dispersion values have a default "NaN"
    club_data = {club: data.clubs.get(club, "NaN") for club in [
        "Driver", "3-Wood", "5-Wood", "3-Hybrid", "4-Hybrid", "5-Hybrid",
        "4-Iron", "5-Iron", "6-Iron", "7-Iron", "8-Iron", "9-Iron",
        "PW", "GW", "SW", "LW"
    ]}

    dispersion_data = {f"{club}_Dispersion": data.clubs.get(f"{club}_Dispersion", "NaN") for club in club_data}

    # Combine values
    values = (
        data.player_id, data.Age, data.Gender, data.HCP,
        *club_data.values(), *dispersion_data.values()
    )

    # Ensure values length matches the columns count (36)
    while len(values) < 36:
        values += ("NaN",)

    if existing_data:
        cursor.execute("""
            UPDATE player_data SET Age=?, Gender=?, HCP=?, 
            Driver=?, Driver_Dispersion=?, "3-Wood"=?, "3-Wood_Dispersion"=?, 
            "5-Wood"=?, "5-Wood_Dispersion"=?, "3-Hybrid"=?, "3-Hybrid_Dispersion"=?, 
            "4-Hybrid"=?, "4-Hybrid_Dispersion"=?, "5-Hybrid"=?, "5-Hybrid_Dispersion"=?,
            "4-Iron"=?, "4-Iron_Dispersion"=?, "5-Iron"=?, "5-Iron_Dispersion"=?,
            "6-Iron"=?, "6-Iron_Dispersion"=?, "7-Iron"=?, "7-Iron_Dispersion"=?,
            "8-Iron"=?, "8-Iron_Dispersion"=?, "9-Iron"=?, "9-Iron_Dispersion"=?,
            "PW"=?, "PW_Dispersion"=?, "GW"=?, "GW_Dispersion"=?, 
            "SW"=?, "SW_Dispersion"=?, "LW"=?, "LW_Dispersion"=?
            WHERE player_id=?
        """, (*values, data.player_id))
    else:
        cursor.execute("""
            INSERT INTO player_data (player_id, Age, Gender, HCP, 
            Driver, Driver_Dispersion, "3-Wood", "3-Wood_Dispersion", 
            "5-Wood", "5-Wood_Dispersion", "3-Hybrid", "3-Hybrid_Dispersion",
            "4-Hybrid", "4-Hybrid_Dispersion", "5-Hybrid", "5-Hybrid_Dispersion",
            "4-Iron", "4-Iron_Dispersion", "5-Iron", "5-Iron_Dispersion",
            "6-Iron", "6-Iron_Dispersion", "7-Iron", "7-Iron_Dispersion",
            "8-Iron", "8-Iron_Dispersion", "9-Iron", "9-Iron_Dispersion",
            "PW", "PW_Dispersion", "GW", "GW_Dispersion", 
            "SW", "SW_Dispersion", "LW", "LW_Dispersion") 
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        """, values)

    conn.commit()
    return {"message": "Golf Bag Saved Successfully"}


@app.get("/get_golf_bag/{player_id}")
def get_golf_bag(player_id: str):
    cursor.execute("SELECT * FROM player_data WHERE player_id=?", (player_id,))
    data = cursor.fetchone()

    if not data:
        raise HTTPException(status_code=404, detail="Player data not found")

    columns = [desc[0] for desc in cursor.description]
    result = dict(zip(columns, data))
    return result



