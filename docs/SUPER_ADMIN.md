# Super Admin Documentation

> Backend is now **Supabase** (Firebase sections are legacy).

## 👑 Overview

The **Super Admin** is the platform-level administration panel that allows the platform owner (you) to manage all restaurants, drivers, customers, and system-wide settings.

### Key Features
- Multi-restaurant management
- Driver verification & management
- Customer management
- Platform analytics
- Commission & payment settings
- System configuration

---

## 🏗️ Project Structure

```
apps/super-admin/
├── public/                     # Static assets
├── src/
│   ├── components/            # Reusable components
│   │   ├── Sidebar.jsx        # Left navigation
│   │   ├── Header.jsx         # Top header with search
│   │   ├── DataTable.jsx      # Reusable data table
│   │   └── StatsCard.jsx      # Dashboard stat card
│   ├── pages/
│   │   ├── Dashboard.jsx      # Platform overview
│   │   ├── Restaurants.jsx    # Restaurant management
│   │   ├── Drivers.jsx        # Driver management
│   │   ├── Customers.jsx      # Customer management
│   │   ├── Orders.jsx         # All platform orders
│   │   ├── Analytics.jsx      # Platform analytics
│   │   └── Settings.jsx       # Platform settings
│   ├── context/
│   │   └── AuthContext.js     # Admin authentication
│   ├── App.jsx                # Main app
│   └── index.css              # Global styles
├── package.json               # Dependencies
└── vite.config.js             # Vite config
```

---

## 🎯 Core Functionality

### Platform Dashboard

Overview of entire platform:

```jsx
const platformStats = {
  totalRestaurants: 125,
  activeRestaurants: 98,
  totalDrivers: 450,
  activeDrivers: 320,
  totalCustomers: 15000,
  todayOrders: 1250,
  todayRevenue: 485000,
  platformCommission: 48500,  // 10% of revenue
};
```

### Restaurant Management

**Restaurant Lifecycle**:
```
Application → Under Review → Approved → Active → (Suspended if needed)
```

**Actions**:
| Action | Description |
|--------|-------------|
| View Profile | See restaurant details |
| Approve | Approve pending application |
| Suspend | Temporarily disable restaurant |
| Delete | Remove from platform |
| View Analytics | Restaurant-specific stats |

```jsx
const restaurant = {
  id: 'rest-001',
  name: 'Pizza Palace',
  owner: 'John Doe',
  email: 'owner@pizzapalace.com',
  phone: '+919876543210',
  address: '123 Main Street, Mumbai',
  status: 'active',          // pending, approved, active, suspended
  rating: 4.5,
  totalOrders: 2500,
  totalRevenue: 750000,
  commissionRate: 10,        // Platform commission %
  joinedDate: '2024-01-15',
  documents: {
    license: 'license.pdf',
    fssai: 'fssai.pdf',
  },
};
```

### Driver Management

**Driver Verification Flow**:
```
Applied → Documents Submitted → Under Review → Verified → Active
```

**Driver Data Structure**:
```jsx
const driver = {
  id: 'driver-001',
  name: 'Rahul Kumar',
  phone: '+919876543210',
  email: 'rahul@email.com',
  vehicleType: 'Bike',
  vehicleNumber: 'MH 01 AB 1234',
  status: 'active',          // pending, verified, active, suspended
  rating: 4.8,
  totalDeliveries: 1250,
  totalEarnings: 125000,
  documents: {
    license: 'driving-license.pdf',
    rc: 'vehicle-rc.pdf',
    photo: 'profile.jpg',
  },
  verifiedAt: '2024-01-20',
};
```

### Commission Management

```jsx
// Platform commission settings
const commissionSettings = {
  defaultRate: 10,            // 10% default
  minimumOrderValue: 100,     // Min order for commission
  paymentCycle: 'weekly',     // When restaurants are paid
  paymentMethod: 'bank_transfer',
};

// Calculate commission
const calculateCommission = (orderTotal, restaurantRate) => {
  const rate = restaurantRate || commissionSettings.defaultRate;
  return (orderTotal * rate) / 100;
};
```

---

## 🔧 Key Pages

### Dashboard.jsx

Platform-wide metrics:

```jsx
const Dashboard = () => {
  return (
    <div className="dashboard">
      {/* Quick Stats */}
      <div className="stats-grid">
        <StatsCard title="Total Revenue" value="₹48,50,000" trend="+12%" />
        <StatsCard title="Active Restaurants" value="98" trend="+5" />
        <StatsCard title="Active Drivers" value="320" trend="+15" />
        <StatsCard title="Today Orders" value="1,250" trend="+8%" />
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <RevenueChart data={revenueData} />
        <OrdersChart data={ordersData} />
      </div>

      {/* Recent Activity */}
      <RecentApplications />
      <TopRestaurants />
    </div>
  );
};
```

### Restaurants.jsx

Restaurant list with filters and actions:

