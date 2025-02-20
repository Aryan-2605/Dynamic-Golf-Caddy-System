import pandas as pd
import joblib
from pydantic import BaseModel
from shapely.geometry import Point
import numpy as np

from area import Area
from get_player_data import get_player_data

MODEL_PATH = "Club_Selection_Model.pkl"
model = joblib.load(MODEL_PATH)





# ✅ Define input features
class ClubPredictionInput(BaseModel):
    start_x: float
    start_y: float

    end_x: float
    end_y: float
    shot_id: float

CLUB_MAPPING = {
    0: '3-Hybrid', 1: '3-Wood', 2: '4-Hybrid', 3: '4-Iron', 4: '5-Hybrid',
    5: '5-Iron', 6: '5-Wood', 7: '6-Iron', 8: '7-Iron', 9: '8-Iron',
    10: '9-Iron', 11: 'Driver', 12: 'GW', 13: 'LW', 14: 'PW', 15: 'SW'
}

#Function to make predictions
def predict_club(player_id, start_x, start_y, end_x, end_y, shot_id):

    hole_data = pd.read_csv('Hole_1.csv')
    area = Area(hole_data)
    area.create_polygon()

    player_data = get_player_data(player_id)
    if player_data is None:
        return {
            "error": "Player not found!"
        }

    for key, value in player_data.items():
        if value is None or value == "":  # Empty string check
            player_data[key] = 'NaN'

    if player_data["Gender"] == "Male":
        player_data["Gender"] = 0
    else:
        player_data["Gender"] = 1


    start_zone = area.return_location(Point(start_x, start_y))
    end_zone = area.return_location(Point(end_x, end_y))

    R = 6371 * 1093.61  # Earth's radius in yards

    rating = 1

    distance_covered = 2 * R * np.arcsin(
        np.sqrt(
            np.sin(np.radians(end_x - start_x) / 2) ** 2 +
            np.cos(np.radians(start_x)) * np.cos(np.radians(end_x)) *
            np.sin(np.radians(end_y - start_y) / 2) ** 2
        )
    )


    input_data = [[
        float(player_id),
        float(shot_id),
        float(rating),
        float(player_data["Age"]),
        float(player_data["Gender"]),
        float(player_data["HCP"]),
        float(player_data["Driver"]),
        float(player_data["Driver_Dispersion"]),
        float(player_data["3-Wood"]),
        float(player_data["3-Wood_Dispersion"]),
        float(player_data["5-Wood"]),
        float(player_data["5-Wood_Dispersion"]),
        float(player_data["3-Hybrid"]),
        float(player_data["3-Hybrid_Dispersion"]),
        float(player_data["4-Hybrid"]),
        float(player_data["4-Hybrid_Dispersion"]),
        float(player_data["5-Hybrid"]),
        float(player_data["5-Hybrid_Dispersion"]),
        float(player_data["4-Iron"]),
        float(player_data["4-Iron_Dispersion"]),
        float(player_data["5-Iron"]),
        float(player_data["5-Iron_Dispersion"]),
        float(player_data["6-Iron"]),
        float(player_data["6-Iron_Dispersion"]),
        float(player_data["7-Iron"]),
        float(player_data["7-Iron_Dispersion"]),
        float(player_data["8-Iron"]),
        float(player_data["8-Iron_Dispersion"]),
        float(player_data["9-Iron"]),
        float(player_data["9-Iron_Dispersion"]),
        float(player_data["PW"]),
        float(player_data["PW_Dispersion"]),
        float(player_data["GW"]),
        float(player_data["GW_Dispersion"]),
        float(player_data["SW"]),
        float(player_data["SW_Dispersion"]),
        float(player_data["LW"]),
        float(player_data["LW_Dispersion"]),
        float(start_x),
        float(start_y),
        float(end_x),
        float(end_y),
        float(distance_covered),
        float(start_zone),
        float(end_zone),
    ]]
    print(distance_covered)
    prediction = model.predict(input_data)
    club_name = CLUB_MAPPING.get(int(prediction[0]), "Unknown Club")
    return {'Club': club_name}
''' 
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
'''
    # Make prediction using the trained model

