# EXPANDED PROJECT DOCUMENTATION
## Mahir Home Services Booking Application
**Course:** Hybrid Mobile Application Development  
**Academic Submission:** Comprehensive Project Technical Report (Spring 2026)

---

## 1. Executive Summary & Project Scope

The **Mahir Home Services Booking Application** is a hybrid mobile app built with **React Native** and **Expo** on the frontend, and a **Node.js Express** server backed by a **MongoDB** database on the backend.

In this expanded, production-grade release, the application integrates critical modern services matching leading industry applications like **Urban Company**, **TaskRabbit**, and **Handy**:
- **Reviews & Ratings System:** Customers can rate completed orders (1-5 stars) and submit review comments. The API dynamically calculates provider aggregate scores and total review counts on the fly.
- **Notifications Hub:** Real-time unread count badges appear on the mobile Home Screen header, opening a Notifications feed where customers can mark notifications as read, mark all read, or delete notifications.
- **Favorites & Saved Services:** Allow one-tap saving of favorite services with immediate rebooking shortcuts.
- **Search & Filters Tag Chips:** Advanced search text matching combined with interactive category filters, top-rated sorting (4.7+ stars), and budget-friendly price sortings.
- **Provider Profiles:** Professional avatar listings, years of experience, skill tag aggregations, total jobs completed, and active availability flags.
- **Multer Local Uploads:** Supports uploading pictures and profile avatars locally.
- **Detailed Tax Invoices:** Dynamic 10% coupon promo codes (`DISCOUNT10`), 5% GST tax itemization, and subtotals.
- **Cancellation Refund Policies:** Cancellation reasons matching refund statuses (automatic 100% refund estimations for card payments simulation) within a 2-hour policy limit.

---

## 2. Technological Stack

1. **Frontend Mobile App:**
   - **React Native & JSX:** Clean structural layouts.
   - **Expo SDK 54 & Router:** Stack and bottom tab navigations (`home`, `categories`, `profile`) combined with modal stacks.
   - **Context API & Hooks:** Centralized state managers (`AuthContext`, `BookingsContext`) employing `useContext`, `useMemo` for heavy invoice structures, `useCallback`, `useEffect` polling, and `useRef`.
   - **Core Components:** `FlatList` (responsive grid list rendering), `ScrollView`, `TextInput`, `Pressable`, `TouchableOpacity`, and `ActivityIndicator`.

2. **Backend API Server:**
   - **Node.js & Express.js:** Routing handlers and request validations.
   - **Multer:** Handling multipart form-data image uploads statically.
   - **Bcryptjs & JWT:** Hashed password credentials and token authorizations.
   - **MongoDB & Mongoose:** 5 core collections (`users`, `bookings`, `reviews`, `notifications`, `providers`) with relational linkages.

---

## 3. Database Schema Models (Mongoose ORM)

### 3.1. `User.js`
Stores user profile information, defining fields for `name`, unique lowercase `email`, `password` (select: false), `phone`, and `role` (customer/provider/admin).

### 3.2. `Booking.js`
Stores booking transactions, listing unique `bookingId` (e.g. `BK-XXXX-YYYY`), `userId` reference, primary `serviceType`, scheduled date/time, selected sub-services sub-document list, payment details, subtotal, service charges, GST tax, total payments, and statuses.

### 3.3. `Review.js` [NEW]
Relational reviews schema:
- `bookingId` (String): Link to the booking reviewed.
- `userId` (ObjectId referencing User): Creator.
- `userName` (String): Author's public display name.
- `providerId` (String): Linked provider.
- `rating` (Number, 1-5 stars): Validation constraint.
- `comment` (String): Review text description.

### 3.4. `Notification.js` [NEW]
System transactional notifications:
- `userId` (ObjectId referencing User): Target customer/provider.
- `title` (String): Notification header.
- `message` (String): Detailed text.
- `type` (String, enum: `['booking', 'cancellation', 'general', 'assigned']`): Defines message styling.
- `read` (Boolean, default: `false`): Tracks unread badge indicators.

### 3.5. `Provider.js` [NEW]
Professional provider detail records:
- `providerId` (String, unique): Primary lookup key.
- `name` (String): Full name.
- `avatar` (String): Profile picture link.
- `category` (String): Skill class.
- `experience` (String): e.g. "5 Years Experience".
- `skills` (Array of Strings): Specific specialties.
- `rating` (Number): Dynamic average score (1.0 to 5.0).
- `reviewsCount` (Number): Dynamic total reviews count.
- `completedJobs` (Number): Active completed jobs counter.
- `availability` (String, Available/Busy/Offline).

---

## 4. RESTful API Routes & Middlewares

- **`auth.js` Middleware:** Intercepts incoming Bearer tokens, decrypts user payloads, and appends the active `User` document to `req.user`.
- **`authRoutes.js`:** User `/signup` (password hashing), `/login` (credential matches), and `/me` profiles.
- **`bookingRoutes.js`:**
  - `POST /`: Places bookings, automatically pushing a "Booking Placed!" unread alert into `Notification` schema.
  - `GET /`: Lists user bookings.
  - `POST /:id/cancel`: Cancels bookings with reasons, automatically estimating refund capabilities and sending a "Booking Cancelled" alert.
  - `PUT /:id/status`: Transition updates (Accepted, In Progress, Completed), triggering specific customer notification alerts.
