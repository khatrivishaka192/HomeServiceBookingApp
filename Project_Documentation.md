# PROJECT DOCUMENTATION
## Mahir Home Services Booking Application
**Course:** Hybrid Mobile Application Development  
**Academic Submission:** Project Documentation (Spring 2026)

---

## 1. Executive Summary & Project Scope

The **Mahir Home Services Booking Application** is a hybrid mobile app built with **React Native** and **Expo** on the frontend, and a **Node.js Express** server backed by a **MongoDB** database on the backend. 

It solves a real-world problem: booking trusted, professional local services (like deep cleaning, electrical repairs, plumbing work, painting, etc.) directly from a mobile phone with dynamic price estimations, multiple service bundling, and real-time history tracking.

---

## 2. Technological Stack

1. **Frontend Mobile App:**
   - **React Native & JSX:** For building native UI/UX layouts across multiple operating systems.
   - **Expo SDK 54 & Router:** Provides seamless routing through a directory-based structure (`app/`), supporting file-based stack and tab navigation.
   - **Context API & Hooks:** Centralized state management for session authentication and booking synchronization, utilizing hooks like `useContext`, `useMemo`, `useCallback`, `useEffect`, and `useRef`.
   - **Core UI Components:** Extensive utilization of native components including `FlatList` (with grid/list responsive toggles), `ScrollView` for smooth scrolling, `TextInput` with regex-validated phone/email inputs, `TouchableOpacity`, `Pressable`, and `ActivityIndicator` for loading states.

2. **Backend API Server:**
   - **Node.js & Express.js:** Handles routing, authentication, request validation, and service delivery as a high-performance RESTful API.
   - **JsonWebToken (JWT) & Bcryptjs:** Used for secure password hashing and stateless token-based authorization.
   - **MongoDB & Mongoose:** Handles document storage. Schema definitions organize data structure and map query operations seamlessly.

---

## 3. Frontend Architecture: Screens, Components & Contexts

### 3.1. Contexts (State Management)

*   `context/AuthContext.jsx`
    *   **Functionality:** Manages the active user's session state. It handles user signups, logins, and session bootstrapping.
    *   **Logic:** Upon signup/login, it receives a secure JWT token from the Express API, stores it persistently in the device's storage using `AsyncStorage`, and sets a global `user` state. On subsequent app launches, the bootstrap effect reads the saved token, sends an authenticated `GET /api/me` request to verify the session, and seamlessly restores the user profile.
*   `context/BookingsContext.jsx`
    *   **Functionality:** Synchronizes all booking activities between the mobile screen and the database.
    *   **Logic:** Listens to changes in the active user session. When a user is logged in, it automatically triggers a `GET /api/bookings` call sending the authorization token to retrieve their booking history. The `addBooking` function sends a `POST /api/bookings` call to register new orders, automatically prepending successfully created bookings in real-time.

### 3.2. Primary Layout & Navigation

*   `app/_layout.tsx`
    *   **Functionality:** Entry-point layout container wrapping the entire application in context providers (`AuthProvider` and `BookingsProvider`) to share authentication and bookings state globally, enabling immediate navigation redirection.
*   `app/(tabs)/_layout.tsx`
    *   **Functionality:** Employs the `expo-router` tab navigation controller to define bottom tab icons and routes for `home`, `categories`, and `profile` screens. It implements an authentication check: if a user is not authenticated, it automatically redirects them back to the welcome index screen.

### 3.3. Application Screens

*   `app/index.jsx` (Welcome Screen)
    *   **Functionality:** The splash/welcome landing screen. It features an interactive feature slider showing app highlights.
    *   **Logic:** Uses `useAuth` hook on mount. If `user.isLoggedIn` is true, it automatically routes the user to `(tabs)/home`. Otherwise, it plays a smooth fade-in and slide animation using `Animated` to present options to log in or register.
*   `app/login.jsx` (Login Screen)
    *   **Functionality:** Captures user email and password to log in.
    *   **Logic:** Employs an email regex pattern check. It invokes `loginUser` from `AuthContext` to submit credentials. Handles loading states via `ActivityIndicator` and displays errors on bad password or email matching.
*   `app/signup.jsx` (Registration Screen)
    *   **Functionality:** Enables new customers to register.
    *   **Logic:** Validates form inputs: checks if name is at least 3 letters, email is in a valid format, password is at least 6 letters, and ensures the confirm password field matches. On success, it registers the user and logs them in automatically.
