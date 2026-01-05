# 🍽️ Restaurant SaaS Platform - Flowcharts

## 1. Overall System Architecture

```mermaid
flowchart TB
    subgraph Platform["🌐 Restaurant SaaS Platform"]
        SA["🔧 Super Admin"]
    end
    
    subgraph Restaurant["🏪 Restaurant Level"]
        RA["📊 Restaurant Admin"]
        STAFF["👨‍🍳 Staff"]
    end
    
    subgraph CustomerChannels["👥 Customer Channels"]
        CAPP["📱 Customer App"]
        CWEB["🌐 Customer Web"]
    end
    
    subgraph Delivery["🚗 Delivery"]
        DAPP["📱 Delivery App"]
        DRIVER["🛵 Driver"]
    end
    
    subgraph Backend["☁️ Firebase Backend"]
        AUTH["🔐 Auth"]
        FS["💾 Firestore"]
        STORAGE["📁 Storage"]
    end
    
    SA -->|Manages| Restaurant
    RA -->|Manages| STAFF
    RA -->|Creates Menu| FS
    
    CAPP -->|Places Orders| FS
    CWEB -->|Places Orders| FS
    
    FS -->|New Orders| RA
    RA -->|Assigns| DAPP
    DAPP --> DRIVER
    DRIVER -->|Delivers to| CAPP
    
    AUTH --> CAPP
    AUTH --> CWEB
    AUTH --> DAPP
    AUTH --> RA
    AUTH --> SA
```

---

## 2. 📱 Customer App Flowchart

```mermaid
flowchart TD
    START((Start)) --> SPLASH[Splash Screen]
    SPLASH --> AUTH{Authenticated?}
    AUTH -->|No| LOGIN[Login/Register Screen]
    LOGIN --> GOOGLE[Google Sign-In]
    LOGIN --> EMAIL[Email]
    GOOGLE --> choose
    EMAIL --> choose
    AUTH -->|Yes| choose["🏠 Choose Restaurant"]
    choose--> HOME[Home]
    HOME --> SEARCH[Search Items]
    HOME --> PROFILE[Profile]
    HOME --> ORDERS[Order History]
    HOME --> MENU["📋 View Menu"]
    MENU --> CATEGORIES[Browse Categories]
    CATEGORIES --> ITEMS[View Items]
    ITEMS --> CUSTOMIZE[Customize Item]
    CUSTOMIZE --> ADD_CART[Add to Cart]
    ADD_CART --> CART{View Cart?}
    CART -->|No| MENU
    CART -->|Yes| CART_SCREEN["🛒 Cart Screen"]
    CART_SCREEN --> ADDRESS[Select/Add Address]
    ADDRESS --> PAYMENT[Select Payment Method]
    PAYMENT -->|Online| PLACE_ORDER[Place Order]
    PAYMENT -->|COD| PLACE_ORDER
    PLACE_ORDER --> ORDER_CONFIRM["✅ Order Confirmed"]
    ORDER_CONFIRM --> TRACK["📍 Track Order"]
    TRACK --> STATUS{Order Status}
    STATUS -->|Preparing| TRACK
    STATUS -->|Out for Delivery| TRACK
    STATUS -->|Delivered| RATE["⭐ Rate & Review"]
    RATE --> HOME
    PROFILE --> EDIT_PROFILE[Edit Profile]
    PROFILE --> ADDRESSES[Manage Addresses]
    PROFILE --> THEME["🌙 Toggle Theme"]
    PROFILE --> LOGOUT[Logout]
    LOGOUT --> LOGIN
```

---

## 3. 🌐 Customer Web Flowchart

```mermaid
flowchart TB
    START(("Visit Website")) --> LANDING["🏠 Landing Page"]
    LANDING --> AUTH{"No Account"}
    AUTH -->|No| GUEST["Continue as Guest"]
    LOGIN["Login/Register"] --> GOOGLE["Google Sign-In"]
    LOGIN --> EMAIL["Email Sign-In - OTP Less"]
    GOOGLE --> BROWSE["Browse Restaurants"]
    EMAIL --> BROWSE
    GUEST --> BROWSE
    BROWSE --> SELECT["Select Items"]
    SELECT --> MENU["📋 Menu Page"]
    MENU --> FILTER["Filter by Category"]
    MENU --> SEARCH["Search Items"]
    FILTER --> ITEMS["View Items"]
    SEARCH --> ITEMS
    ITEMS --> DETAILS["Item Details Modal"]
    DETAILS --> CUSTOMIZE["Add Customizations"]
    CUSTOMIZE --> ADD["Add to Cart"]
    ADD --> CHECK_AUTH["Authenticated?"]
    CHECK_AUTH -->|YES| CONTINUE{"Continue Shopping?"}
    CONTINUE -->|Yes| MENU
    CHECK_AUTH -->|No| FORCE_LOGIN["Must Login"]
    FORCE_LOGIN --> LOGIN
    CHECK_AUTH -->|Yes| CHECKOUT["Checkout Page"]
    CHECKOUT --> PAYMENT["Payment Method"]
    PAYMENT -->|"LATER CASHIER"| CONFIRM["Confirm Order"]
    PAYMENT -->|"ONLINE UPI NOW"| CONFIRM
    CONFIRM --> SUCCESS["✅ Order Placed"]
    SUCCESS --> TRACKING["Order Tracking Page"]
    TRACKING --> REALTIME["Real-time Status Updates"]
    REALTIME --> DELIVERED["📦 Delivered"]
    DELIVERED --> REVIEW["Leave Review"]
    REVIEW --> HOME["Return to Home"]
```

