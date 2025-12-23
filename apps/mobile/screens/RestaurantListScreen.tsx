import React, { useEffect, useState } from "react";
import {
    StyleSheet,
    View,
    Text,
    FlatList,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    TextInput,
} from "react-native";
import { useAuth } from "../lib/AuthContext";
import { type Restaurant } from "@repo/shared";
import { Star, Clock, Search, MapPin } from "lucide-react-native";

export const RestaurantListScreen = ({ navigation }: any) => {
    const { api, user, logout } = useAuth();
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchRestaurants = async () => {
        setLoading(true);
        try {
            const response = await api.get<{ restaurants: Restaurant[] }>("/api/v1/restaurants");
            if (response.ok && response.data) {
                setRestaurants(response.data.restaurants);
            } else {
                setError(response.error || "Failed to fetch restaurants");
            }
        } catch (err) {
            setError("Network error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRestaurants();
    }, []);

    const renderItem = ({ item }: { item: Restaurant }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate("RestaurantDetails", { id: item.id })}
        >
            <Image
                source={{ uri: `https://source.unsplash.com/featured/?food,${item.cuisines[0] || 'restaurant'}` }}
                style={styles.cardImage}
            />
            <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{item.name}</Text>
                    <View style={styles.ratingBadge}>
                        <Star size={12} color="#b45309" fill="#b45309" />
                        <Text style={styles.ratingText}>4.8</Text>
                    </View>
                </View>
                <Text style={styles.cardSubtitle}>{item.cuisines.join(" • ")}</Text>
                <View style={styles.cardFooter}>
                    <View style={styles.footerItem}>
                        <Clock size={14} color="#78716c" />
                        <Text style={styles.footerText}>25-35 min</Text>
                    </View>
                    <View style={styles.footerItem}>
                        <MapPin size={14} color="#78716c" />
                        <Text style={styles.footerText}>1.2 mi</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.welcome}>Deliver to</Text>
                    <View style={styles.locationContainer}>
                        <Text style={styles.address}>Home • 123 Maple St</Text>
                    </View>
                </View>
                <TouchableOpacity onPress={logout} style={styles.profileButton}>
                    <Text style={styles.profileInitial}>{user?.name?.charAt(0)}</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
                <Search size={20} color="#a8a29e" />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Restaurants, dishes..."
                    placeholderTextColor="#a8a29e"
                />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator color="#1c1917" />
                </View>
            ) : error ? (
                <View style={styles.center}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity onPress={fetchRestaurants} style={styles.retryButton}>
                        <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={restaurants}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListHeaderComponent={() => (
                        <Text style={styles.sectionTitle}>Featured Restaurants</Text>
                    )}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#ffffff",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingTop: 60,
        marginBottom: 20,
    },
    welcome: {
        fontSize: 12,
        color: "#78716c",
        fontWeight: "600",
        textTransform: "uppercase",
        letterSpacing: 1,
    },
    locationContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 2,
    },
    address: {
        fontSize: 16,
        fontWeight: "700",
        color: "#1c1917",
    },
    profileButton: {
        width: 40,
        height: 40,
        borderRadius: 14,
        backgroundColor: "#1c1917",
        justifyContent: "center",
        alignItems: "center",
    },
    profileInitial: {
        color: "#ffffff",
        fontWeight: "bold",
        fontSize: 16,
    },
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f5f5f4",
        marginHorizontal: 20,
        paddingHorizontal: 16,
        height: 50,
        borderRadius: 14,
        marginBottom: 24,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 15,
        color: "#1c1917",
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: "800",
        color: "#1c1917",
        marginBottom: 16,
        letterSpacing: -0.5,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    card: {
        backgroundColor: "#ffffff",
        borderRadius: 24,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: "#f5f5f4",
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    cardImage: {
        width: "100%",
        height: 180,
    },
    cardContent: {
        padding: 16,
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#1c1917",
    },
    ratingBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fef3c7",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    ratingText: {
        fontSize: 12,
        fontWeight: "700",
        color: "#b45309",
        marginLeft: 4,
    },
    cardSubtitle: {
        fontSize: 14,
        color: "#78716c",
        marginTop: 4,
    },
    cardFooter: {
        flexDirection: "row",
        marginTop: 12,
        gap: 16,
    },
    footerItem: {
        flexDirection: "row",
        alignItems: "center",
    },
    footerText: {
        fontSize: 12,
        color: "#78716c",
        marginLeft: 4,
        fontWeight: "600",
    },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    errorText: {
        color: "#ef4444",
        marginBottom: 10,
    },
    retryButton: {
        padding: 10,
        backgroundColor: "#1c1917",
        borderRadius: 8,
    },
    retryText: {
        color: "#ffffff",
        fontWeight: "bold",
    },
});
