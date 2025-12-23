type UserRole = "customer" | "courier" | "restaurant_owner" | "staff" | "admin";
type RestaurantStatus = "active" | "inactive" | "suspended";
type OrderStatus = "created" | "confirmed" | "preparing" | "ready" | "completed" | "cancelled" | "refunded";
type OrderType = "pickup" | "delivery";
interface User {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: UserRole;
    is_active: boolean;
    created_at: string;
}
interface Address {
    id: string;
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postal_code?: string;
    country: string;
    latitude?: number;
    longitude?: number;
}
interface Restaurant {
    id: string;
    name: string;
    status: RestaurantStatus;
    cuisines: string[];
    phone?: string;
    email?: string;
    address?: Address;
}
interface MenuItemOption {
    id: string;
    name: string;
    price_delta_cents: number;
    is_active: boolean;
}
interface MenuItemOptionGroup {
    id: string;
    name: string;
    min_choices: number;
    max_choices: number;
    is_required: boolean;
    is_active: boolean;
    options: MenuItemOption[];
}
interface MenuItem {
    id: string;
    name: string;
    description?: string;
    base_price_cents: number;
    price_pickup_cents?: number;
    price_delivery_cents?: number;
    tags: string[];
    is_active: boolean;
    option_groups: MenuItemOptionGroup[];
}
interface MenuCategory {
    id: string;
    name: string;
    sort_order: number;
    is_active: boolean;
    items: MenuItem[];
}
interface Menu {
    id: string;
    name: string;
    is_active: boolean;
    categories: MenuCategory[];
}
interface CartItemOption {
    id: string;
    option_id?: string;
    option_group_id?: string;
    name_snapshot: string;
    price_delta_cents: number;
}
interface CartItem {
    id: string;
    menu_item_id?: string;
    name_snapshot: string;
    base_price_cents: number;
    quantity: number;
    total_price_cents: number;
    notes?: string;
    options: CartItemOption[];
}
interface Cart {
    id: string;
    restaurant_id: string;
    order_type: OrderType;
    notes?: string;
    items: CartItem[];
    totals: {
        subtotal_cents: number;
        tax_cents: number;
        fee_cents: number;
        discount_cents: number;
        total_cents: number;
    };
}
interface Order extends Omit<Cart, "items"> {
    customer_id: string;
    status: OrderStatus;
    currency: string;
    placed_at: string;
    items: (CartItem & {
        total_price_cents: number;
    })[];
}
interface HealthResponse {
    status: string;
}
interface ApiResponse<T> {
    ok: boolean;
    data?: T;
    error?: string;
    code?: string;
    details?: any;
}
declare const getApiBaseUrl: (override?: string) => string;
declare class ApiClient {
    private baseUrl;
    private token;
    constructor(baseUrl: string);
    setToken(token: string | null): void;
    private request;
    get<T>(path: string): Promise<ApiResponse<T>>;
    post<T>(path: string, body?: any): Promise<ApiResponse<T>>;
    patch<T>(path: string, body: any): Promise<ApiResponse<T>>;
    put<T>(path: string, body: any): Promise<ApiResponse<T>>;
    delete<T>(path: string): Promise<ApiResponse<T>>;
}

export { type Address, ApiClient, type ApiResponse, type Cart, type CartItem, type CartItemOption, type HealthResponse, type Menu, type MenuCategory, type MenuItem, type MenuItemOption, type MenuItemOptionGroup, type Order, type OrderStatus, type OrderType, type Restaurant, type RestaurantStatus, type User, type UserRole, getApiBaseUrl };
