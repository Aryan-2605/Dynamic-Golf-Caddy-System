import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Alert,
  SafeAreaView, // ios dynamic island thingy
} from "react-native";
import {
  Card,
  Button,
  Text,
  TextInput,
  Dialog,
  Portal,
  Provider,
  Menu,
  IconButton,
} from "react-native-paper";
import { useNavigation, useRoute } from "@react-navigation/native";
import CONFIG from "./config"; 

// The clubs in the specified order:
const CLUB_ORDER = [
  "Driver",
  "3-Wood",
  "5-Wood",
  "3-Hybrid",
  "4-Hybrid",
  "5-Hybrid",
  "4-Iron",
  "5-Iron",
  "5-Wood",
  "6-Iron",
  "7-Iron",
  "8-Iron",
  "9-Iron",
  "GW",
  "LW",
  "PW",
  "SW",
];

const BagScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();

  // player_id passed from past screen
  const { player_id } = route.params || {};

  if (!player_id) {
    console.warn("No player_id provided to BagScreen.");
  }

  // ============== State Management ==============
  const [clubs, setClubs] = useState([]); 
  const [selectedClub, setSelectedClub] = useState("");
  const [carryDistance, setCarryDistance] = useState("");
  const [dispersion, setDispersion] = useState("");
  const [editIndex, setEditIndex] = useState(null); 

  const [visible, setVisible] = useState(false);

  const [menuVisible, setMenuVisible] = useState(false);

  // ============== Lifecycle - Fetch existing data ==============
  useEffect(() => {
    if (!player_id) return;

    fetch(`${CONFIG.API_BASE_URL}/bag/${player_id}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP Error: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data.clubs && Array.isArray(data.clubs)) {
          const merged = CLUB_ORDER.map((clubName) => {
            const found = data.clubs.find((c) => c.name === clubName);
            if (found) {
              return found;
            } else {
              return { name: clubName, yardage: "", dispersion: "" };
            }
          });
          setClubs(merged);
        }
      })
      .catch((err) => {
        console.error("Fetch bag error:", err);
      });
  }, [player_id]);

  // ============== Show/Hide Dialog Helpers ==============
  const showDialog = () => setVisible(true);
  const hideDialog = () => {
    setVisible(false);
    setSelectedClub("");
    setCarryDistance("");
    setDispersion("");
    setEditIndex(null);
  };

  // ============== Handle Add/Edit ==============
  const handleSelectClub = (clubName) => {
    setSelectedClub(clubName);
    setMenuVisible(false);
    showDialog();
  };

  const handleSaveClub = () => {
    if (!selectedClub || !carryDistance || !dispersion) {
      Alert.alert("Error", "Please fill in distance and dispersion.");
      return;
    }

    if (
        editIndex === null &&
        clubs.some(
          (c) =>
            c.name === selectedClub &&
            c.yardage.trim() !== "" 
        )
      ) {
        Alert.alert("Error", "You already have this club in your bag.");
        return;
      }

    const newClubObject = {
      name: selectedClub,
      yardage: carryDistance,
      dispersion,
    };

    if (editIndex !== null) {
      // Editing existing
      const updatedClubs = [...clubs];
      updatedClubs[editIndex] = newClubObject;
      setClubs(updatedClubs);
    } else {
      // Adding new
      setClubs((prev) => [...prev, newClubObject]);
    }
    hideDialog();
  };

  const handleEditClub = (index) => {
    const clubToEdit = clubs[index];
    setSelectedClub(clubToEdit.name);
    setCarryDistance(clubToEdit.yardage);
    setDispersion(clubToEdit.dispersion);
    setEditIndex(index);
    setVisible(true);
  };

  const handleDeleteClub = (index) => {
    const updatedClubs = [...clubs];
    updatedClubs.splice(index, 1);
    setClubs(updatedClubs);
  };

  // ============== Save Bag to Backend ==============
  const handleSaveBag = () => {
    fetch(`${CONFIG.API_BASE_URL}/bag/save_bag`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        player_id,
        clubs, 
      }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP Error: ${res.status}`);
        }
        return res.json();
      })
      .then(() => {
        Alert.alert("Success", "Bag saved successfully!");
        navigation.goBack(); 
      })
      .catch((err) => {
        console.error("Save bag error:", err);
        Alert.alert("Error", "Could not save bag.");
      });
  };

  // ============== Rendering ==============
  return (
    <Provider>
    
      <SafeAreaView style={styles.safeContainer}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Bag Setup</Text>
          <Button
            mode="contained"
            onPress={handleSaveBag}
            style={styles.saveButton}
          >
            Save Bag
          </Button>
        </View>


        <View style={styles.menuContainer}>
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <Button
                mode="contained"
                onPress={() => setMenuVisible(true)}
                style={styles.menuButton}
              >
                Select Club
              </Button>
            }
          >
            {CLUB_ORDER.map((club, idx) => (
              <Menu.Item
                key={idx}
                title={club}
                onPress={() => handleSelectClub(club)}
              />
            ))}
          </Menu>
        </View>


        <FlatList
        data={clubs.filter(
            (club) => club.yardage.trim() !== "" // && club.dispersion.trim() !== ""
        )}
        keyExtractor={(item, index) => `${item.name}-${index}`}
        renderItem={({ item, index }) => (
            <Card style={styles.cardItem}>
            <Card.Title title={item.name} />
            <Card.Content>
                <Text>Carry Distance: {item.yardage} yds</Text>
                <Text>Dispersion: {item.dispersion} yds</Text>
            </Card.Content>
            <Card.Actions>
                <IconButton icon="pencil" onPress={() => handleEditClub(index)} />
                <IconButton icon="delete" color="red" onPress={() => handleDeleteClub(index)} />
            </Card.Actions>
            </Card>
        )}
        />

        <Portal>
          <Dialog visible={visible} onDismiss={hideDialog}>
            <Dialog.Title>
              {editIndex !== null ? "Edit Club" : "Add Club"}
            </Dialog.Title>
            <Dialog.Content>
              <Text style={styles.clubLabel}>Club: {selectedClub}</Text>
              <TextInput
                label="Carry Distance (yds)"
                keyboardType="numeric"
                value={carryDistance}
                onChangeText={setCarryDistance}
                mode="outlined"
                style={styles.input}
              />
              <TextInput
                label="Dispersion (yds)"
                keyboardType="numeric"
                value={dispersion}
                onChangeText={setDispersion}
                mode="outlined"
                style={styles.input}
              />
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={hideDialog}>Cancel</Button>
              <Button onPress={handleSaveClub}>
                {editIndex !== null ? "Update" : "Add"}
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </SafeAreaView>
    </Provider>
  );
};

export default BagScreen;

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "#f4f4f4",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 10, 
    paddingBottom: 10,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "bold",
  },
  saveButton: {
    backgroundColor: "#4CAF50",
  },
  menuContainer: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  menuButton: {
    backgroundColor: "blue",
  },
  cardItem: {
    marginHorizontal: 16,
    marginVertical: 5,
  },
  clubLabel: {
    fontSize: 16,
    marginBottom: 10,
  },
  input: {
    marginVertical: 6,
  },
});
