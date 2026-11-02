const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Path to data file
const menuFilePath = path.join(__dirname, 'data', 'menu.json');

// Helper to read menu data
function getMenuData() {
  try {
    const raw = fs.readFileSync(menuFilePath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    console.error('Error reading menu data:', error);
    return [];
  }
}

// Helper to save menu data
function saveMenuData(data) {
  try {
    fs.writeFileSync(menuFilePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing menu data:', error);
    return false;
  }
}

// In-memory store for orders and table reservations
let orders = [];
let reservations = [];

// ================= API ROUTES =================

/**
 * GET /api/categories
 * Returns list of categories with counts
 */
app.get('/api/categories', (req, res) => {
  const menu = getMenuData();
  const categoryMap = {
    all: { id: 'all', name: 'All Items', icon: '🍽️', count: menu.length },
    specials: { id: 'specials', name: "Chef's Specials", icon: '⭐', count: menu.filter(i => i.isChefSpecial).length },
    starters: { id: 'starters', name: 'Starters & Bites', icon: '🥗', count: menu.filter(i => i.category === 'starters').length },
    mains: { id: 'mains', name: 'Main Courses', icon: '🥩', count: menu.filter(i => i.category === 'mains').length },
    'pizza-pasta': { id: 'pizza-pasta', name: 'Artisan Pizza & Pasta', icon: '🍕', count: menu.filter(i => i.category === 'pizza-pasta').length },
    desserts: { id: 'desserts', name: 'Desserts', icon: '🍰', count: menu.filter(i => i.category === 'desserts').length },
    drinks: { id: 'drinks', name: 'Beverages & Cocktails', icon: '🍸', count: menu.filter(i => i.category === 'drinks').length }
  };
  res.json(Object.values(categoryMap));
});

/**
 * GET /api/menu
 * Filter, search, and sort menu items
 */
app.get('/api/menu', (req, res) => {
  let menu = getMenuData();
  const { category, search, diet, sort } = req.query;

  // Filter by category
  if (category && category !== 'all') {
    if (category === 'specials') {
      menu = menu.filter(item => item.isChefSpecial);
    } else {
      menu = menu.filter(item => item.category === category);
    }
  }

  // Filter by dietary preference
  if (diet) {
    if (diet === 'vegetarian') menu = menu.filter(item => item.isVegetarian);
    if (diet === 'vegan') menu = menu.filter(item => item.isVegan);
    if (diet === 'glutenFree') menu = menu.filter(item => item.isGlutenFree);
    if (diet === 'spicy') menu = menu.filter(item => item.spiceLevel > 0);
  }

  // Filter by search query (name, description, ingredients)
  if (search && search.trim() !== '') {
    const q = search.trim().toLowerCase();
    menu = menu.filter(item => 
      item.name.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      (item.ingredients && item.ingredients.some(ing => ing.toLowerCase().includes(q)))
    );
  }

  // Sorting
  if (sort) {
    if (sort === 'price-asc') {
      menu.sort((a, b) => a.price - b.price);
    } else if (sort === 'price-desc') {
      menu.sort((a, b) => b.price - a.price);
    } else if (sort === 'rating-desc') {
      menu.sort((a, b) => b.rating - a.rating);
    } else if (sort === 'name-asc') {
      menu.sort((a, b) => a.name.localeCompare(b.name));
    }
  }

  res.json({
    total: menu.length,
    items: menu
  });
});

/**
 * GET /api/menu/:id
 * Retrieve single menu item
 */
app.get('/api/menu/:id', (req, res) => {
  const menu = getMenuData();
  const id = parseInt(req.params.id, 10);
  const item = menu.find(i => i.id === id);

  if (!item) {
    return res.status(404).json({ error: 'Menu item not found' });
  }

  res.json(item);
});

/**
 * POST /api/menu
 * Create a new menu item
 */
app.post('/api/menu', (req, res) => {
  const { name, category, price, description, image, ingredients, calories, prepTime, isVegetarian, isChefSpecial, spiceLevel } = req.body;

  if (!name || !price || !category) {
    return res.status(400).json({ error: 'Name, price, and category are required fields.' });
  }

  const menu = getMenuData();
  const newItem = {
    id: menu.length > 0 ? Math.max(...menu.map(m => m.id)) + 1 : 1,
    name: name.trim(),
    category,
    price: parseFloat(price),
    description: description || 'Freshly prepared signature dish.',
    image: image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    rating: 5.0,
    reviewsCount: 1,
    isVegetarian: Boolean(isVegetarian),
    isVegan: false,
    isGlutenFree: false,
    spiceLevel: parseInt(spiceLevel || 0, 10),
    isChefSpecial: Boolean(isChefSpecial),
    prepTime: prepTime || '15 min',
    calories: calories || '400 kcal',
    ingredients: Array.isArray(ingredients) ? ingredients : (ingredients ? ingredients.split(',').map(s => s.trim()) : []),
    allergens: []
  };

  menu.push(newItem);
  if (saveMenuData(menu)) {
    res.status(201).json({ message: 'Item created successfully', item: newItem });
  } else {
    res.status(500).json({ error: 'Failed to save new menu item.' });
  }
});

/**
 * DELETE /api/menu/:id
 * Delete a menu item
 */
app.delete('/api/menu/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  let menu = getMenuData();
  const initialLength = menu.length;
  menu = menu.filter(i => i.id !== id);

  if (menu.length === initialLength) {
    return res.status(404).json({ error: 'Item not found' });
  }

  saveMenuData(menu);
  res.json({ message: 'Menu item deleted successfully' });
});

/**
 * POST /api/orders
 * Place an order
 */
app.post('/api/orders', (req, res) => {
  const { items, customerName, tableNumber, notes } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Your cart is empty.' });
  }

  const menu = getMenuData();
  let subtotal = 0;
  const orderItems = [];

  for (const item of items) {
    const menuItem = menu.find(m => m.id === item.id);
    if (menuItem) {
      const quantity = Math.max(1, parseInt(item.quantity || 1, 10));
      const itemTotal = menuItem.price * quantity;
      subtotal += itemTotal;
      orderItems.push({
        id: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        quantity,
        total: itemTotal
      });
    }
  }

  const tax = +(subtotal * 0.08).toFixed(2);
  const total = +(subtotal + tax).toFixed(2);
  const orderId = 'ORD-' + Math.floor(100000 + Math.random() * 900000);

  const order = {
    orderId,
    timestamp: new Date().toISOString(),
    customerName: customerName || 'Guest Diner',
    tableNumber: tableNumber || 'Takeaway / Bar',
    notes: notes || '',
    items: orderItems,
    subtotal: +subtotal.toFixed(2),
    tax,
    total,
    status: 'Confirmed & In Kitchen',
    estimatedTime: '20-25 mins'
  };

  orders.push(order);

  res.status(201).json({
    message: 'Order placed successfully!',
    order
  });
});

