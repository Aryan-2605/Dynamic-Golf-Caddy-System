import React, { useEffect, useState, useRef } from "react";
import { View, StyleSheet, Button } from "react-native";
import { WebView } from "react-native-webview";
import * as Location from "expo-location";

const CourseScreen = () => {
  const webViewRef = useRef(null);
  const [location, setLocation] = useState(null);
  const [prevLocation, setPrevLocation] = useState(null);

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
      console.log("Logged Location:", location);
  
      if (prevLocation) {
        console.log(`Drawing line from (${prevLocation.latitude}, ${prevLocation.longitude}) to (${location.latitude}, ${location.longitude})`);
  
        if (webViewRef.current) {
          const jsCode = `
            console.log("Calling addLine in WebView with coordinates: ${prevLocation.latitude}, ${prevLocation.longitude}, ${location.latitude}, ${location.longitude}");
            addLine(${prevLocation.latitude}, ${prevLocation.longitude}, ${location.latitude}, ${location.longitude});
          `;
          webViewRef.current.injectJavaScript(jsCode);
        }
      }
      setPrevLocation(location);
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
