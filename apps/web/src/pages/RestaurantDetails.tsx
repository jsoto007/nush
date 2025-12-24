import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useRestaurant } from "../hooks/useRestaurant";
import { useCart } from "../context/CartContext";
import { ChevronLeft, Plus } from "lucide-react";
import foodPlaceholder from "../assets/food-placeholder.svg";
import { type MenuItem, type MenuItemOptionGroup } from "@repo/shared";

type ActiveSelection = {
    item: MenuItem;
    quantity: number;
    notes: string;
    selections: Record<string, string[]>;
};

export const RestaurantDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { restaurant, menu, loading, error } = useRestaurant(id || "");
    const { addItem, loading: cartLoading } = useCart();
    const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
    const [activeSelection, setActiveSelection] = useState<ActiveSelection | null>(null);
    const [catBarHeight, setCatBarHeight] = useState(0);
    const [headerHeight, setHeaderHeight] = useState(80);
    const catBarRef = useRef<HTMLDivElement | null>(null);
    const catListRef = useRef<HTMLDivElement | null>(null);
    const suppressUntilRef = useRef(0);

    const categories = useMemo(() => {
        const items = menu?.categories ?? [];
        return [...items].sort((a, b) => a.sort_order - b.sort_order);
    }, [menu?.categories]);

    const sectionScrollMargin = headerHeight + catBarHeight + 12;

    useLayoutEffect(() => {
        if (typeof window === "undefined") return;
        const measure = () => {
            const bar = catBarRef.current;
            const header = document.querySelector("header");
            setCatBarHeight(bar?.offsetHeight || 0);
            if (header instanceof HTMLElement) {
                setHeaderHeight(header.offsetHeight || 0);
            }
        };
        measure();
        const ro = new ResizeObserver(measure);
        if (catBarRef.current) {
            ro.observe(catBarRef.current);
        }
        window.addEventListener("resize", measure);
        return () => {
            ro.disconnect();
            window.removeEventListener("resize", measure);
        };
    }, []);

    useEffect(() => {
        if (!categories.length) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (Date.now() < suppressUntilRef.current) return;

                const visible = entries
                    .filter((entry) => entry.isIntersecting)
                    .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

                if (visible.length) {
                    const id = visible[0].target.getAttribute("id");
                    if (id?.startsWith("cat-")) {
                        setActiveCategoryId(id.replace("cat-", ""));
                    }
                }
            },
            {
                rootMargin: `${-(headerHeight + catBarHeight + 8)}px 0px -55% 0px`,
                threshold: [0, 0.25, 0.5, 0.75, 1]
            }
        );

        categories.forEach((category) => {
            const element = document.getElementById(`cat-${category.id}`);
            if (element) observer.observe(element);
        });

        return () => observer.disconnect();
    }, [categories, catBarHeight, headerHeight]);

    useEffect(() => {
        if (!activeCategoryId || !catListRef.current) return;
        const tab = catListRef.current.querySelector<HTMLButtonElement>(
            `button[data-cat-id="${activeCategoryId}"]`
        );
        if (!tab) return;
        const tabRect = tab.getBoundingClientRect();
        const listRect = catListRef.current.getBoundingClientRect();
        const isLeftOverflow = tabRect.left < listRect.left;
        const isRightOverflow = tabRect.right > listRect.right;
        if (isLeftOverflow || isRightOverflow) {
            tab.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
        }
    }, [activeCategoryId]);

    useEffect(() => {
        if (!activeCategoryId && categories[0]) {
            setActiveCategoryId(categories[0].id);
        }
    }, [activeCategoryId, categories]);

    const scrollToCategory = (categoryId: string) => {
        const element = document.getElementById(`cat-${categoryId}`);
        if (!element) return;
        const offset = headerHeight + catBarHeight + 16;
        const targetY = element.getBoundingClientRect().top + window.scrollY - offset;
        setActiveCategoryId(categoryId);
        suppressUntilRef.current = Date.now() + 800;
        window.scrollTo({ top: Math.max(0, targetY), behavior: "smooth" });
    };

    const openItemOptions = (item: MenuItem) => {
        setActiveSelection({
            item,
            quantity: 1,
            notes: "",
            selections: {}
        });
    };

    const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

    const buildSelectionPayload = (selections: Record<string, string[]>) =>
        Object.entries(selections).flatMap(([groupId, optionIds]) =>
            optionIds.map((optionId) => ({ option_id: optionId, option_group_id: groupId }))
        );

    const isSelectionValid = (groups: MenuItemOptionGroup[], selections: Record<string, string[]>) =>
        groups.every((group) => {
            const selectedCount = selections[group.id]?.length || 0;
            const minRequired = group.min_choices || (group.is_required ? 1 : 0);
            const maxAllowed = group.max_choices && group.max_choices > 0 ? group.max_choices : Infinity;
            return selectedCount >= minRequired && selectedCount <= maxAllowed;
        });

    const toggleOption = (group: MenuItemOptionGroup, optionId: string) => {
        setActiveSelection((prev) => {
            if (!prev) return prev;
            const current = prev.selections[group.id] || [];
            const isSelected = current.includes(optionId);
            const maxAllowed = group.max_choices && group.max_choices > 0 ? group.max_choices : Infinity;
            let next = current;
            if (isSelected) {
                next = current.filter((id) => id !== optionId);
            } else if (maxAllowed === 1) {
                next = [optionId];
            } else if (current.length < maxAllowed) {
                next = [...current, optionId];
            }
            return {
                ...prev,
                selections: {
                    ...prev.selections,
                    [group.id]: next
                }
            };
        });
    };

    const confirmAddItem = async () => {
        if (!activeSelection || !restaurant) return;
        const activeGroups = (activeSelection.item.option_groups || []).filter(
            (group) => group.is_active
        );
        if (!isSelectionValid(activeGroups, activeSelection.selections)) {
            alert("Please select the required options.");
            return;
        }
        await addItem(activeSelection.item, restaurant.id, {
            quantity: activeSelection.quantity,
            notes: activeSelection.notes.trim() || undefined,
            selections: buildSelectionPayload(activeSelection.selections)
        });
        setActiveSelection(null);
    };

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
        <div className="w-screen -mx-[calc(50vw-50%)] -mt-px">
            <div
                ref={catBarRef}
                className="fixed inset-x-0 z-40 border-b border-stone-200 bg-white/95 supports-[backdrop-filter]:bg-white/80 backdrop-blur"
                style={{ top: headerHeight }}
            >
                <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
                    <div className="mb-2 text-xs font-bold uppercase tracking-[0.35em] text-stone-400">
                        Categories
                    </div>
                    <div ref={catListRef} className="flex gap-2 overflow-x-auto">
                        {categories.map((category) => (
                            <button
                                key={category.id}
                                type="button"
                                data-cat-id={category.id}
                                aria-current={activeCategoryId === category.id}
                                onClick={() => scrollToCategory(category.id)}
                                className="shrink-0 rounded-xl px-3 py-1.5 text-sm font-semibold text-stone-700 transition border-b-2 border-transparent hover:bg-amber-50 hover:text-amber-700 aria-[current=true]:text-amber-700 aria-[current=true]:border-amber-500 aria-[current=true]:underline aria-[current=true]:underline-offset-8"
                            >
                                {category.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div style={{ height: catBarHeight + 12 }} />

            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <button
                    onClick={() => navigate("/")}
                    className="mb-6 flex items-center gap-2 text-sm font-medium text-stone-500 transition hover:text-stone-900"
                >
                    <ChevronLeft size={16} />
                    Back to browse
                </button>

                <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-stone-900">
                            {restaurant.name}
                        </h1>
                        <p className="mt-2 text-sm text-stone-500">{restaurant.cuisines.join(" • ")}</p>
                    </div>
                    <div className="hidden h-24 w-36 overflow-hidden rounded-2xl bg-stone-100 md:block">
                        <img
                            src={foodPlaceholder}
                            alt={restaurant.name}
                            className="h-full w-full object-cover"
                        />
                    </div>
                </div>

                {categories.length ? (
                    categories.map((category) => (
                        <section
                            id={`cat-${category.id}`}
                            key={category.id}
                            className="mb-10"
                            style={{ scrollMarginTop: sectionScrollMargin }}
                        >
                            <h2 className="mb-4 text-2xl font-extrabold tracking-tight text-stone-900">
                                {category.name}
                            </h2>
                            <div className="space-y-4">
                                {category.items.map((item) => (
                                    <div
                                        key={item.id}
                                        className="group relative flex items-stretch justify-between rounded-2xl border border-stone-200 bg-white p-4 transition hover:shadow-md"
                                    >
                                        <button
                                            type="button"
                                            onClick={() => openItemOptions(item)}
                                            className="flex-1 text-left"
                                        >
                                            <div className="mb-1 text-base font-extrabold tracking-tight text-stone-900">
                                                {item.name}
                                            </div>
                                            <div className="mb-1 text-sm font-semibold text-stone-800">
                                                {formatPrice(item.base_price_cents)}
                                            </div>
                                            {item.description ? (
                                                <p className="line-clamp-2 max-w-prose text-sm text-stone-500">
                                                    {item.description}
                                                </p>
                                            ) : null}
                                        </button>

                                        <div className="relative ml-4 h-28 w-28 shrink-0 overflow-hidden rounded-xl border border-stone-200 bg-stone-50">
                                            <img
                                                src={foodPlaceholder}
                                                alt={item.name}
                                                className="h-full w-full object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => openItemOptions(item)}
                                                className="absolute bottom-2 right-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-400 font-bold text-black shadow transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60"
                                                aria-label={`Add ${item.name}`}
                                                title="Add"
                                                disabled={cartLoading}
                                            >
                                                <Plus size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    ))
                ) : (
                    <div className="rounded-3xl border border-dashed border-stone-200 bg-stone-50 py-12 text-center">
                        <p className="text-stone-500">No menu items available for this restaurant.</p>
                    </div>
                )}
            </div>

            {activeSelection && (
                <div
                    className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
                    onClick={() => setActiveSelection(null)}
                >
                    <div
                        className="w-full max-w-2xl rounded-3xl bg-white shadow-xl"
                        role="dialog"
                        aria-modal="true"
                        aria-label={`${activeSelection.item.name} options`}
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4">
                            <h2 className="text-xl font-bold text-stone-900">{activeSelection.item.name}</h2>
                            <button
                                type="button"
                                onClick={() => setActiveSelection(null)}
                                className="rounded-full px-3 py-1 text-sm font-semibold text-stone-500 transition hover:text-stone-900"
                            >
                                Close
                            </button>
                        </div>

                        <div className="max-h-[70vh] space-y-6 overflow-y-auto px-6 py-5">
                            {activeSelection.item.option_groups
                                ?.filter((group) => group.is_active)
                                .map((group) => {
                                    const selected = activeSelection.selections[group.id] || [];
                                    const maxAllowed =
                                        group.max_choices && group.max_choices > 0
                                            ? group.max_choices
                                            : undefined;
                                    const minRequired =
                                        group.min_choices || (group.is_required ? 1 : 0);
                                    return (
                                        <div key={group.id}>
                                            <div className="flex flex-wrap items-center gap-2 text-base font-bold text-stone-900">
                                                <span>{group.name}</span>
                                                {minRequired > 0 && (
                                                    <span className="text-xs font-semibold text-rose-700">
                                                        required
                                                    </span>
                                                )}
                                                {maxAllowed && (
                                                    <span className="text-xs text-stone-500">
                                                        up to {maxAllowed}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                                                {group.options
                                                    .filter((option) => option.is_active)
                                                    .map((option) => {
                                                        const checked = selected.includes(option.id);
                                                        return (
                                                            <label
                                                                key={option.id}
                                                                className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 transition ${checked
                                                                    ? "border-amber-300 bg-amber-50 ring-2 ring-amber-200"
                                                                    : "border-stone-200 bg-white hover:bg-stone-50"
                                                                    }`}
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={checked}
                                                                    onChange={() => toggleOption(group, option.id)}
                                                                    className="h-4 w-4 accent-amber-500"
                                                                />
                                                                <span className="text-sm font-medium text-stone-800">
                                                                    {option.name}
                                                                    {option.price_delta_cents !== 0 && (
                                                                        <span className="text-stone-500">
                                                                            {" "}
                                                                            ({option.price_delta_cents > 0 ? "+" : "-"}
                                                                            {formatPrice(Math.abs(option.price_delta_cents))}
                                                                            )
                                                                        </span>
                                                                    )}
                                                                </span>
                                                            </label>
                                                        );
                                                    })}
                                            </div>
                                        </div>
                                    );
                                })}

                            <div className="flex items-center gap-3">
                                <label className="text-sm font-semibold text-stone-800">Qty</label>
                                <input
                                    type="number"
                                    min={1}
                                    value={activeSelection.quantity}
                                    onChange={(event) =>
                                        setActiveSelection((prev) =>
                                            prev
                                                ? {
                                                    ...prev,
                                                    quantity: Math.max(1, Number(event.target.value || 1))
                                                }
                                                : prev
                                        )
                                    }
                                    className="w-24 rounded-xl border-2 border-stone-200 bg-white px-3 py-2 text-center text-stone-900 outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-400/20"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-semibold text-stone-800">
                                    Notes
                                </label>
                                <textarea
                                    value={activeSelection.notes}
                                    onChange={(event) =>
                                        setActiveSelection((prev) =>
                                            prev
                                                ? {
                                                    ...prev,
                                                    notes: event.target.value.slice(0, 300)
                                                }
                                                : prev
                                        )
                                    }
                                    className="min-h-28 w-full rounded-2xl border-2 border-stone-200 bg-white px-3 py-2 text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-400/20"
                                    placeholder="No onions, allergies... (max 300)"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 border-t border-stone-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-end">
                            <button
                                type="button"
                                className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-2.5 font-semibold text-stone-800 transition hover:border-stone-400 hover:bg-stone-50 sm:w-auto"
                                onClick={() => setActiveSelection(null)}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="w-full rounded-2xl bg-green-600 px-4 py-2.5 font-bold text-white transition hover:scale-[1.02] hover:shadow-[0_8px_30px_rgba(22,163,74,0.35)] sm:w-auto disabled:cursor-not-allowed disabled:opacity-70"
                                onClick={confirmAddItem}
                                disabled={cartLoading}
                            >
                                Add to cart
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
