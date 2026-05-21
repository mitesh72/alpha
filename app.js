import express from "express";

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcrypt";
import multer from "multer";
import Razorpay from "razorpay";
import crypto from "crypto";
import mongoose from "mongoose";
import collection from "./config.js";
import Product from "./productModel.js";
import Cart from "./cartModel.js";
import { PORT } from "./env.js";
import jwt from "jsonwebtoken";
dotenv.config();
// Middleware to protect admin routes
function requireAdmin(req, res, next) {
  const token = req.headers["x-admin-token"];
 
  if (!token) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
 
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "admin") {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    req.admin = decoded;
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
}

// ------------------ PATH ------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ------------------ APP ------------------
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, "public")));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));



// ------------------ RAZORPAY ------------------
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// ------------------ ORDER MODEL ------------------
const orderSchema = new mongoose.Schema({
  userId:    String,
  items:     Array,
  amount:    Number,
  paymentId: String,
  shipping: {
    name:    String,
    phone:   String,
    email:   String,
    address: String,
    pincode: String,
    city:    String,
    state:   String
  },
  status:    { type: String, default: "Paid" },
  createdAt: { type: Date, default: Date.now }
});
 
const Order = mongoose.model("Order", orderSchema);
// ------------------ CHATBOT (FAQ Based) ------------------

