import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { type Restaurant, type Menu } from "@repo/shared";

export const useRestaurant = (id: string) => {
    const { api } = useAuth();
    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [menu, setMenu] = useState<Menu | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [resResponse, menuResponse] = await Promise.all([
                api.get<{ restaurant: Restaurant }>(`/api/v1/restaurants/${id}`),
                api.get<{ menu: Menu }>(`/api/v1/restaurants/${id}/menus/active`)
            ]);

            if (resResponse.ok && resResponse.data) {
                setRestaurant(resResponse.data.restaurant);
            } else {
                setError(resResponse.error || "Failed to fetch restaurant");
            }

            if (menuResponse.ok && menuResponse.data) {
                setMenu(menuResponse.data.menu);
            } else {
                // Not finding a menu might not be a hard error for the restaurant view
                console.warn("Menu not found for restaurant:", id);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchData();
        }
    }, [id]);

    return { restaurant, menu, loading, error, refetch: fetchData };
};
