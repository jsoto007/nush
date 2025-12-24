import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { type Restaurant, type User, type ApiResponse } from "@repo/shared";
import { UserPlus, Trash2, Mail, Shield, User as UserIcon } from "lucide-react";

interface StaffMember {
    id: string;
    user: User;
    role: string;
    is_active: boolean;
}

export const StaffManagement: React.FC = () => {
    const { restaurant } = useOutletContext<{ restaurant: Restaurant }>();
    const { api } = useAuth();
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("manager");

    const fetchStaff = async () => {
        const response = await api.get<{ staff: StaffMember[] }>(`/api/v1/restaurant-admin/restaurants/${restaurant.id}/staff`);
        if (response.ok && response.data) {
            setStaff(response.data.staff);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchStaff();
    }, [api, restaurant.id]);

    const handleAddStaff = async (e: React.FormEvent) => {
        e.preventDefault();
        const response = await api.post(`/api/v1/restaurant-admin/restaurants/${restaurant.id}/staff`, {
            user_email: email,
            role: role
        });
        if (response.ok) {
            setEmail("");
            fetchStaff();
        } else {
            alert(response.error);
        }
    };

    const handleRemoveStaff = async (staffId: string) => {
        if (!confirm("Are you sure you want to remove this staff member?")) return;
        const response = await api.delete(`/api/v1/restaurant-admin/staff/${staffId}`);
        if (response.ok) {
            setStaff(staff.filter(s => s.id !== staffId));
        }
    };

    if (loading) {
        return (
            <div className="flex h-[40vh] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-stone-200 border-t-stone-900"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl">
            <div className="mb-8">
                <h2 className="text-2xl font-black tracking-tight">Staff Management</h2>
                <p className="text-stone-500 font-medium">Manage who has access to your restaurant's management console.</p>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-4">
                    {staff.map((member) => (
                        <div key={member.id} className="flex items-center justify-between rounded-3xl border border-stone-200 bg-white p-4 transition-all hover:border-stone-900">
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100 text-stone-900">
                                    <UserIcon size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-stone-900">{member.user.name}</h3>
                                    <div className="flex items-center gap-3 text-xs text-stone-500 font-medium">
                                        <div className="flex items-center gap-1">
                                            <Mail size={12} />
                                            {member.user.email}
                                        </div>
                                        <div className="h-1 w-1 rounded-full bg-stone-300" />
                                        <div className="flex items-center gap-1">
                                            <Shield size={12} />
                                            <span className="uppercase tracking-tighter font-black">{member.role}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => handleRemoveStaff(member.id)}
                                className="rounded-xl p-2 text-stone-400 transition hover:bg-red-50 hover:text-red-500"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}

                    {staff.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-[20vh] border-2 border-dashed border-stone-200 rounded-3xl text-stone-400 font-bold">
                            No staff members found.
                        </div>
                    )}
                </div>

                <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm h-fit">
                    <h3 className="font-black text-xs uppercase tracking-widest text-stone-900 mb-6 flex items-center gap-2">
                        <UserPlus size={14} />
                        Add Staff Member
                    </h3>
                    <form onSubmit={handleAddStaff} className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-tight text-stone-400 mb-1.5 ml-1">
                                User Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="staff@example.com"
                                className="w-full rounded-2xl border border-stone-200 px-4 py-3 text-sm font-medium outline-none transition focus:border-stone-900"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-tight text-stone-400 mb-1.5 ml-1">
                                Role
                            </label>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-bold outline-none transition focus:border-stone-900 appearance-none"
                            >
                                <option value="manager">Manager</option>
                                <option value="menu_editor">Menu Editor</option>
                                <option value="viewer">Viewer</option>
                            </select>
                        </div>
                        <button
                            type="submit"
                            className="w-full rounded-2xl bg-stone-900 py-3 text-sm font-black text-white transition hover:bg-stone-800 disabled:opacity-50"
                        >
                            Invite to Staff
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
