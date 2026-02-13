import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";

const PIPELINE = ["Measurement", "Cutting", "Stitching", "Trial", "Delivery"];

const COMPLEXITY_WEIGHT = {
  Suit: 5,
  Blazer: 4,
  Safari: 3,
  Kurta: 2,
  Shirt: 2,
  Pant: 2,
};

const parseDeliveryDate = (value) => {
  if (!value || typeof value !== "string") return null;
  const parts = value.split("/");
  if (parts.length !== 3) return null;

  const day = Number(parts[0]);
  const month = Number(parts[1]) - 1;
  const year = Number(parts[2]);

  const date = new Date(year, month, day);
  return Number.isNaN(date.getTime()) ? null : date;
};

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const getDateBucket = (deliveryDateStr) => {
  const parsed = parseDeliveryDate(deliveryDateStr);
  if (!parsed) return "No Date";

  const today = startOfDay(new Date());
  const target = startOfDay(parsed);
  const diff = Math.round((target - today) / 86400000);

  if (diff < 0) return "Overdue";
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff <= 7) return "This Week";
  return "Later";
};

const normalizeStage = (rawStatus) => {
  const v = String(rawStatus || "").toLowerCase().trim();
  if (["measurement", "pending", "new"].includes(v)) return "Measurement";
  if (["cutting"].includes(v)) return "Cutting";
  if (["stitching", "progress", "in progress", "in_progress"].includes(v)) return "Stitching";
  if (["trial", "qc"].includes(v)) return "Trial";
  if (["delivery", "ready", "delivered", "complete", "completed"].includes(v)) return "Delivery";
  return "Measurement";
};

const stageToBadge = (stage) => {
  if (stage === "Measurement") return "Pending";
  if (stage === "Stitching" || stage === "Cutting") return "Progress";
  return "Complex";
};

const toDateSafe = (raw) => {
  if (!raw) return null;
  if (typeof raw?.toDate === "function") return raw.toDate();
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
};

const formatDateForCard = (deliveryDate, createdAt) => {
  if (deliveryDate) return deliveryDate;
  if (!createdAt) return "--";
  return createdAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
};

const urgencyLevelFromBucket = (bucket) => {
  if (bucket === "Overdue" || bucket === "Today") return "High";
  if (bucket === "Tomorrow" || bucket === "This Week") return "Medium";
  return "Low";
};

const riskScore = (order) => {
  const urgencyScore = {
    Overdue: 100,
    Today: 80,
    Tomorrow: 55,
    "This Week": 35,
    Later: 15,
    "No Date": 5,
  }[order.dateBucket] || 0;

  const stagePenalty = {
    Measurement: 20,
    Cutting: 15,
    Stitching: 10,
    Trial: 5,
    Delivery: 0,
  }[order.stage] || 0;

  const complexity = COMPLEXITY_WEIGHT[order.item] || 1;
  const paymentPenalty = order.paymentStatus === "Unpaid" ? 8 : 0;

  return urgencyScore + stagePenalty + complexity + paymentPenalty;
};

