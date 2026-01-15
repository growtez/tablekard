# Customer App Redesign Plan

## Objective
Align the React Native customer-app design with the customer-web premium aesthetic and add delivery partner location tracking.

---

## Phase 1: Design System & Theme Updates

### 1.1 Update Theme Colors (src/theme.js)
- Primary: `#8B3A1E` (burgundy)
- Light accent: `#FFF0EC` (cream/peach)
- Border accent: `#FFD8CC`
- Background: `#FAFAFA` / `#FFFFFF`
- Text colors matching web
- Inactive nav: `#D4A59A` (light maroon)

### 1.2 Typography
- Add Google Fonts: Outfit, Playfair Display, Syncopate
- Configure react-native custom fonts

---

## Phase 2: Screen Redesigns

### 2.1 HomeScreen.js
Match customer-web home.jsx design:
- [ ] Refined search bar with burgundy focus state
- [ ] Category pills with active/inactive states
- [ ] Discount card carousel with premium styling
- [ ] Food item cards with deep shadows
- [ ] Section headers with "See All" links
- [ ] Bottom navigation with light maroon inactive icons

### 2.2 MenuScreen.js
Match customer-web menu.jsx design:
- [ ] Category tabs at top
- [ ] Grid/list view toggle
- [ ] Item cards with add button
- [ ] Modal for item details with quantity stepper

### 2.3 ProfileScreen.js
Match customer-web profile.jsx design:
- [ ] Hero gradient section
- [ ] Avatar with animated ring
- [ ] Stats cards row
- [ ] Action grid (Orders, Feedback, Queue, etc.)
- [ ] Settings list items

### 2.4 CartScreen.js
- [ ] Item list with quantity controls
- [ ] Price summary card
- [ ] Apply coupon section
- [ ] Place order button

### 2.5 OrdersScreen.js
Match customer-web order_history.jsx design:
- [ ] Stats bubble at top
- [ ] Order cards with accent bar
- [ ] Reorder functionality

### 2.6 AboutScreen.js (New)
Match customer-web about.jsx design:
- [ ] Brand hero section
- [ ] Manifesto card
- [ ] Stats highlights grid
- [ ] Operating hours scroller with dots
- [ ] Visit Us section with location card
- [ ] Contact icons row
- [ ] Social footer

---

## Phase 3: New Features - Location & Delivery Tracking

### 3.1 Location Sharing
**File: src/context/LocationContext.js** (already exists)
- [ ] Enhance with real-time location updates
- [ ] Background location tracking option
- [ ] Location permission handling

### 3.2 OrderTrackingScreen.js Enhancement
**New Features:**
- [ ] Real-time map showing:
  - Restaurant location (fixed marker)
  - User location (user marker)
  - Delivery partner location (animated marker)
  - Route polyline
- [ ] Order status timeline
- [ ] Estimated time of arrival
- [ ] Call/chat with delivery partner
- [ ] Share live location toggle

### 3.3 Dependencies to Add
```json
{
  "react-native-maps": "^1.x",
  "@react-native-community/geolocation": "^3.x",
  "react-native-background-geolocation": "^4.x" (optional for background)
}
```

### 3.4 Firebase/Backend Integration
- [ ] Real-time delivery partner location from Firebase
- [ ] Order status updates
- [ ] Push notifications for order updates

---

## Phase 4: Navigation & Bottom Bar

### 4.1 Bottom Tab Navigator
Match web design:
- Home icon
- Menu icon
- Orders icon
- Profile icon
- Active state: burgundy fill with white icon
- Inactive state: light maroon (#D4A59A)

### 4.2 Stack Navigation
- Home → Menu → ItemDetail → Cart → Checkout
- Orders → OrderTracking (with map)
- Profile → About, Settings, Feedback

---

## Phase 5: Components to Create

### 5.1 Reusable Components
- [ ] `BottomNavBar.js` - Consistent bottom navigation
- [ ] `FoodCard.js` - Standardized food item card
- [ ] `CategoryPill.js` - Category selector pill
- [ ] `SectionHeader.js` - Section titles with "See All"
- [ ] `QuantityStepper.js` - +/- quantity control
- [ ] `PriceTag.js` - Styled price display
- [ ] `OrderStatusTimeline.js` - Order progress steps
- [ ] `DeliveryMap.js` - Map component with tracking

---

## Implementation Priority

1. **High Priority:**
   - Theme/color updates
   - Bottom navigation redesign
   - HomeScreen visual alignment
   - OrderTrackingScreen with map

2. **Medium Priority:**
   - MenuScreen redesign
   - ProfileScreen redesign
   - CartScreen polish

3. **Lower Priority:**
   - AboutScreen (new)
   - FeedbackScreen
   - SettingsScreen refinements

---

## Estimated Effort
- Phase 1: 1-2 hours
- Phase 2: 4-6 hours per screen
- Phase 3: 4-6 hours (location tracking)
- Phase 4: 2-3 hours
- Phase 5: 3-4 hours

**Total: ~30-40 hours of development**

---

## Next Steps
1. Start with theme.js color updates
2. Implement BottomNavBar component
3. Update HomeScreen styling
4. Add OrderTrackingScreen map functionality
