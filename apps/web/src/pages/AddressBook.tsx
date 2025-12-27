import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { MapPin, Plus, Trash2, Home, Briefcase, Navigation, Loader2 } from "lucide-react";

export const AddressBook: React.FC = () => {
    const { user } = useAuth();
    // In a real app, we'd fetch this from the API
    const [addresses, setAddresses] = useState([
        { id: "1", label: "Home", type: "home", line1: "123 Maple Avenue, Apt 4B", city: "Brooklyn", state: "NY", postal_code: "11201" },
        { id: "2", label: "Work", type: "work", line1: "500 7th Ave, Floor 12", city: "New York", state: "NY", postal_code: "10018" }
    ]);
    const [loading, setLoading] = useState(false);

    const handleDelete = (id: string) => {
        setAddresses(addresses.filter(a => a.id !== id));
    };

    return (
        <div className="mx-auto max-w-3xl py-8">
            <div className="mb-8 flex items-center justify-between">
                <h1 className="text-3xl font-black tracking-tight">Address Book</h1>
                <button className="flex items-center gap-2 rounded-2xl bg-stone-900 px-6 py-3 font-bold text-white transition hover:bg-stone-800">
                    <Plus size={20} />
                    Add Address
                </button>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {addresses.map((address) => (
                    <div key={address.id} className="group relative rounded-3xl border border-stone-200 bg-white p-6 transition hover:border-stone-900/10 hover:shadow-xl hover:shadow-stone-200/50">
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-50 text-stone-900">
                            {address.type === "home" ? <Home size={24} /> :
                                address.type === "work" ? <Briefcase size={24} /> :
                                    <MapPin size={24} />}
                        </div>

                        <div className="mb-4">
                            <h3 className="text-lg font-black text-stone-900">{address.label}</h3>
                            <p className="mt-1 text-sm font-medium text-stone-500">{address.line1}</p>
                            <p className="text-sm font-medium text-stone-500">{address.city}, {address.state} {address.postal_code}</p>
                        </div>

                        <div className="flex gap-4">
                            <button className="text-sm font-bold text-stone-900 underline">Edit</button>
                            <button
                                onClick={() => handleDelete(address.id)}
                                className="text-sm font-bold text-red-500 opacity-0 transition group-hover:opacity-100"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>

                        <div className="absolute right-6 top-6 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-green-600">
                            Default
                        </div>
                    </div>
                ))}

                {addresses.length === 0 && (
                    <div className="col-span-full rounded-3xl border border-dashed border-stone-200 py-12 text-center">
                        <p className="font-bold text-stone-400">No saved addresses yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