*   `app/(tabs)/home.jsx` (Dashboard Screen)
    *   **Functionality:** The central dashboard showing personalized greetings, interactive service search, banners, and categories grid.
    *   **Logic:** Dynamically displays the user's name from `useAuth` and lists categories.
*   `app/(tabs)/categories.jsx` (Categories List Screen)
    *   **Functionality:** Shows all service categories in a flat list with counts. Clicking takes users to specific category sub-services.
*   `app/category-services.jsx` (Sub-Services Screen)
    *   **Functionality:** Shows detailed cards for individual sub-services under a chosen category (e.g. Deep Cleaning, Fan Repairing). Clicking "Book Service" launches the booking form.
*   `app/booking.jsx` (Booking Form Screen)
    *   **Functionality:** Highly interactive multi-service booking form.
    *   **Logic:**
        *   **Multi-service Bundling:** Users can toggle checkchips to add/remove multiple companion services.
        *   **Quantity Stepper:** Provides +/- buttons to change the quantity of each selected service.
        *   **Form Validation:** Validates booking date (`YYYY-MM-DD`), ensures the booking time falls inside business hours (8:00 AM to 9:00 PM), checks contact number format, and requires a complete address (minimum 10 characters).
        *   **Dynamic Billing:** Calculates subtotal, adds a constant service fee (Rs. 99), and sums up the total dynamically using the `useMemo` hook. On confirmation, makes a secure POST call to save the booking, showing a success modal on completion.
*   `app/my-bookings.jsx` (History Screen)
    *   **Functionality:** Lists all bookings recorded under the user's account in a responsive layout (automatically showing a 2-column grid on desktop and a single column list on phones).
    *   **Logic:** Consumes the `userBookings` array from `BookingsContext`. Uses custom date formatters and displays colored status pills corresponding to the order's state (Pending, Confirmed, Completed, etc.).
*   `app/(tabs)/profile.jsx` (User Profile Screen)
    *   **Functionality:** Displays user profile info, brief account stats (e.g., active bookings count), and supports clean session logout.

---

## 4. Backend Architecture: Database, Models & API Routes

### 4.1. Configuration & Models

*   `server/src/config/db.js`
    *   **Functionality:** Connects the Node server to the local or cloud MongoDB server using Mongoose.
*   `server/src/models/User.js`
    *   **Schema Details:** Defines fields for `name` (String, min 3), `email` (String, unique, lowercase), `password` (String, hidden by default), `phone` (String), and `role` (enum: customer/provider). Exposes `toPublicJSON()` to safely send user details without leaking hashed passwords.
*   `server/src/models/Booking.js`
    *   **Schema Details:** Stores `bookingId` (unique string key), `userId` (ObjectId referencing User model), `serviceType` (String), `bookingDate` (String), `bookingTime` (String), `price` (Number), `status` (Pending/Confirmed/Cancelled), `contactNumber`, `address`, `paymentMethod`, `subtotal`, `serviceCharge`, `totalPayment`, and a `services` sub-document array recording child services with quantities and totals.

### 4.2. Middleware & Routing

*   `server/src/middleware/auth.js`
    *   **Functionality:** Protects API endpoints. It extracts the Bearer token from the incoming request's `Authorization` header, decodes the JWT using the secret key, fetches the user from the database, and injects it into `req.user` for downstream routes.
*   `server/src/routes/authRoutes.js`
    *   **`POST /signup`**: Hashes passwords, inserts the new user document into MongoDB, creates a JWT token, and returns user details.
    *   **`POST /login`**: Validates credentials, checks hashed password compatibility, signs a JWT token, and returns user details.
    *   **`GET /me`**: Returns the public user profile for the token supplied in the authorization header.
*   `server/src/routes/bookingRoutes.js`
    *   **`POST /`**: Creates a new booking document in the database, automatically generating a unique ID (e.g., `BK-XXXX-YYYY`) and linking it to `req.user._id`.
    *   **`GET /`**: Searches and returns all booking documents linked to the user (`userId: req.user._id`), sorted by date in descending order.

---

## 5. Logic Behind Core Features

### 5.1. Context API vs. Redux State Management
In hybrid application development, centralizing data flow prevents duplicate state and race conditions:
*   **Redux Toolkit** is excellent for large-scale enterprise systems requiring heavy state mutations, strict debugging tools, and middleware pipelines.
*   **Context API** (chosen here) is lightweight, built natively into React, requires zero external packages (reducing bundle size), and is highly efficient for managing sessions and database-driven caches in medium-scale applications. It utilizes `useContext` to propagate session tokens and booking lists down the react tree efficiently without prop-drilling.

