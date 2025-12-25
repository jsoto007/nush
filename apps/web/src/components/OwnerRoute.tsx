import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const OwnerRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-stone-50">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-stone-200 border-t-stone-900"></div>
            </div>
        );
    }

    const isOwnerOrStaff = user && (user.role === "restaurant_owner" || user.role === "staff");
    // Admins can also access owner portal to manage
    const isAdmin = user && user.role === "admin";

    if (!isOwnerOrStaff && !isAdmin) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};
