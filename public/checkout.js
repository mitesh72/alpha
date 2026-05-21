// ============================================================
// checkout.js — FIXED VERSION
// Fixes: duplicate listener, hardcoded key, missing shipping fields
// ============================================================

let userId = localStorage.getItem("loggedUserId");

if (!userId) {
    alert("Please login before placing an order.");
    window.location.href = "/login";
}

let cartItems = [];
let allProducts = [];

init();

async function init() {
    await loadCart();
    await loadProductsDB();
    displayCheckoutItems();
    updateTotals();
}

async function loadCart() {
    const res = await fetch(`/api/cart/${userId}`);
    const data = await res.json();
    cartItems = data.items || [];
}

async function loadProductsDB() {
    const res = await fetch("/api/products");
    allProducts = await res.json();
}

function getBagProducts() {
    return cartItems
        .map(item => {
            const p = allProducts.find(x => x._id === item.productId);
            return p ? { ...p, qty: item.qty } : null;
        })
        .filter(Boolean);
}

function displayCheckoutItems() {
    const container = document.querySelector(".checkout-products");
    const products = getBagProducts();

    if (products.length === 0) {
        container.innerHTML = `<p style="color:#aaa;text-align:center;">Your cart is empty</p>`;
        return;
    }

    container.innerHTML = products.map(p => `
        <div class="checkout-product">
            <img src="${p.image}" style="width:60px;height:60px;object-fit:cover;border-radius:8px;">
            <div style="flex:1;padding:0 10px;">
                <p style="margin:0;font-weight:bold;">${p.name}</p>
                <p style="margin:0;color:#aaa;">Qty: ${p.qty}</p>
            </div>
            <p style="font-weight:bold;">₹${p.price * p.qty}</p>
        </div>
    `).join("");
}

function updateTotals() {
    const products = getBagProducts();
    let subtotal = products.reduce((sum, p) => sum + (p.old_price || p.price) * p.qty, 0);
    let total = products.reduce((sum, p) => sum + p.price * p.qty, 0);
    let discount = subtotal - total;

    document.querySelector(".subtotal").innerText = `₹${subtotal}`;
    document.querySelector(".discount").innerText = `₹${discount}`;
    document.querySelector(".total").innerText = `₹${total}`;
}

// ✅ FIX 2 — Single DOMContentLoaded listener (no duplicate)
window.addEventListener("DOMContentLoaded", () => {
    const btn = document.querySelector(".place-order-btn");
    if (btn) {
        btn.addEventListener("click", payNow);
    }
});

async function payNow() {
    const name    = document.querySelector("input[placeholder='Enter your name']").value.trim();
    const phone   = document.querySelector("input[placeholder='Enter phone number']").value.trim();
    const email   = document.querySelector("input[placeholder='Enter email']").value.trim();
    const address = document.querySelector("textarea").value.trim();
    const pincode = document.querySelector("input[placeholder='Enter pincode']").value.trim();
    const city    = document.querySelector("input[placeholder='Enter city']").value.trim();
    const state   = document.querySelector("input[placeholder='Enter state']").value.trim();

    if (!name || !phone || !address || !pincode || !city || !state) {
        alert("Please fill all shipping details");
        return;
    }

    const products = getBagProducts();
    if (products.length === 0) {
        alert("Your cart is empty!");
        return;
    }

    const amount = products.reduce((sum, p) => sum + p.price * p.qty, 0);

    // ✅ Check which payment method is selected
    const selectedPayment = document.querySelector("input[name='payment']:checked");
    if (!selectedPayment) {
        alert("Please select a payment method.");
        return;
    }

    const paymentMethod = selectedPayment.value; // "cod" or "online"

    // ─── COD FLOW ────────────────────────────────────────────
    if (paymentMethod === "cod") {
        const res = await fetch("/place-cod-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                userId,
                items: products,
                amount,
                shipping: { name, phone, email, address, pincode, city, state }
            })
        });

        const data = await res.json();

        if (data.success) {
            // Clear cart
            await fetch("/api/cart/update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, items: [] })
            });
            window.location.href = `/success.html?orderId=${data.orderId}`;
        } else {
            alert("Failed to place order. Please try again.");
        }
        return;
    }

    // ─── ONLINE PAYMENT FLOW (Razorpay) ──────────────────────
    const configRes = await fetch("/api/config");
    const config = await configRes.json();

    const order = await fetch("/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount })
    }).then(r => r.json());

    const rzp = new Razorpay({
        key: config.razorpayKey,
        amount: order.amount,
        currency: "INR",
        name: "Desi Gabru",
        description: "Order Payment",
        order_id: order.id,

        handler: async function (response) {
            const verify = await fetch("/verify-payment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...response,
                    userId,
                    items: products,
                    amount,
                    shipping: { name, phone, email, address, pincode, city, state }
                })
            });

            const data = await verify.json();

            if (data.success) {
                await fetch("/api/cart/update", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId, items: [] })
                });
                window.location.href = `/success.html?orderId=${data.orderId}`;
            } else {
                alert("Payment verification failed. Please contact support.");
            }
        },

        prefill: { name, email, contact: phone },

        modal: {
            ondismiss: function () {
                alert("Payment cancelled. Your cart is still saved.");
            }
        }
    });

    rzp.open();
}