- **`reviewRoutes.js` [NEW]:**
  - `POST /`: Submits review stars. It automatically fetches all existing reviews for the provider, recalculates the average rating score, and updates the `Provider` document statistics.
  - `GET /provider/:providerId`: Fetches reviews.
  - `DELETE /:id`: Deletes reviews (Admin/Author only), restoring star averages.
- **`notificationRoutes.js` [NEW]:**
  - `GET /`: Lists alerts.
  - `GET /unread/count`: Counts unread items (essential for bell count badges).
  - `PUT /:id/read`: Marks read.
  - `PUT /mark-all-read`: Marks all read.
  - `DELETE /:id`: Removes alert.
- **`providerRoutes.js` [NEW]:**
  - `GET /`: Lists providers (supports Category, Text Search, and Star rating queries). It automatically seeds sample specialists if the database is empty.
  - `GET /:providerId`: Specific profile details.
- **`uploadRoutes.js` [NEW]:**
  - `POST /image`: Uploads images locally using `multer`, returning public static URLs.

---

## 5. Logic Behind Core Features

### 5.1. Real-Time Notification Badge Synchronization
The Home Screen header features a notification bell with a red badge count:
- The context runs a `useEffect` loop that queries `/api/notifications/unread/count` on mount.
- To simulate real-time notification drops without configuring complex WebSockets, the React Native client uses a secure 15-second polling interval. When status changes are triggered on the server, the unread count automatically ticks up on the mobile app.

### 5.2. Star Ratings Aggregation Calculations
When a user reviews a booking, the average rating must update dynamically:
$$\text{Average Rating} = \frac{\sum \text{All Star Ratings for Provider}}{\text{Total Reviews Count}}$$
The `reviewRoutes.js` controller executes this arithmetic using MongoDB aggregate functions, rounding to 1 decimal place before writing it back to the `Provider` record.

### 5.3. GST Invoice Calculations & Promo Code Discounts
The booking form computes itemized invoices dynamically using `useMemo`:
1. **Subtotal:** Sums up the prices of all checked services times their quantities:
   $$\text{Subtotal} = \sum (\text{Base Price} \times \text{Quantity})$$
2. **Promo Discount:** Tying `DISCOUNT10` into the form applies a 10% discount:
   $$\text{Discount} = \text{Subtotal} \times 0.10$$
3. **GST Tax (5%):** Applies a standard 5% tax rate on the discounted subtotal:
   $$\text{GST Tax} = (\text{Subtotal} - \text{Discount}) \times 0.05$$
4. **Total Payment:** Sums up Subtotal, Service Charge (Rs. 99), and GST Tax while subtracting Promo Discounts.

### 5.4. Favorites persistence
Favorites are saved in memory and backed up directly in the device's storage using `AsyncStorage`. Toggling a heart icon instantly adds or removes a service ID from this persistent list, allowing the Favorites screen to load quickly offline.

---

## 6. Comprehensive Setup & Installation Guide

Follow these simple steps to run the application on your computer:

### Step 1: Install Prerequisites
1.  **Node.js**: Download and install Node.js (LTS Version 18 or 20) from [nodejs.org](https://nodejs.org/).
2.  **MongoDB**: Download and start **MongoDB Community Server** and **MongoDB Compass** locally on your PC.

### Step 2: Start the Backend Server
1.  Navigate into the `server/` directory:
    ```bash
    cd server
    ```
2.  Install dependencies (including Express, Mongoose, Multer, and Bcryptjs):
    ```bash
    npm install
    ```
3.  Configure your environment in `.env` (pre-configured for you):
    ```env
    PORT=5000
    MONGODB_URI=mongodb://127.0.0.1:27017/mahir_home_services
    JWT_SECRET=mahir_jwt_secret_key_2026_spring
    JWT_EXPIRES_IN=7d
    ```
4.  Start the server:
    ```bash
    npm start
    ```
    *Stdout prints: `MongoDB connected` and `API server running on http://localhost:5000`.*

### Step 3: Run the React Native Mobile App
1.  Configure `utils/apiConfig.js` (for Android emulators, keep the host set as `'10.0.2.2'`; for web browsers, it connects automatically to `localhost`).
2.  Navigate to your project root folder.
3.  Install packages:
    ```bash
    npm install
    ```
4.  Start Expo:
    ```bash
    npx expo start
    ```
5.  Press **`w`** on your keyboard to open the mobile application instantly in your Web Browser, or scan the QR code to run it on your smartphone!

---

## 7. How to Test the Advanced Features

1.  **Search & Filters:** On the Home Screen, type `cleaning` into the search bar, or tap the **Top Rated (4.7+)** filter chip to instantly filter down listings.
2.  **Favorites:** Tap the heart icon on a service card. Navigate to **Saved Services** (on the home screen filter or in the navigation) to see it persisted. Tap **Book Now** to skip forms and book it!
3.  **Promo Code & GST Invoice:** In the booking form, type `DISCOUNT10` into the promo box and click **Apply**. Verify the detailed invoice updates instantly, showing the 10% discount and 5% GST itemization.
4.  **Notifications Bell Badge:** Place a booking. Go to the Home Screen header. The notification bell will now display a red circular badge `1`. Tap it to open your new **Notifications** screen, see the "Booking Placed Successfully!" alert, and tap to mark it as read!
5.  **Booking Cancellation:** Go to "Your Bookings", click cancel, enter a cancellation reason, and watch the status transition to **"Cancelled"** in MongoDB and on your mobile screen in real-time.
