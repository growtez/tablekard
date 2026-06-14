# Tablekard: A Smart QR-Based Multi-Tenant Restaurant Management SaaS Platform

### Initial Project Report

**Submitted By:** [Your Name / Team Members]  
**Programme:** [B.Tech / MCA / BCA — mention your programme]  
**Institution:** [Your College / University Name]  
**Guide:** [Project Guide Name & Designation]  
**Date:** April 2026

---

# CHAPTER 1 - INTRODUCTION

## 1.1 Introduction
Tablekard is a comprehensive, multi-tenant Software-as-a-Service (SaaS) platform that enables seamless, contactless QR-based ordering and restaurant management without reliance on traditional, expensive Point-of-Sale (POS) hardware. It is built on a serverless-oriented cloud architecture, where a single centralized backend securely serves multiple independent restaurant tenants, forming a highly scalable and cost-effective digital ecosystem.
Unlike conventional on-premise restaurant systems that require complex local installations, Tablekard employs a frictionless web-based approach. Customers scan table-specific QR codes to access dynamic menus and place orders directly from their smartphones, eliminating the need to download dedicated applications or wait for waitstaff.
To prevent operational bottlenecks and order mismanagement, the system integrates real-time database subscriptions and role-based access control. These mechanisms ensure that orders placed by customers are instantly reflected on the kitchen and admin dashboards, maximizing operational efficiency during peak dining hours.
The application is developed using React 19 and Vite for high-performance frontend interfaces. A hybrid cloud architecture utilizes Supabase (PostgreSQL) for robust data storage and real-time synchronization, while Razorpay is integrated for secure, instant payment processing.
The core contributions of this project include:
- **Infrastructure-Less Customer Experience** – enabling customers to order and pay seamlessly via web browsers using simple QR code scans.
- **Multi-Tenant SaaS Architecture** – eliminating heavy upfront costs for restaurants by providing a scalable, subscription-based cloud platform.
- **Intelligent Upselling via Machine Learning** – using collaborative filtering to suggest personalized food items to customers.
- **Immersive Dish Visualization** – integrating WebXR and Augmented Reality (AR) to allow customers to view 3D models of menu items before ordering.

## 1.2 Motivation
The real strength of modern restaurant management comes when intuitive customer-facing applications are combined with a powerful, multi-tenant cloud backend. Together, they form a unified system that handles everything from the moment a customer sits down to the final revenue analytics. In this design, the frontend applications handle the user experience and ordering logic, while the Supabase backend ensures strict data isolation, real-time updates, and secure transactions. However, building this ecosystem is not simple—if done poorly, multi-tenant data leakage can occur, or the system might fail under the heavy concurrent load of peak dining hours.
The need for such an affordable, integrated digital solution arises in many real-world scenarios:
- **High Technology Cost Barrier for SMEs** – Custom app development or enterprise-grade restaurant management systems are too expensive and complex for individual restaurants or small chains. Tablekard offers a low-cost, ready-to-use alternative.
- **Operational Chaos During Peak Hours** – In busy restaurants, traditional order taking is slow and error-prone. A direct-to-kitchen QR ordering system drastically reduces wait times and order mismatches.
- **Lack of Data-Driven Decision Making** – Restaurants generate massive amounts of daily order data but lack the analytical tools to derive insights. Predictive analytics can forecast revenue and optimize inventory.
- **Static and Unengaging Dining Experiences** – Physical menus are difficult to update and cannot dynamically recommend items or show realistic visualizations. Digital AR menus solve this by offering an immersive, easily updatable interface.

## 1.3 Objective
The primary objective of this project is to design, implement, and validate a highly scalable, multi-tenant restaurant management SaaS platform that ensures frictionless contactless ordering, real-time operational synchronization, and data-driven business intelligence.
Specific objectives include:
- **Multi-Role Architecture Design:** To develop three distinct, interconnected web applications (Customer Web App, Restaurant Admin Panel, and Super Admin Panel) that cater to the specific needs of diners, restaurant owners, and platform operators.
- **Frictionless QR-Based Ordering:** To implement a session-based web ordering flow that requires zero app downloads, allowing customers to scan, browse, and order instantly.
- **Real-Time Data Synchronization:** To design a real-time order processing pipeline using Supabase subscriptions, ensuring that customer orders instantly appear on the Restaurant Admin dashboard with zero manual refresh required.
- **Augmented Reality (AR) Integration:** To enable an immersive dining experience where customers can view realistic 3D models of menu items projected onto their physical table before placing an order.
- **Machine Learning Recommendations:** To implement a hybrid collaborative and content-based filtering model that analyzes order history to provide personalized "Frequently Ordered Together" suggestions.
- **Predictive Analytics:** To integrate time-series forecasting models (such as Facebook Prophet or XGBoost) to provide restaurant owners with actionable revenue predictions and inventory alerts.
- **Secure Payment Integration:** To ensure secure financial transactions through the integration of the Razorpay Payment Gateway, supporting real-time UPI and card payments directly from the customer web app.
- **Multi-Tenant Data Privacy:** To ensure strong data security, guaranteeing that the orders, menus, and customer details of one restaurant are completely hidden and secure from all other restaurants using the platform.

