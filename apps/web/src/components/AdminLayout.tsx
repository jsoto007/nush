import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    Utensils,
    Users,
    Package,
    Settings,
    ChevronLeft,
    Store
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface AdminLayoutProps {
    children: React.ReactNode;
    restaurantName?: string;
    baseUrl?: string;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, restaurantName, baseUrl }) => {
    const { user, logout } = useAuth();
    const location = useLocation();

    const navigation = [
        { name: "Dashboard", href: baseUrl || "/admin", icon: LayoutDashboard },
    ];

    const restaurantNavigation = restaurantName ? [
        { name: "Menu", href: `${baseUrl}/menu`, icon: Utensils },
        { name: "Staff", href: `${baseUrl}/staff`, icon: Users },
        { name: "Inventory", href: `${baseUrl}/inventory`, icon: Package },
        { name: "Settings", href: `${baseUrl}/settings`, icon: Settings },
    ] : [];

    return (
        <div className="flex min-h-screen bg-stone-50">
            {/* Sidebar */}
            <aside className="fixed inset-y-0 left-0 w-64 border-r border-stone-200 bg-white">
                <div className="flex h-20 items-center border-b border-stone-200 px-6">
                    <Link to="/" className="text-xl font-black tracking-tighter">
                        NUSH<span className="text-stone-400">.</span> ADMIN
                    </Link>
                </div>

                <nav className="mt-6 px-4 space-y-1">
                    {navigation.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                to={item.href}
                                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition ${isActive
                                    ? "bg-stone-900 text-white"
                                    : "text-stone-500 hover:bg-stone-100 hover:text-stone-900"
                                    }`}
                            >
                                <Icon size={18} />
                                {item.name}
                            </Link>
                        );
                    })}

                    {restaurantName && (
                        <div className="mt-8">
                            <div className="flex items-center gap-2 px-4 mb-2">
                                <Store size={14} className="text-stone-400" />
                                <span className="text-[10px] font-black uppercase tracking-wider text-stone-400">
                                    {restaurantName}
                                </span>
                            </div>
                            {restaurantNavigation.map((item) => {
                                const Icon = item.icon;
                                const isActive = location.pathname.startsWith(item.href);
                                return (
                                    <Link
                                        key={item.name}
                                        to={item.href}
                                        className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition ${isActive
                                            ? "bg-stone-900 text-white"
                                            : "text-stone-500 hover:bg-stone-100 hover:text-stone-900"
                                            }`}
                                    >
                                        <Icon size={18} />
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </nav>

                <div className="absolute bottom-0 w-full border-t border-stone-200 p-4">
                    <div className="flex items-center gap-3 rounded-2xl bg-stone-50 p-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-900 text-sm font-bold text-white uppercase">
                            {user?.name?.charAt(0)}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="truncate text-sm font-bold">{user?.name}</span>
                            <button
                                onClick={logout}
                                className="text-left text-[10px] font-bold text-stone-400 hover:text-red-500 transition"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <main className="pl-64 flex-1">
                <div className="min-h-screen p-8">
                    {children}
                </div>
            </main>
        </div>
    );
};
