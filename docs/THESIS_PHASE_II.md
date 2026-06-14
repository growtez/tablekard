# Tablekard: A Smart QR-Based Multi-Tenant Restaurant Management SaaS Platform

A Thesis (Project Phase II) submitted in partial fulfilment of the requirements For the Degree of
Bachelor of Technology In
Computer Science and Engineering

### Submitted by
* **Faruk Khan** (222010007019)
* **Mridul Roy** (222010007027)
* **Sanjeev Iqbal Ahmed** (222010007041)
* **Shahid Anowar** (222010007043)
* **Sourav Sharma** (222010007049)

### Under the Guidance of
**Mr. N Rana Singha**  
Assistant Professor

**DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING**  
**BARAK VALLEY ENGINEERING COLLEGE**  
NIRALA, SRIBHUMI - 788701, ASSAM  
MAY - 2026

---

## DECLARATION

We, the students of Computer Science and Engineering, Barak Valley Engineering College declare that the work entitled "Tablekard: A Smart QR-Based Multi-Tenant Restaurant Management SaaS Platform" has been successfully completed under the guidance of Mr. N Rana Singha, Assistant Professor, Computer Science and Engineering Department, Barak Valley Engineering College. The report has completely been prepared without resorting to plagiarism. We have adhered to all principles of academic honesty and integrity. No falsified or fabricated data have been presented in the report. Further the matter embodied in the project report has not been submitted previously by anybody for the award of any degree or diploma to any university.

* **Faruk Khan** (222010007019)
* **Mridul Roy** (222010007027)
* **Sanjeev Iqbal Ahmed** (222010007041)
* **Shahid Anowar** (222010007043)
* **Sourav Sharma** (222010007049)

Date: ________________  
Place: ____________________  

---

## CERTIFICATE OF APPROVAL

* **Project Title:** Tablekard: A Smart QR-Based Multi-Tenant Restaurant Management SaaS Platform
* **Project Category:** Major Project Report
* **Student Names:** 
  * Faruk Khan (222010007019)
  * Mridul Roy (222010007027)
  * Sanjeev Iqbal Ahmed (222010007041)
  * Shahid Anowar (222010007043)
  * Sourav Sharma (222010007049)
* **Name of the Department:** Computer Science & Engineering
* **Name of the Supervisor:** Mr. N Rana Singha
* **Academic Session:** January – June, 2026
* **Recommendation:** Yes

**Dr. Kausthav Pratim Kalita**  
Head, Department of CSE  
Barak Valley Engineering College  

---

## CERTIFICATE FROM INTERNAL EXAMINER

This is to certify that, the Thesis work embodied in this Report entitled, “Tablekard: A Smart QR-Based Multi-Tenant Restaurant Management SaaS Platform” submitted by Faruk Khan (222010007019), Mridul Roy (222010007027), Sanjeev Iqbal Ahmed (222010007041), Shahid Anowar (222010007043), and Sourav Sharma (222010007049), Department of Computer Science and Engineering, Barak Valley Engineering College, Sribhumi, Assam in partial fulfilment for the award of the degree of Bachelor of Technology in Computer Science and Engineering has been examined by me on the day of final presentation and found to be satisfactory.

Date: ___________  
Place: ____________________  
**Internal Examiner**

---

## CERTIFICATE FROM SUPERVISOR

This is to certify that, the Major Project/Thesis work embodied in this Report entitled, “Tablekard: A Smart QR-Based Multi-Tenant Restaurant Management SaaS Platform” submitted by Faruk Khan (222010007019), Mridul Roy (222010007027), Sanjeev Iqbal Ahmed (222010007041), Shahid Anowar (222010007043), and Sourav Sharma (222010007049) of Bachelor of Technology in the Computer Science & Engineering Department is absolutely based on their work under my supervision and is prepared only for their academic requirements, not for any other purpose. It is also certified that this work/thesis has not been submitted elsewhere for any degree/diploma.

Date: ___________  
Place: ____________________  
**Mr. N Rana Singha**  
Assistant Professor  

---

## ABSTRACT

The dine-in restaurant industry often faces operational inefficiencies such as manual order-taking, poor communication, and limited real-time tracking. Existing dine-in solutions are typically hardware-dependent, single-tenant, and lack scalability. To address these challenges, this project introduces Tablekard, a multi-tenant Software-as-a-Service (SaaS) platform that streamlines restaurant operations without requiring costly Point-of-Sale (POS) hardware.

Tablekard offers a browser-based experience where customers can browse digital menus, view dishes using Augmented Reality (AR), receive personalized recommendations through Machine Learning, and place orders using table-specific QR codes. The platform includes a Customer Web App, Restaurant Admin Panel, and Super Admin Panel. Developed with React 18 and Vite, and powered by Supabase (PostgreSQL), the system ensures secure multi-tenant data management and real-time synchronization between tables and kitchens. Razorpay integration enables secure online payments.

By connecting customer interactions with kitchen workflows, Tablekard reduces delays, improves operational efficiency, and supports data-driven decision-making. The platform provides a scalable and affordable digital solution for modernizing small and medium-sized restaurants.

**Keywords:** Restaurant Management System, Multi-Tenant SaaS, QR-Based Ordering, Real-Time Synchronization, Razorpay integration, Cloud Computing, Serverless Architecture, Supabase, Augmented Reality (AR), Machine Learning.

---

## ACKNOWLEDGEMENT

We would like to extend our sincere and heartfelt thanks towards all those who helped us in making this project. Without their active guidance, help, cooperation and encouragement, we would not have been able to present the project on time.

We extend our sincere gratitude to our project guide Mr. N Rana Singha and project coordinator Dr. Kausthav Pratim Kalita for their moral support and guidance during the tenure of our project. We also acknowledge with a deep sense of reverence, our gratitude towards all other faculty members of our college faculty for their valuable suggestions given to us in completing the project.

* Faruk Khan (222010007019)
* Mridul Roy (222010007027)
* Sanjeev Iqbal Ahmed (222010007041)
* Shahid Anowar (222010007043)
* Sourav Sharma (222010007049)

Date: ___________  
Place: ____________________  

---

## TABLE OF CONTENTS

* Declaration (i)
* Certificates (ii-iv)
* Abstract (v)
* Acknowledgement (vi)
* List of Tables (viii)
* List of Figures (ix)
* **Chapter 1: Introduction** (1-3)
  * 1.1 Introduction
  * 1.2 Motivation
  * 1.3 Objective