---

## 2. Problem Statement

Despite technological advancements, many restaurants continue to struggle with operational inefficiencies and disconnected systems. The primary challenges include:

1. **Inefficient Order Management:** Traditional pen-and-paper or manual POS entry systems are prone to human error, resulting in order mismatches, delayed service, and dissatisfied customers.
2. **Static Dining Experience:** Physical menus are unengaging, difficult to update, and cannot dynamically recommend items or show realistic visualizations of dishes.
3. **High Technology Costs:** Custom app development or enterprise-grade restaurant management systems are too expensive and complex for individual restaurants or small chains.
4. **Lack of Centralized Control for Aggregators:** Platform operators lack efficient multi-tenant tools to seamlessly onboard restaurants, track overall platform health, and automatically calculate commissions.
5. **Absence of Data Utilization:** Restaurants generate massive amounts of daily order data but lack the analytical tools to derive actionable insights regarding peak hours, trending items, or future revenue projections.

Tablekard solves these issues by providing an affordable, multi-tenant SaaS solution that centralizes order management, enhances the customer experience via contactless ordering, and leverages data for predictive insights.

---

## 3. Literature Review

**[1] Kimes, S. E. (2008).** *"The Role of Technology in Restaurant Revenue Management."* Cornell Hospitality Quarterly, 49(3), 297–309.  
This paper explores how technology adoption in restaurants improves table turnover rates and revenue. It highlights the importance of digital ordering systems in reducing service time, which directly supports the core value proposition of Tablekard's QR-based contactless ordering flow.

**[2] Susanto, H., & Chen, C. K. (2017).** *"Cloud computing adoption in SMEs: A systematic literature review."* Journal of Enterprise Information Management.  
This study investigates the barriers and drivers for SMEs adopting cloud technologies. It validates Tablekard's multi-tenant SaaS model, demonstrating that providing software as a scalable service lowers the barrier to entry for small restaurants compared to custom on-premise solutions.

**[3] Zhang, S., Yao, L., Sun, A., & Tay, Y. (2019).** *"Deep Learning Based Recommender System: A Survey and New Perspectives."* ACM Computing Surveys, 52(1), 1–38.  
This comprehensive survey covers collaborative and content-based filtering techniques. It provides the theoretical foundation for Tablekard's integrated ML recommendation engine, which suggests food items based on order history and item popularity.

**[4] Hincapié, M., Caponio, A., Rios, H., & Mendívil, E. G. (2011).** *"An introduction to Augmented Reality with applications in aeronautical maintenance."* 13th International Conference on Transparent Optical Networks (ICTON). IEEE.  
While originally focused on maintenance, the principles of AR object overlay detailed in this paper inform Tablekard's implementation of 3D dish visualizations using WebXR, allowing customers to preview meals in their physical space.

**[5] Bandara, U., Ihalage, A., & Vidanagama, D. (2018).** *"A Machine Learning Approach to Predict Restaurant Revenue."* 2018 3rd International Conference on Information Technology Research (ICITR). IEEE.  
This research presents models for forecasting restaurant revenue based on historical operational data. It serves as the basis for Tablekard's predictive analytics module within the Restaurant Admin panel, utilizing time-series forecasting for data-driven management.

---

## 4. Proposed Methodology

### 4.1 System Architecture

Tablekard utilizes a modern, serverless-oriented cloud architecture designed for multi-tenancy. 

