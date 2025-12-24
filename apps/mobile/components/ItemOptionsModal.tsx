import React, { useState, useMemo } from "react";
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    Modal,
    ScrollView,
    SafeAreaView,
} from "react-native";
import { X, Check } from "lucide-react-native";
import { type MenuItem, type MenuItemOption, type MenuItemOptionGroup } from "@repo/shared";

interface ItemOptionsModalProps {
    isVisible: boolean;
    onClose: () => void;
    onConfirm: (options: { option_id: string; option_group_id: string; name_snapshot: string; price_delta_cents: number }[]) => void;
    menuItem: MenuItem;
}

export const ItemOptionsModal = ({
    isVisible,
    onClose,
    onConfirm,
    menuItem,
}: ItemOptionsModalProps) => {
    const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});

    const toggleOption = (group: MenuItemOptionGroup, option: MenuItemOption) => {
        const groupId = group.id;
        const optionId = option.id;
        const currentSelected = selectedOptions[groupId] || [];

        if (currentSelected.includes(optionId)) {
            setSelectedOptions({
                ...selectedOptions,
                [groupId]: currentSelected.filter((id) => id !== optionId),
            });
        } else {
            if (group.max_choices === 1) {
                setSelectedOptions({
                    ...selectedOptions,
                    [groupId]: [optionId],
                });
            } else if (group.max_choices === 0 || currentSelected.length < group.max_choices) {
                setSelectedOptions({
                    ...selectedOptions,
                    [groupId]: [...currentSelected, optionId],
                });
            }
        }
    };

    const isGroupValid = (group: MenuItemOptionGroup) => {
        const selectedCount = (selectedOptions[group.id] || []).length;
        if (group.is_required && selectedCount < group.min_choices) return false;
        if (group.max_choices > 0 && selectedCount > group.max_choices) return false;
        return true;
    };

    const isAllValid = useMemo(() => {
        return menuItem.option_groups.every(isGroupValid);
    }, [menuItem, selectedOptions]);

    const currentTotal = useMemo(() => {
        let total = menuItem.base_price_cents;
        Object.entries(selectedOptions).forEach(([groupId, optionIds]) => {
            const group = menuItem.option_groups.find((g) => g.id === groupId);
            if (group) {
                optionIds.forEach((oid) => {
                    const option = group.options.find((o) => o.id === oid);
                    if (option) {
                        total += option.price_delta_cents;
                    }
                });
            }
        });
        return total;
    }, [menuItem, selectedOptions]);

    const handleConfirm = () => {
        if (!isAllValid) return;

        const formattedOptions: { option_id: string; option_group_id: string; name_snapshot: string; price_delta_cents: number }[] = [];
        Object.entries(selectedOptions).forEach(([groupId, optionIds]) => {
            const group = menuItem.option_groups.find((g) => g.id === groupId);
            if (group) {
                optionIds.forEach((oid) => {
                    const option = group.options.find((o) => o.id === oid);
                    if (option) {
                        formattedOptions.push({
                            option_id: option.id,
                            option_group_id: groupId,
                            name_snapshot: option.name,
                            price_delta_cents: option.price_delta_cents,
                        });
                    }
                });
            }
        });

        onConfirm(formattedOptions);
        onClose();
    };

    return (
        <Modal
            visible={isVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <X size={24} color="#1c1917" />
                        </TouchableOpacity>
                        <View style={styles.headerTextContainer}>
                            <Text style={styles.headerTitle}>{menuItem.name}</Text>
                            <Text style={styles.headerSubtitle}>Customize your meal</Text>
                        </View>
                    </View>

                    <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
                        {menuItem.option_groups.map((group) => (
                            <View key={group.id} style={styles.optionGroup}>
                                <View style={styles.groupHeader}>
                                    <View>
                                        <Text style={styles.groupName}>{group.name}</Text>
                                        <Text style={styles.groupRequirements}>
                                            {group.is_required
                                                ? group.min_choices === group.max_choices
                                                    ? `Select ${group.min_choices}`
                                                    : `Select between ${group.min_choices} and ${group.max_choices}`
                                                : group.max_choices > 0
                                                    ? `Select up to ${group.max_choices}`
                                                    : "Optional"}
                                        </Text>
                                    </View>
                                    {group.is_required && (
                                        <View style={styles.requiredBadge}>
                                            <Text style={styles.requiredText}>Required</Text>
                                        </View>
                                    )}
                                </View>

                                {group.options.map((option) => (
                                    <TouchableOpacity
                                        key={option.id}
                                        style={styles.optionItem}
                                        onPress={() => toggleOption(group, option)}
                                    >
                                        <View style={styles.optionInfo}>
                                            <Text style={styles.optionName}>{option.name}</Text>
                                            {option.price_delta_cents > 0 && (
                                                <Text style={styles.optionPrice}>
                                                    +${(option.price_delta_cents / 100).toFixed(2)}
                                                </Text>
                                            )}
                                        </View>
                                        <View
                                            style={[
                                                styles.checkbox,
                                                (selectedOptions[group.id] || []).includes(option.id) &&
                                                styles.checkboxSelected,
                                            ]}
                                        >
                                            {(selectedOptions[group.id] || []).includes(option.id) && (
                                                <Check size={16} color="#ffffff" />
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        ))}
                    </ScrollView>

                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={[styles.confirmButton, !isAllValid && styles.confirmButtonDisabled]}
                            onPress={handleConfirm}
                            disabled={!isAllValid}
                        >
                            <Text style={styles.confirmButtonText}>
                                Add to Cart • ${(currentTotal / 100).toFixed(2)}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "flex-end",
    },
    modalContainer: {
        backgroundColor: "#ffffff",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: "90%",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#f5f5f4",
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#f5f5f4",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 16,
    },
    headerTextContainer: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "800",
        color: "#1c1917",
    },
    headerSubtitle: {
        fontSize: 14,
        color: "#78716c",
        marginTop: 2,
    },
    optionsList: {
        flex: 1,
        padding: 20,
    },
    optionGroup: {
        marginBottom: 32,
    },
    groupHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 16,
    },
    groupName: {
        fontSize: 18,
        fontWeight: "700",
        color: "#1c1917",
    },
    groupRequirements: {
        fontSize: 14,
        color: "#78716c",
        marginTop: 4,
    },
    requiredBadge: {
        backgroundColor: "#fef2f2",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    requiredText: {
        fontSize: 12,
        color: "#ef4444",
        fontWeight: "600",
    },
    optionItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#f5f5f4",
    },
    optionInfo: {
        flex: 1,
    },
    optionName: {
        fontSize: 16,
        color: "#1c1917",
        fontWeight: "500",
    },
    optionPrice: {
        fontSize: 14,
        color: "#78716c",
        marginTop: 2,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: "#e7e5e4",
        justifyContent: "center",
        alignItems: "center",
    },
    checkboxSelected: {
        backgroundColor: "#1c1917",
        borderColor: "#1c1917",
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: "#f5f5f4",
        backgroundColor: "#ffffff",
    },
    confirmButton: {
        backgroundColor: "#1c1917",
        height: 56,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
    },
    confirmButtonDisabled: {
        backgroundColor: "#e7e5e4",
    },
    confirmButtonText: {
        color: "#ffffff",
        fontSize: 16,
        fontWeight: "700",
    },
});
