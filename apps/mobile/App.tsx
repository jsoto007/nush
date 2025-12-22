import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { getApiBaseUrl, type HealthResponse } from "@repo/shared";

const apiBaseUrl = getApiBaseUrl(process.env.EXPO_PUBLIC_API_URL);

export default function App() {
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handlePing = async () => {
    setLoading(true);
    setError("");
    setStatus("");

    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/health`);
      if (!response.ok) {
        throw new Error(`Request failed (${response.status})`);
      }
      const data = (await response.json()) as HealthResponse;
      setStatus(data.status);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.kicker}>nush</Text>
        <Text style={styles.title}>Mobile ping console</Text>
        <Text style={styles.subtitle}>Confirm the API is healthy.</Text>

        <Pressable style={styles.button} onPress={handlePing} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? "Pinging..." : "Ping API"}</Text>
        </Pressable>

        <View style={styles.card}>
          {loading && <ActivityIndicator />}
          {!loading && status ? (
            <Text style={styles.success}>Status: {status}</Text>
          ) : null}
          {!loading && error ? <Text style={styles.error}>Error: {error}</Text> : null}
          {!loading && !status && !error ? (
            <Text style={styles.muted}>Awaiting response.</Text>
          ) : null}
        </View>

        <Text style={styles.baseUrl} numberOfLines={1}>
          {apiBaseUrl}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f3ef",
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  kicker: {
    fontSize: 12,
    letterSpacing: 4,
    textTransform: "uppercase",
    color: "#8f8476",
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "600",
    color: "#1f1b16",
  },
  subtitle: {
    fontSize: 14,
    color: "#6f6458",
    marginTop: 8,
    marginBottom: 24,
  },
  button: {
    backgroundColor: "#1f1b16",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 999,
    alignItems: "center",
    marginBottom: 24,
  },
  buttonText: {
    color: "#f8f5f1",
    fontSize: 14,
    fontWeight: "600",
  },
  card: {
    borderWidth: 1,
    borderColor: "#dcd2c5",
    borderStyle: "dashed",
    borderRadius: 16,
    padding: 16,
    backgroundColor: "#fffaf4",
    gap: 6,
  },
  success: {
    color: "#2f7b49",
  },
  error: {
    color: "#b9493a",
  },
  muted: {
    color: "#8f8476",
  },
  baseUrl: {
    marginTop: 16,
    fontSize: 12,
    color: "#8f8476",
  },
});
