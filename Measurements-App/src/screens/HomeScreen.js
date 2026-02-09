import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

export default function HomeScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hi Yogi! 👋</Text>
            <Text style={styles.subGreeting}>Good Morning</Text>
          </View>
          <View style={styles.headerIcons}>
            <IconBtn name="notifications-outline" onPress={() => {}} />
            <IconBtn name="moon-outline" onPress={() => {}} />
          </View>
        </View>

        {/* WELCOME CARD */}
        <View style={styles.welcomeCard}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={styles.welcomeTitle}>Welcome!</Text>
            <Text style={styles.welcomeDesc}>
              Let’s manage today’s tailoring work
            </Text>
          </View>

          <Image
            source={require("../../assets/machine.png")}
            style={styles.machineImage}
            resizeMode="contain"
          />
        </View>

        {/* SUMMARY */}
        <Text style={styles.sectionTitle}>Summary</Text>

        <View style={styles.summaryContainer}>
          <View style={styles.financialCard}>
            <Text style={styles.cardHeader}>Financials</Text>

            <View style={styles.financeItem}>
              <Text style={styles.financeLabel}>Cash Received</Text>
              <Text style={styles.financeValueGreen}>₹98.5K</Text>
              <View style={styles.chartLineGreen} />
            </View>

            <View style={styles.financeItem}>
              <Text style={styles.financeLabel}>Outstanding</Text>
              <Text style={styles.financeValueRed}>₹93.02K</Text>
              <View style={styles.chartLineRed} />
            </View>

            <View style={styles.financeItem}>
              <Text style={styles.financeLabel}>Profit</Text>
              <Text style={styles.financeValueGreen}>₹1.25L</Text>
              <View style={styles.chartLineGreen} />
            </View>
          </View>

          <View style={styles.rightColumn}>
            <View style={styles.statusCard}>
              <Text style={styles.cardHeader}>Order Status</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressSeg, { backgroundColor: "#EF4444", flex: 1 }]} />
                <View style={[styles.progressSeg, { backgroundColor: "#F59E0B", flex: 1.5 }]} />
                <View style={[styles.progressSeg, { backgroundColor: "#3B82F6", flex: 1 }]} />
                <View style={[styles.progressSeg, { backgroundColor: "#10B981", flex: 1 }]} />
              </View>
              <Text style={styles.legendText}>
                Pending · In Progress · QC · Ready
              </Text>
            </View>

            <View style={styles.urgentCard}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={styles.cardHeader}>Urgent</Text>
                <Ionicons name="chevron-forward" color="#64748B" size={16} />
              </View>
              <Text style={styles.urgentSub}>Deliveries</Text>

              <View style={styles.urgentRow}>
                <Text style={styles.urgentRed}>Due Today</Text>
                <Text style={styles.actionLink}>3 Items</Text>
              </View>
              <View style={styles.urgentRow}>
                <Text style={styles.urgentGray}>Tomorrow</Text>
                <Text style={styles.actionLink}>3 Items</Text>
              </View>
            </View>
          </View>
        </View>

        {/* SEARCH */}
        <Text style={styles.sectionTitle}>Search</Text>
        <View style={styles.searchContainer}>
          <View style={styles.searchHeader}>
            <Ionicons name="search" size={20} color="#94A3B8" />
            <TextInput
              placeholder="Advanced Filter & Search"
              placeholderTextColor="#64748B"
              style={styles.searchInput}
            />
          </View>
          <View style={styles.chipRow}>
            <Chip label="Status" />
            <Chip label="Date" />
            <Chip label="Item Type" />
          </View>
        </View>

        {/* RECENT ORDERS */}
        <Text style={styles.sectionTitle}>Recent Orders</Text>
        <View style={styles.tableCard}>
          <TableRow name="Rahul Verma" item="Kurta" status="Pending" date="28 Jan" />
          <TableRow name="Priya Singh" item="Blouse" status="Progress" date="29 Jan" />
          <TableRow name="Priya Singh" item="Blouse" status="Complex" date="30 Jan" />
        </View>
      </ScrollView>

      {/* BOTTOM NAV */}
      <View style={styles.bottomNavContainer}>
        <View style={styles.bottomNav}>
          <NavIcon name="home" active />
          <NavIcon name="people-outline" />
          <View style={styles.fabPlaceholder} />
          <NavIcon name="receipt-outline" />
          <NavIcon name="person-outline" />
        </View>

        {/* FLOATING + BUTTON (NOW WORKING) */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate("AddMeasurement")}
        >
          <Ionicons name="add" size={32} color="#FFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

