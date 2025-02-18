import React, { useState } from "react";
import { View, StyleSheet, Text, ImageBackground } from "react-native";
import { TextInput, Button, Card } from "react-native-paper";
import CONFIG from "./config";

const LoginScreen = ({ navigation }) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const isValidUsername = (username) => {
        return /^[0-9]{4,10}$/.test(username);
    };

    const handleLogin = async () => {
      if (!username || !password) {
          setError("Please enter both username and password.");
          return;
      }
      if (!isValidUsername(username)) {
          setError("Username must be 4-10 numbers only.");
          return;
      }
      setError("");
      console.log("Logging in with:", username, password);
  
      try {
          const response = await fetch(`${CONFIG.API_BASE_URL}/login`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ player_id: username, password }),
          });
  
          console.log("Response status:", response.status);
  
          const data = await response.json();
          console.log("Response data:", data);
  
          if (!response.ok) {
              throw new Error(data.detail);
          }
  
          setError("");
          console.log("Login Successful:", data.player_id);
          navigation.navigate("Home", { player_id: data.player_id });
  
      } catch (error) {
          console.log("Fetch Error:", error);
          setError(error.message);
      }
  };
  
    return (
        <ImageBackground
            source={{ uri: "https://i.pinimg.com/736x/c6/36/22/c63622ca205e7c99093e159c3d4514e2.jpg" }} 
            style={styles.background}
            resizeMode="cover" 
        >
            <View style={styles.container}>
                <Card style={styles.card}>
                    <Card.Title 
                        title="DGCS Login" 
                        titleStyle={styles.title}
                    />
                    <Card.Content>
                        {error ? <Text style={styles.error}>{error}</Text> : null}

                        <TextInput
                            label="Username"
                            mode="outlined"
                            value={username}
                            onChangeText={setUsername}
                            keyboardType="numeric" 
                            autoCapitalize="none"
                            style={styles.input}
                            theme={{ colors: { primary: "green", outline: "green" } }} 
                        />
                        <TextInput
                            label="Password"
                            mode="outlined"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            style={styles.input}
                            theme={{ colors: { primary: "green", outline: "green" } }} 
                        />
                        <Button mode="contained" onPress={handleLogin} style={styles.button} buttonColor="green">
                            Login
                        </Button>
                    </Card.Content>
                </Card>
            </View>
        </ImageBackground>
        
    );
};

const styles = StyleSheet.create({
    background: {
        flex: 1,
        width: "100%",
        height: "100%",
    },
    title: {
        textAlign: "center",
        fontSize: 24,
        fontWeight: "bold",
        color: "green", 
    },
    container: {
        flex: 1,
        justifyContent: "center",
        padding: 20,
    },
    card: {
        padding: 20,
        backgroundColor: "rgba(255, 255, 255, 0.3)", 
    },
    input: {
        marginBottom: 15,
        color: "green", 
    },
    button: {
        marginTop: 10,
    },
    error: {
        color: "red",
        marginBottom: 10,
    },
});

export default LoginScreen;