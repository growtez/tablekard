// ==========================================
// Restaurant SaaS - Shared Types (Supabase)
// ==========================================

export type IsoDateString = string;

// ==========================================
// Enums
// ==========================================

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  RESTAURANT_ADMIN = 'RESTAURANT_ADMIN',
  RESTAURANT_STAFF = 'RESTAURANT_STAFF',
  CUSTOMER = 'CUSTOMER',
}

export enum SubscriptionPlan {
  QR = 'QR',
}

export enum OrderType {
  DINE_IN = 'DINE_IN',
  TAKEAWAY = 'TAKEAWAY',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  READY = 'READY',
  SERVED = 'SERVED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentMethod {
  ONLINE = 'ONLINE',
  PAY_AT_COUNTER = 'PAY_AT_COUNTER',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  TRIAL = 'TRIAL',
  EXPIRED = 'EXPIRED',
}

export enum RestaurantStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

// ==========================================
// User Types
// ==========================================

export interface Profile {
  id: string; // Supabase auth user id
  email: string;
  name?: string | null;
  role: UserRole;
  avatarUrl?: string | null;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
}

// Backwards-compatible alias for existing UI code
export type User = Profile;

export interface Address {
  id: string;
  label: string; // Home, Work, etc.
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  isDefault: boolean;
}

// ==========================================
// Restaurant Types
// ==========================================

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  status: RestaurantStatus;
  statusReason?: string | null;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;

  contact: {
    phone?: string | null;
    email?: string | null;
    address?: string | null;
  };

  branding?: {
    logoUrl?: string | null;
    primaryColor?: string | null;
    secondaryColor?: string | null;
  };

  settings?: {
    razorpayKeyId?: string | null;
    razorpayKeySecret?: string | null;
    allowPayAtCounter?: boolean;
  };
  subscriptionStatus?: boolean;
  subscriptionType?: string | null;
  location?: {
    latitude?: number | null;
    longitude?: number | null;
    allowedRadius?: number | null;
  };
}

export interface RestaurantSubscription {
  plan: SubscriptionPlan;
  price: number | null; // null for custom/negotiated
  active: boolean;
  trialEndsAt?: IsoDateString;
  expiresAt?: IsoDateString;
  createdAt: IsoDateString;
}

export interface RestaurantUser {
  id: string;
  restaurantId: string;
  authUserId: string;
  role: 'ADMIN' | 'STAFF';
  name: string;
  email: string;
  phone?: string | null;
  active: boolean;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
}

// ==========================================
// Menu Types
// ==========================================

export interface MenuCategory {
  id: string;
  restaurantId: string;
  name: string;
  description?: string | null;
  image?: string | null;
  order: number;
  active: boolean;
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  categoryId: string;
  name: string;
  description?: string | null;
  price: number;
  discountPrice?: number | null;
  image?: string | null;
  available: boolean;
  isVeg: boolean;
  preparationTime?: number | null; // in minutes
  tags?: string[] | null;
  variants?: MenuItemVariant[] | null;
  addons?: MenuItemAddon[] | null;
}

export interface MenuItemVariant {
  id: string;
  name: string;
  price: number;
}

export interface MenuItemAddon {
  id: string;
  name: string;
  price: number;
}

// ==========================================
// Table & QR Types
// ==========================================

export interface Table {
  id: string;
  restaurantId: string;
  tableNumber: number;
  qrCodeUrl?: string | null;
  active: boolean;
  capacity?: number | null;
}

// ==========================================
// Cart Types (Client-side)
// ==========================================

export interface CartItem {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
  variant?: MenuItemVariant;
  addons?: MenuItemAddon[];
  specialInstructions?: string;
}

export interface Cart {
  id: string; // uid or sessionId
  items: CartItem[];
  tableNumber?: number;
  type: OrderType;
  updatedAt: IsoDateString;
}

// ==========================================
// Order Types
// ==========================================

export interface OrderItem {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
  variant?: MenuItemVariant;
  addons?: MenuItemAddon[];
  specialInstructions?: string;
  total: number;
}

export interface Order {
  id: string;
  restaurantId: string;
  orderNumber: string;
  type: OrderType;

  customerId?: string;
  customerName?: string;
  customerPhone?: string;

  tableNumber?: number;

  items: OrderItem[];
  subtotal: number;
  taxes: number;
  discount: number;
  total: number;

  status: OrderStatus;
  statusReason?: string | null;