### 5.2. JWT Token & Route Protection
The mobile app keeps user sessions alive via token exchanges:
1. When a user logs in, the server generates a token containing their database ID, signed with a secret hash.
2. The frontend captures this token and saves it in device memory via `AsyncStorage`.
3. When fetching bookings, the context pulls the token and adds it to the HTTP Headers: `Authorization: Bearer <token>`.
4. The server intercepts and parses this token, establishing security context.

### 5.3. Price Aggregation & Service Bundling
The booking screen manages complex calculations using `useMemo`:
- `selectedServiceDetails` gathers every ticked service, matches its base price from static data, calculates the line total (`price * quantity`), and returns a list.
- `subtotal` reduces this list, adding all totals.
- `totalPayment` dynamically adds the fixed service charge (Rs. 99).
This ensures calculations are performed only when quantities or service selections change, optimizing mobile screen render performance.

---

## 6. Comprehensive Setup & Installation Guide

Follow these steps from scratch to run the application on your computer:

### Step 1: Install Prerequisites
1.  **Node.js**: Download and install Node.js (LTS Version 18 or 20) from [nodejs.org](https://nodejs.org/).
2.  **MongoDB**: 
    - Install **MongoDB Community Server** locally from [mongodb.com](https://www.mongodb.com/try/download/community) and ensure it runs on port `27017`.
    - Alternatively, install **MongoDB Compass** (visual interface tool) to easily see the database entries.

### Step 2: Configure and Start the Backend Server
1.  Navigate into the `server/` directory:
    ```bash
    cd server
    ```
2.  Configure environment variables in `.env` (a `.env` file has been pre-configured for you with default values):
    ```env
    PORT=5000
    MONGODB_URI=mongodb://127.0.0.1:27017/mahir_home_services
    JWT_SECRET=mahir_jwt_secret_key_2026_spring
    JWT_EXPIRES_IN=7d
    ```
3.  Install all backend dependencies:
    ```bash
    npm install
    ```
4.  Start the Express API server:
    ```bash
    npm start
    ```
    *You should see a message: `MongoDB connected` and `API server running on http://localhost:5000`.*

### Step 3: Configure and Start the React Native Frontend
1.  Open the main root directory of the React Native app.
2.  Configure your backend IP address in `utils/apiConfig.js`:
    - If running on **Android Emulator**, keep the IP set as `'10.0.2.2'` (this connects the emulator directly to the computer's localhost).
    - If running on **iOS Simulator** or **Web Browser**, it will automatically point to `localhost`.
    - If running on a **Physical Mobile Device** via Expo Go: Find your computer's local Wi-Fi IPv4 address (e.g. `192.168.1.105` via command `ipconfig` in cmd) and replace the `DEV_HOST` variable inside `utils/apiConfig.js` with your IP:
      ```javascript
      const DEV_HOST = '192.168.1.105'; // Replace with your IP!
      ```
3.  Install packages (if not already done):
    ```bash
    npm install
    ```
4.  Launch Expo client:
    ```bash
    npx expo start
    ```
5.  Run the application:
    - Press **`w`** to run in your Web Browser (highly recommended for instant testing).
    - Press **`a`** to open in Android Emulator.
    - Or scan the displayed QR code with your phone's camera (iOS) or **Expo Go** app (Android) to run on your actual physical phone!

---

## 7. How to View the Database & Test APIs

### 7.1. Viewing Database Collections (MongoDB Compass)
1. Open **MongoDB Compass**.
2. Create a connection to `mongodb://localhost:27017` and click **Connect**.
3. In the left panel, locate the database named **`mahir_home_services`**.
4. Inside, you will see two collections automatically created:
   - **`users`**: Contains registered accounts with names, emails, phones, and hashed passwords.
   - **`bookings`**: Contains created service bookings, sub-services lists, total charges, dates, addresses, and statuses.

### 7.2. Testing the APIs (Via Browser/Postman)
1.  **API Health Check**: Open `http://localhost:5000/api/health` in your browser. You will see:
    ```json
    { "success": true, "message": "Mahir Home Services API is running." }
    ```
2.  **API Requests**: You can test API endpoints like `/api/login` and `/api/bookings` using a tool like Postman by sending JSON request bodies and adding the returned JWT token to your request's Auth headers.