app.post("/chat", async (req, res) => {
  const userMessage = req.body.message?.trim();

  if (!userMessage) {
    return res.json({ reply: "Please type a message." });
  }

  const msg = userMessage.toLowerCase();

  // --- Greetings ---
  if (msg.match(/^(hi|hello|hey|hii|helo|namaste|namaskar|yo|sup)[\s!]*$/)) {
    return res.json({ reply: "Hey there! 👋 Welcome to Desi Gabru! I'm Alpha Groom, your grooming assistant. Ask me about our products, shipping, returns, or anything else! 😊" });
  }

  // --- Beard Care ---
  if (msg.includes("beard oil")) {
    return res.json({ reply: "Our **Beard Oil** deeply nourishes your beard and skin underneath, reducing itchiness and giving a healthy shine. Great for daily use! 🧔 Check it out in the Beard section." });
  }
  if (msg.includes("beard wax")) {
    return res.json({ reply: "**Beard Wax** gives you a strong hold to style and shape your beard exactly how you want. Perfect for groomed looks! 💪 Available in the Beard section." });
  }
  if (msg.includes("beard serum") || msg.includes("beard growth")) {
    return res.json({ reply: "Our **Beard Growth Serum** is packed with nutrients to boost beard growth and fill in patches. Apply daily for best results! 🌱 Find it in the Beard section." });
  }
  if (msg.includes("beard shampoo")) {
    return res.json({ reply: "**Beard Shampoo** gently cleanses your beard without stripping natural oils, keeping it soft and fresh. Use 2-3 times a week! 🚿 Available in the Beard section." });
  }
  if (msg.includes("beard conditioner") || msg.includes("beard softner") || msg.includes("beard softener")) {
    return res.json({ reply: "Our **Beard Conditioner/Softener** makes your beard incredibly soft and manageable. Great after shampooing! ✨ Check the Beard section." });
  }
  if (msg.includes("beard")) {
    return res.json({ reply: "We have a full beard care range! 🧔\n\n• Beard Oil — nourishes & softens\n• Beard Growth Serum — promotes growth\n• Beard Wax — styling & hold\n• Beard Shampoo — gentle cleansing\n• Beard Conditioner — extra softness\n\nVisit the Beard section to explore all!" });
  }

  // --- Hair Care ---
  if (msg.includes("hair wax")) {
    return res.json({ reply: "**Hair Wax** gives a strong, flexible hold for all hairstyles. Matte finish, easy to wash out. Perfect for daily styling! 💇 Check the Hair section." });
  }
  if (msg.includes("hair clay")) {
    return res.json({ reply: "**Hair Clay** provides a natural matte finish with a medium-strong hold. Great for textured, casual looks! 🎨 Available in the Hair section." });
  }
  if (msg.includes("hair serum")) {
    return res.json({ reply: "**Hair Serum** controls frizz, adds shine and protects from heat damage. Apply a few drops on damp or dry hair! ✨ Find it in the Hair section." });
  }
  if (msg.includes("hair spray")) {
    return res.json({ reply: "**Hair Spray** keeps your hairstyle locked in place all day. Lightweight formula, no sticky residue! 💨 Check the Hair section." });
  }
  if (msg.includes("shampoo") || msg.includes("dandruff")) {
    return res.json({ reply: "Our **Anti-Dandruff Shampoo** effectively fights dandruff while keeping your scalp healthy and hair clean. Use regularly for best results! 🚿 Available in the Hair section." });
  }
  if (msg.includes("hair")) {
    return res.json({ reply: "Our hair care lineup has you covered! 💇\n\n• Hair Wax — strong hold styling\n• Hair Clay — matte natural look\n• Hair Serum — frizz control & shine\n• Hair Spray — all-day hold\n• Anti-Dandruff Shampoo — clean scalp\n\nVisit the Hair section to shop!" });
  }

  // --- Skincare / Face ---
  if (msg.includes("face wash") || msg.includes("facewash")) {
    return res.json({ reply: "Our **Charcoal Face Wash** deeply cleanses pores, removes oil and dirt, and leaves skin fresh and clear. Use twice daily! 🌊 Available in the Face section." });
  }
  if (msg.includes("face serum") || msg.includes("vitamin c") || msg.includes("serum")) {
    return res.json({ reply: "Our **Vitamin C Face Serum** brightens skin, reduces dark spots and gives a healthy glow. Apply after washing face, before moisturiser! ✨ Check the Face section." });
  }
  if (msg.includes("face mask") || msg.includes("charcoal mask") || msg.includes("charcol")) {
    return res.json({ reply: "**Charcoal Face Mask** pulls out blackheads, unclogs pores and leaves skin super smooth. Use 1-2 times a week! 😮 Find it in the Face section." });
  }
  if (msg.includes("scrub") || msg.includes("face scrub")) {
    return res.json({ reply: "Our **Face Scrub** exfoliates dead skin cells, revealing fresher, brighter skin underneath. Use 2-3 times a week for best results! 🌟 Available in the Face section." });
  }
  if (msg.includes("moistur")) {
    return res.json({ reply: "**Moisturising Cream** keeps your skin hydrated all day, preventing dryness and keeping skin soft. Apply morning and night! 💧 Check the Face section." });
  }
  if (msg.includes("face") || msg.includes("skin") || msg.includes("skincare")) {
    return res.json({ reply: "Our skincare range is made for men's skin! 🧴\n\n• Charcoal Face Wash — deep cleanse\n• Vitamin C Serum — glow & brightness\n• Charcoal Face Mask — pore cleansing\n• Face Scrub — exfoliation\n• Moisturising Cream — hydration\n\nVisit the Face section to explore!" });
  }

  // --- Perfume / Fragrance ---
  if (msg.includes("attar")) {
    return res.json({ reply: "Our **Attars** are long-lasting, alcohol-free natural fragrances inspired by classic Indian scents. A small drop goes a long way! 🌸 Check the Perfume section." });
  }
  if (msg.includes("deo") || msg.includes("deodrant") || msg.includes("deodorant")) {
    return res.json({ reply: "Our **Deodorant** keeps you fresh and odour-free all day. Strong protection, great fragrance! 💨 Available in the Perfume section." });
  }
  if (msg.includes("body spray")) {
    return res.json({ reply: "**Body Spray** gives a refreshing burst of fragrance perfect for everyday use. Light yet long-lasting! 🌊 Check the Perfume section." });
  }
  if (msg.includes("perfume") || msg.includes("fragrance") || msg.includes("smell") || msg.includes("scent")) {
    return res.json({ reply: "Smell amazing with Desi Gabru! 🌸\n\n• Perfume — premium long-lasting\n• Attar — natural alcohol-free fragrance\n• Body Spray — everyday freshness\n• Deodorant — all-day odour protection\n\nVisit the Perfume section to find your signature scent!" });
  }

  // --- Grooming Kit / Combo ---
  if (msg.includes("kit") || msg.includes("grooming kit") || msg.includes("combo")) {
    return res.json({ reply: "Our **Grooming Kits & Combos** are the best value! 🎁 Get multiple products bundled together at a great price. Perfect for gifting too! Check the Grooming Kit or Combo sections." });
  }

  // --- Shipping ---
  if (msg.includes("ship") || msg.includes("deliver") || msg.includes("delivery time") || msg.includes("how long")) {
    return res.json({ reply: "🚚 **Shipping Info:**\n\n• Delivery time: 3-5 business days across India\n• Cash on Delivery (COD) is available\n• Free shipping on orders above a certain amount\n\nHappy shopping! 😊" });
  }

  // --- Returns / Refunds ---
  if (msg.includes("return") || msg.includes("refund") || msg.includes("exchange")) {
    return res.json({ reply: "📦 **Return & Refund Policy:**\n\n• 7-day return window from delivery date\n• Product must be unused and in original packaging\n• Contact our support to initiate a return\n\nWe've got you covered! 😊" });
  }

  // --- COD ---
  if (msg.includes("cod") || msg.includes("cash on delivery") || msg.includes("payment")) {
    return res.json({ reply: "💵 **Payment Options:**\n\n• Cash on Delivery (COD) — Yes, available!\n• Online payment via Razorpay (cards, UPI, net banking)\n\nPay however you like! 😊" });
  }

  // --- Order / Tracking ---
  if (msg.includes("order") || msg.includes("track") || msg.includes("my order")) {
    return res.json({ reply: "📋 To check your orders, go to **My Orders** page after logging in. You can see all your past and current orders there! If you have an issue, feel free to contact us. 😊" });
  }

  // --- Contact / Support ---
  if (msg.includes("contact") || msg.includes("support") || msg.includes("help") || msg.includes("number") || msg.includes("email")) {
    return res.json({ reply: "📞 **Need Help?**\n\nFor any queries, reach out to us and our team will assist you. You can also drop a message here and we'll do our best to help! 😊" });
  }

  // --- About / Brand ---
  if (msg.includes("about") || msg.includes("brand") || msg.includes("desi gabru") || msg.includes("who are you")) {
    return res.json({ reply: "🇮🇳 **About Desi Gabru:**\n\nWe are a premium Indian men's grooming brand offering high-quality beard care, hair care, skincare, and fragrance products — made specifically for the modern Indian man!\n\nOur mission: Look good, feel great. 💪" });
  }

  // --- Thanks ---
  if (msg.match(/(thank|thanks|thankyou|shukriya|dhanyawad)/)) {
    return res.json({ reply: "You're welcome! 😊 Feel free to ask anything else. Happy grooming! 🧔✨" });
  }

  // --- Default fallback ---
  return res.json({ reply: "I'm here to help! 😊 You can ask me about:\n\n🧔 Beard Care\n💇 Hair Care\n🧴 Skincare / Face\n🌸 Perfumes & Fragrances\n🎁 Grooming Kits\n🚚 Shipping & Delivery\n📦 Returns & Refunds\n💵 Payment Options\n\nWhat would you like to know?" });
});

