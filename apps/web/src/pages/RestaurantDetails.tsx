import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useRestaurant } from "../hooks/useRestaurant";
import { useCart } from "../context/CartContext";
import { Star, Clock, MapPin, ChevronLeft, Plus, Info } from "lucide-react";

export const RestaurantDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { restaurant, menu, loading, error } = useRestaurant(id || "");
    const { addItem } = useCart();
    const [activeCategory, setActiveCategory] = useState<string | null>(null);

    if (loading) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-stone-200 border-t-stone-900"></div>
            </div>
        );
    }

    if (error || !restaurant) {
        return (
            <div className="p-8 text-center">
                <p className="text-red-600">{error || "Restaurant not found"}</p>
                <button
                    onClick={() => navigate("/")}
                    className="mt-4 text-sm font-semibold text-stone-900 hover:underline"
                >
                    Back to browse
                </button>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-5xl">
            <button
                onClick={() => navigate("/")}
                className="mb-6 flex items-center gap-2 text-sm font-medium text-stone-500 transition hover:text-stone-900"
            >
                <ChevronLeft size={16} />
                Back to browse
            </button>

            <div className="relative overflow-hidden rounded-3xl border border-stone-200 bg-white p-8">
                <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-4xl font-bold text-stone-900">{restaurant.name}</h1>
                            <div className="flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700">
                                <Star size={12} fill="currentColor" />
                                <span>4.8</span>
                            </div>
                        </div>
                        <p className="mt-2 text-stone-500">{restaurant.cuisines.join(" • ")}</p>

                        <div className="mt-6 flex flex-wrap items-center gap-6 text-sm text-stone-600">
                            <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-50 text-stone-400">
                                    <Clock size={16} />
                                </div>
                                <span>25-35 min</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-50 text-stone-400">
                                    <MapPin size={16} />
                                </div>
                                <span>1.2 miles</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-50 text-stone-400">
                                    <Info size={16} />
                                </div>
                                <span className="underline decoration-stone-200 underline-offset-4">Restaurant info</span>
                            </div>
                        </div>
                    </div>

                    <div className="hidden h-32 w-48 overflow-hidden rounded-2xl bg-stone-100 md:block">
                        <img
                            src={`https://source.unsplash.com/featured/?food,${restaurant.cuisines[0] || 'restaurant'}`}
                            alt={restaurant.name}
                            className="h-full w-full object-cover"
                        />
                    </div>
                </div>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-4">
                {/* Categories Sidebar */}
                <div className="lg:col-span-1">
                    <nav className="sticky top-24 flex flex-col gap-1">
                        <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-stone-400">Menu</h2>
                        {menu?.categories.map((category) => (
                            <button
                                key={category.id}
                                onClick={() => setActiveCategory(category.id)}
                                className={`rounded-xl px-4 py-3 text-left text-sm font-medium transition ${activeCategory === category.id
                                        ? "bg-stone-900 text-white shadow-lg shadow-stone-200"
                                        : "text-stone-600 hover:bg-stone-100"
                                    }`}
                            >
                                {category.name}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Menu Items */}
                <div className="lg:col-span-3">
                    {menu?.categories.map((category) => (
                        <section key={category.id} className="mb-12">
                            <h2 className="mb-6 text-2xl font-bold text-stone-900">{category.name}</h2>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                {category.items.map((item) => (
                                    <div
                                        key={item.id}
                                        onClick={() => addItem(item, restaurant.id)}
                                        className="group relative flex cursor-pointer items-start justify-between rounded-2xl border border-stone-200 bg-white p-4 transition hover:border-stone-400 hover:shadow-lg hover:shadow-stone-100"
                                    >
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-stone-900">{item.name}</h3>
                                            {item.description && (
                                                <p className="mt-1 line-clamp-2 text-xs text-stone-500">{item.description}</p>
                                            )}
                                            <p className="mt-3 font-medium text-stone-900">
                                                ${(item.base_price_cents / 100).toFixed(2)}
                                            </p>
                                        </div>
                                        <div className="ml-4 flex h-24 w-24 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-stone-50">
                                            <img
                                                src={`https://source.unsplash.com/featured/?food,${item.name}`}
                                                alt={item.name}
                                                className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = "https://via.placeholder.com/150?text=Food";
                                                }}
                                            />
                                            <button className="absolute bottom-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-white text-stone-900 shadow-md transition hover:bg-stone-900 hover:text-white">
                                                <Plus size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    ))}
                    {!menu?.categories.length && (
                        <div className="rounded-3xl border border-dashed border-stone-200 bg-stone-50 py-12 text-center">
                            <p className="text-stone-500">No menu items available for this restaurant.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
