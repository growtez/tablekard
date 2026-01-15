// ==========================================
// Restaurant SaaS - Shared Types
// ==========================================

import { Timestamp } from 'firebase/firestore';

// ==========================================
// Enums
// ==========================================

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  RESTAURANT_ADMIN = 'RESTAURANT_ADMIN',
  RESTAURANT_STAFF = 'RESTAURANT_STAFF',
  DELIVERY_PERSONNEL = 'DELIVERY_PERSONNEL',
  CUSTOMER = 'CUSTOMER',
}

export enum SubscriptionPlan {
  QR = 'QR',
  DELIVERY = 'DELIVERY',
  OWNED = 'OWNED',
}

export enum OrderType {
  DINE_IN = 'DINE_IN',
  DELIVERY = 'DELIVERY',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  READY = 'READY',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentMethod {
  ONLINE = 'ONLINE',
  COD = 'COD',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum RestaurantStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  TRIAL = 'TRIAL',
  EXPIRED = 'EXPIRED',
}

// ==========================================
// User Types
// ==========================================

export interface User {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  restaurantId?: string; // For restaurant staff
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

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
  subscription: any;
  id: string;
  name: string;
  slug: string; // For subdomain
  domain?: string; // Custom domain (paid feature)
  status: RestaurantStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;

  // Contact Info
  contact: {
    phone: string;
    email: string;
    address: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };

  // Operating Hours
  operatingHours?: {
    [day: string]: {
      open: string;
      close: string;
      isClosed: boolean;
    };
  };
}

export interface RestaurantSubscription {
  plan: SubscriptionPlan;
  price: number | null; // null for OWNED (contact team)
  active: boolean;
  trialEndsAt?: Timestamp;
  expiresAt: Timestamp;
  createdAt: Timestamp;
}

export interface RestaurantBranding {
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor?: string;
  font: string;
  showSaasBranding: boolean;
}

export interface RestaurantFeatures {
  qrOrder: boolean;
  delivery: boolean;
  customDomain: boolean;
  ownedApp: boolean;
}

export interface RestaurantUser {
  uid: string;
  role: 'ADMIN' | 'STAFF' | 'DELIVERY';
  name: string;
  email: string;
  phone?: string;
  active: boolean;
  createdAt: Timestamp;
}

// ==========================================
// Menu Types
// ==========================================

export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  image?: string;
  order: number;
  active: boolean;
}

export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  discountPrice?: number;
  image?: string;
  available: boolean;
  isVeg: boolean;
  preparationTime?: number; // in minutes
  tags?: string[];
  variants?: MenuItemVariant[];
  addons?: MenuItemAddon[];
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
  tableNumber: number;
  qrCodeUrl?: string;
  active: boolean;
  capacity?: number;
}

// ==========================================
// Cart Types
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
  tableNumber?: number; // For dine-in
  type: OrderType;
  updatedAt: Timestamp;
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
  orderNumber: string;
  type: OrderType;

  // Customer Info
  customerId?: string;
  customerName?: string;
  customerPhone?: string;

  // For Dine-In
  tableNumber?: number;

  // For Delivery
  address?: Address;
  assignedAgent?: string;
  deliveryInstructions?: string;

  // Order Details
  items: OrderItem[];
  subtotal: number;
  taxes: number;
  deliveryFee: number;
  discount: number;
  total: number;

  // Status
  status: OrderStatus;

  // Payment
  payment: {
    method: PaymentMethod;
    status: PaymentStatus;
    transactionId?: string;
  };

  // Timestamps
  createdAt: Timestamp;
  confirmedAt?: Timestamp;
  preparingAt?: Timestamp;
  readyAt?: Timestamp;
  deliveredAt?: Timestamp;
  cancelledAt?: Timestamp;
}

// ==========================================
// Delivery Types
// ==========================================

export interface DeliveryAgent {
  uid: string;
  name: string;
  phone: string;
  email?: string;
  active: boolean;
  available: boolean;
  currentLocation?: {
    lat: number;
    lng: number;
    updatedAt: Timestamp;
  };
  createdAt: Timestamp;
}

export interface DeliveryAssignment {
  orderId: string;
  agentId: string;
  status: 'ASSIGNED' | 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED';
  assignedAt: Timestamp;
  pickedUpAt?: Timestamp;
  deliveredAt?: Timestamp;
}

// ==========================================
// Analytics Types
// ==========================================

export interface DailyAnalytics {
  date: string; // YYYY-MM-DD
  totalOrders: number;
  dineInOrders: number;
  deliveryOrders: number;
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
  platformLogo: string;
  supportEmail: string;
  supportPhone: string;
  defaultTrialDays: number;
  plans: {
    [key in SubscriptionPlan]: {
      name: string;
      price: number | null;
      features: RestaurantFeatures;
    };
  };
}
