import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Alert,
  SafeAreaView,
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

const CLUB_ORDER = [
  "Driver",
  "3-Wood",
  "5-Wood",
  "3-Hybrid",
  "4-Hybrid",
  "5-Hybrid",
  "4-Iron",
  "5-Iron",
  "6-Iron",
  "7-Iron",
  "8-Iron",
  "9-Iron",
  "PW",
  "GW",
  "SW",
  "LW",
];

const BagScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { player_id } = route.params || {};

  if (!player_id) {
    console.warn("No player_id provided to BagScreen.");
  }

  const [clubs, setClubs] = useState([]);
  const [selectedClub, setSelectedClub] = useState("");
  const [carryDistance, setCarryDistance] = useState("");
  const [dispersion, setDispersion] = useState("");
  const [editClubName, setEditClubName] = useState(null);

  const [visible, setVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  useEffect(() => {
    if (!player_id) return;

    fetch(`${CONFIG.API_BASE_URL}/bag/${player_id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.clubs && Array.isArray(data.clubs)) {
          setClubs(data.clubs);
        }
      })
      .catch((err) => console.error("Fetch bag error:", err));
  }, [player_id]);

  const showDialog = () => setVisible(true);
  const hideDialog = () => {
    setVisible(false);
    setSelectedClub("");
    setCarryDistance("");
    setDispersion("");
    setEditClubName(null);
  };

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

    setClubs((prev) => {
      if (editClubName !== null) {
        return prev.map((c) =>
          c.name === editClubName
            ? { name: selectedClub, yardage: carryDistance, dispersion }
            : c
        );
      } else {
        return [...prev, { name: selectedClub, yardage: carryDistance, dispersion }];
      }
    });

    hideDialog();
  };

  const handleEditClub = (clubName, yardage, dispersion) => {
    setSelectedClub(clubName);
    setCarryDistance(yardage);
    setDispersion(dispersion);
    setEditClubName(clubName);
    setVisible(true);
  };

  const handleDeleteClub = (clubName) => {
    setClubs((prev) => prev.filter((c, i) => c.name !== clubName || i !== prev.findIndex((c) => c.name === clubName)));
  };

  const handleSaveBag = () => {
    fetch(`${CONFIG.API_BASE_URL}/bag/save_bag`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ player_id, clubs }),
    })
      .then((res) => res.json())
      .then(() => {
        Alert.alert("Success", "Bag saved successfully!");
        navigation.goBack();
      })
      .catch((err) => {
        console.error("Save bag error:", err);
        Alert.alert("Error", "Could not save bag.");
      });
  };

  const clubCounts = clubs.reduce((acc, club) => {
    acc[club.name] = (acc[club.name] || 0) + 1;
    return acc;
  }, {});

  return (
    <Provider>
      <SafeAreaView style={styles.safeContainer}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Bag Setup</Text>
          <Button mode="contained" onPress={handleSaveBag} style={styles.saveButton}>
            Save Bag
          </Button>
        </View>

        <View style={styles.menuContainer}>
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <Button mode="contained" onPress={() => setMenuVisible(true)} style={styles.menuButton}>
                Select Club
              </Button>
            }
          >
            {CLUB_ORDER.map((club, idx) => (
              <Menu.Item
                key={idx}
                title={club}
                onPress={() => handleSelectClub(club)}
                disabled={clubCounts[club] >= 2} 
                style={clubCounts[club] >= 2 ? styles.disabledMenuItem : {}}
              />
            ))}
          </Menu>
        </View>

        <FlatList
          data={clubs}
          keyExtractor={(item, index) => `${item.name}-${index}`}
          renderItem={({ item }) => (
            <Card style={styles.cardItem}>
              <Card.Title title={item.name} />
              <Card.Content>
                <Text>Carry Distance: {item.yardage} yds</Text>
                <Text>Dispersion: {item.dispersion} yds</Text>
              </Card.Content>
              <Card.Actions>
                <IconButton icon="pencil" onPress={() => handleEditClub(item.name, item.yardage, item.dispersion)} />
                <IconButton icon="delete" color="red" onPress={() => handleDeleteClub(item.name)} />
              </Card.Actions>
            </Card>
          )}
        />

        <Portal>
          <Dialog visible={visible} onDismiss={hideDialog}>
            <Dialog.Title>{editClubName ? "Edit Club" : "Add Club"}</Dialog.Title>
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
              <Button onPress={handleSaveClub}>{editClubName ? "Update" : "Add"}</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </SafeAreaView>
    </Provider>
  );
};

export default BagScreen;

const styles = StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: "#f4f4f4" },
  headerContainer: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10 },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: "bold" },
  saveButton: { backgroundColor: "#4CAF50" },
  menuContainer: { paddingHorizontal: 16, marginBottom: 10 },
  menuButton: { backgroundColor: "blue" },
  cardItem: { marginHorizontal: 16, marginVertical: 5 },
  clubLabel: { fontSize: 16, marginBottom: 10 },
  input: { marginVertical: 6 },
  disabledMenuItem: { opacity: 0.5 },
});