---

## 4. 🚗 Delivery App Flowchart

```mermaid
flowchart TD
    START((Start)) --> SPLASH[Splash Screen]
    SPLASH --> AUTH{Authenticated?}
    AUTH -->|No| LOGIN["restaurant_id, driver_id, password"]
    LOGIN --> VERIFY[Verify Credentials]
    VERIFY --> HOME
    AUTH -->|Yes| HOME["🏠 Dashboard"]
    HOME --> TOGGLE{Online Status}
    TOGGLE -->|Go Online| ONLINE["📡 Online - Waiting"]
    TOGGLE -->|Go Offline| OFFLINE["💤 Offline"]
    ONLINE --> NEW_ORDER{New Order?}
    NEW_ORDER -->|Yes| NOTIFICATION["🔔 Order Notification"]
    NEW_ORDER -->|No| ONLINE
    NOTIFICATION --> ACCEPT{Accept Order?}
    ACCEPT -->|Yes| COLLECT[Collect Order]
    ACCEPT -->|"No, reason_message"| ONLINE
    COLLECT --> CONFIRM_PICKUP[Confirm Pickup]
    CONFIRM_PICKUP --> NAVIGATE["🗺️ Navigate to Customer"]
    NAVIGATE --> ARRIVE[Arrive at Location]
    ARRIVE --> DELIVER[Hand Over Order]
    DELIVER --> CONFIRM_DELIVERY["✅ Mark Delivered"]
    CONFIRM_DELIVERY --> ONLINE
    HOME --> HISTORY["📜 Order History"]
    HOME --> EARNINGS_PAGE["Stats Dashboard"]
    HOME --> PROFILE["👤 Profile"]
    EARNINGS_PAGE --> DAILY[Daily Stats]
    EARNINGS_PAGE --> WEEKLY[Weekly Chart]
    EARNINGS_PAGE --> MONTHLY[Monthly Summary]
    PROFILE --> VEHICLE[Vehicle Info]
    PROFILE --> LOGOUT[Logout]
    LOGOUT --> LOGIN
```

---

## 5. 📊 Restaurant Admin Flowchart

```mermaid
flowchart TD
    START((Start)) --> LOGIN["🔐 Admin Login"]
    LOGIN --> AUTH{Valid Credentials?}
    AUTH -->|No| LOGIN
    AUTH -->|Yes| DASH["📊 Dashboard"]
    DASH --> ORDERS["📦 Orders Management"]
    DASH --> MENU["📋 Menu Management"]
    DASH --> STAFF["👥 Staff Management"]
    DASH --> ANALYTICS["📈 Analytics"]
    DASH --> SETTINGS["⚙️ Settings"]
    
    subgraph OrderFlow["Order Management"]
        ORDERS --> NEW[New Orders]
        ORDERS --> PREPARING[Preparing]
        ORDERS --> READY[Ready for Pickup]
        ORDERS --> COMPLETED[Completed]
        NEW --> ACCEPT_ORDER[Accept Order]
        ACCEPT_ORDER --> ASSIGN[Assign to Kitchen]
        ASSIGN --> PREPARING
        PREPARING --> MARK_READY[Mark Ready]
        MARK_READY --> READY
        READY -->|Online| ASSIGN_DRIVER[Assign Driver]
        READY -->|Offline| COMPLETED
        ASSIGN_DRIVER --> COMPLETED
    end
    
    subgraph MenuFlow["Menu Management"]
        MENU --> CATEGORIES[Manage Categories]
        CATEGORIES --> ITEMS[Manage Items]
        CATEGORIES --> ADD_CAT[Add Category]
        CATEGORIES --> EDIT_CAT[Edit Category]
        CATEGORIES --> DEL_CAT[Delete Category]
        ITEMS --> ADD_ITEM[Add Item]
        ITEMS --> EDIT_ITEM[Edit Item]
        ITEMS --> TOGGLE_AVAIL[Toggle Availability]
        ITEMS --> DEL_ITEM[Delete Item]
    end
    
    subgraph StaffFlow["Staff Management"]
        STAFF --> VIEW_STAFF[View Staff]
        STAFF --> ADD_STAFF[Add Staff Member]
        ADD_STAFF --> Delivery[Delivery Staff]
        ADD_STAFF --> NonDelivery[Non-Delivery Staff]
        STAFF --> EDIT_STAFF[Edit Permissions]
        STAFF --> REMOVE_STAFF[Remove Staff]
    end
    
    ANALYTICS --> REVENUE[Revenue Reports]
    ANALYTICS --> POPULAR[Popular Items]
    ANALYTICS --> ONLINE_OFFLINE[Online/Offline Reports]
    SETTINGS --> RESTAURANT_INFO[Restaurant Info]
    SETTINGS --> HOURS[Operating Hours]
    SETTINGS --> DELIVERY_ZONES[Delivery Zones]
    SETTINGS --> BRANDING[Branding/Theme]
```

