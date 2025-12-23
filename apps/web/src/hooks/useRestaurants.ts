import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { type Restaurant } from "@repo/shared";

export const useRestaurants = () => {
    const { api } = useAuth();
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchRestaurants = async () => {
        setLoading(true);
        const response = await api.get<{ restaurants: Restaurant[] }>("/api/v1/restaurants");
        if (response.ok && response.data) {
            setRestaurants(response.data.restaurants);
        } else {
            setError(response.error || "Failed to fetch restaurants");
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchRestaurants();
    }, []);

    return { restaurants, loading, error, refetch: fetchRestaurants };
};
