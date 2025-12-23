import React, { useEffect, useState } from "react";
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    FlatList,
    Dimensions,
} from "react-native";
import { useAuth } from "../lib/AuthContext";
import { type Restaurant, type Menu, type MenuItem, type MenuCategory } from "@repo/shared";
import { ChevronLeft, Star, Clock, MapPin, Plus, ShoppingCart } from "lucide-react-native";

const { width } = Dimensions.get("window");

export const RestaurantDetailsScreen = ({ route, navigation }: any) => {
    const { id } = route.params;
    const { api } = useAuth();
    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [menu, setMenu] = useState<Menu | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [resResponse, menuResponse] = await Promise.all([
                api.get<Restaurant>(`/api/v1/restaurants/${id}`),
                api.get<Menu>(`/api/v1/restaurants/${id}/menu`),
            ]);

            if (resResponse.ok && resResponse.data) {
                setRestaurant(resResponse.data);
            }
            if (menuResponse.ok && menuResponse.data) {
                setMenu(menuResponse.data);
            }
        } catch (err) {
            setError("Network error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    const renderMenuItem = (item: MenuItem) => (
        <TouchableOpacity key={item.id} style={styles.menuItem}>
            <View style={styles.menuItemDetails}>
                <Text style={styles.menuItemName}>{item.name}</Text>
                {item.description && (
                    <Text style={styles.menuItemDescription} numberOfLines={2}>
                        {item.description}
                    </Text>
                )}
                <Text style={styles.menuItemPrice}>${(item.base_price_cents / 100).toFixed(2)}</Text>
            </View>
            <View style={styles.itemAction}>
                <Image
                    source={{ uri: `https://source.unsplash.com/featured/?food,${item.name}` }}
                    style={styles.menuItemImage}
                />
                <TouchableOpacity style={styles.addButton}>
                    <Plus size={20} color="#ffffff" />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator color="#1c1917" />
            </View>
        );
    }

    if (!restaurant) {
        return (
            <View style={styles.center}>
                <Text style={styles.errorText}>Restaurant not found</Text>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backLink}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.imageContainer}>
                    <Image
                        source={{ uri: `https://source.unsplash.com/featured/?food,${restaurant.cuisines[0] || 'restaurant'}` }}
                        style={styles.heroImage}
                    />
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <ChevronLeft size={24} color="#1c1917" />
                    </TouchableOpacity>
                </View>

                <View style={styles.content}>
                    <View style={styles.header}>
                        <Text style={styles.title}>{restaurant.name}</Text>
                        <View style={styles.ratingRow}>
                            <Star size={16} color="#b45309" fill="#b45309" />
                            <Text style={styles.ratingText}>4.8 (500+ ratings)</Text>
                        </View>
                        <Text style={styles.cuisines}>{restaurant.cuisines.join(" • ")}</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <View style={styles.infoItem}>
                            <Clock size={18} color="#78716c" />
                            <Text style={styles.infoText}>25-35 min</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <MapPin size={18} color="#78716c" />
                            <Text style={styles.infoText}>1.2 mi</Text>
                        </View>
                    </View>

                    {menu?.categories.map((category) => (
                        <View key={category.id} style={styles.categorySection}>
                            <Text style={styles.categoryTitle}>{category.name}</Text>
                            {category.items.map(renderMenuItem)}
                        </View>
                    ))}
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.viewCartButton}>
                    <View style={styles.cartContent}>
                        <View style={styles.cartIconContainer}>
                            <ShoppingCart size={20} color="#ffffff" />
                        </View>
                        <Text style={styles.cartButtonText}>View Cart</Text>
                        <Text style={styles.cartCount}>0 items</Text>
                    </View>
                    <Text style={styles.cartTotal}>$0.00</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#ffffff",
    },
    imageContainer: {
        position: "relative",
    },
    heroImage: {
        width: "100%",
        height: 250,
    },
    backButton: {
        position: "absolute",
        top: 60,
        left: 20,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "#ffffff",
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    content: {
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 120,
    },
    header: {
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: "800",
        color: "#1c1917",
        letterSpacing: -0.5,
    },
    ratingRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 8,
    },
    ratingText: {
        marginLeft: 6,
        fontSize: 14,
        color: "#1c1917",
        fontWeight: "600",
    },
    cuisines: {
        marginTop: 6,
        fontSize: 15,
        color: "#78716c",
    },
    infoRow: {
        flexDirection: "row",
        paddingVertical: 16,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: "#f5f5f4",
        marginBottom: 32,
        gap: 24,
    },
    infoItem: {
        flexDirection: "row",
        alignItems: "center",
    },
    infoText: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: "600",
        color: "#1c1917",
    },
    categorySection: {
        marginBottom: 32,
    },
    categoryTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#1c1917",
        marginBottom: 16,
    },
    menuItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#f5f5f4",
    },
    menuItemDetails: {
        flex: 1,
        marginRight: 16,
    },
    menuItemName: {
        fontSize: 16,
        fontWeight: "700",
        color: "#1c1917",
    },
    menuItemDescription: {
        fontSize: 14,
        color: "#78716c",
        marginTop: 4,
        lineHeight: 20,
    },
    menuItemPrice: {
        fontSize: 15,
        fontWeight: "600",
        color: "#1c1917",
        marginTop: 8,
    },
    itemAction: {
        position: "relative",
    },
    menuItemImage: {
        width: 100,
        height: 100,
        borderRadius: 12,
    },
    addButton: {
        position: "absolute",
        bottom: -8,
        right: -8,
        backgroundColor: "#1c1917",
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 2,
        borderColor: "#ffffff",
    },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#ffffff",
    },
    errorText: {
        color: "#ef4444",
        marginBottom: 10,
    },
    backLink: {
        color: "#1c1917",
        fontWeight: "bold",
    },
    footer: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 40,
        backgroundColor: "#ffffff",
        borderTopWidth: 1,
        borderTopColor: "#f5f5f4",
    },
    viewCartButton: {
        backgroundColor: "#1c1917",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        height: 56,
        borderRadius: 16,
        paddingHorizontal: 20,
    },
    cartContent: {
        flexDirection: "row",
        alignItems: "center",
    },
    cartIconContainer: {
        marginRight: 12,
    },
    cartButtonText: {
        color: "#ffffff",
        fontSize: 16,
        fontWeight: "700",
    },
    cartCount: {
        color: "rgba(255, 255, 255, 0.6)",
        fontSize: 14,
        marginLeft: 8,
    },
    cartTotal: {
        color: "#ffffff",
        fontSize: 16,
        fontWeight: "700",
    },
});
