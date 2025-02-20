import sqlite3

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
