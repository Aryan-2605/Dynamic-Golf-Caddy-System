import joblib
from pydantic import BaseModel

MODEL_PATH = "Club_Selection_Model.pkl"
model = joblib.load(MODEL_PATH)

# ✅ Define input features
class ClubPredictionInput(BaseModel):
    player_id: float
    shot_id: float
    rating: float
    Age: float
    Gender: float
    HCP: float
    Driver: float
    Driver_Dispersion: float
    Three_Wood: float
    Three_Wood_Dispersion: float
    Five_Wood: float
    Five_Wood_Dispersion: float
    Three_Hybrid: float
    Three_Hybrid_Dispersion: float
    Four_Hybrid: float
    Four_Hybrid_Dispersion: float
    Five_Hybrid: float
    Five_Hybrid_Dispersion: float
    Four_Iron: float
    Four_Iron_Dispersion: float
    Five_Iron: float
    Five_Iron_Dispersion: float
    Six_Iron: float
    Six_Iron_Dispersion: float
    Seven_Iron: float
    Seven_Iron_Dispersion: float
    Eight_Iron: float
    Eight_Iron_Dispersion: float
    Nine_Iron: float
    Nine_Iron_Dispersion: float
    PW: float
    PW_Dispersion: float
    GW: float
    GW_Dispersion: float
    SW: float
    SW_Dispersion: float
    LW: float
    LW_Dispersion: float
    start_x: float
    start_y: float
    end_x: float
    end_y: float
    distance_covered: float
    start_zone: float
    end_zone: float

#Function to make predictions
def predict_club(data: ClubPredictionInput):
    input_data = [[
        data.player_id, data.shot_id, data.rating, data.Age, data.Gender, data.HCP,
        data.Driver, data.Driver_Dispersion, data.Three_Wood, data.Three_Wood_Dispersion,
        data.Five_Wood, data.Five_Wood_Dispersion, data.Three_Hybrid, data.Three_Hybrid_Dispersion,
        data.Four_Hybrid, data.Four_Hybrid_Dispersion, data.Five_Hybrid, data.Five_Hybrid_Dispersion,
        data.Four_Iron, data.Four_Iron_Dispersion, data.Five_Iron, data.Five_Iron_Dispersion,
        data.Six_Iron, data.Six_Iron_Dispersion, data.Seven_Iron, data.Seven_Iron_Dispersion,
        data.Eight_Iron, data.Eight_Iron_Dispersion, data.Nine_Iron, data.Nine_Iron_Dispersion,
        data.PW, data.PW_Dispersion, data.GW, data.GW_Dispersion, data.SW, data.SW_Dispersion,
        data.LW, data.LW_Dispersion, data.start_x, data.start_y, data.end_x, data.end_y,
        data.distance_covered, data.start_zone, data.end_zone
    ]]

    # Make prediction using the trained model
    prediction = model.predict(input_data)
    return prediction.tolist()
