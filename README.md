# Restaurant Billing — React Native (Expo) Frontend

## Setup

### 1. Install dependencies
```bash
cd restaurant_billing/frontend
npm install
```

### 2. Configure the API URL
Open `src/api/api.js` and update `BASE_URL` to your Django backend server's IP:
```js
const BASE_URL = 'http://YOUR_SERVER_IP:8000/api';
```
- Find your IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
- Make sure your phone and server are on the **same Wi-Fi network**

### 3. Start the app
```bash
npm start
# or
npx expo start
```
Scan the QR code with the **Expo Go** app on your phone.

---

## Screens

| Screen | Description |
|---|---|
| Dashboard | Stats overview + recent orders + New Bill button |
| Tables | Grid of tables (Available/Occupied) + Take Away option |
| Select Items | Main billing screen — add items, set payment mode, KOT/Bill |
| Order Details | View/edit order with discount, tax, payment mode |
| Bill | Receipt view with Print and Share |
| KOT | Kitchen Order Ticket view with Print |
| Orders List | All orders with filter tabs (All/Pending/KOT/Billed/Paid) |
| Menu Management | View and add/edit menu items by category |

## Navigation Structure

```
Bottom Tabs
├── Dashboard → Tables → SelectItems → Bill/KOT
├── Tables → SelectItems → Bill/KOT
├── Orders → OrderDetails → Bill/KOT
└── Menu (MenuManagement)
```

## Colors
- Primary: `#1565C0` (blue)
- KOT: `#E65100` (orange)
- Available: `#43A047` (green)
- Occupied: `#E53935` (red)
