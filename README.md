# 🍽️ L'Aura Bistro & Bar — Full-Stack Restaurant Menu Website

A modern, responsive full-stack Restaurant Menu web application featuring a **Node.js/Express (JavaScript)** backend and a luxury **HTML5/CSS3/Vanilla JavaScript** frontend.

---

## 🚀 Features

- **Dynamic Menu Catalog**:
  - Live category filtering (Starters, Mains, Pizza & Pasta, Desserts, Cocktails, Chef's Specials).
  - Dietary filters (🌱 Vegetarian, 🌿 Vegan, 🌾 Gluten-Free, 🌶️ Spicy).
  - Multi-criteria sorting (Price: Low/High, Rating, Name).
  - Instant live keyword search (by dish name, description, ingredients).
- **Interactive Quick View & Dish Details Modal**:
  - Nutrition calories, preparation time, allergen warnings, full ingredient breakdown.
  - Quantity selector directly in the modal.
- **Cart & Order Drawer**:
  - Persistent cart state saved in `localStorage`.
  - Dining mode / Table number selector (Table 1-4 or Takeaway).
  - Real-time tax & total calculations.
  - Generates instant kitchen ticket receipt with unique Order ID and estimated prep time.
- **Table Reservation System**:
  - Book tables with date, time, party size, and special seating requests.
- **Manager / Admin Dish Creation**:
  - Add new dishes directly to the menu via the UI, saving directly to `data/menu.json` via backend REST API.

---

## 📁 Project Structure

```
c:\Users\ganga\OneDrive\Desktop\html\
├── package.json          # Node.js dependencies & scripts
├── server.js            # Express server & REST API routes
├── data/
│   └── menu.json        # Restaurant menu items database
└── public/              # Static Frontend assets
    ├── index.html       # HTML5 structure & modals
    ├── css/
    │   └── style.css    # Modern luxury restaurant styling
    └── js/
        └── app.js       # Client-side state, API calls & UI interactions
```

---

## 🏃 How to Run

1. Open your terminal in this directory:
   ```powershell
   cd c:\Users\ganga\OneDrive\Desktop\html
   ```

2. Start the Node.js backend server:
   ```powershell
   node server.js
   ```

3. Open your browser and navigate to:
   ```
   http://localhost:3001
   ```
   *(If port 3000 is open, it will run on 3000; otherwise it automatically falls back to 3001).*

---

## 🔌 Backend REST APIs

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/categories` | Returns categories with dish counts |
| `GET` | `/api/menu` | Query params: `category`, `search`, `diet`, `sort` |
| `GET` | `/api/menu/:id` | Single dish details |
| `POST` | `/api/menu` | Add a new dish to the menu database |
| `DELETE` | `/api/menu/:id` | Delete a dish |
| `POST` | `/api/orders` | Submit order & calculate bill summary |
| `POST` | `/api/reservations` | Reserve a dining table |
