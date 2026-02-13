// import React, { useState } from "react";
// import { db } from "../firebaseConfig";
// import { addDoc, collection, serverTimestamp } from "firebase/firestore";
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   ScrollView,
//   TextInput,
//   Modal,
//   Alert,
// } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";
// import { Ionicons } from "@expo/vector-icons";
// import { TabRouter } from "@react-navigation/native";

// /* ---------------- DATA ---------------- */

// const GARMENTS = [
//   "Shirt",
//   "Pant",
//   "Kurta",
//   "Safari",
//   "Coti",
//   "Blazer",
//   "Suit",
// ];

// const FIT_PRESETS = {
//   Slim: -0.5,
//   Regular: 0,
//   Loose: 0.5,
// };

// const MEASUREMENTS = {
//   Shirt: {
//     "Body Size": [
//       "Chest",
//       "Stomach (Pet)",
//       "Seat (Hip)",
//       "Shoulder",
//       "Back",
//     ],
//     Sleeves: [
//       "Sleeve Length",
//       "Sleeve Round",
//       "Sleeve End",
//     ],
//     Neck: [
//       "Collar",
//       "Front Neck",
//       "Back Neck",
//     ],
//     Length: ["Shirt Length"],
//   },

//   Pant: {
//     "Upper Part": ["Waist", "Seat (Hip)"],
//     Legs: ["Thigh", "Knee", "Calf", "Bottom"],
//     Length: ["Full Length", "Inside Length", "Seat Length"],
//   },

//   Kurta: {
//     "Body Size": [
//       "Chest",
//       "Stomach (Pet)",
//       "Seat (Hip)",
//       "Shoulder",
//     ],
//     Sleeves: ["Sleeve Length", "Sleeve End"],
//     Length: ["Kurta Length"],
//   },

//   Safari: {
//     "Body Size": [
//       "Chest",
//       "Stomach (Pet)",
//       "Seat (Hip)",
//       "Shoulder",
//     ],
//     Sleeves: ["Sleeve Length", "Armhole"],
//     Length: ["Safari Length"],
//   },

//   Coti: {
//     "Body Size": [
//       "Chest",
//       "Stomach (Pet)",
//       "Seat (Hip)",
//       "Shoulder",
//     ],
//     Length: ["Coti Length"],
//   },

//   Blazer: {
//     "Body Size": [
//       "Chest",
//       "Stomach (Pet)",
//       "Seat (Hip)",
//       "Shoulder",
//       "Back",
//     ],
//     Sleeves: ["Sleeve Length", "Armhole"],
//     Length: ["Blazer Length"],
//   },

//   Suit: {
//     "Jacket Size": [
//       "Chest",
//       "Stomach (Pet)",
//       "Seat (Hip)",
//       "Shoulder",
//       "Sleeve Length",
//       "Back",
//     ],
//     "Pant Size": [
//       "Waist",
//       "Seat (Hip)",
//       "Thigh",
//       "Bottom",
//       "Full Length",
//     ],
//   },
// };

// /* ---------------- SCREEN ---------------- */

// export default function AddMeasurementScreen({ navigation,route }) {
//   const {customerId} = route.params;
//   const [activeGarment, setActiveGarment] = useState("Shirt");
//   const [data, setData] = useState({});
//   const [pickerOpen, setPickerOpen] = useState(false);
//   const [fitType, setFitType] = useState("Regular");

//   const updateValue = (field, value) => {
//     setData((prev) => ({
//       ...prev,
//       [activeGarment]: {
//         ...(prev[activeGarment] || {}),
//         [field]: value,
//       },
//     }));
//   };

//   const applyFitPreset = (type) => {
//     const offset = FIT_PRESETS[type];
//     const updated = {};

//     Object.values(MEASUREMENTS[activeGarment])
//       .flat()
//       .forEach((f) => {
//         const base = parseFloat(data?.[activeGarment]?.[f] || 0);
//         if (!isNaN(base)) {
//           updated[f] = (base + offset).toFixed(1);
//         }
//       });

//     setData((prev) => ({
//       ...prev,
//       [activeGarment]: {
//         ...(prev[activeGarment] || {}),
//         ...updated,
//       },
//     }));