/**
 * POST /api/reservations
 * Book a dining table
 */
app.post('/api/reservations', (req, res) => {
  const { name, phone, guests, date, time, specialRequest } = req.body;

  if (!name || !phone || !date || !time) {
    return res.status(400).json({ error: 'Please provide name, phone, date, and time.' });
  }

  const reservationCode = 'RES-' + Math.floor(1000 + Math.random() * 9000);
  const reservation = {
    code: reservationCode,
    name,
    phone,
    guests: guests || 2,
    date,
    time,
    specialRequest: specialRequest || '',
    status: 'Confirmed',
    createdAt: new Date().toISOString()
  };

  reservations.push(reservation);

  res.status(201).json({
    message: 'Table reservation confirmed!',
    reservation
  });
});

// Fallback to index.html for single-page style navigation
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Function to start server with automatic port fallback if busy
function startServer(port) {
  const server = app.listen(port, () => {
    console.log(`\n==================================================`);
    console.log(`🍽️  Restaurant Menu Server is running!`);
    console.log(`🌐 Local URL: http://localhost:${port}`);
    console.log(`📦 Serving static frontend from 'public/' directory`);
    console.log(`==================================================\n`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`⚠️  Port ${port} is in use, trying port ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('Server error:', err);
    }
  });
}

startServer(PORT);