* **Chapter 2: Literature Survey** (4-12)
  * 2.1 Related Works
  * 2.2 Problem Statement
* **Chapter 3: Proposed Methodology** (13-27)
  * 3.1 Architectural Diagram
  * 3.2 Other Diagrams
  * 3.3 Software and Hardware Requirements
* **Chapter 4: Results and Discussions** (28-37)
  * 4.1 Project Outputs with Discussion
  * 4.2 Comparative Study
* **Chapter 5: Conclusion and Future Scope** (38-39)
  * 5.1 Conclusion
  * 5.2 Future Work
* **References** (40)

---

## LIST OF TABLES

| Sl. No | Title | Page No |
| :--- | :--- | :--- |
| 2.1 | Comparison of Digital Ordering Approaches | 5 |
| 2.2 | Comparative Analysis of Existing Restaurant Solutions | 7 |
| 2.3 | Related Research Literature Summary | 10 |
| 3.3.1 | Software Requirements | 26 |
| 3.3.2 | Hardware Requirements | 27 |

---

## LIST OF FIGURES

| Sl. No | Title | Page No |
| :--- | :--- | :--- |
| 3.1 | Graphical System Architecture | 13 |
| 3.2 | Customer Web Flow | 14 |
| 3.3 | Restaurant Admin Flow | 16 |
| 3.4 | Super Admin Flow | 18 |
| 3.5 | State Transition Diagram | 21 |
| 3.6 | State Transition Diagram - Scanning Phase | 22 |
| 3.7 | State Transition Diagram - Location Phase | 23 |
| 3.8 | State Transition Diagram - Login Phase | 23 |
| 3.9 | State Transition Diagram - Discovery, Ordering & Payment | 24 |
| 3.10 | State Transition Diagram - Live Queue | 25 |
| 3.11 | State Transition Diagram - Post-Order Phase | 25 |
| 4.1 | Restaurant Admin - Dashboard Page | 28 |
| 4.2 | Restaurant Admin - Menu Management Page | 28 |
| 4.3 | Restaurant Admin - Report & Analytics Page | 29 |
| 4.4 | Super Admin - Dashboard Page | 30 |
| 4.5 | Super Admin - Restaurants Owner List | 30 |
| 4.6 | Customer Web App - Home Page | 31 |
| 4.7 | Customer Web App - Add to Cart Page | 31 |
| 4.8 | Customer Web App - Payment Page | 32 |
| 4.9 | Customer Web App - Live Queue Page | 32 |
| 4.10 | Customer Web App - Profile Page | 33 |
| 4.11 | Customer Web App - Order History Page | 33 |
| 4.12 | Field Testing 1 - Scanning QR and Browsing Menu | 35 |
| 4.13 | Field Testing 2 - Restaurant Admin Taking Order | 35 |
| 4.14 | Field Testing 3 - Users Viewing Live Queue and Receiving Order | 36 |

---

## CHAPTER 1: INTRODUCTION

### 1.1 Introduction
Tablekard is a comprehensive, multi-tenant Software-as-a-Service (SaaS) platform that enables seamless, contactless QR-based ordering and restaurant management without reliance on traditional, expensive Point-of-Sale (POS) hardware. It is built on a serverless-oriented cloud architecture, where a single centralized backend securely serves multiple independent restaurant tenants, forming a highly scalable and cost-effective digital ecosystem.

Unlike conventional on-premise restaurant systems that require complex local installations, Tablekard employs a frictionless web-based approach. Customers scan table-specific QR codes to access dynamic menus and place orders directly from their smartphones, eliminating the need to download dedicated applications or wait for waitstaff. To prevent operational bottlenecks and mismanagement, the system integrates real-time database subscriptions and robust role-based access control across a multi-tiered application suite. These mechanisms ensure perfect operational synchronization: orders placed by customers, along with their live queue status, are instantly reflected on the dedicated Kitchen App for the kitchen staff and the Restaurant Admin Panel for managers. Simultaneously, a centralized Super Admin Panel allows platform operators to manage and oversee all tenant restaurants.

The applications are developed using React 18 and Vite for high-performance frontend interfaces. A hybrid cloud architecture utilizes Supabase (PostgreSQL) for robust data storage and real-time synchronization, while the live Razorpay payment gateway is integrated for secure, instant transactions. The core contributions of this project include:
1. **Infrastructure-Less Customer Experience** – enabling customers to order, track their live queue status, and pay seamlessly via web browsers using simple QR code scans.
2. **Multi-Tenant SaaS Architecture** – eliminating heavy upfront costs for restaurants by providing a scalable, subscription-based cloud platform equipped with dedicated Customer, Kitchen, Restaurant Admin, and Super Admin interfaces.
3. **Client-Side Recommendation Engine** – utilizing a lightweight, browser-based collaborative filtering algorithm to analyze preferences and suggest personalized food items to customers without heavy backend processing.
4. **Immersive Dish Visualization** – providing a system where restaurant administrators can easily upload industry-standard 3D asset files (specifically `.glb` and `.usdz` formats), which are then integrated with WebXR to allow customers to view realistic Augmented Reality (AR) models of menu items before ordering.

### 1.2 Motivation
The real strength of modern restaurant management comes when intuitive customer-facing applications are combined with a powerful, multi-tenant cloud backend and dedicated interfaces for operations. Together, they form a unified system that handles everything from the moment a customer sits down to the kitchen preparation and final revenue analytics. In this design, the frontend applications (Customer Web App, Kitchen App, Restaurant Admin, and Super Admin) handle the user experience, order processing, and administrative workflows, while the Supabase backend ensures strict data isolation, real-time updates, and secure transactions. However, building this ecosystem is not simple—if done poorly, multi-tenant data leakage can occur, or the system might fail under the heavy concurrent load of peak dining hours. The need for an affordable, integrated digital solution arises from several real-world operational challenges:
* **High Wait Times:** Orders sent directly from tables to the kitchen reduce delays, while live queue tracking keeps customers updated.
* **Expensive Billing Systems:** Tablekard replaces costly POS hardware with smartphone- and tablet-based management.
* **Static Dining Experience:** AR-enabled 3D food previews make menus interactive and engaging.
* **Lack of Personalization:** AI-based recommendations suggest relevant dishes using customer ordering patterns.
* **Payment Delays:** Razorpay integration enables fast and secure UPI and card payments.

