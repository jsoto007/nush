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

    const portalPath = location.pathname.startsWith("/admin") ? "/admin" : "/restaurant/admin-portal";
    const baseConsoleUrl = `${portalPath}/restaurant/${id}`;

    if (loading) {
        return (
            <AdminLayout baseUrl={portalPath}>
                <div className="flex h-[60vh] items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-stone-200 border-t-stone-900"></div>
                </div>
            </AdminLayout>
        );
    }

    if (!restaurant) {
        return <Navigate to={portalPath} replace />;
    }

    // Default to menu if we are exactly at the console root
    if (location.pathname === baseConsoleUrl || location.pathname === `${baseConsoleUrl}/`) {
        return <Navigate to={`${baseConsoleUrl}/menu`} replace />;
    }

    return (
        <AdminLayout
            restaurantName={restaurant.name}
            baseUrl={portalPath}
        >
            <Outlet context={{ restaurant }} />
        </AdminLayout>
    );
};