  payment: {
    method: PaymentMethod;
    status: PaymentStatus;
    transactionId?: string;
  };

  createdAt: IsoDateString;
  updatedAt?: IsoDateString;
  confirmedAt?: IsoDateString;
  preparingAt?: IsoDateString;
  readyAt?: IsoDateString;
  servedAt?: IsoDateString;
  cancelledAt?: IsoDateString;
}

// ==========================================
// Analytics Types (Optional)
// ==========================================

export interface DailyAnalytics {
  date: string; // YYYY-MM-DD
  totalOrders: number;
  dineInOrders: number;
  takeawayOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  topItems: {
    itemId: string;
    name: string;
    quantity: number;
  }[];
}

// ==========================================
// SaaS Platform Types
// ==========================================

export interface SaasSettings {
  platformName: string;
  platformLogo?: string | null;
  supportEmail: string;
  supportPhone: string;
  defaultTrialDays: number;
  plans: {
    [key in SubscriptionPlan]?: {
      name?: string;
      price?: number | null;
      features?: Record<string, boolean>;
    };
  };
}

// ==========================================
// Supabase Database Type
// ==========================================

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          role: UserRole;
          avatar_url: string | null;
          created_at: IsoDateString;
          updated_at: IsoDateString;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          role?: UserRole;
          avatar_url?: string | null;
          created_at?: IsoDateString;
          updated_at?: IsoDateString;
        };
        Update: {
          email?: string;
          name?: string | null;
          role?: UserRole;
          avatar_url?: string | null;
          updated_at?: IsoDateString;
        };
        Relationships: [];
      };
      restaurants: {
        Row: {
          id: string;
          name: string;
          slug: string;
          status: RestaurantStatus;
          status_reason: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          contact_address: string | null;
          logo_url: string | null;
          primary_color: string | null;
          secondary_color: string | null;
          settings: Record<string, unknown> | null;
          subscription_status: boolean;
          subscription_type: string | null;
          latitude: number | null;
          longitude: number | null;
          allowed_radius: number | null;
          created_at: IsoDateString;
          updated_at: IsoDateString;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          status?: RestaurantStatus;
          status_reason?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          contact_address?: string | null;
          logo_url?: string | null;
          primary_color?: string | null;
          secondary_color?: string | null;
          settings?: Record<string, unknown> | null;
          subscription_status?: boolean;
          subscription_type?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          allowed_radius?: number | null;
          created_at?: IsoDateString;
          updated_at?: IsoDateString;
        };
        Update: {
          name?: string;
          slug?: string;
          status?: RestaurantStatus;
          status_reason?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          contact_address?: string | null;
          logo_url?: string | null;
          primary_color?: string | null;
          secondary_color?: string | null;
          settings?: Record<string, unknown> | null;
          subscription_status?: boolean;
          subscription_type?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          allowed_radius?: number | null;
          updated_at?: IsoDateString;
        };
        Relationships: [];
      };
      restaurant_users: {
        Row: {
          id: string;
          restaurant_id: string;
          auth_user_id: string;
          role: 'ADMIN' | 'STAFF';
          name: string;
          email: string;
          phone: string | null;
          active: boolean;
          created_at: IsoDateString;
          updated_at: IsoDateString;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          auth_user_id: string;
          role: 'ADMIN' | 'STAFF';
          name: string;
          email: string;
          phone?: string | null;
          active?: boolean;
          created_at?: IsoDateString;
          updated_at?: IsoDateString;
        };
        Update: {
          role?: 'ADMIN' | 'STAFF';
          name?: string;
          email?: string;
          phone?: string | null;
          active?: boolean;
          updated_at?: IsoDateString;
        };
        Relationships: [];
      };
      restaurant_tables: {
        Row: {
          id: string;
          restaurant_id: string;
          table_number: number;
          qr_code_url: string | null;
          active: boolean;
          capacity: number | null;
          created_at: IsoDateString;
          updated_at: IsoDateString;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          table_number: number;
          qr_code_url?: string | null;
          active?: boolean;
          capacity?: number | null;
          created_at?: IsoDateString;
          updated_at?: IsoDateString;
        };
        Update: {
          table_number?: number;
          qr_code_url?: string | null;
          active?: boolean;
          capacity?: number | null;
          updated_at?: IsoDateString;
        };
        Relationships: [];
      };
      menu_categories: {
        Row: {
          id: string;
          restaurant_id: string;
          name: string;
          description: string | null;
          image_url: string | null;
          sort_order: number;
          active: boolean;
          created_at: IsoDateString;
          updated_at: IsoDateString;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          name: string;
          description?: string | null;
          image_url?: string | null;
          sort_order?: number;
          active?: boolean;
          created_at?: IsoDateString;
          updated_at?: IsoDateString;
        };
        Update: {
          name?: string;
          description?: string | null;
          image_url?: string | null;
          sort_order?: number;
          active?: boolean;
          updated_at?: IsoDateString;
        };
        Relationships: [];
      };
      menu_items: {
        Row: {
          id: string;
          restaurant_id: string;
          category_id: string | null;
          name: string;
          description: string | null;
          price: number;
          discount_price: number | null;
          image_url: string | null;
          is_available: boolean;
          is_veg: boolean;
          preparation_time: number | null;
          tags: string[] | null;
          variants: Record<string, unknown>[] | null;
          addons: Record<string, unknown>[] | null;
          created_at: IsoDateString;
          updated_at: IsoDateString;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          category_id?: string | null;
          name: string;
          description?: string | null;
          price: number;
          discount_price?: number | null;
          image_url?: string | null;
          is_available?: boolean;
          is_veg?: boolean;
          preparation_time?: number | null;
          tags?: string[] | null;
          variants?: Record<string, unknown>[] | null;
          addons?: Record<string, unknown>[] | null;
          created_at?: IsoDateString;
          updated_at?: IsoDateString;
        };
        Update: {
          category_id?: string | null;
          name?: string;
          description?: string | null;
          price?: number;
          discount_price?: number | null;
          image_url?: string | null;
          is_available?: boolean;
          is_veg?: boolean;
          preparation_time?: number | null;
          tags?: string[] | null;
          variants?: Record<string, unknown>[] | null;
          addons?: Record<string, unknown>[] | null;
          updated_at?: IsoDateString;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          restaurant_id: string;
          customer_id: string | null;
          order_number: string;
          type: OrderType;
          table_number: number | null;
          customer_name: string | null;
          customer_phone: string | null;
          status: OrderStatus;
          status_reason: string | null;
          payment_method: PaymentMethod;
          payment_status: PaymentStatus;
          transaction_id: string | null;
          subtotal: number;
          taxes: number;
          discount: number;
          total: number;
          created_at: IsoDateString;
          updated_at: IsoDateString;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          customer_id?: string | null;
          order_number: string;
          type: OrderType;
          table_number?: number | null;
          customer_name?: string | null;
          customer_phone?: string | null;
          status?: OrderStatus;
          status_reason?: string | null;
          payment_method?: PaymentMethod;
          payment_status?: PaymentStatus;
          transaction_id?: string | null;
          subtotal: number;
          taxes: number;
          discount?: number;
          total: number;
          created_at?: IsoDateString;
          updated_at?: IsoDateString;
        };
        Update: {
          status?: OrderStatus;
          status_reason?: string | null;
          payment_method?: PaymentMethod;
          payment_status?: PaymentStatus;
          transaction_id?: string | null;
          updated_at?: IsoDateString;
        };
        Relationships: [];
      };
      platform_settings: {
        Row: {
          id: string;
          config: Record<string, unknown> | null;
          updated_at: IsoDateString;
        };
        Insert: {
          id: string;
          config?: Record<string, unknown> | null;
          updated_at?: IsoDateString;
        };
        Update: {
          config?: Record<string, unknown> | null;
          updated_at?: IsoDateString;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          menu_item_id: string | null;
          name: string;
          price: number;
          quantity: number;
          total: number;
          variant: Record<string, unknown> | null;
          addons: Record<string, unknown>[] | null;
          special_instructions: string | null;
          created_at: IsoDateString;
        };
        Insert: {
          id?: string;
          order_id: string;
          menu_item_id?: string | null;
          name: string;
          price: number;
          quantity: number;
          total: number;
          variant?: Record<string, unknown> | null;
          addons?: Record<string, unknown>[] | null;
          special_instructions?: string | null;
          created_at?: IsoDateString;
        };
        Update: {
          name?: string;
          price?: number;
          quantity?: number;
          total?: number;
          variant?: Record<string, unknown> | null;
          addons?: Record<string, unknown>[] | null;
          special_instructions?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [key: string]: never;
    };
    Functions: {
      [key: string]: never;
    };
    Enums: {
      [key: string]: never;
    };
  };
}