/* ---------- SUB COMPONENTS ---------- */

const IconBtn = ({ name, onPress }) => (
  <TouchableOpacity style={styles.iconBtn} onPress={onPress}>
    <Ionicons name={name} size={20} color="#E2E8F0" />
  </TouchableOpacity>
);

const Chip = ({ label }) => (
  <TouchableOpacity style={styles.chip}>
    <Text style={styles.chipText}>{label}</Text>
    <Ionicons name="chevron-down" size={12} color="#94A3B8" />
  </TouchableOpacity>
);

const TableRow = ({ name, item, status, date }) => (
  <View style={styles.tableRow}>
    <Text style={[styles.td, { flex: 2, color: "#F1F5F9" }]}>{name}</Text>
    <Text style={[styles.td, { flex: 1.5 }]}>{item}</Text>

    <View style={{ flex: 1.5, alignItems: "center" }}>
      <View
        style={[
          styles.badge,
          status === "Pending" && styles.badgeRed,
          status === "Progress" && styles.badgeOrange,
          status === "Complex" && styles.badgeGreen,
        ]}
      >
        <Text
          style={[
            styles.badgeText,
            status === "Pending" && styles.textRed,
            status === "Progress" && styles.textOrange,
            status === "Complex" && styles.textGreen,
          ]}
        >
          {status}
        </Text>
      </View>
    </View>

    <Text style={[styles.td, { flex: 1.5, textAlign: "right" }]}>{date}</Text>
    <MaterialCommunityIcons name="dots-vertical" size={18} color="#64748B" />
  </View>
);

const NavIcon = ({ name, active }) => (
  <TouchableOpacity>
    <Ionicons name={name} size={24} color={active ? "#3B82F6" : "#64748B"} />
    {active && <View style={styles.activeDot} />}
  </TouchableOpacity>
);

/* ---------- STYLES ---------- */
/* (unchanged – keep exactly as you already have) */