// ------------------ COD ORDER ------------------
app.post("/place-cod-order", async (req, res) => {
  try {
    const { userId, items, amount, shipping } = req.body;

    const newOrder = await Order.create({
      userId,
      items,
      amount,
      paymentId: "COD",
      status: "Pending",
      shipping
    });

    res.json({ success: true, orderId: newOrder._id });
  } catch (err) {
    console.error("COD order error:", err);
    res.status(500).json({ success: false });
  }
});

// ------------------ CREATE ORDER ------------------
app.post("/create-order", async (req, res) => {
  try {
    const { amount } = req.body;

    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: "order_" + Date.now()
    });

    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error creating order");
  }
});

// ------------------ VERIFY PAYMENT ------------------
app.get("/api/config", (req, res) => {
  res.json({ razorpayKey: process.env.RAZORPAY_KEY_ID });
});
app.post("/verify-payment", async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      userId,
      items,
      amount,
      shipping
    } = req.body;
 
    const body = razorpay_order_id + "|" + razorpay_payment_id;
 
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");
 
    if (expected === razorpay_signature) {
      const newOrder = await Order.create({
        userId,
        items,
        amount,
        paymentId: razorpay_payment_id,
        shipping   // ✅ now saved
      });
 
      return res.json({ success: true, orderId: newOrder._id });
    }
 
    res.json({ success: false });
 
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});
// ------------------ ORDER HISTORY ------------------
app.get("/api/orders/:userId", async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});
 
// -----------------------------
// Multer config (image uploads)
// -----------------------------
const storage = multer.diskStorage({
  destination: "public/uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });
// ------------------ PRODUCTS ------------------
app.get("/api/products", async (req, res) => {
  res.json(await Product.find());
});

app.get("/api/products/:id", async (req, res) => {
  res.json(await Product.findById(req.params.id));
});
// Edit product (admin only)
app.put("/api/products/:id", requireAdmin, upload.single("image"), async (req, res) => {
  try {
    const { name, price, old_price, description } = req.body;
 
    const update = { name, price, old_price, description };
 
    // Only update image if a new one was uploaded
    if (req.file) {
      update.image = "/uploads/" + req.file.filename;
    }
 
    const product = await Product.findByIdAndUpdate(req.params.id, update, { new: true });
 
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
 
    res.json({ success: true, product });
  } catch (err) {
    console.error("Edit product error:", err);
    res.status(500).json({ success: false, message: "Failed to update product" });
  }
});
 
app.delete("/api/products/:id", requireAdmin, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Product deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Delete failed" });
  }
});
app.post("/api/products", requireAdmin, upload.single("image"), async (req, res) => {
  try {
    const { name, price, old_price, description } = req.body;
 
    const newProduct = await Product.create({
      name,
      price,
      old_price,
      description,
      image: "/uploads/" + req.file.filename
    });
 
    res.json({ success: true, product: newProduct });
 
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error adding product" });
  }
});
// ------------------ CART ------------------
app.get("/api/cart/:userId", async (req, res) => {
  let cart = await Cart.findOne({ userId: req.params.userId });

  if (!cart) {
    cart = await Cart.create({ userId: req.params.userId, items: [] });
  }

  res.json(cart);
});

