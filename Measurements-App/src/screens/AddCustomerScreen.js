import React, { useContext, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Animated,
  StyleSheet,
} from "react-native";
import { ThemeContext } from "../context/ThemeContext";
import { addDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";

export default function AddCustomerScreen({ navigation }) {
  const { theme } = useContext(ThemeContext);

  const slide = useRef(new Animated.Value(40)).current;
  const fade = useRef(new Animated.Value(0)).current;

  const [customerId, setCustomerId] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [altPhone, setAltPhone] = useState("");
  const [address, setAddress] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slide, { toValue: 0, duration: 400, useNativeDriver: true }),
      Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    generateCustomerId();
  }, []);

  const generateCustomerId = async () => {
    const snap = await getDocs(collection(db, "customers"));
    const next = snap.size + 1;
    setCustomerId(`CUST-${String(next).padStart(4, "0")}`);
  };

  const saveCustomer = async () => {
    if (!name || !phone || !deliveryDate) {
      alert("Name, phone & delivery date required");
      return;
    }

    await addDoc(collection(db, "customers"), {
      customerId,
      name,
      phone,
      altPhone,
      address,
      deliveryDate,
      notes,
      createdAt: new Date(),
    });

    navigation.replace("AddMeasurement", {
      customerId,
      customerName: name,
    });
  };

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: theme.bg, transform: [{ translateY: slide }], opacity: fade },
      ]}
    >
      <Text style={[styles.title, { color: theme.text }]}>
        Add Customer ({customerId})
      </Text>

      {input("Full Name", name, setName, theme)}
      {input("Phone", phone, setPhone, theme, "phone-pad")}
      {input("Alternate Phone", altPhone, setAltPhone, theme, "phone-pad")}
      {input("Delivery Date (DD/MM/YYYY)", deliveryDate, setDeliveryDate, theme)}
      {input("Address", address, setAddress, theme, "default", true)}
      {input("Notes (fit preference)", notes, setNotes, theme, "default", true)}

      <TouchableOpacity
        style={[styles.button, { backgroundColor: theme.primary }]}
        onPress={saveCustomer}
      >
        <Text style={styles.buttonText}>Save & Add Measurement</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const input = (placeholder, value, set, theme, keyboard, multi) => (
  <TextInput
    placeholder={placeholder}
    placeholderTextColor={theme.subText}
    value={value}
    onChangeText={set}
    keyboardType={keyboard || "default"}
    multiline={multi}
    style={[
      styles.input,
      { backgroundColor: theme.card, color: theme.text, borderColor: theme.border },
      multi && { height: 80 },
    ]}
  />
);

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 14 },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  button: {
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
