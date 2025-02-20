import sqlite3
import pandas as pd
from shapely.geometry import Point, Polygon
import ast
import joblib
from pydantic import BaseModel

MODEL_PATH = "Expected_Area_Models.pkl"

models = joblib.load(MODEL_PATH)

lat_model = models["lat_model"]
lon_model = models["lon_model"]

conn = sqlite3.connect("DGCS.db", check_same_thread=False)


def get_player_data(player_id):
    c = conn.cursor()
    c.execute("""
        SELECT Age, Gender, HCP, Driver, Driver_Dispersion, `3-Wood`, `3-Wood_Dispersion`, 
               `5-Wood`, `5-Wood_Dispersion`, `3-Hybrid`, `3-Hybrid_Dispersion`, `4-Hybrid`, 
               `4-Hybrid_Dispersion`, `5-Hybrid`, `5-Hybrid_Dispersion`, `4-Iron`, 
               `4-Iron_Dispersion`, `5-Iron`, `5-Iron_Dispersion`, `6-Iron`, `6-Iron_Dispersion`,
               `7-Iron`, `7-Iron_Dispersion`, `8-Iron`, `8-Iron_Dispersion`, `9-Iron`, 
               `9-Iron_Dispersion`, `PW`, `PW_Dispersion`, `GW`, `GW_Dispersion`, 
               `SW`, `SW_Dispersion`, `LW`, `LW_Dispersion` 
        FROM player_data WHERE player_id=?""", (player_id,))

    result = c.fetchone()

    if result:
        columns = [
            'Age', 'Gender', 'HCP', 'Driver',
            'Driver_Dispersion', '3-Wood', '3-Wood_Dispersion', '5-Wood',
            '5-Wood_Dispersion', '3-Hybrid', '3-Hybrid_Dispersion', '4-Hybrid',
            '4-Hybrid_Dispersion', '5-Hybrid', '5-Hybrid_Dispersion', '4-Iron',
            '4-Iron_Dispersion', '5-Iron', '5-Iron_Dispersion', '6-Iron',
            '6-Iron_Dispersion', '7-Iron', '7-Iron_Dispersion', '8-Iron',
            '8-Iron_Dispersion', '9-Iron', '9-Iron_Dispersion', 'PW',
            'PW_Dispersion', 'GW', 'GW_Dispersion', 'SW', 'SW_Dispersion', 'LW',
            'LW_Dispersion'
        ]
        return dict(zip(columns, result))

    return None


class LocationInput(BaseModel):
    start_x: float
    start_y: float
    shot_id: float


class Area():
    def __init__(self, hole_data):
        self.hole_data = hole_data
        self.polygons = self.create_polygon()

    def parse_hole_data(self):
        predefined_areas = ['Fairway', 'TreeLine', 'Green', 'Bunker', 'Zone', 'TeeBox']
        area_coordinates = {}

        for area in predefined_areas:
            arrays = self.hole_data.loc[self.hole_data['Area'] == area, 'Coordinates'].values

            converted = [ast.literal_eval(item) for item in arrays]

            area_coordinates[area] = converted

        return area_coordinates

    def create_polygon(self):
        area_coordinates = self.parse_hole_data()
        hole_polygons = {}

        for zone, coordinates in area_coordinates.items():
            #print(f"Zone: {zone}")
            for i, coords in enumerate(coordinates):
                polygon = Polygon(coords)
                hole_polygons.setdefault(zone, []).append(polygon)
                #print(f"  Polygon {i + 1}: {polygon}")

        return hole_polygons

    def return_location(self, location):
        predefined_areas = ['Fairway', 'TreeLine', 'Green', 'Bunker', 'Zone', 'TeeBox']
        is_inside = {}

        for zone, polygons in self.polygons.items():
            if zone in predefined_areas:
                is_inside[zone] = False

                for i, polygon in enumerate(polygons):
                    if isinstance(polygon, str):
                        self.polygons[zone][i] = Polygon(ast.literal_eval(polygon))
                        polygon = self.polygons[zone][i]

                    if polygon.contains(location):
                        is_inside[zone] = True
                        break

        if is_inside.get("TeeBox", True):
            return 4
        elif is_inside.get("Bunker", True):
            return 0
        elif is_inside.get("Green", True):
            return 2
        elif is_inside.get("Fairway", True):
            return 1
        elif is_inside.get("TreeLine", True):
            return 5
        elif is_inside.get("Zone", True):
            return 3
        else:
            return 3


def predict_location(player_id, start_x, start_y, shot_id):
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
            player_data[key] = 0.0


    start_zone = area.return_location(Point(start_x, start_y))
    rating = 1

    if player_data is None:
        return {
            "error": "Player not found!"
        }

    if player_data["Gender"] == "Male":
        player_data["Gender"] = 0
    else:
        player_data["Gender"] = 1

    print(f'FUCKING TESTING FUCKIGN TESTING {type(player_data["Driver"])} ')

    '''X Train Order
    
    Index(['player_id', 'shot_id', 'rating', 'Age', 'Gender', 'HCP', 'Driver',
       'Driver_Dispersion', '3-Wood', '3-Wood_Dispersion', '5-Wood',
       '5-Wood_Dispersion', '3-Hybrid', '3-Hybrid_Dispersion', '4-Hybrid',
       '4-Hybrid_Dispersion', '5-Hybrid', '5-Hybrid_Dispersion', '4-Iron',
       '4-Iron_Dispersion', '5-Iron', '5-Iron_Dispersion', '6-Iron',
       '6-Iron_Dispersion', '7-Iron', '7-Iron_Dispersion', '8-Iron',
       '8-Iron_Dispersion', '9-Iron', '9-Iron_Dispersion', 'PW',
       'PW_Dispersion', 'GW', 'GW_Dispersion', 'SW', 'SW_Dispersion', 'LW',
       'LW_Dispersion', 'start_x', 'start_y', 'start_zone'],
      dtype='object')
    
    '''

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
        float(start_zone)
    ]]

    lat_pred = lat_model.predict(input_data)[0]
    lon_pred = lon_model.predict(input_data)[0]

    return {
        "latitude": float(lat_pred),
        "longitude": float(lon_pred)
    }


''' input_data = [[
        data.player_id, data.shot_id, data.rating, data.Age, data.Gender, data.HCP,
        data.Driver, data.Driver_Dispersion, data.Three_Wood, data.Three_Wood_Dispersion,
        data.Five_Wood, data.Five_Wood_Dispersion, data.Three_Hybrid, data.Three_Hybrid_Dispersion,
        data.Four_Hybrid, data.Four_Hybrid_Dispersion, data.Five_Hybrid, data.Five_Hybrid_Dispersion,
        data.Four_Iron, data.Four_Iron_Dispersion, data.Five_Iron, data.Five_Iron_Dispersion,
        data.Six_Iron, data.Six_Iron_Dispersion, data.Seven_Iron, data.Seven_Iron_Dispersion,
        data.Eight_Iron, data.Eight_Iron_Dispersion, data.Nine_Iron, data.Nine_Iron_Dispersion,
        data.PW, data.PW_Dispersion, data.GW, data.GW_Dispersion, data.SW, data.SW_Dispersion,
        data.LW, data.LW_Dispersion, data.start_x, data.start_y, data.start_zone
    ]]

    lat_pred = lat_model.predict(input_data)[0]
    lon_pred = lon_model.predict(input_data)[0]

    return {
        "latitude": float(lat_pred),
        "longitude": float(lon_pred)
    }
'''
