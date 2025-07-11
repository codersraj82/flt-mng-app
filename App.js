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
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import DateTimePicker from "@react-native-datetimepicker/datetimepicker";
import axios from "axios";

const API_URL =
  "https://script.google.com/macros/s/AKfycbyBjxcu3fe80RS14xvinRYN5Dx6DajsdVcrB_XG4zb2Csl2rKpGxTjoZ6piQ53VFfrnUg/exec";

export default function App() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchRoute, setSearchRoute] = useState("");
  const [searchStatus, setSearchStatus] = useState("");
  const [searchDateObj, setSearchDateObj] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
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
  const [pickerVisible, setPickerVisible] = useState({
    faultDateTime: false,
    handoverDateTime: false,
    clearanceDateTime: false,
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
      const dateMatch = searchDateObj
        ? row[3]?.startsWith(searchDateObj.toISOString().split("T")[0])
        : true;
      return routeMatch && statusMatch && dateMatch;
    });
    setFilteredData([data[0], ...filtered]);
  };

  useEffect(() => {
    filterResults();
  }, [searchRoute, searchStatus, searchDateObj, data]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const exportToPDF = async () => {
    const headers = data[0];
    const rows = filteredData
      .slice(1)
      .map(
        (row) => `
      <tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>
    `
      )
      .join("");

    const html = `
      <html>
        <body>
          <h1>Filtered Faults Report</h1>
          <table border="1" style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri);
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
        <Text>
          {searchDateObj
            ? `Filter Date: ${searchDateObj.toISOString().split("T")[0]}`
            : "Filter by Fault Date"}
        </Text>
      </Pressable>
      {showDatePicker && (
        <DateTimePicker
          value={searchDateObj || new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) setSearchDateObj(selectedDate);
          }}
        />
      )}
      <Button title="Export Filtered Faults to PDF" onPress={exportToPDF} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 10, marginTop: 40 },
  header: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
  input: {
    borderColor: "#ccc",
    borderWidth: 1,
    padding: 8,
    marginBottom: 10,
    borderRadius: 4,
  },
});
