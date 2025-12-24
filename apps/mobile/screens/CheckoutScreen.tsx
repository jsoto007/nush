import React from "react";
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    FlatList,
    Alert,
} from "react-native";
import { ChevronLeft, Plus, Minus, Trash2, ShoppingBag } from "lucide-react-native";
import { useCart } from "../lib/CartContext";
import { type CartItem } from "@repo/shared";

export const CheckoutScreen = ({ navigation }: any) => {
    const { cart, updateItemQuantity, removeItemFromCart, clearCart } = useCart();

    const handleUpdateQuantity = (item: CartItem, delta: number) => {
        const newQuantity = item.quantity + delta;
        if (newQuantity > 0) {
            updateItemQuantity(item.id, newQuantity);
        } else {
            handleDelete(item);
        }
    };

    const handleDelete = (item: CartItem) => {
        Alert.alert(
            "Remove Item",
            `Are you sure you want to remove ${item.name_snapshot} from your cart?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Remove",
                    style: "destructive",
                    onPress: () => removeItemFromCart(item.id),
                },
            ]
        );
    };

    const renderCartItem = ({ item }: { item: CartItem }) => (
        <View style={styles.cartItem}>
            <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name_snapshot}</Text>
                {item.options.length > 0 && (
                    <Text style={styles.itemOptions}>
                        {item.options.map((opt) => opt.name_snapshot).join(", ")}
                    </Text>
                )}
                <Text style={styles.itemPrice}>
                    ${((item.base_price_cents + item.options.reduce((sum, o) => sum + o.price_delta_cents, 0)) / 100).toFixed(2)}
                </Text>
            </View>

            <View style={styles.quantityControls}>
                <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => handleUpdateQuantity(item, -1)}
                >
                    {item.quantity === 1 ? (
                        <Trash2 size={16} color="#ef4444" />
                    ) : (
                        <Minus size={16} color="#1c1917" />
                    )}
                </TouchableOpacity>
                <Text style={styles.quantityText}>{item.quantity}</Text>
                <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => handleUpdateQuantity(item, 1)}
                >
                    <Plus size={16} color="#1c1917" />
                </TouchableOpacity>
            </View>
        </View>
    );

    if (!cart || cart.items.length === 0) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <ChevronLeft size={24} color="#1c1917" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Checkout</Text>
                </View>
                <View style={styles.emptyCart}>
                    <ShoppingBag size={64} color="#e7e5e4" />
                    <Text style={styles.emptyCartText}>Your cart is empty</Text>
                    <TouchableOpacity
                        style={styles.browseButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.browseButtonText}>Browse Menu</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ChevronLeft size={24} color="#1c1917" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Checkout</Text>
            </View>

            <FlatList
                data={cart.items}
                renderItem={renderCartItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.itemList}
                ListFooterComponent={
                    <View style={styles.summaryContainer}>
                        <Text style={styles.summaryTitle}>Order Summary</Text>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Subtotal</Text>
                            <Text style={styles.summaryValue}>
                                ${(cart.totals.subtotal_cents / 100).toFixed(2)}
                            </Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Delivery Fee</Text>
                            <Text style={styles.summaryValue}>
                                ${(cart.totals.fee_cents / 100).toFixed(2)}
                            </Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Tax</Text>
                            <Text style={styles.summaryValue}>
                                ${(cart.totals.tax_cents / 100).toFixed(2)}
                            </Text>
                        </View>
                        {cart.totals.discount_cents > 0 && (
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Discount</Text>
                                <Text style={styles.discountValue}>
                                    -${(cart.totals.discount_cents / 100).toFixed(2)}
                                </Text>
                            </View>
                        )}
                        <View style={[styles.summaryRow, styles.totalRow]}>
                            <Text style={styles.totalLabel}>Total</Text>
                            <Text style={styles.totalValue}>
                                ${(cart.totals.total_cents / 100).toFixed(2)}
                            </Text>
                        </View>
                    </View>
                }
            />

            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.placeOrderButton}
                    onPress={() => Alert.alert("Order Placed", "Coming soon!")}
                >
                    <Text style={styles.placeOrderText}>Place Order</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#ffffff",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#f5f5f4",
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#f5f5f4",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "800",
        color: "#1c1917",
    },
    itemList: {
        padding: 20,
    },
    cartItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#f5f5f4",
    },
    itemInfo: {
        flex: 1,
        marginRight: 16,
    },
    itemName: {
        fontSize: 16,
        fontWeight: "700",
        color: "#1c1917",
    },
    itemOptions: {
        fontSize: 14,
        color: "#78716c",
        marginTop: 2,
    },
    itemPrice: {
        fontSize: 14,
        color: "#1c1917",
        fontWeight: "600",
        marginTop: 4,
    },
    quantityControls: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f5f5f4",
        borderRadius: 12,
        padding: 4,
    },
    quantityButton: {
        width: 32,
        height: 32,
        justifyContent: "center",
        alignItems: "center",
    },
    quantityText: {
        fontSize: 16,
        fontWeight: "700",
        color: "#1c1917",
        marginHorizontal: 12,
    },
    summaryContainer: {
        marginTop: 32,
        paddingTop: 24,
        borderTopWidth: 1,
        borderTopColor: "#f5f5f4",
        marginBottom: 100,
    },
    summaryTitle: {
        fontSize: 18,
        fontWeight: "800",
        color: "#1c1917",
        marginBottom: 16,
    },
    summaryRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 12,
    },
    summaryLabel: {
        fontSize: 15,
        color: "#78716c",
    },
    summaryValue: {
        fontSize: 15,
        color: "#1c1917",
        fontWeight: "600",
    },
    discountValue: {
        fontSize: 15,
        color: "#10b981",
        fontWeight: "600",
    },
    totalRow: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: "#f5f5f4",
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: "800",
        color: "#1c1917",
    },
    totalValue: {
        fontSize: 18,
        fontWeight: "800",
        color: "#1c1917",
    },
    footer: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        paddingBottom: 40,
        backgroundColor: "#ffffff",
        borderTopWidth: 1,
        borderTopColor: "#f5f5f4",
    },
    placeOrderButton: {
        backgroundColor: "#1c1917",
        height: 56,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
    },
    placeOrderText: {
        color: "#ffffff",
        fontSize: 16,
        fontWeight: "700",
    },
    emptyCart: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 40,
    },
    emptyCartText: {
        fontSize: 18,
        fontWeight: "700",
        color: "#1c1917",
        marginTop: 16,
    },
    browseButton: {
        marginTop: 24,
        backgroundColor: "#1c1917",
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    browseButtonText: {
        color: "#ffffff",
        fontWeight: "600",
    },
});
