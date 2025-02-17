import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, Dimensions, Image, ImageBackground, Pressable } from "react-native";
import { Card } from "react-native-paper";

const { width, height } = Dimensions.get("window");

const HomeScreen = () => {
    const images = [
        "https://cdn1.thegolfinggazette.com/uploads/77/2024/09/GettyImages-2164268739-1140x815.jpg",
        "https://wp.usatodaysports.com/wp-content/uploads/sites/87/2020/02/gettyimages-85836947.jpg",
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSFFgVUReIiSpRO1jEHaZG6Q03wXi8hlXjpqg&s",
        "https://tigerwoods.com/wp-content/uploads/2016/11/TigerWoods_Biography_Trophy.jpg",
        "https://e0.365dm.com/24/04/736x414/skysports-rory-mcilroy-golf_6514390.jpg?20240408091228",
        
    ];

    const gridItems = ["Box 1", "Box 2", "Box 3", "Box 4"];

    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = React.useRef(null);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) => {
                const nextIndex = (prevIndex + 1) % images.length;
                flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
                return nextIndex;
            });
        }, 8000); 

        return () => clearInterval(interval);
    }, []);

    const handlePress = (title) => {
        console.log(`${title} tapped`);
    };

    return (
        <ImageBackground 
            source={{ uri: "https://i.pinimg.com/736x/32/1c/1c/321c1c23d7c6119e33a1f815cde6fdac.jpg" }} 
            style={styles.backgroundImage}
        >
            <View style={styles.container}>
                <Text style={styles.headerText}>DGCS</Text>

                <View style={styles.imageContainer}>
                    <FlatList
                        ref={flatListRef}
                        data={images}
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

                <View style={styles.gridContainer}>
                    {gridItems.map((title, index) => (
                        <Pressable 
                            key={index} 
                            onPress={() => handlePress(title)} 
                            style={({ pressed }) => [
                                styles.gridItem, 
                                index < 2 ? { marginBottom: 20 } : null,
                                { opacity: pressed ? 0.7 : 1 }
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
        </ImageBackground>
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
    headerText: {
        position: "flex",
        top: 60,
        left: 20,
        fontSize: 24,
        fontWeight: "bold",
        color: "white",
    },
    imageContainer: {
        height: height / 3,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 40,
    },
    slide: {
        width: width,
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
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
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
});

export default HomeScreen;