//     setFitType(type);
//   };

//   const handleSave = async () => {
//   try {
//     await addDoc(collection(db, "measurements"), {
//       customerId,                     // comes from route.params
//       garment: activeGarment,
//       fitType,
//       values: data[activeGarment] || {},
//       createdAt: serverTimestamp(),
//     });

//     Alert.alert(
//       "Saved",
//       `${activeGarment} measurements saved (${fitType} fit)`
//     );

//     navigation.navigate("Home");
//   } catch (error) {
//     Alert.alert("Error", "Failed to save measurements");
//   }
// };


//   return (
//     <SafeAreaView style={styles.safe}>
//       {/* HEADER */}
//       <View style={styles.header}>
//         <TouchableOpacity onPress={() => navigation.goBack()}>
//           <Ionicons name="arrow-back" size={22} color="#E5E7EB" />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>Take Measurements</Text>
//         <View style={{ width: 22 }} />
//       </View>

//       {/* GARMENT PICKER */}
//       <TouchableOpacity
//         style={styles.garmentPicker}
//         onPress={() => setPickerOpen(true)}
//       >
//         <Text style={styles.smallLabel}>Garment</Text>
//         <View style={styles.rowBetween}>
//           <Text style={styles.valueText}>{activeGarment}</Text>
//           <Ionicons name="chevron-down" size={18} color="#94A3B8" />
//         </View>
//       </TouchableOpacity>

//       {/* FIT PRESET */}
//       <View style={styles.fitRow}>
//         {Object.keys(FIT_PRESETS).map((f) => (
//           <TouchableOpacity
//             key={f}
//             style={[
//               styles.fitChip,
//               fitType === f && styles.fitChipActive,
//             ]}
//             onPress={() => applyFitPreset(f)}
//           >
//             <Text
//               style={[
//                 styles.fitText,
//                 fitType === f && styles.fitTextActive,
//               ]}
//             >
//               {f}
//             </Text>
//           </TouchableOpacity>
//         ))}
//       </View>

//       {/* FORM */}
//       <ScrollView contentContainerStyle={styles.form}>
//         {Object.entries(MEASUREMENTS[activeGarment]).map(
//           ([section, fields]) => (
//             <View key={section} style={styles.card}>
//               <Text style={styles.cardTitle}>{section}</Text>
//               <View style={styles.divider} />

//               {fields.map((field) => (
//                 <View key={field} style={styles.measureRow}>
//                   <Text style={styles.measureLabel}>{field}</Text>

//                   <View style={styles.measureInputWrap}>
//                     <TextInput
//                       style={styles.measureInput}
//                       keyboardType="numeric"
//                       placeholder="0"
//                       placeholderTextColor="#64748B"
//                       value={data?.[activeGarment]?.[field] || ""}
//                       onChangeText={(v) => updateValue(field, v)}
//                     />
//                     <Text style={styles.unit}>in</Text>
//                   </View>
//                 </View>
//               ))}
//             </View>
//           )
//         )}
//       </ScrollView>

//       {/* SAVE */}
//       <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
//         <Text style={styles.saveText}>Save Measurements</Text>
//       </TouchableOpacity>

//       {/* GARMENT MODAL */}
//       <Modal transparent visible={pickerOpen} animationType="slide">
//         <View style={styles.modalBg}>
//           <View style={styles.modalCard}>
//             <Text style={styles.modalTitle}>Select Garment</Text>
//             {GARMENTS.map((g) => (
//               <TouchableOpacity
//                 key={g}
//                 style={styles.modalItem}
//                 onPress={() => {
//                   setActiveGarment(g);
//                   setPickerOpen(false);
//                 }}
//               >
//                 <Text style={styles.modalText}>{g}</Text>
//               </TouchableOpacity>
//             ))}
//           </View>
//         </View>
//       </Modal>
//     </SafeAreaView>
//   );
// }

// /* ---------------- STYLES ---------------- */

// const styles = StyleSheet.create({
//   safe: { flex: 1, backgroundColor: "#0B1121" },

//   header: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     padding: 20,
//   },
//   headerTitle: {
//     color: "#FFFFFF",
//     fontSize: 18,
//     fontWeight: "700",
//   },

