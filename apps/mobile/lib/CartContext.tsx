import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { type Cart, type CartItem, type MenuItem, type ApiResponse } from "@repo/shared";
import { useAuth } from "./AuthContext";

interface CartContextType {
    cart: Cart | null;
    loading: boolean;
    error: string | null;
    addItemToCart: (restaurantId: string, menuItem: MenuItem, options: any[], quantity: number) => Promise<void>;
    updateItemQuantity: (itemId: string, quantity: number) => Promise<void>;
    removeItemFromCart: (itemId: string) => Promise<void>;
    fetchCart: (restaurantId?: string) => Promise<void>;
    clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { api, user } = useAuth();
    const [cart, setCart] = useState<Cart | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchCart = useCallback(async (restaurantId?: string) => {
        setLoading(true);
        try {
            const url = restaurantId
                ? `/cart/current?restaurant_id=${restaurantId}`
                : "/cart/current";
            const response = await api.get<Cart>(url);
            if (response.ok && response.data) {
                setCart(response.data);
            } else {
                setCart(null);
            }
        } catch (err) {
            setError("Failed to fetch cart");
        } finally {
            setLoading(false);
        }
    }, [api]);

    useEffect(() => {
        fetchCart();
    }, [fetchCart, user]);


    const addItemToCart = async (restaurantId: string, menuItem: MenuItem, options: any[], quantity: number) => {
        // Optimistic update if cart already exists for this restaurant
        // If not, we'll wait for the server to create it
        let previousCart = cart;

        try {
            // 1. If no cart, create it first
            let currentCart = cart;
            if (!currentCart) {
                const createRes = await api.post<Cart>("/cart", {
                    restaurant_id: restaurantId,
                    order_type: "pickup", // Default to pickup for now
                });
                if (!createRes.ok || !createRes.data) {
                    throw new Error(createRes.error || "Failed to create cart");
                }
                currentCart = createRes.data;
                setCart(currentCart);
            }

            // 2. Add item
            const response = await api.post<Cart>("/cart/items", {
                cart_id: currentCart.id,
                menu_item_id: menuItem.id,
                quantity,
                options,
            });

            if (response.ok && response.data) {
                setCart(response.data);
            } else {
                throw new Error(response.error || "Failed to add item to cart");
            }
        } catch (err: any) {
            setError(err.message);
            setCart(previousCart); // Rollback
        }
    };

    const updateItemQuantity = async (itemId: string, quantity: number) => {
        if (!cart) return;

        const previousCart = JSON.parse(JSON.stringify(cart));

        // Optimistic update
        const updatedItems = cart.items.map(item =>
            item.id === itemId ? { ...item, quantity } : item
        );

        // Recalculate totals optimistically (simplified)
        const newSubtotal = updatedItems.reduce((acc, item) => {
            const itemOptionsTotal = item.options.reduce((sum, opt) => sum + opt.price_delta_cents, 0);
            return acc + (item.base_price_cents + itemOptionsTotal) * item.quantity;
        }, 0);

        setCart({
            ...cart,
            items: updatedItems,
            totals: {
                ...cart.totals,
                subtotal_cents: newSubtotal,
                total_cents: newSubtotal + cart.totals.tax_cents + cart.totals.fee_cents - cart.totals.discount_cents
            }
        });

        try {
            const response = await api.patch<Cart>(`/cart/items/${itemId}`, { quantity });
            if (response.ok && response.data) {
                setCart(response.data);
            } else {
                throw new Error(response.error || "Failed to update quantity");
            }
        } catch (err: any) {
            setError(err.message);
            setCart(previousCart); // Rollback
        }
    };

    const removeItemFromCart = async (itemId: string) => {
        if (!cart) return;

        const previousCart = JSON.parse(JSON.stringify(cart));

        // Optimistic update
        const updatedItems = cart.items.filter(item => item.id !== itemId);
        const newSubtotal = updatedItems.reduce((acc, item) => {
            const itemOptionsTotal = item.options.reduce((sum, opt) => sum + opt.price_delta_cents, 0);
            return acc + (item.base_price_cents + itemOptionsTotal) * item.quantity;
        }, 0);

        setCart({
            ...cart,
            items: updatedItems,
            totals: {
                ...cart.totals,
                subtotal_cents: newSubtotal,
                total_cents: newSubtotal + cart.totals.tax_cents + cart.totals.fee_cents - cart.totals.discount_cents
            }
        });

        try {
            const response = await api.delete<Cart>(`/cart/items/${itemId}`);
            if (response.ok && response.data) {
                setCart(response.data);
            } else {
                throw new Error(response.error || "Failed to remove item");
            }
        } catch (err: any) {
            setError(err.message);
            setCart(previousCart); // Rollback
        }
    };

    const clearCart = async () => {
        if (!cart) return;
        const previousCart = cart;
        setCart(null);

        try {
            const response = await api.post<Cart>("/cart/clear", { cart_id: cart.id });
            if (!response.ok) {
                throw new Error(response.error || "Failed to clear cart");
            }
        } catch (err: any) {
            setError(err.message);
            setCart(previousCart);
        }
    };

    return (
        <CartContext.Provider
            value={{
                cart,
                loading,
                error,
                addItemToCart,
                updateItemQuantity,
                removeItemFromCart,
                fetchCart,
                clearCart,
            }}
        >
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
};
