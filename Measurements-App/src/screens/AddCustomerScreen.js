import React, { useState, useRef } from "react";
import { db, auth } from "../firebaseConfig";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

/* ---------- SIMPLE ORDER ID ---------- */
const generateOrderId = () => {
  const random = Math.floor(100 + Math.random() * 900);
  return `ORD-${random}`;
};

const todayDate = new Date().toLocaleDateString("en-GB");

export default function AddCustomerScreen({ navigation }) {
  const [orderId] = useState(generateOrderId());
  const [today] = useState(todayDate);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [notes, setNotes] = useState("");

  const [errors, setErrors] = useState({});
  const [showDatePicker, setShowDatePicker] = useState(false);

  /* ---------- VALIDATION ---------- */
  const validateField = (field, value) => {
    let message = "";

    if (field === "name" && !value.trim())
      message = "Enter customer name";

    if (field === "phone" && value.length !== 10)
      message = "Enter 10 digit mobile";

    if (field === "city" && !value.trim())
      message = "Enter city";

    if (field === "deliveryDate" && !value)
      message = "Select delivery date";

    setErrors((prev) => ({ ...prev, [field]: message }));
    return message === "";
  };

  const handlePhoneChange = (text) => {
    const cleaned = text.replace(/[^0-9]/g, "").slice(0, 10);
    setPhone(cleaned);
    validateField("phone", cleaned);
  };

  /* ---------- SAVE ---------- */
  const handleContinue = async () => {
    const valid =
      validateField("name", name) &
      validateField("phone", phone) &
      validateField("city", city) &
      validateField("deliveryDate", deliveryDate);

    if (!valid) return;

    const docRef = await addDoc(collection(db, "customers"), {
      ownerId: auth.currentUser.uid,
      orderId,
      name,
      phone,
      city,
      deliveryDate,
      notes,
      status: "pending",
      createdAt: serverTimestamp(),
    });

    navigation.navigate("AddMeasurement", {
      customerId: docRef.id,
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Customer</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.form}>
          {/* ORDER INFO */}
          <View style={styles.orderBox}>
            <Info label="Order ID" value={orderId} />
            <Info label="Today" value={today} />
          </View>

          <Field
            label="Customer Name"
            value={name}
            error={errors.name}
            onChangeText={(t) => {
              setName(t);
              validateField("name", t);
            }}
          />

          <Field
            label="Mobile Number"
            value={phone}
            error={errors.phone}
            keyboardType="number-pad"
            onChangeText={handlePhoneChange}
          />

          <Field
            label="City"
            value={city}
            error={errors.city}
            onChangeText={(t) => {
              setCity(t);
              validateField("city", t);
            }}
          />

          <TouchableOpacity onPress={() => setShowDatePicker(true)}>
            <Field
              label="Delivery Date"
              value={deliveryDate}
              error={errors.deliveryDate}
              editable={false}
            />
          </TouchableOpacity>

          <Field
            label="Notes (Optional)"
            value={notes}
            onChangeText={setNotes}
            multiline
          />

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* BUTTON */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.saveBtn} onPress={handleContinue}>
            <Text style={styles.saveText}>CONTINUE TO MEASUREMENTS</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {showDatePicker && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          minimumDate={new Date()}
          onChange={(e, date) => {
            setShowDatePicker(false);
            if (date) {
              const formatted = date.toLocaleDateString("en-GB");
              setDeliveryDate(formatted);
              validateField("deliveryDate", formatted);
            }
          }}
        />
      )}
    </SafeAreaView>
  );
}

/* ---------- INPUT COMPONENT ---------- */
const Field = ({ label, error, ...props }) => (
  <View style={{ marginBottom: 18 }}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      {...props}
      style={[styles.input, error ? styles.errorBorder : styles.normalBorder]}
      placeholderTextColor="#64748B"
    />
    {error && <Text style={styles.errorText}>{error}</Text>}
  </View>
);

/* ---------- INFO BOX ---------- */
const Info = ({ label, value }) => (
  <View>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

/* ---------- STYLES ---------- */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0B1121" },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
  },
  headerTitle: { color: "#FFF", fontSize: 20, fontWeight: "700" },

  form: { padding: 20 },

  orderBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#151E32",
    padding: 16,
    borderRadius: 14,
    marginBottom: 25,
  },

  infoLabel: { color: "#94A3B8", fontSize: 11 },
  infoValue: { color: "#FFF", fontSize: 16, fontWeight: "700" },

  label: { color: "#94A3B8", fontSize: 12, marginBottom: 6 },

  input: {
    backgroundColor: "#151E32",
    borderRadius: 12,
    padding: 15,
    color: "#FFF",
    fontSize: 15,
    borderWidth: 1.2,
  },

  normalBorder: { borderColor: "#1E293B" },
  errorBorder: { borderColor: "#EF4444" },

  errorText: { color: "#EF4444", fontSize: 12, marginTop: 4 },

  footer: { padding: 20 },

  saveBtn: {
    backgroundColor: "#2563EB",
    padding: 18,
    borderRadius: 14,
    alignItems: "center",
  },
  saveText: { color: "#FFF", fontWeight: "700", fontSize: 15 },
});
