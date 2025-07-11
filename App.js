// App.js
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Alert,
  Platform,
  Pressable,
  Modal,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import axios from "axios";

const API_URL =
  "https://script.google.com/macros/s/AKfycbyBjxcu3fe80RS14xvinRYN5Dx6DajsdVcrB_XG4zb2Csl2rKpGxTjoZ6piQ53VFfrnUg/exec";

export default function App() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchRoute, setSearchRoute] = useState("");
  const [searchStatus, setSearchStatus] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [form, setForm] = useState({
    rowNumber: "",
    docketNo: "",
    routeId: "",
    routeName: "",
    faultDateTime: "",
    handoverDateTime: "",
    clearanceDateTime: "",
    faultDuration: "",
    status: "",
    initialAssessment: "",
    servicesDown: "",
  });
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchData = async () => {
    try {
      const res = await axios.get(API_URL);
      setData(res.data);
      setFilteredData(res.data);
    } catch (error) {
      Alert.alert("Error", "Failed to fetch data");
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData().then(() => setRefreshing(false));
  }, []);

  const filterResults = () => {
    const filtered = data.filter((row, index) => {
      if (index === 0) return false;
      const routeMatch = searchRoute
        ? row[2]?.toLowerCase().includes(searchRoute.toLowerCase())
        : true;
      const statusMatch = searchStatus
        ? row[7]?.toLowerCase().includes(searchStatus.toLowerCase())
        : true;
      const dateMatch = searchDate
        ? row[3]?.startsWith(searchDate.split(" ")[0])
        : true;
      return routeMatch && statusMatch && dateMatch;
    });
    setFilteredData([data[0], ...filtered]);
  };

  useEffect(() => {
    filterResults();
  }, [searchRoute, searchStatus, searchDate, data]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const dateTimeString = selectedDate
        .toISOString()
        .slice(0, 16)
        .replace("T", " ");
      setSearchDate(dateTimeString);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.header}>Search / Filter</Text>
      <TextInput
        placeholder="Search by Route Name"
        value={searchRoute}
        onChangeText={(text) => setSearchRoute(text)}
        style={styles.input}
      />
      <TextInput
        placeholder="Filter by Status (e.g. carried forward/restored)"
        value={searchStatus}
        onChangeText={(text) => setSearchStatus(text)}
        style={styles.input}
      />
      <Pressable onPress={() => setShowDatePicker(true)} style={styles.input}>
        <Text>{searchDate || "Filter by Fault Date & Time (tap to pick)"}</Text>
      </Pressable>
      {showDatePicker && (
        <DateTimePicker
          value={searchDate ? new Date(searchDate) : new Date()}
          mode="datetime"
          display="default"
          onChange={onDateChange}
        />
      )}

      {/* <Button title="Export Filtered Faults to PDF" onPress={exportToPDF} /> */}

      {/* ... rest of UI remains the same */}
    </ScrollView>
  );
}

// Keep styles as they are
