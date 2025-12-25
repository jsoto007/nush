import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { AdminLayout } from "../../components/AdminLayout";
import { type Restaurant, type User as UserType } from "@repo/shared";
import { Plus, Store, ChevronRight, Users, UserPlus } from "lucide-react";
import { CreateRestaurantModal } from "./components/CreateRestaurantModal";
import { CreateUserModal } from "./components/CreateUserModal";

export const SuperAdminDashboard: React.FC = () => {
    const { api } = useAuth();
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRestaurantModalOpen, setIsRestaurantModalOpen] = useState(false);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        const response = await api.get<{ restaurants: Restaurant[] }>("/api/v1/admin/restaurants");
        if (response.ok && response.data) {
            setRestaurants(response.data.restaurants);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, [api]);

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex h-[60vh] items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-stone-200 border-t-stone-900"></div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-black tracking-tight">Super Admin Console</h1>
                    <p className="text-stone-500 font-medium">Global platform management and oversight.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsUserModalOpen(true)}
                        className="flex items-center gap-2 rounded-2xl border border-stone-200 bg-white px-6 py-3 text-sm font-bold transition hover:bg-stone-50"
                    >
                        <UserPlus size={18} />
                        New User Account
                    </button>
                    <button
                        onClick={() => setIsRestaurantModalOpen(true)}
                        className="flex items-center gap-2 rounded-2xl bg-stone-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-stone-800"
                    >
                        <Plus size={18} />
                        New Restaurant
                    </button>
                </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {restaurants.map((restaurant) => (
                    <Link
                        key={restaurant.id}
                        to={`/admin/restaurant/${restaurant.id}`}
                        className="group relative overflow-hidden rounded-3xl border border-stone-200 bg-white p-6 transition-all hover:border-stone-900 hover:shadow-xl hover:shadow-stone-200/50"
                    >
                        {/* ... restaurant card content ... */}
                        <div className="flex items-start justify-between">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100 transition-colors group-hover:bg-stone-900 group-hover:text-white">
                                <Store size={24} />
                            </div>
                            <div className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${restaurant.status === "active" ? "bg-green-100 text-green-700" : "bg-stone-100 text-stone-500"
                                }`}>
                                {restaurant.status}
                            </div>
                        </div>

                        <div className="mt-6">
                            <h3 className="text-xl font-bold tracking-tight">{restaurant.name}</h3>
                            <p className="text-sm text-stone-500 font-medium mt-1">
                                {restaurant.cuisines.join(" • ")}
                            </p>
                        </div>

                        <div className="mt-8 flex items-center justify-between border-t border-stone-50 pt-4">
                            <span className="text-xs font-bold text-stone-400 group-hover:text-stone-900 transition-colors">Manage Full Access</span>
                            <ChevronRight size={16} className="text-stone-300 group-hover:text-stone-900 transform group-hover:translate-x-1 transition-all" />
                        </div>
                    </Link>
                ))}
            </div>

            {restaurants.length === 0 && (
                <div className="flex flex-col items-center justify-center h-[40vh] border-2 border-dashed border-stone-200 rounded-3xl">
                    <Store size={48} className="text-stone-200 mb-4" />
                    <p className="text-stone-500 font-bold">No restaurants found</p>
                    <button
                        onClick={() => setIsRestaurantModalOpen(true)}
                        className="mt-4 text-sm font-black text-stone-900 underline"
                    >
                        Create your first restaurant
                    </button>
                </div>
            )}

            <CreateRestaurantModal
                isOpen={isRestaurantModalOpen}
                onClose={() => setIsRestaurantModalOpen(false)}
                onCreated={fetchData}
            />

            <CreateUserModal
                isOpen={isUserModalOpen}
                onClose={() => setIsUserModalOpen(false)}
                onCreated={() => { }}
                showRoleSelector
                defaultRole="restaurant_owner"
            />
        </AdminLayout>
    );
};
