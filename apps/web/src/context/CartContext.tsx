import React, { createContext, useContext, useState, useEffect } from "react";
import { type MenuItem, type Cart, type OrderType } from "@repo/shared";
import { useAuth } from "./AuthContext";

interface CartContextType {
    cart: Cart | null;
    addItem: (
        item: MenuItem,
        restaurantId: string,
        options?: {
            quantity?: number;
            notes?: string;
            selections?: { option_id: string; option_group_id: string }[];
        }
    ) => Promise<void>;
    updateQuantity: (itemId: string, quantity: number) => Promise<void>;
    removeItem: (itemId: string) => Promise<void>;
    clearCart: () => Promise<void>;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    loading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { api, user } = useAuth();
    const [cart, setCart] = useState<Cart | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const refreshCart = async () => {
        setLoading(true);
        try {
            const response = await api.get<{ cart: Cart }>("/api/v1/cart/current");
            if (response.ok && response.data) {
                setCart(response.data.cart);
            }
        } catch (err) {
            console.error("Failed to refresh cart:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshCart();
    }, [user]);

    const addItem = async (
        item: MenuItem,
        restaurantId: string,
        options?: {
            quantity?: number;
            notes?: string;
            selections?: { option_id: string; option_group_id: string }[];
        }
    ) => {
        setLoading(true);
        try {
            let currentCart = cart;

            // If no cart or different restaurant, create/fetch new cart
            if (!currentCart || currentCart.restaurant_id !== restaurantId) {
                const response = await api.post<{ cart: Cart }>("/api/v1/cart", {
                    restaurant_id: restaurantId,
                    order_type: "pickup"
                });
                if (response.ok && response.data) {
                    currentCart = response.data.cart;
                } else {
                    throw new Error(response.error || "Failed to create cart");
                }
            }

            const itemResponse = await api.post<{ cart: Cart }>("/api/v1/cart/items", {
                cart_id: currentCart.id,
                menu_item_id: item.id,
                quantity: options?.quantity ?? 1,
                notes: options?.notes,
                options: options?.selections ?? []
            });

            if (itemResponse.ok && itemResponse.data) {
                setCart(itemResponse.data.cart);
                setIsOpen(true);
            } else {
                throw new Error(itemResponse.error || "Failed to add item");
            }
        } catch (err) {
            console.error(err);
            alert(err instanceof Error ? err.message : "Failed to add item");
        } finally {
            setLoading(false);
        }
    };

    const updateQuantity = async (itemId: string, quantity: number) => {
        if (!cart) return;
        setLoading(true);
        try {
            const response = await api.patch<{ cart: Cart }>(`/api/v1/cart/items/${itemId}`, {
                quantity
            });
            if (response.ok && response.data) {
                setCart(response.data.cart);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const removeItem = async (itemId: string) => {
        if (!cart) return;
        setLoading(true);
        try {
            const response = await api.delete<{ cart: Cart }>(`/api/v1/cart/items/${itemId}`);
            if (response.ok && response.data) {
                setCart(response.data.cart);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const clearCart = async () => {
        if (!cart) return;
        setLoading(true);
        try {
            const response = await api.post<{ cart: Cart }>("/api/v1/cart/clear", {
                cart_id: cart.id
            });
            if (response.ok && response.data) {
                setCart(response.data.cart);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <CartContext.Provider value={{
            cart,
            addItem,
            updateQuantity,
            removeItem,
            clearCart,
            isOpen,
            setIsOpen,
            loading
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) throw new Error("useCart must be used within a CartProvider");
    return context;
};
