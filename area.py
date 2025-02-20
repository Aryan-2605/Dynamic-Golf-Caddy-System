import ast

from shapely import Polygon


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
