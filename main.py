import sqlite3
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

#Run this in console before running SQL commands
#  uvicorn main:app --host 0.0.0.0 --port 8000 --reload

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


class User(BaseModel):
    player_id: str
    password: str


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

    return {"message": "Login successful"}
