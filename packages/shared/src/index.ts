export type UserRole = "customer" | "courier" | "restaurant_owner" | "staff" | "admin";
export type RestaurantStatus = "active" | "inactive" | "suspended";
export type OrderStatus =
  | "created"
  | "confirmed"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled"
  | "refunded";
export type OrderType = "pickup" | "delivery";

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface Address {
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

export interface Restaurant {
  id: string;
  name: string;
  status: RestaurantStatus;
  cuisines: string[];
  phone?: string;
  email?: string;
  address?: Address;
}

export interface MenuItemOption {
  id: string;
  name: string;
  price_delta_cents: number;
  is_active: boolean;
}

export interface MenuItemOptionGroup {
  id: string;
  name: string;
  min_choices: number;
  max_choices: number;
  is_required: boolean;
  is_active: boolean;
  options: MenuItemOption[];
}

export interface MenuItem {
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

export interface MenuCategory {
  id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
  items: MenuItem[];
}

export interface Menu {
  id: string;
  name: string;
  is_active: boolean;
  categories: MenuCategory[];
}

export interface CartItemOption {
  id: string;
  option_id?: string;
  option_group_id?: string;
  name_snapshot: string;
  price_delta_cents: number;
}

export interface CartItem {
  id: string;
  menu_item_id?: string;
  name_snapshot: string;
  base_price_cents: number;
  quantity: number;
  total_price_cents: number;
  notes?: string;
  options: CartItemOption[];
}

export interface Cart {
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

export interface Order extends Omit<Cart, "items"> {
  customer_id: string;
  status: OrderStatus;
  currency: string;
  placed_at: string;
  items: (CartItem & { total_price_cents: number })[];
}

export interface HealthResponse {
  status: string;
}

export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
  code?: string;
  details?: any;
}

export const getApiBaseUrl = (override?: string) => {
  const envValue =
    override ??
    (typeof process !== "undefined" ? process.env?.EXPO_PUBLIC_API_URL : undefined);

  if (envValue && envValue.trim().length > 0) {
    return envValue.replace(/\/$/, "");
  }

  return "http://localhost:5001";
};

export class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${path}`;
    const headers = new Headers(options.headers);
    if (this.token) {
      headers.set("Authorization", `Bearer ${this.token}`);
    }
    if (!(options.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }

    try {
      const response = await fetch(url, { ...options, headers, credentials: "include" });
      const data = await response.json();

      if (response.ok) {
        return { ok: true, data: data.data };
      } else {
        return {
          ok: false,
          error: data.message || "An error occurred",
          code: data.code,
          details: data.details,
        };
      }
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "Network error" };
    }
  }

  get<T>(path: string) {
    return this.request<T>(path);
  }

  post<T>(path: string, body?: any) {
    return this.request<T>(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  patch<T>(path: string, body: any) {
    return this.request<T>(path, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  }

  put<T>(path: string, body: any) {
    return this.request<T>(path, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  delete<T>(path: string) {
    return this.request<T>(path, { method: "DELETE" });
  }
}
