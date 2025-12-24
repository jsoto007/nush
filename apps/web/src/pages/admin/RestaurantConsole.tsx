import React, { useEffect, useState } from "react";
import { useParams, Outlet, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { AdminLayout } from "../../components/AdminLayout";
import { type Restaurant } from "@repo/shared";

export const RestaurantConsole: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { api } = useAuth();
    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [loading, setLoading] = useState(true);
    const location = useLocation();

    useEffect(() => {
        const fetchRestaurant = async () => {
            if (!id) return;
            // Using the regular restaurant endpoint as the user already has access confirmed by the backend
            const response = await api.get<Restaurant>(`/api/v1/restaurants/${id}`);
            if (response.ok && response.data) {
                setRestaurant(response.data);
            }
            setLoading(false);
        };

        fetchRestaurant();
    }, [id, api]);

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex h-[60vh] items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-stone-200 border-t-stone-900"></div>
                </div>
            </AdminLayout>
        );
    }

    if (!restaurant) {
        return <Navigate to="/admin" replace />;
    }

    // Default to menu if we are exactly at /admin/restaurant/:id
    if (location.pathname === `/admin/restaurant/${id}` || location.pathname === `/admin/restaurant/${id}/`) {
        return <Navigate to={`/admin/restaurant/${id}/menu`} replace />;
    }

    return (
        <AdminLayout
            restaurantName={restaurant.name}
            baseUrl={`/admin/restaurant/${id}`}
        >
            <Outlet context={{ restaurant }} />
        </AdminLayout>
    );
};
