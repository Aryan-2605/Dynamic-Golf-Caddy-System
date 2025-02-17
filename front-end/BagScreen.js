import React, { useState, useEffect } from "react";
import { View, StyleSheet, FlatList, Alert } from "react-native";
import { Card, Button, Text, TextInput, Dialog, Portal, Provider, Menu, Snackbar, RadioButton } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";

const API_URL = "http://192.168.97.22:8000";

const clubOptions = [
    "Driver", "3-Wood", "5-Wood", "3-Hybrid", "4-Hybrid", "5-Hybrid", 
    "4-Iron", "5-Iron", "6-Iron", "7-Iron", "8-Iron", "9-Iron",
    "PW", "GW", "SW", "LW"
];

const BagScreen = ({ route }) => {
    const { player_id } = route.params; // Get player_id from navigation
    const navigation = useNavigation();

    const [clubs, setClubs] = useState([]);
    const [selectedClub, setSelectedClub] = useState("");
    const [yardage, setYardage] = useState("");
    const [dispersion, setDispersion] = useState("");
    const [editingIndex, setEditingIndex] = useState(null);
    const [visible, setVisible] = useState(false);
    const [menuVisible, setMenuVisible] = useState(false);
    const [snackbarVisible, setSnackbarVisible] = useState(false);

    const [age, setAge] = useState("");
    const [gender, setGender] = useState("");
    const [hcp, setHcp] = useState("");

    useEffect(() => {
        fetchGolfBag();
    }, []);

    const fetchGolfBag = async () => {
        try {
            const response = await fetch(`${API_URL}/get_golf_bag/${player_id}`);
            if (!response.ok) {
                console.log("No existing golf bag found for this user.");
                return;
            }

            const data = await response.json();
            console.log("Fetched Data:", data);

            setAge(data.Age?.toString() || "");
            setGender(data.Gender || "");
            setHcp(data.HCP?.toString() || "");

            const loadedClubs = clubOptions
                .map(club => ({
                    name: club,
                    yardage: data[club] !== "NaN" ? data[club] : "",
                    dispersion: data[`${club}_Dispersion`] !== "NaN" ? data[`${club}_Dispersion`] : ""
                }))
                .filter(club => club.yardage !== "" && club.dispersion !== "");

            setClubs(loadedClubs);
        } catch (error) {
            console.error("Error fetching golf bag:", error);
        }
    };

    const showDialog = () => setVisible(true);
    const hideDialog = () => {
        setVisible(false);
        setSelectedClub("");
        setYardage("");
        setDispersion("");
        setEditingIndex(null);
    };

    const handleAddOrEditClub = () => {
        if (!selectedClub || !yardage || !dispersion) {
            Alert.alert("Error", "Please enter yardage and dispersion values.");
            return;
        }

        if (editingIndex === null && clubs.some(club => club.name === selectedClub)) {
            Alert.alert("Error", "This club is already in your bag.");
            return;
        }

        const newClub = { name: selectedClub, yardage, dispersion };

        if (editingIndex !== null) {
            const updatedClubs = [...clubs];
            updatedClubs[editingIndex] = newClub;
            setClubs(updatedClubs);
        } else {
            setClubs([...clubs, newClub]);
        }

        hideDialog();
    };

    const handleEditClub = (index) => {
        const clubToEdit = clubs[index];
        setSelectedClub(clubToEdit.name);
        setYardage(clubToEdit.yardage);
        setDispersion(clubToEdit.dispersion);
        setEditingIndex(index);
        showDialog();
    };

    const handleRemoveClub = (index) => {
        const updatedClubs = clubs.filter((_, i) => i !== index);
        setClubs(updatedClubs);
    };

    const handleSave = async () => {
        if (!age || !gender || !hcp) {
            Alert.alert("Error", "Please enter your Age, Gender, and Handicap.");
            return;
        }

        const clubData = {};
        clubOptions.forEach(club => {
            const foundClub = clubs.find(c => c.name === club);
            clubData[club] = foundClub ? foundClub.yardage : "NaN";
            clubData[`${club}_Dispersion`] = foundClub ? foundClub.dispersion : "NaN";
        });

        const payload = {
            player_id,
            Age: parseInt(age, 10),
            Gender: gender,
            HCP: parseFloat(hcp),
            clubs: clubData,
        };

        console.log("Saving Data:", payload);

        try {
            const response = await fetch(`${API_URL}/save_golf_bag`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error("Failed to save golf bag.");
            }

            setSnackbarVisible(true);
            setTimeout(() => {
                setSnackbarVisible(false);
                navigation.navigate("Home");
            }, 1500);
        } catch (error) {
            console.error("Error saving golf bag:", error);
            Alert.alert("Error", "Failed to save data. Try again.");
        }
    };

    return (
        <Provider>
            <View style={styles.container}>
                <Card style={styles.card}>
                    <Card.Title title="Golf Bag Setup" titleStyle={styles.cardTitle} />
                    <Card.Content>
                        <TextInput
                            label="Age"
                            keyboardType="numeric"
                            value={age}
                            onChangeText={setAge}
                            mode="outlined"
                            style={styles.input}
                        />
                        <Text style={styles.genderLabel}>Gender:</Text>
                        <RadioButton.Group onValueChange={setGender} value={gender}>
                            <View style={styles.radioContainer}>
                                <View style={styles.radioItem}>
                                    <RadioButton value="Male" />
                                    <Text>Male</Text>
                                </View>
                                <View style={styles.radioItem}>
                                    <RadioButton value="Female" />
                                    <Text>Female</Text>
                                </View>
                            </View>
                        </RadioButton.Group>
                        <TextInput
                            label="Handicap (HCP)"
                            keyboardType="numeric"
                            value={hcp}
                            onChangeText={setHcp}
                            mode="outlined"
                            style={styles.input}
                        />

                        <Menu
                            visible={menuVisible}
                            onDismiss={() => setMenuVisible(false)}
                            anchor={
                                <Button 
                                    mode="contained" 
                                    onPress={() => setMenuVisible(true)} 
                                    style={styles.button}>
                                    Select Club
                                </Button>
                            }>
                            {clubOptions.map((club, index) => (
                                <Menu.Item 
                                    key={index} 
                                    title={club} 
                                    onPress={() => {
                                        setSelectedClub(club);
                                        setMenuVisible(false);
                                        showDialog();
                                    }} 
                                    disabled={clubs.some(c => c.name === club)}
                                />
                            ))}
                        </Menu>
                    </Card.Content>
                </Card>

                <Button mode="contained" style={styles.saveButton} onPress={handleSave}>
                    Save Profile & Bag
                </Button>

                <Portal>
                    <Snackbar visible={snackbarVisible} onDismiss={() => setSnackbarVisible(false)} duration={2000}>
                        Profile and Bag saved successfully!
                    </Snackbar>
                </Portal>
            </View>
        </Provider>
    );
};

const styles = StyleSheet.create({
    snackbar: {
      bottom: 30,
    },
    container: {
        flex: 1,
        paddingTop: 60,
        paddingHorizontal: 20,
        backgroundColor: "#f4f4f4",
    },
    card: {
        marginBottom: 20,
        padding: 10,
    },
    cardTitle: {
        textAlign: "center",
        fontSize: 20,
        fontWeight: "bold",
    },
    button: {
        marginTop: 10,
        backgroundColor: "green",
    },
    listItem: {
        marginVertical: 5,
        padding: 10,
        backgroundColor: "rgba(255,255,255,0.9)",
    },
    listText: {
        fontSize: 18,
        fontWeight: "bold",
    },
    input: {
        marginBottom: 15,
    },
    genderLabel: {
        marginTop: 10,
        marginBottom: 5,
    },
    radioContainer: {
        flexDirection: "row",
        justifyContent: "space-around",
        marginBottom: 15,
    },
    radioItem: {
        flexDirection: "row",
        alignItems: "center",
    },
    buttonContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 10,
    },
    saveButton: {
        marginTop: 20,
        bottom: 20,
        backgroundColor: "blue",
    },
});

export default BagScreen;
