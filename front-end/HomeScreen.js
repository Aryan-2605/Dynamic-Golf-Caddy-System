import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  Image,
  ImageBackground,
  Pressable,
  Alert,
} from "react-native";
import {
  Card,
  TextInput,
  Button,
  Dialog,
  Portal,
  Provider,
} from "react-native-paper";
import { useNavigation, useRoute } from "@react-navigation/native";
import CONFIG from "./config";
import { LogBox } from "react-native";



const { width, height } = Dimensions.get("window");

const HomeScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const player_id = route.params?.player_id;
  console.log(player_id)

  const [isDialogVisible, setDialogVisible] = useState(false);
  const [profile, setProfile] = useState({ age: "", gender: "", hcp: "" });

  useEffect(() => {
    if (!player_id) return;

    (async () => {
      try {
        // Attempt to get an existing profile from the backend
        const res = await fetch(
          `${CONFIG.API_BASE_URL}/get_golf_bag/${player_id}`
        );

        if (!res.ok) {
          throw new Error(`HTTP Error: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();
        if (!data || !data.Age || !data.Gender || !data.HCP) {
          setDialogVisible(true);
        } else {
          setProfile({
            age: data.Age.toString(),
            gender: data.Gender,
            hcp: data.HCP.toString(),
          });
        }
      } catch (err) {
        console.error("Fetch error:", err);

        setDialogVisible(true);
      }
    })();
  }, [player_id]);

  const handleSaveProfile = async () => {
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/save_profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          player_id,
          Age: profile.age,
          Gender: profile.gender,
          HCP: profile.hcp,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save profile. Status: ${response.status}`);
      }

      setDialogVisible(false);
      Alert.alert("Success", "Profile saved successfully!");
    } catch (error) {
      console.error("Save error:", error);
      Alert.alert("Error", "Failed to save profile.");
    }
  };

  // 3️⃣ Handle Grid Press
  const handlePress = (title) => {
    if (title === "Bag Selector") {
      navigation.navigate("Bag", { player_id });
    }

    if (title === "Course") {
      navigation.navigate("Course", { player_id });
    }


  };


  return (
    <Provider>
        
      <ImageBackground
        source={{
          uri: "https://i.pinimg.com/736x/32/1c/1c/321c1c23d7c6119e33a1f815cde6fdac.jpg",
        }}
        style={styles.backgroundImage}
      >
        <View style={styles.container}>
          {/* Header & Logout */}
          <View style={styles.headerContainer}>
            <Text style={styles.headerText}>DGCS</Text>
            <Pressable
              onPress={() => navigation.navigate("Login")}
              style={({ pressed }) => [
                styles.logoutButton,
                pressed && { backgroundColor: "rgba(255,255,255,0.3)" }, 
              ]}
            >
              <Text style={styles.logoutText}>Logout</Text>
            </Pressable>
          </View>

          <View style={styles.imageContainer}>
            <FlatList
              data={[
                "https://cdn1.thegolfinggazette.com/uploads/77/2024/09/GettyImages-2164268739-1140x815.jpg",
                "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSFFgVUReIiSpRO1jEHaZG6Q03wXi8hlXjpqg&s",
                "https://tigerwoods.com/wp-content/uploads/2016/11/TigerWoods_Biography_Trophy.jpg",
                "https://e0.365dm.com/24/04/736x414/skysports-rory-mcilroy-golf_6514390.jpg?20240408091228",
              ]}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <View style={styles.slide}>
                  <Image source={{ uri: item }} style={styles.image} />
                </View>
              )}
            />
          </View>

          {/* Grid Menu */}
          <View style={styles.gridContainer}>
            {["Bag Selector", "Course", "Box 3", "Box 4"].map((title, index) => (
              <Pressable
              key={index}
              onPress={() => handlePress(title)}
              style={({ pressed }) => [
                styles.gridItem,
                pressed && { backgroundColor: "rgba(255, 255, 255, 0.3)" }, 
              ]}
            >
              <Card style={styles.cardStyle}>
                <Card.Content>
                  <Text style={styles.gridText}>{title}</Text>
                </Card.Content>
              </Card>
            </Pressable>
            ))}
          </View>
        </View>

        {/* Profile Input Dialog */}
        <Portal>
          <Dialog visible={isDialogVisible} dismissable={false}>
            <Dialog.Title>Complete Your Profile</Dialog.Title>
            <Dialog.Content>
              <TextInput
                label="Age"
                keyboardType="numeric"
                value={profile.age}
                onChangeText={(value) => setProfile({ ...profile, age: value })}
                mode="outlined"
                style={styles.input}
              />
              <TextInput
                label="Gender (Male/Female)"
                value={profile.gender}
                onChangeText={(value) =>
                  setProfile({ ...profile, gender: value })
                }
                mode="outlined"
                style={styles.input}
              />
              <TextInput
                label="HCP"
                keyboardType="numeric"
                value={profile.hcp}
                onChangeText={(value) => setProfile({ ...profile, hcp: value })}
                mode="outlined"
                style={styles.input}
              />
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={handleSaveProfile}>Save</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </ImageBackground>
    </Provider>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    resizeMode: "cover",
  },
  container: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 40, // push down from very top
    marginHorizontal: 20,
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    top: 20,
  },
  logoutButton: {
    marginLeft: "auto", // push it to the right
    paddingHorizontal: 10,
    paddingVertical: 5,
    top: 20,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  logoutText: {
    fontSize: 18,
    fontWeight: "600",
    color: "white",
  },
  imageContainer: {
    height: height / 3,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  slide: {
    width,
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: width * 0.9,
    height: height / 4,
    borderRadius: 10,
    marginVertical: 10,
  },
  gridContainer: {
    flex: 2,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-evenly",
    alignItems: "center",
    padding: 10,
  },
  gridItem: {
    width: width * 0.4,
    height: 120,
    justifyContent: "center",
    alignItems: "center",
    margin: 5,
    borderRadius: 10,
    backgroundColor: "rgba(39, 34, 34, 0.3)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  cardStyle: {
    backgroundColor: "transparent",
    elevation: 0,
  },
  gridText: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
  input: {
    marginBottom: 10,
  },
});

export default HomeScreen;