export default function HomeScreen() {
  const navigation = useNavigation();

  const [customers, setCustomers] = useState([]);
  const [measurements, setMeasurements] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  const [findMode, setFindMode] = useState("customer"); // customer | work
  const [queueMode, setQueueMode] = useState("all"); // all | next10
  const [searchText, setSearchText] = useState("");

  const [filters, setFilters] = useState({
    status: "All Status",
    date: "All Date",
    item: "All Item Type",
    urgency: "All Urgency",
    payment: "All Payment",
  });

  const [activeFilterKey, setActiveFilterKey] = useState(null);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [localOverrides, setLocalOverrides] = useState({});

  useEffect(() => {
    let unsubscribeCustomers = () => {};
    let unsubscribeMeasurements = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      unsubscribeCustomers();
      unsubscribeMeasurements();

      if (!user) {
        setCustomers([]);
        setMeasurements([]);
        setLoadingOrders(false);
        return;
      }

      setLoadingOrders(true);

      const qCustomers = query(collection(db, "customers"), where("ownerId", "==", user.uid));
      unsubscribeCustomers = onSnapshot(
        qCustomers,
        (snap) => {
          setCustomers(
            snap.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }))
          );
          setLoadingOrders(false);
        },
        () => {
          setCustomers([]);
          setLoadingOrders(false);
        }
      );

      unsubscribeMeasurements = onSnapshot(
        collection(db, "measurements"),
        (snap) => {
          setMeasurements(
            snap.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }))
          );
        },
        () => {
          setMeasurements([]);
        }
      );
    });

    return () => {
      unsubscribeCustomers();
      unsubscribeMeasurements();
      unsubscribeAuth();
    };
  }, []);

  const orders = useMemo(() => {
    const customerIds = new Set(customers.map((c) => c.id));

    const latestMeasurementByCustomer = {};
    for (const m of measurements) {
      if (!customerIds.has(m.customerId)) continue;
      const created = toDateSafe(m.createdAt);
      const createdMs = created ? created.getTime() : 0;
      const prev = latestMeasurementByCustomer[m.customerId];
      if (!prev || createdMs > prev.createdMs) {
        latestMeasurementByCustomer[m.customerId] = {
          garment: m.garment || "-",
          createdMs,
        };
      }
    }

    return customers.map((c) => {
      const createdAt = toDateSafe(c.createdAt);
      const createdAtMs = createdAt ? createdAt.getTime() : 0;

      const override = localOverrides[c.id] || {};

      const stage = override.stage || normalizeStage(c.stage || c.status);
      const paymentStatus = override.paymentStatus || c.paymentStatus || "Unpaid";
      const item =
        latestMeasurementByCustomer[c.id]?.garment ||
        c.itemType ||
        c.garment ||
        "-";
      const date = formatDateForCard(c.deliveryDate, createdAt);
      const dateBucket = getDateBucket(c.deliveryDate);
      const urgency = urgencyLevelFromBucket(dateBucket);

      return {
        id: c.id,
        name: c.name || "Unknown",
        phone: c.phone || "",
        city: c.city || "",
        orderId: c.orderId || "-",
        item,
        stage,
        paymentStatus,
        badgeStatus: stageToBadge(stage),
        date,
        dateBucket,
        urgency,
        rawDeliveryDate: c.deliveryDate || "",
        createdAtMs,
      };
    });
  }, [customers, measurements, localOverrides]);

  const statusOptions = useMemo(
    () => ["All Status", ...Array.from(new Set(orders.map((o) => o.stage)))],
    [orders]
  );
  const itemOptions = useMemo(
    () => ["All Item Type", ...Array.from(new Set(orders.map((o) => o.item)))],
    [orders]
  );
  const dateOptions = ["All Date", "Overdue", "Today", "Tomorrow", "This Week", "Later", "No Date"];
  const urgencyOptions = ["All Urgency", "High", "Medium", "Low"];
  const paymentOptions = ["All Payment", "Paid", "Unpaid"];

  const filteredOrders = useMemo(() => {
    const q = searchText.trim().toLowerCase();

    const filtered = orders.filter((o) => {
      const customerBlob = [o.name, o.phone, o.orderId, o.city].join(" ").toLowerCase();
      const workBlob = [o.item, o.stage, o.date, o.dateBucket, o.paymentStatus, o.urgency].join(" ").toLowerCase();

      const searchMatch = !q || (findMode === "customer" ? customerBlob.includes(q) : workBlob.includes(q));

      const statusMatch = filters.status === "All Status" || o.stage === filters.status;
      const dateMatch = filters.date === "All Date" || o.dateBucket === filters.date;
      const itemMatch = filters.item === "All Item Type" || o.item === filters.item;
      const urgencyMatch = filters.urgency === "All Urgency" || o.urgency === filters.urgency;
      const paymentMatch = filters.payment === "All Payment" || o.paymentStatus === filters.payment;

      return searchMatch && statusMatch && dateMatch && itemMatch && urgencyMatch && paymentMatch;
    });

    if (queueMode === "next10") {
      return [...filtered].sort((a, b) => riskScore(b) - riskScore(a)).slice(0, 10);
    }

    return [...filtered].sort((a, b) => {
      const order = ["Overdue", "Today", "Tomorrow", "This Week", "Later", "No Date"];
      const d = order.indexOf(a.dateBucket) - order.indexOf(b.dateBucket);
      if (d !== 0) return d;
      return b.createdAtMs - a.createdAtMs;
    });
  }, [orders, searchText, findMode, filters, queueMode]);

  const groupedOrders = useMemo(() => {
    const groups = {
      Overdue: [],
      Today: [],
      Tomorrow: [],
      "This Week": [],
      Later: [],
      "No Date": [],
    };
    filteredOrders.forEach((o) => {
      groups[o.dateBucket].push(o);
    });
    return groups;
  }, [filteredOrders]);

  const attention = useMemo(() => {
    const overdue = orders.filter((o) => o.dateBucket === "Overdue").length;
    const today = orders.filter((o) => o.dateBucket === "Today").length;
    const trialPending = orders.filter((o) => o.stage === "Trial").length;
    const paymentPending = orders.filter((o) => o.paymentStatus === "Unpaid").length;
    return { overdue, today, trialPending, paymentPending };
  }, [orders]);

  const analytics = useMemo(() => {
    const dueToday = orders.filter((o) => o.dateBucket === "Today").length;
    const ready = orders.filter((o) => o.stage === "Delivery").length;
    const unpaid = orders.filter((o) => o.paymentStatus === "Unpaid").length;
    return { dueToday, ready, unpaid, total: orders.length };
  }, [orders]);

  const suggestions = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return [];

    const result = [];

    if (findMode === "customer") {
      const nameMatch = orders.find((o) => o.name.toLowerCase().includes(q));
      const phoneMatch = orders.find((o) => o.phone.toLowerCase().includes(q));
      const orderMatch = orders.find((o) => o.orderId.toLowerCase().includes(q));

      if (nameMatch) result.push({ type: "search", label: `Customer: ${nameMatch.name}`, value: nameMatch.name });
      if (phoneMatch) result.push({ type: "search", label: `Phone: ${phoneMatch.phone}`, value: phoneMatch.phone });
      if (orderMatch) result.push({ type: "search", label: `Order: ${orderMatch.orderId}`, value: orderMatch.orderId });
    } else {
      const statusHit = statusOptions.find((s) => s.toLowerCase().includes(q) && s !== "All Status");
      const itemHit = itemOptions.find((i) => i.toLowerCase().includes(q) && i !== "All Item Type");
      const dateHit = dateOptions.find((d) => d.toLowerCase().includes(q) && d !== "All Date");

      if (statusHit) result.push({ type: "filter", key: "status", label: `Status: ${statusHit}`, value: statusHit });
      if (itemHit) result.push({ type: "filter", key: "item", label: `Item: ${itemHit}`, value: itemHit });
      if (dateHit) result.push({ type: "filter", key: "date", label: `Date: ${dateHit}`, value: dateHit });
    }

    result.push({ type: "clear", label: "Clear all filters" });
    return result.slice(0, 4);
  }, [searchText, findMode, orders, statusOptions, itemOptions]);

  const applySuggestion = (s) => {
    if (s.type === "search") {
      setSearchText(s.value);
      return;
    }
    if (s.type === "filter") {
      setFilters((prev) => ({ ...prev, [s.key]: s.value }));
      setSearchText("");
      return;
    }
    if (s.type === "clear") {
      setFilters({
        status: "All Status",
        date: "All Date",
        item: "All Item Type",
        urgency: "All Urgency",
        payment: "All Payment",
      });
      setSearchText("");
    }
  };

  const openFilter = (key) => {
    setActiveFilterKey(key);
    setFilterModalVisible(true);
  };

  const currentFilterOptions = useMemo(() => {
    if (activeFilterKey === "status") return statusOptions;
    if (activeFilterKey === "date") return dateOptions;
    if (activeFilterKey === "item") return itemOptions;
    if (activeFilterKey === "urgency") return urgencyOptions;
    if (activeFilterKey === "payment") return paymentOptions;
    return [];
  }, [activeFilterKey, statusOptions, itemOptions]);

  const setFilterValue = (value) => {
    if (!activeFilterKey) return;
    setFilters((prev) => ({ ...prev, [activeFilterKey]: value }));
    setFilterModalVisible(false);
    setActiveFilterKey(null);
  };

  const rotateStage = (orderId) => {
    setLocalOverrides((prev) => {
      const current = prev[orderId]?.stage || orders.find((o) => o.id === orderId)?.stage || PIPELINE[0];
      const idx = PIPELINE.indexOf(current);
      const next = PIPELINE[(idx + 1) % PIPELINE.length];
      return { ...prev, [orderId]: { ...(prev[orderId] || {}), stage: next } };
    });
  };

  const markPaid = (orderId) => {
    setLocalOverrides((prev) => ({
      ...prev,
      [orderId]: { ...(prev[orderId] || {}), paymentStatus: "Paid" },
    }));
  };

  const callCustomer = async (phone) => {
    if (!phone) {
      Alert.alert("No Phone", "Customer phone number is missing.");
      return;
    }
    const url = `tel:${phone}`;
    const ok = await Linking.canOpenURL(url);
    if (!ok) return Alert.alert("Error", "Unable to open dialer.");
    await Linking.openURL(url);
  };

  const whatsappCustomer = async (phone) => {
    if (!phone) {
      Alert.alert("No Phone", "Customer phone number is missing.");
      return;
    }
    const cleaned = phone.replace(/[^\d]/g, "");
    const url = `https://wa.me/91${cleaned}`;
    const ok = await Linking.canOpenURL(url);
    if (!ok) return Alert.alert("Error", "WhatsApp is not available.");
    await Linking.openURL(url);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
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
            <Text style={styles.welcomeDesc}>Let's manage today's tailoring work</Text>
          </View>
          <Image source={require("../../assets/machine.png")} style={styles.machineImage} resizeMode="contain" />
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
              <Text style={styles.legendText}>Pending · In Progress · QC · Ready</Text>
            </View>

            <View style={styles.urgentCard}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={styles.cardHeader}>Attention Inbox</Text>
                <Ionicons name="alert-circle-outline" color="#64748B" size={16} />
              </View>
              <View style={styles.attentionRow}>
                <AlertPill label={`Overdue ${attention.overdue}`} color="#F87171" onPress={() => setFilters((p) => ({ ...p, date: "Overdue" }))} />
                <AlertPill label={`Today ${attention.today}`} color="#F59E0B" onPress={() => setFilters((p) => ({ ...p, date: "Today" }))} />
              </View>
              <View style={styles.attentionRow}>
                <AlertPill label={`Trial ${attention.trialPending}`} color="#3B82F6" onPress={() => setFilters((p) => ({ ...p, status: "Trial" }))} />
                <AlertPill label={`Unpaid ${attention.paymentPending}`} color="#EAB308" onPress={() => setFilters((p) => ({ ...p, payment: "Unpaid" }))} />
              </View>
            </View>
          </View>
        </View>

        {/* COMMAND CENTER */}
        <Text style={styles.sectionTitle}>Command Center</Text>
        <View style={styles.searchContainer}>
          <View style={styles.modeRow}>
            <ModeToggle label="Find Customer" active={findMode === "customer"} onPress={() => setFindMode("customer")} />
            <ModeToggle label="Find Work" active={findMode === "work"} onPress={() => setFindMode("work")} />
          </View>

          <View style={styles.searchHeader}>
            <Ionicons name="search" size={20} color="#94A3B8" />
            <TextInput
              placeholder={findMode === "customer" ? "Name, phone, order ID..." : "Status, date, item, payment..."}
              placeholderTextColor="#64748B"
              style={styles.searchInput}
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>

          {!!suggestions.length && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionRow}>
              {suggestions.map((s, idx) => (
                <TouchableOpacity key={`${s.label}-${idx}`} style={styles.suggestionChip} onPress={() => applySuggestion(s)}>
                  <Text style={styles.suggestionText}>{s.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <View style={styles.queueRow}>
            <ModeToggle label="All Orders" active={queueMode === "all"} onPress={() => setQueueMode("all")} />
            <ModeToggle label="My Next 10" active={queueMode === "next10"} onPress={() => setQueueMode("next10")} />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            <Chip label={filters.status === "All Status" ? "Status" : filters.status} onPress={() => openFilter("status")} />
            <Chip label={filters.date === "All Date" ? "Date" : filters.date} onPress={() => openFilter("date")} />
            <Chip label={filters.item === "All Item Type" ? "Item Type" : filters.item} onPress={() => openFilter("item")} />
            <Chip label={filters.urgency === "All Urgency" ? "Urgency" : filters.urgency} onPress={() => openFilter("urgency")} />
            <Chip label={filters.payment === "All Payment" ? "Payment" : filters.payment} onPress={() => openFilter("payment")} />
          </ScrollView>

          <View style={styles.analyticsRow}>
            <MiniStat label="Total" value={analytics.total} />
            <MiniStat label="Due Today" value={analytics.dueToday} />
            <MiniStat label="Ready" value={analytics.ready} />
            <MiniStat label="Unpaid" value={analytics.unpaid} />
          </View>
        </View>

        {/* WORK QUEUE */}
        <Text style={styles.sectionTitle}>Recent Work Queue</Text>
        <View style={styles.tableCard}>
          {loadingOrders ? (
            <Text style={styles.td}>Loading orders...</Text>
          ) : filteredOrders.length === 0 ? (
            <Text style={styles.td}>No orders found</Text>
          ) : (
            Object.entries(groupedOrders).map(([bucket, list]) =>
              list.length ? (
                <View key={bucket} style={{ marginBottom: 12 }}>
                  <Text style={styles.groupTitle}>{bucket}</Text>
                  {list.map((order) => {
                    const stageIndex = PIPELINE.indexOf(order.stage);
                    const isExpanded = selectedOrderId === order.id;
                    return (
                      <View key={order.id} style={styles.orderCard}>
                        <TouchableOpacity onPress={() => setSelectedOrderId(isExpanded ? null : order.id)}>
                          <View style={styles.orderHeader}>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.orderName}>{order.name}</Text>
                              <Text style={styles.orderMeta}>#{order.orderId} · {order.item}</Text>
                            </View>
                            <View style={{ alignItems: "flex-end" }}>
                              <Text style={styles.orderDate}>{order.date}</Text>
                              <Text style={[styles.urgencyDot, order.urgency === "High" && styles.highUrgency, order.urgency === "Medium" && styles.mediumUrgency, order.urgency === "Low" && styles.lowUrgency]}>
                                {order.urgency}
                              </Text>
                            </View>
                          </View>

                          <View style={styles.timelineRow}>
                            {PIPELINE.map((step, idx) => (
                              <View key={step} style={styles.timelineItem}>
                                <View style={[styles.timelineDot, idx <= stageIndex && styles.timelineDotActive]} />
                                <Text style={[styles.timelineText, idx <= stageIndex && styles.timelineTextActive]}>{step}</Text>
                              </View>
                            ))}
                          </View>

                          <View style={styles.badgeRow}>
                            <StatusBadge status={order.badgeStatus} />
                            <Text style={styles.paymentBadge}>{order.paymentStatus}</Text>
                            <TouchableOpacity onPress={() => setSelectedOrderId(isExpanded ? null : order.id)}>
                              <MaterialCommunityIcons name="dots-horizontal" size={20} color="#94A3B8" />
                            </TouchableOpacity>
                          </View>
                        </TouchableOpacity>

                        {isExpanded && (
                          <View style={styles.actionRail}>
                            <ActionBtn icon="call-outline" label="Call" onPress={() => callCustomer(order.phone)} />
                            <ActionBtn icon="logo-whatsapp" label="WhatsApp" onPress={() => whatsappCustomer(order.phone)} />
                            <ActionBtn icon="git-compare-outline" label="Next Stage" onPress={() => rotateStage(order.id)} />
                            <ActionBtn icon="cash-outline" label="Collect" onPress={() => markPaid(order.id)} />
                            <ActionBtn icon="print-outline" label="Print" onPress={() => Alert.alert("Print", "Print flow can be linked here.")} />
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              ) : null
            )
          )}
        </View>
      </ScrollView>

      {/* FILTER MODAL */}
      <Modal
        transparent
        visible={filterModalVisible}
        animationType="fade"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setFilterModalVisible(false)}>
          <View style={styles.modalCard}>
            {currentFilterOptions.map((opt) => (
              <TouchableOpacity key={opt} style={styles.modalItem} onPress={() => setFilterValue(opt)}>
                <Text style={styles.modalItemText}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* BOTTOM NAV */}
      <View style={styles.bottomNavContainer}>
        <View style={styles.bottomNav}>
          <NavIcon name="home" active />
          <NavIcon name="people-outline" />
          <View style={styles.fabPlaceholder} />
          <NavIcon name="receipt-outline" />
          <NavIcon name="person-outline" />
        </View>
        <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate("AddCustomer")}>
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

const ModeToggle = ({ label, active, onPress }) => (
  <TouchableOpacity style={[styles.modeToggle, active && styles.modeToggleActive]} onPress={onPress}>
    <Text style={[styles.modeToggleText, active && styles.modeToggleTextActive]}>{label}</Text>
  </TouchableOpacity>
);

const Chip = ({ label, onPress }) => (
  <TouchableOpacity style={styles.chip} onPress={onPress}>
    <Text style={styles.chipText} numberOfLines={1}>{label}</Text>
    <Ionicons name="chevron-down" size={12} color="#94A3B8" />
  </TouchableOpacity>
);

const MiniStat = ({ label, value }) => (
  <View style={styles.miniStat}>
    <Text style={styles.miniStatValue}>{value}</Text>
    <Text style={styles.miniStatLabel}>{label}</Text>
  </View>
);

const AlertPill = ({ label, color, onPress }) => (
  <TouchableOpacity style={[styles.alertPill, { borderColor: color }]} onPress={onPress}>
    <Text style={[styles.alertPillText, { color }]}>{label}</Text>
  </TouchableOpacity>
);

const StatusBadge = ({ status }) => (
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
);

const ActionBtn = ({ icon, label, onPress }) => (
  <TouchableOpacity style={styles.actionBtn} onPress={onPress}>
    <Ionicons name={icon} size={16} color="#E2E8F0" />
    <Text style={styles.actionBtnText}>{label}</Text>
  </TouchableOpacity>
);

const NavIcon = ({ name, active }) => (
  <TouchableOpacity>
    <Ionicons name={name} size={24} color={active ? "#3B82F6" : "#64748B"} />
    {active && <View style={styles.activeDot} />}
  </TouchableOpacity>
);

/* ---------- STYLES ---------- */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0B1121" },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    marginBottom: 20,
  },
  greeting: { fontSize: 22, fontWeight: "bold", color: "#FFF" },
  subGreeting: { fontSize: 14, color: "#94A3B8" },
  headerIcons: { flexDirection: "row", gap: 12 },
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

  welcomeCard: {
    marginHorizontal: 20,
    backgroundColor: "#172033",
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#334155",
  },
  welcomeTitle: { color: "#60A5FA", fontSize: 18, fontWeight: "bold", marginBottom: 5 },
  welcomeDesc: { color: "#CBD5E1", fontSize: 13, lineHeight: 18, maxWidth: "90%" },
  machineImage: { width: 110, height: 80 },

  sectionTitle: {
    color: "#E2E8F0",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 20,
    marginTop: 24,
    marginBottom: 12,
  },

  summaryContainer: { flexDirection: "row", paddingHorizontal: 20, gap: 12, height: 230 },
  financialCard: {
    flex: 1,
    backgroundColor: "#151E32",
    borderRadius: 16,
    padding: 16,
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  rightColumn: { flex: 1, gap: 12 },
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
    justifyContent: "space-between",
  },

  cardHeader: { color: "#F1F5F9", fontSize: 14, fontWeight: "600", marginBottom: 4 },
  financeItem: { marginBottom: 4 },
  financeLabel: { color: "#64748B", fontSize: 10, marginBottom: 2 },
  financeValueGreen: { color: "#4ADE80", fontSize: 16, fontWeight: "bold" },
  financeValueRed: { color: "#F87171", fontSize: 16, fontWeight: "bold" },
  chartLineGreen: {
    height: 2,
    width: "60%",
    backgroundColor: "#4ADE80",
    marginTop: 4,
    opacity: 0.5,
    borderRadius: 2,
  },
  chartLineRed: {
    height: 2,
    width: "60%",
    backgroundColor: "#F87171",
    marginTop: 4,
    opacity: 0.5,
    borderRadius: 2,
  },
  progressBar: {
    flexDirection: "row",
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    marginVertical: 8,
  },
  progressSeg: { height: 6 },
  legendText: { fontSize: 8, color: "#94A3B8" },

  attentionRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 6, gap: 8 },
  alertPill: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 5,
    alignItems: "center",
  },
  alertPillText: { fontSize: 11, fontWeight: "600" },

  searchContainer: {
    marginHorizontal: 20,
    backgroundColor: "#151E32",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#1E293B",
    gap: 10,
  },

  modeRow: { flexDirection: "row", gap: 8 },
  queueRow: { flexDirection: "row", gap: 8, marginTop: 2 },

  modeToggle: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#334155",
    backgroundColor: "#0F172A",
    paddingVertical: 7,
    alignItems: "center",
  },
  modeToggleActive: { borderColor: "#3B82F6", backgroundColor: "#1E3A8A" },
  modeToggleText: { color: "#94A3B8", fontSize: 12, fontWeight: "600" },
  modeToggleTextActive: { color: "#DBEAFE" },

  searchHeader: { flexDirection: "row", alignItems: "center" },
  searchInput: { flex: 1, marginLeft: 10, color: "#FFF", fontSize: 14 },

  suggestionRow: { gap: 8 },
  suggestionChip: {
    borderWidth: 1,
    borderColor: "#334155",
    backgroundColor: "#1E293B",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  suggestionText: { color: "#CBD5E1", fontSize: 11 },

  chipRow: { flexDirection: "row", gap: 8 },
  chip: {
    flexDirection: "row",
    backgroundColor: "#1E293B",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "#334155",
  },
  chipText: { color: "#94A3B8", fontSize: 11 },

  analyticsRow: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  miniStat: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#1E293B",
    borderRadius: 10,
    backgroundColor: "#0F172A",
    paddingVertical: 8,
    alignItems: "center",
  },
  miniStatValue: { color: "#E2E8F0", fontSize: 14, fontWeight: "700" },
  miniStatLabel: { color: "#64748B", fontSize: 10 },

  tableCard: {
    marginHorizontal: 20,
    backgroundColor: "#151E32",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  groupTitle: {
    color: "#CBD5E1",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 6,
    marginTop: 4,
  },

  orderCard: {
    backgroundColor: "#0F172A",
    borderWidth: 1,
    borderColor: "#1E293B",
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
  },
  orderHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  orderName: { color: "#F1F5F9", fontSize: 14, fontWeight: "700" },
  orderMeta: { color: "#94A3B8", fontSize: 11, marginTop: 2 },
  orderDate: { color: "#CBD5E1", fontSize: 11 },
  urgencyDot: {
    marginTop: 3,
    fontSize: 10,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 1,
    overflow: "hidden",
  },
  highUrgency: { color: "#F87171", borderColor: "#F87171" },
  mediumUrgency: { color: "#F59E0B", borderColor: "#F59E0B" },
  lowUrgency: { color: "#34D399", borderColor: "#34D399" },

  timelineRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  timelineItem: { alignItems: "center", flex: 1 },
  timelineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#334155", marginBottom: 3 },
  timelineDotActive: { backgroundColor: "#3B82F6" },
  timelineText: { color: "#64748B", fontSize: 8, textAlign: "center" },
  timelineTextActive: { color: "#93C5FD" },

  badgeRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },

  td: { color: "#94A3B8", fontSize: 12 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, minWidth: 60, alignItems: "center" },
  badgeRed: { backgroundColor: "rgba(239, 68, 68, 0.15)" },
  badgeOrange: { backgroundColor: "rgba(245, 158, 11, 0.15)" },
  badgeGreen: { backgroundColor: "rgba(16, 185, 129, 0.15)" },
  textRed: { color: "#EF4444", fontSize: 10, fontWeight: "600" },
  textOrange: { color: "#F59E0B", fontSize: 10, fontWeight: "600" },
  textGreen: { color: "#10B981", fontSize: 10, fontWeight: "600" },
  badgeText: { fontSize: 10, fontWeight: "600" },

  paymentBadge: {
    color: "#F8FAFC",
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "#334155",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    fontSize: 10,
    overflow: "hidden",
  },

  actionRail: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#1E293B",
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 6,
  },
  actionBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#334155",
    backgroundColor: "#1E293B",
    borderRadius: 8,
    alignItems: "center",
    paddingVertical: 7,
    gap: 2,
  },
  actionBtnText: { color: "#CBD5E1", fontSize: 10 },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#151E32",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#334155",
    overflow: "hidden",
  },
  modalItem: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B",
  },
  modalItemText: { color: "#E2E8F0", fontSize: 14 },

  bottomNavContainer: { position: "absolute", bottom: 0, left: 0, right: 0 },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#0F172A",
    height: 70,
    borderTopWidth: 1,
    borderTopColor: "#1E293B",
    paddingBottom: 10,
  },
  fabPlaceholder: { width: 60 },
  fab: {
    position: "absolute",
    top: -25,
    alignSelf: "center",
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
    borderWidth: 4,
    borderColor: "#0B1121",
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#3B82F6",
    alignSelf: "center",
    marginTop: 4,
  },
});