//   garmentPicker: {
//     marginHorizontal: 16,
//     marginBottom: 10,
//     padding: 14,
//     borderRadius: 16,
//     backgroundColor: "#151E32",
//     borderWidth: 1,
//     borderColor: "#1E293B",
//   },
//   smallLabel: { color: "#94A3B8", fontSize: 11 },
//   rowBetween: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//   },
//   valueText: { color: "#E2E8F0", fontSize: 16 },

//   fitRow: {
//     flexDirection: "row",
//     justifyContent: "space-around",
//     marginBottom: 10,
//   },
//   fitChip: {
//     paddingHorizontal: 18,
//     paddingVertical: 10,
//     borderRadius: 20,
//     backgroundColor: "#1E293B",
//   },
//   fitChipActive: {
//     backgroundColor: "#2563EB",
//   },
//   fitText: { color: "#CBD5E1", fontWeight: "600" },
//   fitTextActive: { color: "#FFFFFF" },

//   form: { padding: 16, paddingBottom: 120 },

//   card: {
//     backgroundColor: "#151E32",
//     borderRadius: 18,
//     padding: 16,
//     marginBottom: 16,
//     borderWidth: 1,
//     borderColor: "#1E293B",
//   },
//   cardTitle: {
//     color: "#E2E8F0",
//     fontSize: 15,
//     fontWeight: "700",
//   },
//   divider: {
//     height: 1,
//     backgroundColor: "#1E293B",
//     marginVertical: 10,
//   },

//   /* ---- ALIGNED MEASUREMENT ROW ---- */
//   measureRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginBottom: 12,
//   },
//   measureLabel: {
//     flex: 1,
//     color: "#CBD5E1",
//     fontSize: 14,
//     paddingRight: 8,
//   },
//   measureInputWrap: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#0F172A",
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: "#1E293B",
//     paddingHorizontal: 10,
//     width: 120,
//     height: 42,
//   },
//   measureInput: {
//     flex: 1,
//     color: "#FFFFFF",
//     fontSize: 15,
//     textAlign: "center",
//   },
//   unit: {
//     color: "#94A3B8",
//     fontSize: 12,
//     marginLeft: 4,
//   },

//   saveBtn: {
//     position: "absolute",
//     bottom: 20,
//     left: 20,
//     right: 20,
//     backgroundColor: "#2563EB",
//     paddingVertical: 16,
//     borderRadius: 16,
//     alignItems: "center",
//   },
//   saveText: {
//     color: "#FFFFFF",
//     fontSize: 16,
//     fontWeight: "700",
//   },

//   modalBg: {
//     flex: 1,
//     backgroundColor: "rgba(0,0,0,0.6)",
//     justifyContent: "flex-end",
//   },
//   modalCard: {
//     backgroundColor: "#0F172A",
//     padding: 20,
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//   },
//   modalTitle: {
//     color: "#FFFFFF",
//     fontSize: 16,
//     fontWeight: "700",
//     marginBottom: 10,
//   },
//   modalItem: {
//     paddingVertical: 14,
//     borderBottomWidth: 1,
//     borderBottomColor: "#1E293B",
//   },
//   modalText: {
//     color: "#CBD5E1",
//     fontSize: 15,
//   },
// });



import React, { useState, useRef } from "react";
import { db } from "../firebaseConfig";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

/* ---------------- DATA ---------------- */

const GARMENTS = [
  "Shirt",
  "Pant",
  "Kurta",
  "Safari",
  "Coti",
  "Blazer",
  "Suit",
];

const FIT_PRESETS = {
  Slim: -0.5,
  Regular: 0,
  Loose: 0.5,
};

