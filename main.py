import sqlite3
from fastapi import FastAPI, HTTPException
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel
from bag_routes import router as bag_router
from get_bag import router as get_bag_router
from club_prediction import ClubPredictionInput, predict_club
from expected_area_prediction import LocationInput, predict_location


# Do this command before doing any SQL stuff
#   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
#   uvicorn main:app --host 192.168.97.22 --port 8000 --reload

app = FastAPI()

# ------------------------------------------------------
#                 Connect to Database
# ------------------------------------------------------
conn = sqlite3.connect("DGCS.db", check_same_thread=False)

# ------------------------------------------------------
#              Ensure "users" Table Exists
# ------------------------------------------------------
with conn:
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS users (
            player_id TEXT PRIMARY KEY,
            password TEXT NOT NULL
        )
    """)

# ------------------------------------------------------
#           Check "player_data" Table Exists
# ------------------------------------------------------
with conn:
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS player_data (
            player_id TEXT PRIMARY KEY,
            Age INTEGER,
            Gender TEXT CHECK(Gender IN ('Male', 'Female')),
            HCP REAL,
            FOREIGN KEY (player_id) REFERENCES users(player_id)
        )
    """)


# ------------------------------------------------------
#    Checks "users" exist
# ------------------------------------------------------
def add_manual_users():
    with conn:
        c = conn.cursor()
        users = [
            ("2001", "1234"),
            ("2002", "1234"),
            ("2003", "1234")
        ]
        c.executemany("INSERT OR IGNORE INTO users VALUES (?, ?)", users)


add_manual_users()  # Insert if not exists


# ------------------------------------------------------
#                 Data Models
# ------------------------------------------------------
class User(BaseModel):
    player_id: str
    password: str


class Profile(BaseModel):
    player_id: str
    Age: int
    Gender: str
    HCP: float


# ------------------------------------------------------
#                  LOGIN ENDPOINT
# ------------------------------------------------------
@app.post("/login")
def login(user: User):
    c = conn.cursor()
    try:
        c.execute("SELECT password FROM users WHERE player_id=?", (user.player_id,))
        result = c.fetchone()
    finally:
        c.close()

    if not result or result[0] != user.password:
        raise HTTPException(status_code=400, detail="Invalid username or password")

    return {"message": "Login successful", "player_id": user.player_id}


# ------------------------------------------------------
#               SAVE PROFILE ENDPOINT
# ------------------------------------------------------
@app.post("/save_profile")
def save_profile(data: Profile):
    c = conn.cursor()
    try:
        c.execute("SELECT * FROM player_data WHERE player_id=?", (data.player_id,))
        existing_data = c.fetchone()

        if existing_data:
            c.execute("""
                UPDATE player_data
                SET Age=?, Gender=?, HCP=?
                WHERE player_id=?
            """, (data.Age, data.Gender, data.HCP, data.player_id))
        else:
            c.execute("""
                INSERT INTO player_data (player_id, Age, Gender, HCP)
                VALUES (?, ?, ?, ?)
            """, (data.player_id, data.Age, data.Gender, data.HCP))

        conn.commit()
    finally:
        c.close()

    return {"message": "Profile saved successfully"}


# ------------------------------------------------------
#             GET PROFILE CHECK IF PROFILE IS FILLED
# ------------------------------------------------------

@app.get("/get_golf_bag/{player_id}")
def get_golf_bag(player_id: str):
    c.execute("SELECT * FROM player_data WHERE player_id=?", (player_id,))
    data = c.fetchone()

    if not data:
        raise HTTPException(status_code=404, detail="Player data not found")

    columns = [desc[0] for desc in c.description]
    result = dict(zip(columns, data))
    return result

# ------------------------------------------------------
#             Bag Addition and Selection. (GET)
# ------------------------------------------------------


app.include_router(get_bag_router)

app.include_router(bag_router)









# ------------------------------------------------------
#    Club Selection Model
# ------------------------------------------------------
class LocationInput(BaseModel):
    start_x: float
    start_y: float
    shot_id: int

class ClubInput(BaseModel):
    start_x: float
    start_y: float
    end_x: float
    end_y: float
    shot_id: int


@app.post("/predictclub/{player_id}")
def predict(player_id: int, data: ClubInput):
    result = predict_club(player_id, data.start_x, data.start_y, data.end_x, data.end_y, data.shot_id)
    return jsonable_encoder(result)

@app.post("/predictlocation/{player_id}")
def predict(player_id: int, data: LocationInput):
    result = predict_location(player_id, data.start_x, data.start_y, data.shot_id)

    return jsonable_encoder(result)





