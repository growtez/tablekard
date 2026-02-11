# Customer App Documentation (Deprecated)

> The mobile customer app has been removed.  
> This repo now focuses on **QR-only Customer Web**.

## 📱 Overview

The **Customer App** is a React Native mobile application that allows end-users to browse menus, place food orders, track deliveries, and manage their profiles.

### Key Features
- Browse restaurant menus
- Add items to cart with customizations
- Place and track orders
- Manage delivery addresses
- Dark/Light theme support
- GPS location for delivery

---

## 🏗️ Project Structure

```
apps/customer-app/
├── android/                    # Android native code
├── ios/                        # iOS native code (if needed)
├── src/
│   ├── context/
│   │   ├── ThemeContext.js     # Theme state management
│   │   └── LocationContext.js  # Location/address management
│   ├── navigation/
│   │   └── AppNavigator.js     # Navigation configuration
│   ├── screens/
│   │   ├── HomeScreen.js       # Main home with offers & items
│   │   ├── MenuScreen.js       # Full menu with categories
│   │   ├── CartScreen.js       # Cart & orders tab view
│   │   ├── ProfileScreen.js    # User profile & settings
│   │   ├── OrdersScreen.js     # Order history
│   │   ├── AddressScreen.js    # Manage addresses
│   │   ├── ItemDetailScreen.js # Item details modal
│   │   ├── CheckoutScreen.js   # Checkout flow
│   │   ├── OrderTrackingScreen.js # Track active order
│   │   └── SettingsScreen.js   # App settings & theme
│   └── theme.js                # Color definitions
├── App.tsx                     # Root component
├── package.json                # Dependencies
└── metro.config.js             # Metro bundler config
```

---

## 🎨 Theming System

### How It Works

1. **ThemeContext.js** provides theme state to all components
2. Each screen imports `useTheme()` hook
3. Colors are applied dynamically via inline styles

### Theme Colors

```javascript
// Dark Theme (default)
{
  primary: '#d9b550',      // Gold accent
  background: '#212121',   // Main background
  card: '#2D2D2D',         // Card background
  text: '#FFFFFF',         // Primary text
  textMuted: '#888888',    // Secondary text
}

// Light Theme
{
  primary: '#d9b550',      // Same gold accent
  background: '#F5F5F5',   // Light background
  card: '#FFFFFF',         // White cards
  text: '#212121',         // Dark text
  textMuted: '#999999',    // Muted text
}
```

### Adding Theme to a New Screen

```javascript
import {useTheme} from '../context/ThemeContext';

const NewScreen = () => {
  const {theme, isDark} = useTheme();
  const colors = theme.colors;

  return (
    <View style={{backgroundColor: colors.background}}>
      <Text style={{color: colors.text}}>Hello</Text>
    </View>
  );
};
```

---

## 🧭 Navigation Structure

### Tab Navigation (Bottom Bar)

| Tab | Screen | Icon |
|-----|--------|------|
| Home | HomeScreen | home |
| Menu | MenuScreen | shopping-bag |
| Cart | CartScreen | shopping-cart |
| Profile | ProfileScreen | user |

### Stack Navigation

```
MainApp (Tabs)
├── Home
├── Menu
├── Cart
└── Profile
    └── Settings (push)

Additional Screens:
├── ItemDetail (push)
├── Orders (push)
├── Checkout (push)
├── Address (push)
└── OrderTracking (push)
```

### Adding a New Screen

1. Create screen file in `src/screens/`:
```javascript
// src/screens/NewScreen.js
import React from 'react';
import {View, Text} from 'react-native';
import {useTheme} from '../context/ThemeContext';

const NewScreen = ({navigation}) => {
  const {theme} = useTheme();
  return (
    <View style={{flex: 1, backgroundColor: theme.colors.background}}>
      <Text style={{color: theme.colors.text}}>New Screen</Text>
    </View>
  );
};

export default NewScreen;
```

2. Add to AppNavigator.js:
```javascript
import NewScreen from '../screens/NewScreen';

// Inside Stack.Navigator
<Stack.Screen name="NewScreen" component={NewScreen} />
```

3. Navigate from another screen:
```javascript
navigation.navigate('NewScreen');
```

---

## 📍 Location System

### LocationContext Features

| Function | Purpose |
|----------|---------|
| `getCurrentLocation()` | Get GPS coordinates |
| `savedAddresses` | Array of saved addresses |
| `selectedAddress` | Currently selected address |
| `addAddress()` | Add new address |
| `setDefaultAddress()` | Set default delivery address |

### Using Location in a Screen

```javascript
import {useLocation} from '../context/LocationContext';

const MyScreen = () => {
  const {selectedAddress, getCurrentLocation, isLoading} = useLocation();

  return (
    <View>
      <Text>Deliver to: {selectedAddress?.address}</Text>
      <Button title="Use GPS" onPress={getCurrentLocation} />
    </View>
  );
};
```