- **Frontend:** Built with React 19 and Vite. It consists of three separate Single Page Applications (SPAs): the Customer Web App, Restaurant Admin Panel, and Super Admin Panel.
- **Backend & Database:** Powered by **Supabase**. It utilizes PostgreSQL for robust relational data storage. Row Level Security (RLS) is heavily implemented to ensure strict multi-tenant data isolation (ensuring Restaurant A cannot access Restaurant B's data).
- **Real-time Synchronization:** Supabase's Realtime capabilities are used to push live order updates instantly from the Customer Web App to the Restaurant Admin dashboard.

### 4.2 Core SaaS Workflow

1. **Onboarding:** The Super Admin provisions a new restaurant account, setting up their profile, commission rate, and admin credentials.
2. **Menu & Table Setup:** The Restaurant Admin logs in to add categories, menu items, prices, and generates unique QR codes for each physical table in their establishment.
3. **Customer Interaction & Payment:** A customer sits at a table and scans the QR code. They are directed to a session-specific web instance (`/r/:restaurantSlug/table/:tableNumber`) where they browse the menu, place an order, and complete the transaction securely via the **Razorpay Payment Gateway** integration.
4. **Order Processing:** The order appears instantly on the Restaurant Admin's live dashboard. Staff update the status sequentially (`New` → `Accepted` → `Preparing` → `Ready`).
5. **Platform Management:** The Super Admin monitors platform-wide activity, tracking total orders, active restaurants, and generating commission reports based on transaction volumes.

### 4.3 Advanced Features Integration

While the core SaaS workflow handles daily operations, the platform is augmented with advanced technologies:
- **AR Menu Viewer:** Leverages Google's `<model-viewer>` to render 3D `.glb` models of food items, allowing customers to see the size and look of a dish in AR before ordering.
- **Smart Recommendations:** A Python-based ML microservice uses collaborative filtering to analyze historical order data and suggest "Frequently Ordered Together" or personalized items to the user during checkout.
- **Predictive Analytics:** The admin dashboard features forecasting charts powered by time-series ML models (e.g., Prophet or XGBoost) that analyze past sales to predict upcoming busy periods and inventory demands.

---

## 5. Software and Hardware Requirements

### 5.1 Software Requirements

The Tablekard platform relies on a modern, robust, and highly integrated software ecosystem spanning frontend interfaces, serverless backend engines, secure payment processing APIs, interactive augmented reality interfaces, and predictive analytics tools.

| Category | Tool / Library | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend Core** | React | 19 | Core SPA framework for Customer Web, Restaurant Admin, and Super Admin panels |
| **Build Tool** | Vite | ≥ 5.x | High-performance dev server, bundling, and hot module replacement (HMR) |
| **Development Language** | TypeScript | ≥ 5.3 | Compile-time static type safety across client applications and shared packages |
| **SPA Routing** | React Router DOM | v7 | Declarative frontend routing, query parameter handling, and page transition flow |
| **State & Data Caching** | TanStack React Query | v5 | Managing server state, optimistic UI updates, and real-time dashboard polling |
| **Database Engine** | PostgreSQL (Supabase) | — | Relational data persistence with custom multi-tenant schemas and indexes |
| **Database Security** | PostgreSQL RLS | — | Row-Level Security policies to enforce strict data isolation between restaurant tenants |
| **Backend Runtime** | Deno (Supabase Functions)| — | Serverless TypeScript environment for webhook handlers and payment verifications |
| **Realtime Gateway** | Supabase Realtime | — | WebSockets-based listener for instant order status pushes to kitchen/admin |
| **Cloud Storage** | Supabase Storage | — | Hosting user-uploaded food item images, 3D AR assets, and store logos |
| **Payment Gateway** | Razorpay SDK & API | — | Secure checkout integration (UPI, cards, netbanking) and Deno HMAC verification |
| **QR Code Generation** | `qrcode.react` | ≥ 4.2 | Dynamic QR generation for table-specific ordering routes inside Admin panel |
| **In-App QR Scanning** | `@yudiel/react-qr-scanner`| ≥ 2.5 | Camera-based customer sign-in/table scanning from web browser |
| **Interactive 3D / AR** | `@google/model-viewer` | ≥ 3.x / 4.x | High-fidelity WebGL 3D rendering and immersive AR scene projections |
| **Data Visualization** | Recharts | v3.8 | Interactive analytics, charts, and metrics breakdown for the reports dashboard |
| **Document Generation** | jsPDF | v4 | Dynamic generation of PDF invoices for receipts and admin analytical reports |
| **Image Manipulation** | `react-easy-crop` | v5 | Client-side image cropping and resizing for uploading menu graphics |
| **ML Engine (Proposed)** | Python / Facebook Prophet | ≥ 3.10 | Time-series forecasting for revenue and collaborative recommendation pipeline |

### 5.2 Hardware Requirements

The hardware specifications ensure efficient local development, smooth multi-tenant database operations, responsive administrative interfaces, and fluid real-time interactions for users.

| Component | Minimum Specifications | Recommended Specifications |
| :--- | :--- | :--- |
| **Development Machine** | Intel Core i5 (8th Gen) / AMD Ryzen 5<br>8 GB RAM<br>20 GB available SSD space<br>Windows 10 / macOS Monterey / Ubuntu 20.04 | Intel Core i7 / Apple Silicon (M1/M2/M3)<br>16 GB RAM<br>50 GB SSD space<br>NVIDIA CUDA-compatible GPU (for local ML prototyping) |
| **Customer Device** | Smartphone/tablet (Android or iOS)<br>Rear-facing camera (5 MP)<br>Chrome 79+ / Safari 14+ / Edge 79+<br>3G/4G Mobile Data or stable Wi-Fi (5 Mbps) | Modern smartphone (released 2020 or later)<br>High-res autofocus camera (12 MP)<br>Chrome/Safari latest version<br>5G or high-speed Wi-Fi (15+ Mbps)<br>ARCore/ARKit hardware compatibility |
| **Restaurant Admin Devices**| Desktop PC, laptop, or tablet (iPad/Galaxy Tab)<br>1280×720 screen resolution<br>Chrome 90+ / Edge / Safari<br>Stable broadband connection (10 Mbps) | Desktop PC or dedicated POS station<br>1920×1080 Full HD display (optimal dashboard view)<br>Chrome latest version (configured for auto-print)<br>High-speed fiber broadband (50+ Mbps with backup link) |
| **ML Server (Proposed)** | 2 vCPUs<br>2 GB RAM<br>5 GB persistent SSD storage (e.g., Render Starter / Railway Starter) | 4 vCPUs<br>4 GB RAM / Dedicated GPU instance<br>15 GB SSD storage (e.g., AWS EC2 t3.medium or Railway Pro) |

### 5.3 Augmented Reality (AR) System Requirements

Immersive dish visualization is a key differentiator of Tablekard, allowing customers to preview a realistic 3D model of their food on their dining table in real-world scale before ordering. To achieve this, the platform utilizes web-standard AR technologies that require specific software and hardware configurations.

#### 5.3.1 Client-Side AR Software Requirements
- **WebXR Device API:** The primary web standard used to access device sensors, cameras, and tracking features directly from the web browser.
- **Google `<model-viewer>` Component:** Leverages standard web-components to automatically detect device capabilities and launch the best available AR mode:
  - **WebXR:** Inline browser-based AR rendering (supported in modern mobile Chrome/Edge).
  - **Scene Viewer:** Android native AR wrapper (launches Google Play Services for AR).
  - **Quick Look:** iOS native AR viewer (launches native iOS Quick Look app for USDZ rendering).
- **Supported 3D Formats:**
  - **glTF Binary (`.glb`):** Required for inline WebGL 3D rendering and Android Scene Viewer AR.
  - **Universal Scene Description (`.usdz`):** Required for iOS Safari Quick Look AR integration.
  - *Optimization Spec:* 3D models must be compressed (using Draco compression) and kept under 10 MB (ideally 2–5 MB) with a low polygon count (≤ 50,000 triangles) to ensure rapid loading over cellular networks.

#### 5.3.2 Client-Side AR Hardware Requirements
- **Tracking & Motion Sensors:** The device must possess a 6-Degrees-of-Freedom (6-DoF) sensor suite including an Accelerometer, Gyroscope, and Magnetometer to perform Simultaneous Localization and Mapping (SLAM).
- **Camera System:** High-resolution rear-facing camera (minimum 8 MP with autofocus) to capture and analyze the physical table surface for plane detection.
- **Operating System & Native SDK Support:**
  - **Android Devices:** Android 7.0 (Nougat) or newer with Google Play Services for AR (ARCore) installed.
  - **iOS Devices:** iOS 11.0 or newer on ARKit-compatible devices (iPhone 6s/SE or newer, iPad Pro 1st Gen or newer).
- **GPU and Memory:** System must support WebGL 2.0. At least 4 GB of system RAM is recommended to prevent tab crashes when rendering detailed 3D textures in memory.

---

## 6. Experiments and Results

> *Note: As the project is currently in the active development phase, this section presents the preliminary results of the core implementation, along with the testing framework for upcoming modules.*

### 6.1 Preliminary Results: System Implementation
The initial experiment was to successfully establish the core multi-tenant SaaS architecture. The foundational routing, theming, and database connections have been successfully tested and deployed.

*[Insert Screenshot of Customer Web App here]*
**Figure 6.1:** Result showing the Customer Web App interface successfully fetching the dynamic menu from the Supabase backend.

*[Insert Screenshot of Cart/Checkout here]*
**Figure 6.2:** Result of the cart state management test, demonstrating accurate price calculation before checkout.

*[Insert Screenshot of Restaurant Admin Dashboard here]*
**Figure 6.3:** Result showing the Restaurant Admin panel successfully receiving real-time order updates.

### 6.2 Database Isolation Tests
A critical experiment for a multi-tenant platform is ensuring data security. The multi-tenant database schema has been tested using Supabase (PostgreSQL). Row Level Security (RLS) policies were evaluated to ensure data is securely isolated between different restaurant tenants.

*[Insert Screenshot of Supabase Dashboard here]*
**Figure 6.4:** Result confirming the secure deployment of core tables (users, restaurants, menus, orders) with RLS active.

### 6.3 Planned Experiments (Ongoing Work)
While the core ordering workflow yields successful initial results, the following advanced experiments are currently in the development pipeline and will be evaluated in the final report:
- **Payment Gateway Testing:** Testing the secure payment handoff and webhook responses via Razorpay.
- **AR Menu Rendering Latency:** Measuring the load time and device compatibility of 3D `.glb` assets using the `<model-viewer>` component.
- **Machine Learning Accuracy Evaluation:** Evaluating the collaborative filtering models using the Precision@5 metric, and configuring MAPE (Mean Absolute Percentage Error) for the predictive analytics dashboard.

---

## 7. Conclusion

Tablekard provides a comprehensive digital transformation solution for the restaurant industry through a modern, scalable SaaS architecture. By centralizing management across Super Admin, Restaurant Admin, and Customer interfaces, it effectively eliminates the traditional bottlenecks associated with manual order taking and standalone POS systems. 

The multi-tenant nature of the platform ensures that it is economically viable for restaurants of all sizes to adopt enterprise-grade technology. Furthermore, by seamlessly integrating advanced features like Augmented Reality menus, intelligent upselling recommendations, and predictive business analytics, Tablekard not only optimizes operational efficiency but actively enhances the dining experience and drives revenue growth.

The proposed architecture relies on robust, production-ready technologies (React, Supabase, PostgreSQL) ensuring the platform is highly scalable, secure, and ready for real-world deployment across multiple restaurant outlets.

### Future Work
Future enhancements to the Tablekard ecosystem will focus on expanding operational capabilities within the restaurant. A primary upcoming feature is the development of a dedicated **Kitchen App (Kitchen Display System)**. This application will serve as a specialized interface for the kitchen staff, displaying active food orders in real-time. Kitchen staff will be able to view exactly what needs to be prepared and simply click a "Finished" button to clear the current ticket, which will instantly load the next pending order in the queue, further streamlining the kitchen-to-table workflow.

---

## 8. References

1. Kimes, S. E. (2008). *The Role of Technology in Restaurant Revenue Management.* Cornell Hospitality Quarterly, 49(3), 297–309.
2. Susanto, H., & Chen, C. K. (2017). *Cloud computing adoption in SMEs: A systematic literature review.* Journal of Enterprise Information Management.
3. Zhang, S., Yao, L., Sun, A., & Tay, Y. (2019). *Deep Learning Based Recommender System: A Survey and New Perspectives.* ACM Computing Surveys, 52(1), 1–38.
4. Hincapié, M., Caponio, A., Rios, H., & Mendívil, E. G. (2011). *An introduction to Augmented Reality with applications in aeronautical maintenance.* 13th International Conference on Transparent Optical Networks (ICTON). IEEE.
5. Bandara, U., Ihalage, A., & Vidanagama, D. (2018). *A Machine Learning Approach to Predict Restaurant Revenue.* 2018 3rd International Conference on Information Technology Research (ICITR). IEEE.

---

*End of Initial Project Report*  
*Document Version: 1.0 | April 2026*
