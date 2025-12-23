import React from "react";
import { Link } from "react-router-dom";
import { useRestaurants } from "../hooks/useRestaurants";
import foodPlaceholder from "../assets/food-placeholder.svg";
import { Star, Clock, MapPin } from "lucide-react";

export const RestaurantList: React.FC = () => {
    const { restaurants, loading, error } = useRestaurants();

    if (loading) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-stone-200 border-t-stone-900"></div>
            </div>
        );
    }

    if (error) {
        return <div className="p-8 text-center text-red-600">{error}</div>;
    }

    return (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {restaurants.map((restaurant) => (
                <Link
                    key={restaurant.id}
                    to={`/restaurant/${restaurant.id}`}
                    className="group block overflow-hidden rounded-3xl border border-stone-200 bg-white transition hover:shadow-xl hover:shadow-stone-200/40"
                >
                    <div className="aspect-video w-full bg-stone-100">
                        <div className="flex h-full w-full items-center justify-center text-stone-400">
                            <img
                                src={foodPlaceholder}
                                alt={restaurant.name}
                                className="h-full w-full object-cover"
                            />
                        </div>
                    </div>
                    <div className="p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-stone-900 group-hover:text-stone-700">
                                    {restaurant.name}
                                </h3>
                                <p className="mt-1 text-sm text-stone-500">
                                    {restaurant.cuisines.join(" • ")}
                                </p>
                            </div>
                            <div className="flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700">
                                <Star size={12} fill="currentColor" />
                                <span>4.8</span>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-4 text-sm text-stone-500">
                            <div className="flex items-center gap-1">
                                <Clock size={14} />
                                <span>25-35 min</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <MapPin size={14} />
                                <span>1.2 miles</span>
                            </div>
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    );
};