### 1.3 Objective
The overall objective of this project is to design and implement a highly scalable, multi-tenant restaurant management SaaS platform that ensures frictionless contactless ordering, real-time operational synchronization, and data-driven business intelligence. The objectives include:
* **Multi-Role & QR-Based Ordering System:** Develop interconnected applications for customers, kitchen staff, restaurant owners, and platform admins with a secure QR-based ordering flow requiring no app installation.
* **Real-Time Restaurant Operations:** Enable instant order synchronization, live queue tracking, and seamless communication between customers, kitchen staff, and restaurant dashboards using Supabase real-time features.
* **Smart & Interactive Dining Experience:** Integrate AR-based 3D food visualization and AI-powered personalized recommendations to improve customer engagement and ordering decisions.
* **Secure & Scalable SaaS Infrastructure:** Ensure secure Razorpay payment integration, predictive analytics for business insights, and strict multi-tenant data privacy across restaurants.

---

## CHAPTER 2: LITERATURE SURVEY

### 2.1 Related Works
The development of Tablekard uniquely combines several distinct areas of technology that are traditionally kept separate: multi-tenant cloud systems, real-time database synchronization, browser-based Augmented Reality (AR), and client-side recommendations. This section reviews these individual technologies, examines past research, and highlights the gaps that Tablekard bridges by bringing them together into a single, cohesive platform.