---

## 6. 🔧 Super Admin Flowchart

```mermaid
flowchart TD
    START((Start)) --> LOGIN["🔐 Super Admin Login"]
    LOGIN --> AUTH{Valid Admin?}
    AUTH -->|No| ERROR[Access Denied]
    ERROR --> LOGIN
    AUTH -->|Yes| DASH["📊 Platform Dashboard"]
    DASH --> RESTAURANTS["🏪 Restaurants"]
    DASH --> CUSTOMERS["👥 Customers"]
    DASH --> ANALYTICS["📈 Platform Analytics"]
    DASH --> SUBSCRIPTION["Subscription Management"]
    
    subgraph RestaurantMgmt["Restaurant Management"]
        RESTAURANTS --> VIEW_REST[View All Restaurants]
        RESTAURANTS --> ADD_REST[Onboard New Restaurant]
        RESTAURANTS --> EDIT_REST[Edit Restaurant]
        RESTAURANTS --> SUSPEND[Suspend Restaurant]
        ADD_REST -->|Manual| REST_DETAILS[Enter Details]
        REST_DETAILS --> ASSIGN_PLAN[Assign Subscription Plan]
        ASSIGN_PLAN --> CREATE_ADMIN[Create Admin Account]
        CREATE_ADMIN --> ACTIVATE[Activate Restaurant]
        ADD_REST -->|Automatic| AUTO_DETAILS[Enter Details]
        AUTO_DETAILS --> AUTO_PLAN[Choose Subscription Plan]
        AUTO_PLAN --> AUTO_ADMIN[Create Admin Account]
        AUTO_ADMIN --> AUTO_ACTIVATE[Activate Restaurant]
    end
    
    subgraph CustomerMgmt["Customer Management"]
        CUSTOMERS --> VIEW_CUST[View All Customers]
        CUSTOMERS --> SEARCH_CUST[Search Customer]
        CUSTOMERS --> CUST_ORDERS[View Customer Orders]
        CUSTOMERS --> SUSPEND_CUST[Suspend Customer]
    end
    
    SUBSCRIPTION --> VIEW_SUB[View Restaurant Subscription]
    SUBSCRIPTION --> EDIT_SUB[Edit Subscription Plan]
    
    ANALYTICS --> TOTAL_ORDERS[Total Orders]
    ANALYTICS --> REVENUE[Platform Revenue]
    ANALYTICS --> GROWTH[Growth Metrics]
    ANALYTICS --> TOP_REST[Top Restaurants]
```

---

## 7. 🔄 Complete Order Flow (End-to-End)

```mermaid
sequenceDiagram
    participant C as 👤 Customer
    participant APP as 📱 App/Web
    participant FB as ☁️ Firebase
    participant RA as 📊 Restaurant Admin
    participant DA as 🚗 Delivery App
    participant D as 🛵 Driver

    C->>APP: Browse Menu
    C->>APP: Add Items to Cart
    C->>APP: Place Order (Online/COD)
    APP->>FB: Create Order Document
    
    FB-->>RA: Real-time Order Notification
    RA->>FB: Accept Order (Status: PREPARING)
    
    FB-->>APP: Order Accepted
    APP-->>C: Show "Preparing" Status
    
    RA->>FB: Order Ready (Status: READY)
    
    alt Online Order
        RA->>FB: Assign Delivery Driver
        FB-->>DA: New Delivery Assignment
        DA-->>D: Show Order Details
        D->>DA: Accept Delivery
        DA->>FB: Update (Status: PICKED_UP)
        FB-->>APP: Show "Out for Delivery"
        D->>DA: Confirm Delivery
        DA->>FB: Update (Status: DELIVERED)
    else Offline Order
        RA->>FB: Mark as Complete
    end
    
    FB-->>APP: Order Complete
    APP-->>C: Request Review
    C->>APP: Submit Rating
    APP->>FB: Store Review
```