/* --- STYLES --- */

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#0B1121", 
  },
  
  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    marginBottom: 20,
  },
  greeting: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFF",
  },
  subGreeting: {
    fontSize: 14,
    color: "#94A3B8",
  },
  headerIcons: {
    flexDirection: "row",
    gap: 12,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1E293B",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#334155",
  },

  // Welcome Card
  welcomeCard: {
    marginHorizontal: 20,
    backgroundColor: "#172033",
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#334155",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  welcomeTitle: {
    color: "#60A5FA",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  welcomeDesc: {
    color: "#CBD5E1",
    fontSize: 13,
    lineHeight: 18,
    maxWidth: '90%',
  },
  
  // ADJUSTED FOR THE NEW REALISTIC MACHINE
  machineImage: {
    width: 110, // Wider to fit the vintage machine aspect ratio
    height: 80,
    // No tintColor, so the black and gold shows naturally
  },

  // Section Headers
  sectionTitle: {
    color: "#E2E8F0",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 20,
    marginTop: 24,
    marginBottom: 12,
  },

  // Summary Bento Grid
  summaryContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
    height: 220, 
  },
  financialCard: {
    flex: 1,
    backgroundColor: "#151E32",
    borderRadius: 16,
    padding: 16,
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  rightColumn: {
    flex: 1,
    gap: 12,
  },
  statusCard: {
    flex: 1,
    backgroundColor: "#151E32",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#1E293B",
    justifyContent: "center",
  },
  urgentCard: {
    flex: 1.2,
    backgroundColor: "#151E32",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#1E293B",
  },

  // Financial Content
  cardHeader: {
    color: "#F1F5F9",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  financeItem: {
    marginBottom: 4,
  },
  financeLabel: {
    color: "#64748B",
    fontSize: 10,
    marginBottom: 2,
  },
  financeValueGreen: {
    color: "#4ADE80",
    fontSize: 16,
    fontWeight: "bold",
  },
  financeValueRed: {
    color: "#F87171",
    fontSize: 16,
    fontWeight: "bold",
  },
  chartLineGreen: {
    height: 2,
    width: '60%',
    backgroundColor: '#4ADE80',
    marginTop: 4,
    opacity: 0.5,
    borderRadius: 2
  },
  chartLineRed: {
    height: 2,
    width: '60%',
    backgroundColor: '#F87171',
    marginTop: 4,
    opacity: 0.5,
    borderRadius: 2
  },

  // Order Status Content
  progressBar: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginVertical: 8,
  },
  statusLegend: {
    flexDirection: 'row',
  },
  legendText: {
    fontSize: 8,
    color: '#94A3B8'
  },

  // Urgent Content
  urgentSub: {
    color: '#94A3B8', 
    fontSize: 10, 
    marginBottom: 8 
  },
  urgentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    alignItems: 'center'
  },
  urgentRed: {
    color: '#F87171',
    fontSize: 11,
    fontWeight: '600'
  },
  urgentGray: {
    color: '#94A3B8',
    fontSize: 11,
  },
  actionLink: {
    color: '#3B82F6',
    fontSize: 11,
  },

  // Search
  searchContainer: {
    marginHorizontal: 20,
    backgroundColor: "#151E32",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    color: '#FFF',
    fontSize: 14,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  chipText: {
    color: '#94A3B8',
    fontSize: 11,
  },

  // Recent Orders Table
  tableCard: {
    marginHorizontal: 20,
    backgroundColor: "#151E32",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  tableHeader: {
    flexDirection: 'row',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    paddingBottom: 8,
  },
  th: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  td: {
    color: '#94A3B8',
    fontSize: 12,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
  },
  badgeRed: { backgroundColor: 'rgba(239, 68, 68, 0.15)' },
  badgeOrange: { backgroundColor: 'rgba(245, 158, 11, 0.15)' },
  badgeGreen: { backgroundColor: 'rgba(16, 185, 129, 0.15)' },
  
  textRed: { color: '#EF4444', fontSize: 10, fontWeight: '600' },
  textOrange: { color: '#F59E0B', fontSize: 10, fontWeight: '600' },
  textGreen: { color: '#10B981', fontSize: 10, fontWeight: '600' },
  badgeText: { fontSize: 10, fontWeight: '600' },

  // Weekly Chart
  chartCard: {
    marginHorizontal: 20,
    backgroundColor: "#151E32",
    borderRadius: 16,
    padding: 16,
    height: 150,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  chartYAxis: {
    color: '#64748B',
    fontSize: 10,
    marginRight: 10,
    marginTop: 0,
  },
  barContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingBottom: 10,
  },
  barWrapper: {
    alignItems: 'center',
    width: '10%',
  },
  bar: {
    width: '100%',
    backgroundColor: '#3B82F6',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },

  // Bottom Navigation
  bottomNavContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    height: 70,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    paddingBottom: 10,
  },
  fabPlaceholder: {
    width: 60,
  },
  fab: {
    position: 'absolute',
    top: -25,
    alignSelf: 'center',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
    borderWidth: 4,
    borderColor: '#0B1121',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3B82F6',
    alignSelf: 'center',
    marginTop: 4,
  }
});