#### 2.1.1 Digital Ordering Approaches
Over the last decade, dining workflows have shifted from paper menus to digital systems. The choice of architecture affects how much a system costs to set up, how fast it runs, and how easy it is for customers to use.
* **Traditional POS Systems:** These systems (like old-school billing computers) require physical servers installed inside the restaurant and expensive touchscreens. *Drawback:* Very expensive to install, hard to update, and customers cannot use them directly to place orders.
* **Native Mobile Apps:** Some restaurant chains build dedicated iOS or Android apps for ordering. *Drawback:* Customers do not want to download and install a new application just to order a single meal.
* **Contactless QR Web Applications (Tablekard's Approach):** Diners scan a table-specific QR code to open a menu directly in their phone's web browser, allowing them to order and pay instantly. *Advantage:* No app downloads are needed, there is no setup friction, and the kitchen staff gets the order immediately. Patil et al. [1] demonstrated that browser-based QR code ordering cuts processing errors and wait times, while Gaikar et al. [2] highlighted the benefit of a visual menu and real-time tracking interface for diners.

| Feature | Traditional POS | Native Mobile Apps | Contactless QR Web Apps (Tablekard) |
| :--- | :--- | :--- | :--- |
| **Hardware Setup** | Expensive terminals and local servers | None (Runs on customer's phone) | None (Runs on customer's phone) |
| **App Installation** | Required on local terminals | Required on customer's phone | None (Runs in web browser) |
| **User Friction** | High (Staff training needed) | High (Must download from App Store) | Zero (Instant scan-to-browse) |
| **Setup Cost** | Very High | Medium | Low (SaaS subscription model) |
| **Real-Time Sync** | Local network cables | Slow background polling | Database Subscriptions (Supabase Realtime [9]) |

*Table 2.1: Comparison of Digital Ordering Approaches*

#### 2.1.2 Real-Time Data Synchronization Methods
Getting orders from the customer's phone to the kitchen staff's display in real-time requires a strong database connection:
* **HTTP Short Polling:** The app repeatedly asks the database for updates (e.g., every 5 seconds). This drains the phone's battery and slows down the servers.
* **WebSockets:** Keeps a continuous, open two-way channel between the user and the server. However, it can be hard to scale when thousands of users connect at the same time.
* **Database Subscriptions (Tablekard's Approach):** The database automatically pushes changes to the client as soon as they happen. Tablekard uses Supabase Realtime [9] to stream updates directly from the PostgreSQL transaction log to the Kitchen App and Admin Panel via WebSockets, eliminating constant page refreshes and server overhead. Razorpay API webhooks [8] are integrated via serverless edge functions to securely listen for and verify payment confirmations asynchronously.

#### 2.1.3 Survey of Existing Restaurant Management and Ordering Platforms
Several commercial platforms have attempted to modernize restaurant workflows. A critical analysis of these systems reveals key trade-offs in usability, cost, and extensibility.
* **Toast POS [11]:** A dominant industry standard that combines software with proprietary Android-based terminal hardware. It handles ordering, payments, and kitchen displays. *Strengths:* Robust features, built-in payment processing, and highly reliable offline backup modes. *Weaknesses:* Lock-in to proprietary hardware, expensive transaction fees, and high upfront setup costs that lock out small food vendors.
* **OpenTable [12]:** A system focused primarily on reservation management, table seating coordination, and customer reviews. *Strengths:* Massive user base and reliable table reservation algorithms that help fill dining rooms. *Weaknesses:* Lacks built-in, direct-to-kitchen QR ordering and is not designed for real-time kitchen staff coordination.
* **Static QR Menus:** Basic QR codes printed on tables that link directly to static PDF files or simple non-interactive web pages. *Strengths:* Extremely cheap and simple to set up. *Weaknesses:* No ordering flow, no live status updates, no payment integrations, and requires manual staff interaction for taking orders.
* **GloriaFood:** A lightweight online ordering system that supports basic QR-based digital menus and direct web-ordering widgets. *Strengths:* Simple to set up, free basic tier for online ordering widgets, and accessible for small operations. *Weaknesses:* Lacks advanced features such as WebXR-powered AR menus, predictive analytics, collaborative recommendation engines, and a multi-tenant SaaS architecture with centralized super-admin management.

| Platform / System | Core Technology | Primary Focus | Multi Tenancy | Main Limitations |
| :--- | :--- | :--- | :--- | :--- |
| **Toast POS [11]** | Android OS, Cloud Backend | Kitchen operations & billing | Yes | Locked into expensive, proprietary hardware. |
| **OpenTable [12]** | Cloud Web Portal, Native Apps | Reservation & table management | Yes | No direct-to-kitchen QR ordering or live kitchen tracking. |
| **Static QR Menus** | Static HTML, PDF links | Replacing paper menus | No | No cart, no checkout, and no real-time status updates. |
| **GloriaFood** | Web Widgets, Cloud Backend | Basic online takeout/delivery | No | Lacks AR visualization, recommendations, and multi-tenant SaaS. |

*Table 2.2: Comparative Analysis of Existing Restaurant Solutions*

#### 2.1.4 Dual-Centered Design: Customer vs. Restaurant Centered Systems
Most existing restaurant solutions are one-sided:
* **Restaurant-Centered Systems:** Tools like traditional POS terminals or Toast [11] focus almost entirely on the operational backend (billing, inventory, kitchen displays). They treat the customer's table experience as an afterthought.
* **Customer-Centered Systems:** Tools like online PDF menus or delivery apps focus strictly on user convenience. They do not help the kitchen staff manage active orders or give the restaurant owner operational control.

Tablekard bridges this gap by being both customer-centered and restaurant-centered. It offers a premium, interactive frontend for the diner (AR models, personalized recommendations, live queue status, and Razorpay checkout) while simultaneously providing robust operational tools for the kitchen staff (Kitchen App) and restaurant owners (Admin/Super Admin panels).

#### 2.1.5 Customer Acceptance & Perception
* **Khare & Alkonda (2023) [3]:** Studied 203 diners and found that 77% preferred contactless menus over physical ones because they are more hygienic, reduce waiting times, and improve order accuracy.
* **Xu & Jonjoubsong [4]:** Applied the Technology Acceptance Model (TAM) by surveying 408 restaurant users and found that speed, reliability, and payment safety are the main reasons people adopt digital systems. HTML-based menus (web browsers) were highly preferred over physical self-service kiosks or mobile app downloads.

#### 2.1.6 Augmented Reality (AR) Menu Visualizations
* **Styliaras (2021) [5]:** Reviewed 34 food-related AR apps and found that most required downloading native mobile apps, which significantly limits user adoption.
* **Tablekard's Solution:** Instead of forcing app downloads, Tablekard uses browser-native WebXR Device API specifications [10] via `<model-viewer>`. Restaurant admins can upload standard `.glb` and `.usdz` 3D files of their dishes, and customers can preview them directly in AR on their table using standard web browsers, achieving frictionless interactive dining.

#### 2.1.7 Recommendation Systems
* **Mahajan et al. (2021) [6]:** Showed that hybrid recommendation systems (combining what a user likes with what is popular) are highly effective in food ordering. Similarly, Asani et al. [7] demonstrated that incorporating client preferences and sentiment analysis yields a more satisfying culinary selection.
* **Tablekard's Solution:** Rather than using expensive cloud servers to run machine learning scripts, Tablekard runs a lightweight collaborative filtering algorithm [17] directly in the customer's mobile browser, providing instant "Frequently Ordered Together" suggestions by leveraging local caching and client-side processing.

#### 2.1.8 Research Gaps & Tablekard's Positioning
Traditional setups leave several issues unsolved:
1. **Strict Separation of Customer and Restaurant Interfaces:** Existing platforms force restaurants to piece together different systems for ordering, billing, and kitchen tracking.
2. **Expensive Entry Barriers:** Existing POS software forces restaurants to buy proprietary hardware.
3. **Lack of Dynamic Customer Engagement:** Most digital menus are static pictures or PDFs. Existing solutions lack interactive features like table-side AR dish previews or real-time preparation tracking.
4. **Lack of Multi-Tenant Security:** Most cheap ordering websites do not guarantee database-level isolation, risking data leaks between restaurants.

Tablekard bridges these gaps by offering a complete, multi-tenant SaaS platform that requires no special hardware. By serving both the customer and the restaurant operations concurrently, Tablekard delivers an all-in-one digital transformation platform.

#### 2.1.9 Summary of Related Research

| Sl. No. | Author(s) & Year | Research Focus | Method Used | Key Findings | Relevance to Tablekard |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1.** | Patil et al. (2025) [1] | Café Brown QR Ordering | Browser-based PHP/MySQL system with WebSockets | Sped up order times by 25% and cut errors by 90%. | Proves that browser-based QR ordering is highly effective in real-world settings. |
| **2.** | Gaikar et al. (2026) [2] | JOYFOOD System | Node.js/MongoDB with real-time status tracking | Dashboards and multi-stage tracking improve kitchen flow. | Shows the importance of having a visual queue tracker. |
| **3.** | Khare & Alkonda (2023) [3] | Customer Perception | Survey of 203 diners regarding digital menus | 77% of diners preferred contactless menus due to hygiene and speed. | Validates the market demand for Tablekard's no-contact model. |
| **4.** | Xu & Jonjoubsong [4] | Technology Acceptance Model (TAM) | TAM survey of 408 restaurant users | Customers prefer web-based menus over mobile apps or kiosks. | Direct support for Tablekard's browser-native approach. |
| **5.** | Styliaras (2021) [5] | AR in Hospitality | Review of 34 food-related AR applications | AR creates high customer engagement but needs to be easier to access. | Supports Tablekard's use of admin-uploaded `.glb`/`.usdz` files via WebXR [10]. |

*Table 2.3: Related Research Literature Summary*

### 2.2 Problem Statement
Traditional dine-in restaurants rely on disconnected, manual processes, causing operational inefficiencies and poor customer experiences. Current technologies focus heavily on food delivery, neglecting dine-in management. Consequently, customers face long wait times, opaque ordering, and slow payments, while owners lack real-time insights. A scalable, browser-based platform integrating QR ordering, AR menus, AI recommendations, live tracking, and digital payments is essential to modernize these operations by addressing three critical gaps:
1. **Integrated System Gap:** The absence of a real-time digital system creates a disconnect between customers, kitchen staff, and management. This lack of coordination results in slow service, frequent ordering errors, and an inability for owners to make data-driven decisions, ultimately reducing profitability.
2. **Operational Fragmentation:** Restaurants suffer from fragmented workflows. Static physical menus are costly and difficult to update, while manual order-taking introduces errors and communication delays. Operating with separate, disconnected tools prevents real-time synchronization between the front-of-house, kitchen, and management dashboards, leading to preparation bottlenecks and inefficient staff monitoring.
3. **Customer Experience and Technology Gap:** Current hospitality tech favors delivery, leaving dine-in customers with an outdated experience characterized by long wait times for ordering and billing. Traditional menus lack visual previews (causing ordering uncertainty) and cannot offer personalized recommendations. There is a critical market gap for a unified, browser-native solution that resolves these pain points through interactive AR menus, collaborative AI recommendations, live order tracking, and instant, secure payments.

Ultimately, the combination of a severe system disconnect between staff and diners, highly fragmented manual workflows, and an outdated table experience creates an environment of high operational friction. Resolving these compounding challenges requires moving away from piecemeal applications that keep front-of-house customer interactions completely isolated from back-office kitchen workflows. The dine-in sector explicitly demands a unified, real-time digital infrastructure capable of simultaneously eliminating communication latency, removing ordering uncertainty, and streamlining the financial settlement process.

---

## CHAPTER 3: PROPOSED METHODOLOGY

### 3.1 Architectural Diagram
Tablekard uses a serverless cloud architecture to facilitate multi-tenant access, data segregation, and real-time operations.

```
+-----------------------------------------------------------------------------------+
|                                PRESENTATION LAYER                                 |
|                                (Hosted on Vercel)                                 |
|                                                                                   |
|  +-----------------------+     +-----------------------+     +-----------------+  |
|  |   Customer Web App    |     | Restaurant Admin App  |     | Super Admin App |  |
|  | (QR, AR, Recs, Pay)   |     |  (Menu, Orders, KDS)  |     |  (Tenants, MRR) |  |
|  +-----------------------+     +-----------------------+     +-----------------+  |
+------------------------------------------+----------------------------------------+
                                           | WebSocket / REST
                                           v
+-----------------------------------------------------------------------------------+
|                                  SUPABASE BACKEND                                 |
|                                                                                   |
|   +-----------------------+   +-----------------------+   +-------------------+   |
|   |  Supabase Auth        |   | Supabase Realtime     |   | Supabase Storage  |   |
|   |  (Google, Email/PW)   |   | (Live Subscriptions)  |   | (Media, .glb/usdz)|   |
|   +-----------+-----------+   +-----------+-----------+   +---------+---------+   |
|               |                           |                         |             |
|               +---------------------------+-------------------------+             |
|                                           |                                       |
|                                           v                                       |
|                               +-----------------------+                           |
|                               |  PostgreSQL Database  |                           |
|                               | (Row-Level Security)  |                           |
|                               +-----------------------+                           |
+------------------------------------------+----------------------------------------+
                                           | Secure Handoff / Webhook
                                           v
+-----------------------------------------------------------------------------------+
|                        EXTERNAL PAYMENT GATEWAY (Razorpay)                        |
|                                                                                   |
|    +------------------------+                  +-----------------------------+    |
|    | Razorpay Checkout API  |<---------------->| Deno Edge Functions         |    |
|    | (UPI, Cards, Netbank)  |                  | (HMAC Webhook Verification) |    |
|    +------------------------+                  +-----------------------------+    |
+-----------------------------------------------------------------------------------+
```
*Fig 3.1: Graphical System Architecture*

#### 3.1.1 Layer Descriptions:
* **Presentation Layer:** Hosted on Vercel, this layer handles all user interactions and is divided into three distinct web applications tailored to specific roles:
  * **Customer Web App:** The mobile-optimized interface where diners scan the table QR code, browse the digital menu, view AR food models, and place orders directly from their smartphone browsers.
  * **Restaurant Admin:** The operational dashboard for restaurant managers and kitchen staff. It is used to manage digital menus, update table availability, and track incoming orders in real-time.
  * **Super Admin:** The overarching management portal for the platform operators. It is used to onboard new restaurant tenants, manage SaaS billing tiers, and monitor global system health.
* **Supabase Backend:** This is a serverless backend that acts as the central hub for data storage, security, and synchronization. The backend utilizes the following services:
  * **Authentication (Auth):** Manages secure access across all three frontend applications, utilizing modern login methods such as Google OAuth, Magic Links, and standard Email/Password credentials.
  * **Realtime Live Order Subscriptions:** Uses WebSocket connections to instantly push database changes to the client. When a customer places an order, this module ensures the Kitchen App updates instantly without requiring a page refresh.
  * **Storage Bucket:** A dedicated cloud storage environment responsible for hosting static assets, including standard menu images and the `.glb` files required for the WebXR Augmented Reality features.
  * **PostgreSQL + RLS:** The primary relational database. The integration of Row-Level Security (RLS) is critical for the multi-tenant architecture, acting as a strict barrier to ensure that each restaurant's operational data remains completely isolated and secure from others.
* **External Integrations & Security (Payment Flow):**
  * **Razorpay:** The third-party payment gateway integrated directly into the frontend. It handles instant checkout (UPI, cards, net banking) for diners and processes recurring SaaS subscription fees for the restaurant owners.
  * **Edge Functions & Webhook Verification:** Serverless functions that act as a secure bridge between Razorpay and the database. When a transaction completes, Razorpay sends a webhook to these functions to cryptographically verify the payment's authenticity before marking the order as "Paid" in the PostgreSQL database.

### 3.2 Other Diagrams
#### 3.2.1 Customer Web Flow
1. **Entry Point:** The customer journey begins by scanning a QR code placed at the table, which automatically captures and associates the specific table number with the session.
2. **Authentication (New Users):** Customers authenticate themselves through phone number registration, social login, or magic links. Returning users experience a smoother process through cached credentials, enabling automatic login without repeated manual input.
3. **Account Management (Parallel Flow):** Users can manage their profiles through a dashboard where they can update personal information such as name, profile photo, email, and phone number. They can also monitor their location status and review previous order history.
4. **Discovery and Ordering (The Core Loop):** The system first validates that the customer is physically present within the restaurant premises. Users can then browse the digital menu, view detailed information about items, save favorites, add products to the cart, and proceed to checkout. During checkout, customers can select either online payment or payment at the desk. The process concludes with an order confirmation state.
5. **Post-Order Experience:** Once an order is placed, it enters a live queue where customers and staff can track its progress in real time. After the dining experience, customers can provide ratings and feedback regarding food and service. The process ends with the generation of the final invoice or receipt.

#### 3.2.2 Restaurant Admin Flow
1. **Account Management:**
   * **Login & Access:** The admin securely logs into the system using credentials previously provisioned by the super admin.
   * **Profile Configuration:** Admins can set up and edit core restaurant details, including the "About" section, location coordinates, branding elements, and operating hours.
2. **Menu Management:**
   * **Item Control:** Admins have full control over the digital menu. They can add, edit, or delete individual menu items, as well as adjust prices, apply discounts, and update photos or descriptions.
   * **Category Organization:** The ability to create and manage distinct categories (e.g., Starters, Mains, Desserts) to keep the menu structured.
3. **Table Management:**
   * **QR Generation:** The system allows admins to generate unique, downloadable QR codes mapped directly to specific table numbers, which powers the customer's entry point.
4. **Order Management (The Core Loop):**
   * **Intake & Verification:** Admins receive incoming "New Orders," verify the customer's selected payment method (online or pay at desk), and officially accept the order into the system.
   * **Kitchen Workflow:** Once accepted, the order is assigned to the kitchen. The admin updates the order's state chronologically: `Preparing` => `Mark Ready` => `Served`.
   * **Live Tracking:** All of these state changes sync directly with the Live Queue so both staff and customers have real-time visibility.
5. **Post-Order Management:**
   * **Billing:** After the service is complete, the admin can generate the final, formalized invoice for accounting purposes or to provide to the customer.
6. **Additional Features (Parallel Flows):**
   * **Staff Management:** A dedicated portal where admins can onboard new staff, view current employees, remove users, and fine-tune specific system permissions.
   * **Analytics Dashboard:** A comprehensive data suite allowing admins to view revenue reports, track order and payment trends, identify popular menu items, and toggle the public visibility of customer ratings.

#### 3.2.3 Super Admin Flow
1. **Authentication:** Secure access using multi-factor credentials.
2. **Global Analytics:** Financial tracking (MRR, Total Revenue) and general performance tracking.
3. **Restaurant Management:** Approving/suspending tenants, reviewing billing, and impersonating tenant admins for troubleshooting.
4. **User Management:** A global directory for managing system permissions and roles.
5. **System Settings:** Managing platform APIs, security keys, email templates, and configurations.
6. **Platform Management:** Configuring SaaS subscription pricing models and managing platform feature flags.
7. **Support & Moderation:** Dispute management and system logs auditing.
8. **Subscription & Billing:** Tracking tenant payment history and handling subscription plans upgrades or downgrades.

#### 3.2.4 State Transition Diagram
The comprehensive State Transition Diagram illustrates the complete lifecycle of a customer session within the system, from the initial physical trigger to the final session termination. It maps the dynamic behavior of the application by dividing the user journey into seven dependent phases:

```
[Scan QR] --> [Validate Table ID] --> [Request GPS] --> [Proximity Check] 
                                                               |
                                                               v (In Range)
[Access Granted] <-- [Session Verification / Login] <----------+
       |
       v
[Browse Menu] <--> [View Item Details / AR View [10]]
       |
       v
[Manage Cart] --> [Select Payment Method] --> [Execute Payment [8]]
                                                      |
                                                      v
[Order Placed] <-- [Update Kitchen Display App] <-----+
       |
       v
[Live Queue (New -> Preparing -> Ready -> Served)]
       |
       v
[Feedback & Invoice] --> [Session Terminated]
```
*Fig 3.5: State Transition Diagram Flow*

1. **Scanning Phase:** The process begins when the user opens the scanner. The system scans the QR code and validates it. If valid, the table is successfully resolved, triggering the location check.
2. **Location Phase:** The system requests GPS permissions. Proximity check validates coordinates to verify the diner is physically present within the restaurant's operational boundaries.
3. **Login Phase:** Verifies user session. If authenticated, the user receives an `AccessGranted` state.
4. **Discovery and Ordering Phase:** Customers browse the menu, access details, view AR food models, add items to the cart, and proceed to checkout.
5. **Payment Phase:** Prompts the user to pay online via Razorpay [8] or at the counter. Successful payment triggers real-time order placement.
6. **Live Queue Tracking:** Updates order status in real time across Customer, Kitchen, and Admin dashboards via WebSockets.
7. **Post-Order Phase:** Customers can submit feedback, view invoices, and complete checkout to terminate the session.

### 3.3 Software and Hardware Requirements
#### 3.3.1 Software Requirements

| Category | Tool/Library | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | React | 18 / 19 | SPA development (Customer, Admin, Super Admin) |
| **Build Tool** | Vite | ≥7 | Frontend scaffolding and bundling |
| **Language** | TypeScript | — | Compile-time type safety |
| **QR Code** | qrcode.react | ≥4 | Table QR code generation |
| **Database** | Supabase (PostgreSQL) | — | Relational database with row-level security |
| **Database Security** | PostgreSQL RLS | — | Row-level security policies to enforce strict data isolation |
| **Backend Runtime** | Deno (Supabase Functions) | — | Serverless TypeScript environment for webhook processing |
| **Authentication** | Supabase Auth | — | Google OAuth, Magic Link, email/password |
| **Payment Gateway** | Razorpay SDK & API | — | Secure checkout integration and Deno HMAC verification [8] |
| **Realtime** | Supabase Realtime | — | WebSocket-based live order notifications [9] |
| **Storage** | Supabase Storage | — | Media asset hosting |

*Table 3.3.1: Software Requirements*

#### 3.3.2 Hardware Requirements

| Component | Minimum | Recommended |
| :--- | :--- | :--- |
| **Development Machine** | Intel i5 8th Gen / Ryzen 5, 8 GB RAM, 20 GB SSD, Windows 10 | 16 GB RAM for ML pipelines; NVIDIA CUDA GPU |
| **Customer Device** | Any smartphone/tablet with Chrome 79+, Safari 14+; mobile data/Wi-Fi | ARCore (Android) or ARKit (iOS) for WebXR AR menu [10] |
| **Admin Devices** | Desktop/laptop, Chrome 90+, 1280×720 display, stable internet | 1920×1080 for analytics dashboard |
| **ML Microservice** | 2 vCPU, 2 GB RAM, 5 GB storage | 4 vCPU, 4 GB RAM (e.g., AWS EC2 t3.small / Render) |

*Table 3.3.2: Hardware Requirements*

---

## CHAPTER 4: RESULTS AND DISCUSSIONS

### 4.1 Project Outputs with Discussion
This section presents the final GUIs for Tablekard’s three platforms: the Customer Web App, Restaurant Admin Panel, and Super Admin Panel.

#### 4.1.1 Discussion of Restaurant Admin Panel Interfaces
* **Dashboard Page (Fig 4.1):** A centralized hub displaying real-time revenue, active orders, pending payments, and best-selling dishes for quick operational oversight.
* **Menu Management Page (Fig 4.2):** An interface to dynamically organize food categories, toggle item availability, and configure promotional offers without reprinting menus.
* **Report & Analytics Page (Fig 4.3):** A business intelligence dashboard tracking key metrics (revenue, orders, active tables) alongside visual trends like peak-hour heatmaps for data-driven decisions.

#### 4.1.2 Discussion of Super Admin Panel Interfaces
* **Dashboard Page (Fig 4.4):** An overview of the Tablekard Super Admin Panel dashboard, highlighting key platform metrics, revenue analytics, and real-time system health data.
* **Restaurants Owner List (Fig 4.5):** The restaurant management interface within Tablekard, illustrating the ability for super admins to view and control individual multi-tenant restaurant accounts, statuses, and subscription tiers.

#### 4.1.3 Discussion of Customer Web App Interfaces
* **Home Page (Fig 4.6):** The landing page where customers browse menu items, view featured offers, search for food, and access their cart.
* **Add to Cart Page (Fig 4.7):** The page where customers manage their current cart items, place orders (with options to pay online or at the counter), and view their order history or status.
* **Payment Page (Fig 4.8):** A seamless, Razorpay-powered checkout interface supporting multiple payment methods [8].
* **Live Queue Page (Fig 4.9):** A real-time tracking interface for monitoring the order status and preparation progress from the kitchen.
* **Profile Page (Fig 4.10):** The user dashboard where customers can view or edit their personal info, review order statistics, and access favorites, feedback, and restaurant details.
* **Order History Page (Fig 4.11):** A modern interface displaying real-time order tracking, spending analytics, and quick reorder functionality.

#### 4.1.4 Testing under Uncontrolled Environment
* **User Flow (Fig 4.12):** User scanning the restaurant QR code, browsing the menu, and ordering items in an uncontrolled dining setting.
* **Kitchen Flow (Fig 4.13):** Restaurant cook/admin viewing orders and dashboard displaying active tickets in real-time.
* **Queue Tracking (Fig 4.14):** Users watching the live queue updates and receiving the order.

### 4.2 Comparative Study
To evaluate the effectiveness and innovation of Tablekard, a comparative study was conducted against existing digital restaurant management solutions and traditional Point-of-Sale (POS) systems.

#### 4.2.1 Comparison of Proposed Framework with Respect to Existing Work
The following table highlights how Tablekard directly addresses the limitations of current market alternatives through its integrated SaaS approach:

| Feature | Tablekard (Proposed) | Traditional POS [11] | Static QR Menus | Native App Systems |
| :--- | :--- | :--- | :--- | :--- |
| **Hardware Dependency** | Zero. Uses existing mobile devices & browsers. | High. Needs proprietary terminals & servers. | Zero. Uses existing mobile devices. | Medium. Requires phone storage for apps. |
| **Setup Cost** | Low. SaaS subscription. | High. Hardware & installation. | Low. Cheap PDF/HTML. | High. Custom app development. |
| **Real-Time Sync** | Instant. Supabase Realtime [9]. | Local. Wired network sync. | None. Static content. | Delayed. Often API polling. |
| **Customer Journey** | Frictionless. Scan, AR view [10], order, and pay. | Staff-Dependent. Waitstaff inputs orders. | View-Only. Manual ordering required. | High Friction. App download required. |
| **Immersive Features**| Yes. WebXR AR [10] & ML recommendations [6]. | No. Basic text interfaces. | No. Static 2D images. | Rare. Basic 2D galleries. |
| **Multi-Tenant SaaS** | Yes. Centralized admin with strict data isolation. | Varies. Often single-tenant on-premise. | No. Simple hosting. | Varies. Usually a single brand. |
| **Integrated Payments**| Yes. Razorpay [8] (UPI/Cards). | Yes. Built-in terminals. | No. Manual collection. | Yes. In-app gateways. |

*Table 4.1: Feature Comparison of Tablekard vs. Existing Market Solutions*

#### 4.2.2 Operational and Economic Impact
* **Reduction in Order-to-Kitchen Latency:** In a traditional setup, the time taken from a customer deciding on a meal to the kitchen receiving the ticket relies entirely on waitstaff availability. By enabling direct customer-to-kitchen QR ordering over Supabase Realtime, Tablekard eliminates this intermediate delay. Orders instantly populate on the Kitchen App, effectively reducing ordering friction during peak dining hours.
* **Economic Viability for SMEs:** Traditional POS systems create high barriers to entry for Small and Medium Enterprises (SMEs) due to upfront hardware costs (often running into thousands of dollars for terminals and local servers). Tablekard’s cloud-native SaaS architecture shifts this to a low-cost operational expense. Restaurant owners simply utilize their existing tablets or smartphones to access the Restaurant Admin and Kitchen Apps.
* **Enhanced Customer Engagement and Upselling:** Static menus rely on customer imagination and waitstaff suggestions. Tablekard replaces this with interactive Augmented Reality (AR) visualizations and automated, client-side recommendations. This transparency reduces order hesitation (as customers see exactly what they will receive) and automatically drives cross-selling without requiring active staff intervention.
* **Data Privacy and Multi-Tenant Security:** Unlike basic web ordering portals where data might be mingled in a single database table, Tablekard utilizes PostgreSQL Row-Level Security (RLS). The comparative advantage here is absolute data isolation. A Super Admin can oversee the entire platform, but individual restaurant tenants operate within strict boundaries, ensuring that competitive data (revenue, customer lists, recipes) is cryptographically isolated from other tenants on the same infrastructure.

#### 4.2.3 Summary of Findings
The comparative analysis proves that Tablekard effectively mitigates the "Operational Fragmentation" and "Technology Gap" defined in the problem statement. By leveraging modern WebXR [10], serverless functions, and real-time database subscriptions [9], Tablekard delivers the robust operational control of an expensive enterprise POS system combined with the frictionless accessibility of a simple QR code.

---

## CHAPTER 5: CONCLUSION AND FUTURE WORK

### 5.1 Conclusion
The rapid growth of web technologies has created an opportunity to redesign restaurant workflows, moving away from expensive, physical Point-of-Sale (POS) terminals toward lightweight, cloud-based software. This project, Tablekard, successfully demonstrates the design, implementation, and validation of a comprehensive, multi-tenant Software-as-a-Service (SaaS) restaurant management and QR-based ordering platform.

By utilizing browser-native web apps, Tablekard eliminates the friction of traditional installations. Customers can browse menus, view dishes in Augmented Reality, place orders, and pay directly from their smartphones without downloading any apps. At the same time, kitchen staff and restaurant managers get instant, real-time updates on their dedicated screens.

#### Summary of Achievements:
1. **Infrastructure-Less Dining:** The system successfully enabled customers to order and pay at their tables using a simple QR scan, reducing customer wait times and eliminating the need for expensive physical billing terminals.
2. **Secure Multi-Tenant SaaS Architecture:** By using Supabase Row-Level Security (RLS), Tablekard ensures that multiple restaurants can safely share the same database without any risk of data leakage.
3. **Real-Time Sync and Live Queue:** The Kitchen App and Restaurant Admin Panel receive customer orders instantly through Supabase Realtime subscriptions. Additionally, the Live Queue keeps customers informed of their order preparation status in real-time.
4. **Interactive Menu Enhancements:** Restaurant administrators can easily upload 3D models in `.glb` and `.usdz` formats, which customers can view directly on their tables using WebXR. The system also runs a lightweight, client-side recommendation engine to suggest relevant items without using expensive server-side resources.
5. **Frictionless Payments:** The clean integration of the live Razorpay payment gateway allows customers to pay securely using UPI, cards, or net banking directly from their mobile browser.

### 5.2 Future Work
While the current implementation of Tablekard provides a strong foundation for digital restaurant management, several enhancements can be explored to extend functionality, improve usability, and optimize performance:
* **IoT Kitchen Printer Integration:** Support direct wireless printing (via Bluetooth or local Wi-Fi) from the Kitchen App to cheap thermal printers, enabling the kitchen staff to easily print order tickets.
* **Offline Order Caching:** Allow the Customer Web App to save cart items locally if the restaurant's network drops momentarily, automatically submitting the orders as soon as the connection is restored.
* **AI-Powered Menu Generator:** Integrate computer vision tools so restaurant owners can upload photos of dishes, and the admin system will automatically generate descriptions and tags.
* **Advanced Sales Forecasting:** Integrate time-series forecasting models (like Facebook Prophet) into the Restaurant Admin dashboard to give owners predictive analytics on daily revenue and inventory needs.
* **Voice-Activated Ordering:** Add voice search and command options to the Customer Web App, making it easier for visually impaired or elderly diners to browse and place orders.
* **Dynamic Smart Pricing:** Implement dynamic pricing features that automatically adjust menu rates or trigger discounts during slow hours (happy hours) or busy peak dining times.
* **Smart Table Reservations:** Allow customers to book tables online ahead of time, which will automatically sync with the Restaurant Admin Panel to reserve the table and pre-load the menu.

---

## REFERENCES

[1] A. Patil, G. Kukadolkar, and S. S. Bandekar, “Automation of Cafe Services: A QR-Based Digital Ordering System for Café Brown,” *International Journal of Scientific Research and Engineering Development*, vol. 8, no. 4, pp. 1353–1363, 2025.

[2] A. Gaikar, K. Ambre, R. Sarkavas, S. Kumari, and S. Jadhav, “A Study on JOYFOOD: QR Code Based Food Ordering System for Restaurants,” *International Journal for Research in Applied Science and Engineering Technology*, vol. 14, no. IV, pp. 1787–1791, 2026. doi: 10.22214/ijraset.2026.79635.

[3] A. S. Khare and V. Alkonda, “The Study of Customer Perception on Contactless Menus at Restaurant,” *European Chemical Bulletin*, vol. 12, Special Issue 8, pp. 4676–4693, 2023.

[4] X. Xu and L. Jonjoubsong, “The Intention to Use Contactless Ordering Systems for Restaurants of Thai Customers,” *Faculty of Business Administration, Huachiew Chalermprakiet University*, pp. 199–213, n.d.

[5] G. D. Styliaras, “Augmented Reality in Food Promotion and Analysis: Review and Potentials,” *Digital*, vol. 1, pp. 216–240, 2021. doi: 10.3390/digital1040016.

[6] K. Mahajan, V. Joshi, M. Khedkar, J. Galani, and M. Kulkarni, “Restaurant Recommendation System using Machine Learning,” *International Journal of Advanced Trends in Computer Science and Engineering*, vol. 10, no. 3, pp. 1671–1675, 2021. doi: 10.30534/ijatcse/2021/261032021.

[7] E. Asani, H. Vahdat-Nejad, and J. Sadri, “Restaurant recommender system based on sentiment analysis,” *Machine Learning with Applications*, vol. 6, p. 100114, 2021. doi: 10.1016/j.mlwa.2021.100114.

[8] Razorpay, “Razorpay documentation.” [Online]. Available: https://razorpay.com/docs

[9] Supabase, “Supabase Realtime and Client Reference Documentation.” [Online]. Available: https://supabase.com/docs

[10] W3C WebXR Device API Working Group, “WebXR Device API Specification,” *W3C Recommendation*, 2023. [Online]. Available: https://www.w3.org/TR/webxr/

[11] Toast POS, “Toast Tab POS System.” Accessed: May 20, 2026. [Online]. Available: https://pos.toasttab.com/

[12] OpenTable, “Restaurant Reservation and Management Platform.” [Online]. Available: https://www.opentable.com/. [Accessed: May 20, 2026].

[13] S. Sidharth and S. G. Jacob, “Database security using row level security (RLS) in PostgreSQL,” *International Journal of Engineering and Technology*, vol. 8, no. 2, pp. 450–455, 2019.

[14] E. Jonas et al., “Cloud Programming Simplified: A Berkeley View on Serverless Computing,” *arXiv preprint arXiv:1902.03383*, 2019.

[15] M. Billinghurst, A. Clark, and G. Lee, “A survey of augmented reality,” *Foundations and Trends in Human–Computer Interaction*, vol. 8, no. 2-3, pp. 73–272, 2015.

[16] B. Sarwar, G. Karypis, J. Konstan, and J. Riedl, “Item-based collaborative filtering recommendation algorithms,” in *Proceedings of the 10th international conference on World Wide Web*, 2001, pp. 285–295.