const MEASUREMENTS = {
  Shirt: {
    "Body Size": [
      "Chest",
      "Stomach (Pet)",
      "Seat (Hip)",
      "Shoulder",
      "Back",
    ],
    Sleeves: [
      "Sleeve Length",
      "Sleeve Round",
      "Sleeve End",
    ],
    Neck: [
      "Collar",
      "Front Neck",
      "Back Neck",
    ],
    Length: ["Shirt Length"],
  },

  Pant: {
    "Upper Part": ["Waist", "Seat (Hip)"],
    Legs: ["Thigh", "Knee", "Calf", "Bottom"],
    Length: ["Full Length", "Inside Length", "Seat Length"],
  },

  Kurta: {
    "Body Size": [
      "Chest",
      "Stomach (Pet)",
      "Seat (Hip)",
      "Shoulder",
    ],
    Sleeves: ["Sleeve Length", "Sleeve End"],
    Length: ["Kurta Length"],
  },

  Safari: {
    "Body Size": [
      "Chest",
      "Stomach (Pet)",
      "Seat (Hip)",
      "Shoulder",
    ],
    Sleeves: ["Sleeve Length", "Armhole"],
    Length: ["Safari Length"],
  },

  Coti: {
    "Body Size": [
      "Chest",
      "Stomach (Pet)",
      "Seat (Hip)",
      "Shoulder",
    ],
    Length: ["Coti Length"],
  },

  Blazer: {
    "Body Size": [
      "Chest",
      "Stomach (Pet)",
      "Seat (Hip)",
      "Shoulder",
      "Back",
    ],
    Sleeves: ["Sleeve Length", "Armhole"],
    Length: ["Blazer Length"],
  },

  Suit: {
    "Jacket Size": [
      "Chest",
      "Stomach (Pet)",
      "Seat (Hip)",
      "Shoulder",
      "Sleeve Length",
      "Back",
    ],
    "Pant Size": [
      "Waist",
      "Seat (Hip)",
      "Thigh",
      "Bottom",
      "Full Length",
    ],
  },
};

/* ---------------- SCREEN ---------------- */

