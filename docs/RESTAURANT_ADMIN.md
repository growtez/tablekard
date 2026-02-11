# Restaurant Admin Documentation

> Backend is now **Supabase** (Firebase sections are legacy).

## 🏪 Overview

The **Restaurant Admin** is a React web application that allows restaurant owners to manage their menu, orders, staff, and settings. Each restaurant subscribing to the platform gets their own admin panel.

### Key Features
- Dashboard with live stats
- Menu management (add/edit/delete items)
- Order management (accept, prepare, ready)
- Staff management
- Settings & configuration
- Analytics & reports

---

## 🏗️ Project Structure

```
apps/restaurant-admin/
├── public/                     # Static assets
├── src/
│   ├── components/            # Reusable components
│   │   ├── Sidebar.jsx        # Navigation sidebar
│   │   ├── Header.jsx         # Top header
│   │   ├── OrderCard.jsx      # Order display card
│   │   └── MenuItemCard.jsx   # Menu item card
│   ├── pages/
│   │   ├── Dashboard.jsx      # Main dashboard
│   │   ├── Orders.jsx         # Order management
│   │   ├── Menu.jsx           # Menu management
│   │   ├── Staff.jsx          # Staff management
│   │   ├── Settings.jsx       # Restaurant settings
│   │   └── Analytics.jsx      # Reports & analytics
│   ├── context/
│   │   └── ThemeContext.js    # Theme management
│   ├── App.jsx                # Main app with router
│   └── index.css              # Global styles
├── package.json               # Dependencies
└── vite.config.js             # Vite configuration
```

---

## 🎯 Core Functionality

### Dashboard

The main dashboard displays:
- Today's orders count
- Revenue
- Active orders in real-time
- Popular items
- Recent reviews

```jsx
// Dashboard stats structure
const dashboardStats = {
  todayOrders: 45,
  todayRevenue: 15680,
  activeOrders: 8,
  avgPrepTime: '15 mins',
  rating: 4.7,
};
```

### Order Management

**Order States Flow**:
```
new → accepted → preparing → ready → picked_up → delivered
```

**Order Actions**:
| Action | From State | To State |
|--------|------------|----------|
| Accept | new | accepted |
| Start Preparing | accepted | preparing |
| Mark Ready | preparing | ready |
| Picked Up | ready | picked_up |

```jsx
// Order component pattern
const OrderCard = ({ order, onUpdateStatus }) => {
  const getNextStatus = (currentStatus) => {
    const flow = ['new', 'accepted', 'preparing', 'ready'];
    const currentIndex = flow.indexOf(currentStatus);
    return flow[currentIndex + 1];
  };

  return (
    <div className="order-card">
      <h3>Order #{order.id}</h3>
      <span className={`status ${order.status}`}>{order.status}</span>
      <button onClick={() => onUpdateStatus(order.id, getNextStatus(order.status))}>
        Update Status
      </button>
    </div>
  );
};
```

### Menu Management

**CRUD Operations**:
- **Create**: Add new menu items
- **Read**: View all items by category
- **Update**: Edit item details, price, availability
- **Delete**: Remove items

```jsx
// Menu item structure
const menuItem = {
  id: 'item-001',
  name: 'Margherita Pizza',
  description: 'Classic pizza with tomato and mozzarella',
  price: 299,
  category: 'Main Course',
  image: 'pizza.jpg',
  isAvailable: true,
  isVegetarian: true,
  prepTime: '20 mins',
};
```

### Staff Management

Manage restaurant staff accounts:
- Add new staff members
- Assign roles (Manager, Chef, Waiter)
- Set permissions
- Track attendance

```jsx
const staffMember = {
  id: 'staff-001',
  name: 'John Doe',
  role: 'chef',
  email: 'john@restaurant.com',
  phone: '+919876543210',
  status: 'active',
};
```

---

## 🔧 Key Components

### Sidebar Navigation

```jsx
const menuItems = [
  { path: '/', icon: 'home', label: 'Dashboard' },
  { path: '/orders', icon: 'clipboard', label: 'Orders' },
  { path: '/menu', icon: 'book', label: 'Menu' },
  { path: '/staff', icon: 'users', label: 'Staff' },
  { path: '/analytics', icon: 'bar-chart', label: 'Analytics' },
  { path: '/settings', icon: 'settings', label: 'Settings' },
];
```

### Order Notifications

Real-time notifications for new orders:

```jsx
// Using Firebase Realtime updates
useEffect(() => {
  const unsubscribe = firestore()
    .collection('restaurants')
    .doc(restaurantId)
    .collection('orders')
    .where('status', '==', 'new')
    .onSnapshot(snapshot => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added') {
          // Play notification sound
          // Show toast notification
          playSound('new-order.mp3');
          showNotification('New Order!', change.doc.data());
        }
      });
    });

  return () => unsubscribe();
}, []);
```

---

## 🚀 Running the App

```bash
cd apps/restaurant-admin

# Install dependencies
npm install

# Start development server
npm run dev

# Opens at http://localhost:5173
```

---

## 🔗 Firebase Integration

### Firestore Collections

| Collection | Path | Description |
|------------|------|-------------|
| Restaurants | `/restaurants/{restaurantId}` | Restaurant profile |
| Menu | `/restaurants/{restaurantId}/menu` | Menu items |
| Orders | `/restaurants/{restaurantId}/orders` | Orders |
| Staff | `/restaurants/{restaurantId}/staff` | Staff members |

### Real-time Order Listener

```jsx
import { onSnapshot, collection, query, where, orderBy } from 'firebase/firestore';

useEffect(() => {
  const ordersQuery = query(
    collection(db, 'restaurants', restaurantId, 'orders'),
    where('status', 'in', ['new', 'accepted', 'preparing']),
    orderBy('createdAt', 'desc')
  );

  const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
    const orders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setActiveOrders(orders);
  });

  return () => unsubscribe();
}, [restaurantId]);
```

---

## 📝 Common Modifications

### Add New Dashboard Stat

```jsx
// In Dashboard.jsx
<div className="stat-card">
  <Icon name="trending-up" />
  <div className="stat-value">{stats.weeklyGrowth}%</div>
  <div className="stat-label">Weekly Growth</div>
</div>
```

### Add New Menu Category

1. Update category list:
```jsx
const categories = [
  'Starters',
  'Main Course',
  'Drinks',
  'Desserts',
  'NEW_CATEGORY',  // Add here
];
```

2. Filter items by category:
```jsx
const filteredItems = menuItems.filter(item => item.category === selectedCategory);
```

### Add Order Sound Notification

```jsx
const playOrderSound = () => {
  const audio = new Audio('/sounds/new-order.mp3');
  audio.play();
};

// On new order
useEffect(() => {
  if (newOrders.length > prevOrdersCount) {
    playOrderSound();
  }
}, [newOrders]);
```
