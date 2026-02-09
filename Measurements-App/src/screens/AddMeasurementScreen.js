import React, { useContext, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
} from "react-native";
import { ThemeContext } from "../context/ThemeContext";
import { addDoc, collection } from "firebase/firestore";
import { db } from "../firebaseConfig";

export default function AddMeasurementScreen({ route, navigation }) {
  const { theme } = useContext(ThemeContext);

  const customerId = route?.params?.customerId;
  const customerName = route?.params?.customerName || "Customer";

  const [garment, setGarment] = useState("Shirt");
  const [fit, setFit] = useState("Regular");
  const [notes, setNotes] = useState("");
  const [measurements, setMeasurements] = useState({});

  const handleChange = (key, value) => {
    setMeasurements({ ...measurements, [key]: value });
  };

  const saveMeasurement = async () => {
    if (!customerId) {
      alert("Customer missing");
      return;
    }

    await addDoc(collection(db, "measurements"), {
      customerId,
      garment,
      fit,
      measurements,
      notes,
      createdAt: new Date(),
    });

    alert("Measurement saved");
    navigation.replace("Home");
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.bg }}
      contentContainerStyle={{ padding: 16 }}
      showsVerticalScrollIndicator={false}
    >
      {/* HEADER */}
      <Text style={[styles.title, { color: theme.text }]}>
        Measurements for {customerName}
      </Text>
      <Text style={{ color: theme.subText, marginBottom: 16 }}>
        Select garment and enter accurate measurements
      </Text>

      {/* GARMENT SELECTION */}
      <Text style={[styles.section, { color: theme.text }]}>
        Garment Type
      </Text>

      <View style={styles.row}>
        {Object.keys(GARMENTS).map((g) => (
          <TouchableOpacity
            key={g}
            style={[
              styles.garmentCard,
              {
                backgroundColor:
                  garment === g ? theme.primary : theme.card,
                borderColor: theme.border,
              },
            ]}
            onPress={() => {
              setGarment(g);
              setMeasurements({});
            }}
          >
            <Text
              style={{
                color: garment === g ? "#fff" : theme.text,
                fontWeight: "600",
              }}
            >
              {g}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* MEASUREMENT FIELDS */}
      <Text style={[styles.section, { color: theme.text }]}>
        {garment} Measurements
      </Text>

      {GARMENTS[garment].map((field) => (
        <TextInput
          key={field}
          placeholder={field}
          placeholderTextColor={theme.subText}
          keyboardType="numeric"
          value={measurements[field] || ""}
          onChangeText={(v) => handleChange(field, v)}
          style={[
            styles.input,
            {
              backgroundColor: theme.card,
              color: theme.text,
              borderColor: theme.border,
            },
          ]}
        />
      ))}

      {/* FIT SELECTION */}
      <Text style={[styles.section, { color: theme.text }]}>
        Fit Preference
      </Text>

      <View style={styles.row}>
        {["Slim", "Regular", "Loose"].map((f) => (
          <TouchableOpacity
            key={f}
            style={[
              styles.fitChip,
              {
                backgroundColor:
                  fit === f ? theme.primary : theme.card,
                borderColor: theme.border,
              },
            ]}
            onPress={() => setFit(f)}
          >
            <Text
              style={{
                color: fit === f ? "#fff" : theme.text,
              }}
            >
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* NOTES */}
      <Text style={[styles.section, { color: theme.text }]}>
        Tailor Notes
      </Text>

      <TextInput
        placeholder="Example: Loose sleeve, tight collar"
        placeholderTextColor={theme.subText}
        multiline
        value={notes}
        onChangeText={setNotes}
        style={[
          styles.notes,
          {
            backgroundColor: theme.card,
            color: theme.text,
            borderColor: theme.border,
          },
        ]}
      />

      {/* SAVE BUTTON */}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: theme.primary }]}
        onPress={saveMeasurement}
      >
        <Text style={styles.buttonText}>Save Measurement</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

/* GARMENT LOGIC (REAL TAILOR DATA) */
const GARMENTS = {
  Shirt: [
    "Chest",
    "Waist",
    "Shoulder",
    "Sleeve Length",
    "Shirt Length",
    "Collar",
  ],
  Pant: [
    "Waist",
    "Hip",
    "Thigh",
    "Knee",
    "Bottom",
    "Pant Length",
  ],
  Blazer: [
    "Chest",
    "Shoulder",
    "Sleeve Length",
    "Coat Length",
    "Waist",
  ],
  Suit: [
    "Chest",
    "Shoulder",
    "Sleeve Length",
    "Coat Length",
    "Waist",
    "Pant Length",
  ],
  Safari: [
    "Chest",
    "Waist",
    "Shoulder",
    "Sleeve",
    "Length",
  ],
  Coti: [
    "Chest",
    "Waist",
    "Length",
  ],
};

/* STYLES */
const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontWeight: "700",
  },
  section: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  garmentCard: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 14,
    borderWidth: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  fitChip: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    borderWidth: 1,
  },
  notes: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    height: 90,
    textAlignVertical: "top",
  },
  button: {
    marginTop: 24,
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