```jsx
const Restaurants = () => {
  const [filter, setFilter] = useState('all');  // all, pending, active, suspended
  const [restaurants, setRestaurants] = useState([]);

  const handleApprove = async (id) => {
    await updateDoc(doc(db, 'restaurants', id), {
      status: 'approved',
      approvedAt: new Date(),
    });
  };

  const handleSuspend = async (id, reason) => {
    await updateDoc(doc(db, 'restaurants', id), {
      status: 'suspended',
      suspendedReason: reason,
      suspendedAt: new Date(),
    });
  };

  return (
    <div className="restaurants-page">
      <FilterTabs active={filter} onChange={setFilter} />
      <DataTable
        data={restaurants}
        columns={['Name', 'Owner', 'Status', 'Rating', 'Orders', 'Actions']}
        actions={['view', 'approve', 'suspend']}
      />
    </div>
  );
};
```

### Drivers.jsx

Driver management with verification:

```jsx
const Drivers = () => {
  const [pendingVerifications, setPendingVerifications] = useState([]);

  const handleVerify = async (driverId) => {
    await updateDoc(doc(db, 'drivers', driverId), {
      status: 'verified',
      verifiedAt: new Date(),
      verifiedBy: currentAdmin.id,
    });
  };

  return (
    <div className="drivers-page">
      {/* Pending Verifications */}
      <section className="pending-section">
        <h2>Pending Verifications ({pendingVerifications.length})</h2>
        {pendingVerifications.map(driver => (
          <DriverVerificationCard
            key={driver.id}
            driver={driver}
            onVerify={handleVerify}
            onReject={handleReject}
          />
        ))}
      </section>

      {/* All Drivers */}
      <section className="all-drivers">
        <DataTable
          data={drivers}
          columns={['Name', 'Vehicle', 'Status', 'Rating', 'Deliveries', 'Actions']}
        />
      </section>
    </div>
  );
};
```

---

## 🔗 Firebase Structure

### Collections Overview

```
firestore/
├── restaurants/
│   ├── {restaurantId}/
│   │   ├── profile
│   │   ├── menu/
│   │   ├── orders/
│   │   └── staff/
├── drivers/
│   └── {driverId}/
│       ├── profile
│       ├── documents/
│       └── earnings/
├── customers/
│   └── {customerId}/
├── orders/
│   └── {orderId}/
├── platform/
│   ├── settings
│   ├── commissions
│   └── analytics
└── admins/
    └── {adminId}/
```

### Admin Authentication

```jsx
// Admin roles
const ROLES = {
  SUPER_ADMIN: 'super_admin',      // Full access
  ADMIN: 'admin',                   // Standard admin
  SUPPORT: 'support',               // Customer support only
  FINANCE: 'finance',               // Finance & payments only
};

// Check permissions
const canApproveRestaurants = (role) => {
  return ['super_admin', 'admin'].includes(role);
};
```

---

## 🚀 Running the App

```bash
cd apps/super-admin

# Install dependencies
npm install

# Start development server
npm run dev

# Opens at http://localhost:5174
```

---

## 📝 Common Modifications

### Add New Dashboard Metric

```jsx
<StatsCard
  title="Platform Commission"
  value={`₹${stats.platformCommission.toLocaleString()}`}
  trend="+15%"
  icon="dollar-sign"
/>
```

### Add Restaurant Filter

```jsx
const filters = ['all', 'pending', 'approved', 'active', 'suspended', 'NEW_FILTER'];

// Add filter logic
const filterRestaurants = (restaurants, filter) => {
  if (filter === 'all') return restaurants;
  if (filter === 'NEW_FILTER') {
    return restaurants.filter(r => r.someCondition);
  }
  return restaurants.filter(r => r.status === filter);
};
```

### Add New Admin Permission

```jsx
// In AuthContext.js
const permissions = {
  'super_admin': ['all'],
  'admin': ['restaurants', 'drivers', 'orders'],
  'support': ['orders', 'customers'],
  'finance': ['payments', 'analytics'],
  'new_role': ['specific_permissions'],  // Add new role
};

// Check permission
const hasPermission = (role, permission) => {
  const rolePermissions = permissions[role];
  return rolePermissions.includes('all') || rolePermissions.includes(permission);
};
```

---

## 🔐 Security Notes

### Admin Access Control

1. **Authentication**: Use Firebase Admin SDK or custom JWT
2. **Role-Based Access**: Check permissions on each action
3. **Audit Logging**: Log all admin actions
4. **IP Whitelisting**: Restrict access by IP (optional)

```jsx
// Audit logging
const logAdminAction = async (action, details) => {
  await addDoc(collection(db, 'admin_logs'), {
    adminId: currentAdmin.id,
    adminName: currentAdmin.name,
    action,
    details,
    timestamp: new Date(),
    ip: await getClientIP(),
  });
};

// Usage
await logAdminAction('restaurant_approved', { restaurantId: 'rest-001' });
```