app.post("/api/cart/update", async (req, res) => {
  const { userId, items } = req.body;

  await Cart.findOneAndUpdate(
    { userId },
    { items },
    { upsert: true }
  );

  res.json({ success: true });
});
// -----------------------------
// Create default admin
// -----------------------------
const createDefaultAdmin = async () => {
  const admin = await collection.findOne({ name: "admin" });

  if (!admin) {
    const hashedPassword = await bcrypt.hash("admin123", 10);

    await collection.create({
      name: "admin",
      password: hashedPassword,
      role: "admin"
    });

    console.log("Default admin created → username: admin | password: admin123");
  } else {
    console.log("Admin already exists");
  }
};

createDefaultAdmin();



// -----------------------------
// ROUTES
// -----------------------------

// Login page
app.get("/login", (req, res) => {
  res.render("login"); // make sure login.ejs exists
});

// Signup page
app.get("/signup", (req, res) => {
  res.render("signup"); // make sure signup.ejs exists
});

// Admin dashboard
app.get("/admin", (req, res) => {
  // Serve the admin page — protection happens client-side on load
  // and all admin API calls are protected server-side
  res.sendFile(path.join(__dirname, "public", "admin", "admin.html"));
});
 
// Verify admin token (called by admin.html on page load)
app.get("/admin/api/verify", requireAdmin, (req, res) => {
  res.json({ success: true });
});
 
// Admin logout
app.post("/admin/api/logout", (req, res) => {
  res.json({ success: true });
});

// -----------------------------
// SIGNUP
// -----------------------------
app.post("/signup", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.json({ success: false, message: "Please fill all fields" });
    }

    const existingUser = await collection.findOne({ name: username });

    if (existingUser) {
      return res.json({ success: false, message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await collection.create({
      name: username,
      password: hashedPassword,
      role: "user"
    });

    res.json({
      success: true,
      userId: newUser._id,
      message: "Signup successful"
    });

  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Signup error" });
  }
});

// -----------------------------
// LOGIN
// -----------------------------

app.post("/login", async (req, res) => {
  try {
    const user = await collection.findOne({ name: req.body.username });
 
    if (!user) {
      return res.json({ success: false, message: "Username not found" });
    }
 
    const isPasswordMatch = await bcrypt.compare(req.body.password, user.password);
 
    if (!isPasswordMatch) {
      return res.json({ success: false, message: "Wrong password" });
    }
 
    // Generate admin token if role is admin
    let adminToken = null;
    if (user.role === "admin") {
      adminToken = jwt.sign(
        { userId: user._id, role: "admin" },
        process.env.JWT_SECRET,
        { expiresIn: "8h" }
      );
    }
 
    res.json({
      success: true,
      userId: user._id,
      role: user.role || "user",
      adminToken   // null for regular users
    });
 
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Login error" });
  }
});
 // 1. GET all orders (admin only)
app.get("/api/admin/orders", requireAdmin, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});
 
// 2. PATCH order status (admin only)
app.patch("/api/admin/orders/:id/status", requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["Paid", "Shipped", "Delivered", "Cancelled"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }
    await Order.findByIdAndUpdate(req.params.id, { status });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: "Update failed" });
  }
});
 
  //--------my orders----------
// TRACK ORDER ROUTE
app.get("/orders/track", async (req, res) => {
  const { id } = req.query;
  if (!id) return res.json({ success: false, message: "Order ID is required." });
  try {
    const order = await Order.findById(id).lean();
    if (!order) return res.json({ success: false, message: "Order not found. Please check the ID." });
    res.json({ success: true, order });
  } catch {
    res.json({ success: false, message: "Invalid Order ID format." });
  }
});

app.get("/orders", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "orders.html"));
}); 

// ------------------ SERVER ------------------
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});