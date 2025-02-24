import React, { useEffect, useState, useRef } from "react";
import { View, StyleSheet, Button, Text, TouchableOpacity, SafeAreaView } from "react-native";
import { WebView } from "react-native-webview";
import * as Location from "expo-location";
import { useNavigation, useRoute } from "@react-navigation/native";
import CONFIG from "./config";

const CourseScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const webViewRef = useRef(null);
  const [location, setLocation] = useState(null);
  const [prevLocation, setPrevLocation] = useState(null);
  const [firstPointLogged, setFirstPointLogged] = useState(false);
  const [shotId, setShotId] = useState(0);
  const { player_id } = route.params || {};
  const [predictedLocation, setPredictedLocation] = useState(null);
  const [recommendedClub, setRecommendedClub] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isInsidePolygon, setIsInsidePolygon] = useState(false); // Track if user is inside the course

  if (!player_id) {
    console.warn("No player_id provided to CourseScreen.");
  }

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("Permission to access location was denied");
        return;
      }

      Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 2000, distanceInterval: 1 },
        (newLocation) => {
          const { latitude, longitude } = newLocation.coords;
          setLocation({ latitude, longitude });

          console.log("📍 New GPS Location:", latitude, longitude);

          if (webViewRef.current) {
            webViewRef.current.injectJavaScript(`
              updateUserLocation(${latitude}, ${longitude});
              (function() {
                var inside = isPointInsidePolygon([${latitude}, ${longitude}], polygon_3405987639aa90c4b8f32fb43bdc179c);
                window.ReactNativeWebView.postMessage(inside ? "INSIDE" : "OUTSIDE");
              })();
            `);
          }
        }
      );
    })();
  }, []);

  // Handle messages from WebView
  const handleMessage = (event) => {
    if (event.nativeEvent.data === "OUTSIDE") {
      setIsInsidePolygon(false);
      setErrorMessage("🚨 You are outside the golf course! Please move back inside.");
    } else {
      setIsInsidePolygon(true);
      setErrorMessage(""); // Clear error message when inside
    }
  };

  const logAndProcessLocation = async () => {
    if (!location) {
      console.warn("⚠️ Waiting for GPS signal...");
      return;
    }

    if (!isInsidePolygon) {
      console.warn("🚫 Location outside the polygon. No action taken.");
      return;
    }

    if (!firstPointLogged) {
      console.log("📍 First location logged:", location);
      setPrevLocation(location);
      setFirstPointLogged(true);
    } else if (location && prevLocation) {
      console.log("🖌️ Drawing line from:", prevLocation, "to", location);

      if (webViewRef.current) {
        webViewRef.current.injectJavaScript(`
          addLine(${prevLocation.latitude}, ${prevLocation.longitude}, ${location.latitude}, ${location.longitude});
        `);
      }

      setPrevLocation(location);
    }

    const newShotId = shotId + 1;
    setShotId(newShotId);

    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/predictlocation/${player_id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start_x: location.latitude,
          start_y: location.longitude,
          shot_id: newShotId,
        }),
      });

      const data = await response.json();
      console.log("🎯 Predicted Location:", data);

      if (data.latitude && data.longitude) {
        setPredictedLocation(data);

        webViewRef.current.injectJavaScript(`
          updateTargetMarker(${data.latitude}, ${data.longitude});
        `);

        const clubResponse = await fetch(`${CONFIG.API_BASE_URL}/predictclub/${player_id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            start_x: location.latitude,
            start_y: location.longitude,
            end_x: data.latitude,
            end_y: data.longitude,
            shot_id: newShotId,
          }),
        });

        const clubData = await clubResponse.json();
        console.log("🏌️ Recommended Club:", clubData.Club);
        setRecommendedClub(clubData.Club);
      } else {
        console.warn("⚠️ Predicted location missing latitude/longitude.");
      }
      
    } catch (error) {
      console.error("❌ Error fetching prediction:", error);
    }
  };

  return (
    <View style={styles.container}>

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topOverlay}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.courseInfo}>
            <Text style={styles.courseText}>Hendon Golf Club</Text>
            <Text style={styles.holeText}>Hole 1 | Par 4</Text>
          </View>
        </View>
      </SafeAreaView>

      <WebView
        ref={webViewRef}
        originWhitelist={["*"]}
        source={require("./assets/Hole 1.html")}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onMessage={handleMessage}
      />

      <View style={styles.bottomBar}>
        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        {recommendedClub && (
          <Text style={styles.clubText}>🏌️ Recommended Club: <Text style={styles.clubName}>{recommendedClub}</Text></Text>
        )}

        <TouchableOpacity style={styles.button} onPress={logAndProcessLocation}>
          <Text style={styles.buttonText}>Log & Predict Location</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "rgba(0, 0, 0, 1)",
  },
  container: { 
    flex: 1,
  },
  webview: { flex: 1 },
  
  bottomBar: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.8)", 
    padding: 20,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },

  errorText: {
    fontSize: 16,
    color: "#ff4d4d",
    textAlign: "center",
    marginBottom: 30,
  },

  clubText: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 30,
  },

  clubName: {
    fontWeight: "bold",
    color: "#ffd700", 
  },

  button: {
    backgroundColor: "#28a745",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
    width: "90%",
    alignItems: "center",
    marginTop: 5,
    bottom: 10,
  },

  buttonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },

  topOverlay: {
    width: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 10,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },

  backButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: "#fff",
    borderRadius: 8,
  },

  backButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
  },

  courseInfo: {
    flex: 1,
    alignItems: "center",
    paddingTop: 5, // Extra padding to prevent overlap with Dynamic Island
  },

  courseText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },

  holeText: {
    fontSize: 16,
    color: "#ffd700",
  },
});

export default CourseScreen;