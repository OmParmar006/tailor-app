import React, { useContext, useEffect } from "react";
import { View, Text } from "react-native";
import { AuthContext } from "../context/AuthContext";

export default function WelcomeScreen({ navigation }) {
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace("Home");
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#020617",
      }}
    >
      <Text style={{ color: "#fff", fontSize: 22, fontWeight: "700" }}>
        Welcome
      </Text>
      <Text style={{ color: "#CBD5F5", marginTop: 8 }}>
        {user?.email}
      </Text>
    </View>
  );
}
