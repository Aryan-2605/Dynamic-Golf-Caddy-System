import React, { useEffect, useState, useRef } from "react";
import { View, StyleSheet, Button } from "react-native";
import { WebView } from "react-native-webview";
import * as Location from "expo-location";

const CourseScreen = () => {
  const webViewRef = useRef(null);
  const [location, setLocation] = useState(null);
  const [prevLocation, setPrevLocation] = useState(null);

  const { player_id } = route.params || {};

  if (!player_id) {
    console.warn("No player_id provided to Course.");
  }

  

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("Permission to access location was denied");
        return;
      }

      Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 2000, distanceInterval: 4 },
        (newLocation) => {
          const { latitude, longitude } = newLocation.coords;
          setLocation({ latitude, longitude });

          console.log("New GPS Location: ", latitude, longitude);

          if (webViewRef.current) {
            webViewRef.current.injectJavaScript(`
              updateUserLocation(${latitude}, ${longitude});
            `);
          }
        }
      );
    })();
  }, []);

  const logAndDrawLine = () => {
    if (location) {
      console.log("Trying to log location:", location);
  
      if (webViewRef.current) {
        webViewRef.current.injectJavaScript(`
          if (!isPointInsidePolygon([${location.latitude}, ${location.longitude}], polygon_3405987639aa90c4b8f32fb43bdc179c)) {
            alert("🚫 You must be on the golf course to log your first point!");
          } else {
            console.log("✅ Location logged:", ${location.latitude}, ${location.longitude});
            window.ReactNativeWebView.postMessage("Location valid");
          }
        `);
      }
    }
  };
  
  

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        originWhitelist={["*"]}
        source={require("./assets/Hole 1.html")}
        style={styles.webview}
      />
      <Button title="Log & Draw Line" onPress={logAndDrawLine} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
});

export default CourseScreen;