---

## 🔧 Key Screens Reference

### HomeScreen.js

**Purpose**: Main dashboard with featured offers and popular items

**Key Components**:
- Header with cart icon
- Location bar (tap to change address)
- Featured offers carousel
- Popular items grid
- Recent orders section
- Item detail modal

**State Variables**:
```javascript
const [searchTerm, setSearchTerm] = useState('');
const [favorites, setFavorites] = useState([]);
const [cart, setCart] = useState([]);
const [showModal, setShowModal] = useState(false);
const [selectedItem, setSelectedItem] = useState(null);
```

### MenuScreen.js

**Purpose**: Full menu with category filtering

**Key Components**:
- Search bar
- Category tabs (Starters, Main Course, Drinks, Desserts)
- Menu items list
- Item detail modal

**To Add a New Category**:
```javascript
const categories = ['Starters', 'Main Course', 'Drinks', 'Desserts', 'NEW_CATEGORY'];

const menuItems = {
  // ... existing categories
  'NEW_CATEGORY': [
    {id: 100, name: 'New Item', price: 200, ...},
  ],
};
```

### CartScreen.js

**Purpose**: View cart items and order history

**Key Components**:
- Tab navigation (Cart / Orders)
- Cart items with quantity controls
- Order summary (subtotal, tax, delivery)
- Place order button
- Order history list

### ProfileScreen.js

**Purpose**: User profile and settings access

**Key Components**:
- User info card
- Stats (orders, favorites, points)
- Theme toggle card
- Menu items list (Settings, Addresses, etc.)
- Logout button

---

## 📦 Dependencies

### Core Dependencies

| Package | Purpose |
|---------|---------|
| `react-native` | Mobile framework |
| `@react-navigation/native` | Navigation |
| `@react-navigation/native-stack` | Stack navigation |
| `@react-navigation/bottom-tabs` | Tab navigation |
| `react-native-screens` | Native screen optimization |
| `react-native-safe-area-context` | Safe area handling |
| `react-native-vector-icons` | Icons |
| `react-native-geolocation-service` | GPS location |

### Adding a Dependency

```bash
cd apps/customer-app
npm install <package-name>
# For native dependencies, rebuild:
npx react-native run-android
```

---

## 🚀 Running the App

### Development

```bash
cd apps/customer-app

# Install dependencies
npm install

# Start Metro bundler
npx react-native start

# In another terminal, run on Android
npx react-native run-android
```

### Debugging

```bash
# Open React Native debugger
# Shake device or press 'd' in Metro terminal

# View logs
npx react-native log-android
```

### Building Release APK

```bash
cd apps/customer-app/android

# Generate release APK
./gradlew assembleRelease

# APK location:
# android/app/build/outputs/apk/release/app-release.apk
```

---

## 🔗 Connecting to Backend

### Firebase Setup (Future)

1. Add `google-services.json` to `android/app/`
2. Install Firebase packages:
```bash
npm install @react-native-firebase/app @react-native-firebase/firestore
```

3. Import and use in screens:
```javascript
import firestore from '@react-native-firebase/firestore';

// Fetch menu items
const getMenu = async () => {
  const snapshot = await firestore()
    .collection('restaurants')
    .doc('restaurant-id')
    .collection('menu')
    .get();
  return snapshot.docs.map(doc => doc.data());
};
```

---

## 📝 Common Modifications

### Change Primary Color

1. Edit `src/theme.js`:
```javascript
export const darkColors = {
  primary: '#NEW_COLOR',  // Change this
  // ...
};
```

2. The color updates everywhere automatically via ThemeContext.

### Add New Menu Item

In `MenuScreen.js` or via Firebase:
```javascript
const menuItems = {
  'Starters': [
    // Add new item
    {
      id: 99,
      name: 'New Dish',
      description: 'Delicious new dish',
      fullDescription: 'Full description here',
      price: 299,
      time: '20min',
      rating: 4.5,
      servings: 2,
      image: 'https://example.com/image.jpg',
      isVegan: false,
    },
  ],
};
```

### Add New Bottom Tab

1. Create screen in `src/screens/`
2. In `AppNavigator.js`:
```javascript
import NewTabScreen from '../screens/NewTabScreen';

// Inside Tab.Navigator
<Tab.Screen name="NewTab" component={NewTabScreen} />

// Update tabBarIcon in screenOptions
if (route.name === 'NewTab') iconName = 'icon-name';
```

---

## ⚠️ Troubleshooting

### Metro bundler port conflict
```bash
# Kill existing Metro
taskkill /F /IM node.exe

# Start fresh
npx react-native start --reset-cache
```

### Icons not showing
```bash
# Rebuild the app after adding vector icons
npx react-native run-android
```

### Build fails
```bash
cd android
./gradlew clean
cd ..
npx react-native run-android
```
