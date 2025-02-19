import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import LoginScreen from "./LoginScreen";
import HomeScreen from "./HomeScreen";
import BagScreen from "./BagScreen"; 
import { LogBox } from 'react-native';  
import CourseScreen from "./CourseScreen"

const Stack = createStackNavigator();

LogBox.ignoreLogs([
    '404',
    'Possible Unhandled Promise Rejection',
    '422'
  ]);

export default function App() {
    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen name="Bag" component={BagScreen} />
                <Stack.Screen name="Course" component={CourseScreen}  />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