export default function AddMeasurementScreen({ navigation, route }) {
  const { customerId } = route?.params || {};

  const [activeGarment, setActiveGarment] = useState("Shirt");
  const [data, setData] = useState({});
  const [pickerOpen, setPickerOpen] = useState(false);
  const [fitType, setFitType] = useState("Regular");

  /* 🔔 TOAST STATE (OVERLAY ONLY) */
  const [toastMsg, setToastMsg] = useState("");
  const toastAnim = useRef(new Animated.Value(300)).current;

  const showToast = (message) => {
    setToastMsg(message);

    Animated.timing(toastAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      Animated.timing(toastAnim, {
        toValue: 300,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setToastMsg(""));
    }, 2000);
  };

  const updateValue = (field, value) => {
    setData((prev) => ({
      ...prev,
      [activeGarment]: {
        ...(prev[activeGarment] || {}),
        [field]: value,
      },
    }));
  };

  const applyFitPreset = (type) => {
    const offset = FIT_PRESETS[type];
    const updated = {};

    Object.values(MEASUREMENTS[activeGarment])
      .flat()
      .forEach((f) => {
        const base = parseFloat(data?.[activeGarment]?.[f] || 0);
        if (!isNaN(base)) {
          updated[f] = (base + offset).toFixed(1);
        }
      });

    setData((prev) => ({
      ...prev,
      [activeGarment]: {
        ...(prev[activeGarment] || {}),
        ...updated,
      },
    }));

    setFitType(type);
  };

  /* ✅ VALIDATION (LOGIC ONLY) */
  const allMeasurementsFilled = () => {
    const fields = Object.values(MEASUREMENTS[activeGarment]).flat();
    return fields.every(
      (f) =>
        data?.[activeGarment]?.[f] &&
        data[activeGarment][f].toString().trim() !== ""
    );
  };

  const handleSave = async () => {
    if (!allMeasurementsFilled()) {
      Alert.alert(
        "Incomplete",
        "Please fill all measurement fields"
      );
      return;
    }

    try {
      await addDoc(collection(db, "measurements"), {
        customerId,
        garment: activeGarment,
        fitType,
        values: data[activeGarment],
        createdAt: serverTimestamp(),
      });

      showToast("All measurements saved successfully");

      setTimeout(() => {
        navigation.navigate("Home");
      }, 800);
    } catch (error) {
      Alert.alert("Error", "Failed to save measurements");
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#E5E7EB" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Take Measurements</Text>
        <View style={{ width: 22 }} />
      </View>

      {/* GARMENT PICKER */}
      <TouchableOpacity
        style={styles.garmentPicker}
        onPress={() => setPickerOpen(true)}
      >
        <Text style={styles.smallLabel}>Garment</Text>
        <View style={styles.rowBetween}>
          <Text style={styles.valueText}>{activeGarment}</Text>
          <Ionicons name="chevron-down" size={18} color="#94A3B8" />
        </View>
      </TouchableOpacity>

      {/* FIT PRESET */}
      <View style={styles.fitRow}>
        {Object.keys(FIT_PRESETS).map((f) => (
          <TouchableOpacity
            key={f}
            style={[
              styles.fitChip,
              fitType === f && styles.fitChipActive,
            ]}
            onPress={() => applyFitPreset(f)}
          >
            <Text
              style={[
                styles.fitText,
                fitType === f && styles.fitTextActive,
              ]}
            >
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* FORM */}
      <ScrollView contentContainerStyle={styles.form}>
        {Object.entries(MEASUREMENTS[activeGarment]).map(
          ([section, fields]) => (
            <View key={section} style={styles.card}>
              <Text style={styles.cardTitle}>{section}</Text>
              <View style={styles.divider} />

              {fields.map((field) => (
                <View key={field} style={styles.measureRow}>
                  <Text style={styles.measureLabel}>{field}</Text>

                  <View style={styles.measureInputWrap}>
                    <TextInput
                      style={styles.measureInput}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor="#64748B"
                      value={data?.[activeGarment]?.[field] || ""}
                      onChangeText={(v) => updateValue(field, v)}
                    />
                    <Text style={styles.unit}>in</Text>
                  </View>
                </View>
              ))}
            </View>
          )
        )}
      </ScrollView>

      {/* SAVE */}
      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveText}>Save Measurements</Text>
      </TouchableOpacity>

      {/* GARMENT MODAL */}
      <Modal transparent visible={pickerOpen} animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select Garment</Text>
            {GARMENTS.map((g) => (
              <TouchableOpacity
                key={g}
                style={styles.modalItem}
                onPress={() => {
                  setActiveGarment(g);
                  setPickerOpen(false);
                }}
              >
                <Text style={styles.modalText}>{g}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* 🔔 SLIDING TOAST (OVERLAY, NOT UI CHANGE) */}
      {toastMsg !== "" && (
        <Animated.View
          style={{
            position: "absolute",
            top: 50,
            right: 20,
            backgroundColor: "#111827",
            paddingVertical: 12,
            paddingHorizontal: 18,
            borderRadius: 20,
            transform: [{ translateX: toastAnim }],
          }}
        >
          <Text style={{ color: "#FFFFFF", fontWeight: "600" }}>
            {toastMsg}
          </Text>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0B1121" },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },

  garmentPicker: {
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "#151E32",
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  smallLabel: { color: "#94A3B8", fontSize: 11 },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  valueText: { color: "#E2E8F0", fontSize: 16 },

  fitRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 10,
  },
  fitChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#1E293B",
  },
  fitChipActive: {
    backgroundColor: "#2563EB",
  },
  fitText: { color: "#CBD5E1", fontWeight: "600" },
  fitTextActive: { color: "#FFFFFF" },

  form: { padding: 16, paddingBottom: 120 },

  card: {
    backgroundColor: "#151E32",
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  cardTitle: {
    color: "#E2E8F0",
    fontSize: 15,
    fontWeight: "700",
  },
  divider: {
    height: 1,
    backgroundColor: "#1E293B",
    marginVertical: 10,
  },

  measureRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  measureLabel: {
    flex: 1,
    color: "#CBD5E1",
    fontSize: 14,
    paddingRight: 8,
  },
  measureInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0F172A",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1E293B",
    paddingHorizontal: 10,
    width: 120,
    height: 42,
  },
  measureInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 15,
    textAlign: "center",
  },
  unit: {
    color: "#94A3B8",
    fontSize: 12,
    marginLeft: 4,
  },

  saveBtn: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "#2563EB",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  saveText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#0F172A",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
  },
  modalItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B",
  },
  modalText: {
    color: "#CBD5E1",
    fontSize: 15,
  },
});
