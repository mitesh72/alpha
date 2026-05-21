// Use a UNIQUE name so it never conflicts with index.js
const cartUserId = localStorage.getItem("loggedUserId");

if (!cartUserId) {
    alert("Please login to view your cart.");
    window.location.href = "/login";
}

// Unique variable names to avoid redeclaration conflicts
let cartDataItems = [];
let productList = [];

/* ---------------------------
   LOAD CART + PRODUCTS
----------------------------*/
async function loadBagPage() {
    const cartRes = await fetch(`/api/cart/${cartUserId}`);
    const cartData = await cartRes.json();
    cartDataItems = cartData.items || [];

    const prodRes = await fetch("/api/products");
    productList = await prodRes.json();

    updateCartIconCount(cartDataItems.reduce((s, i) => s + i.qty, 0));
    renderCartItems();
    renderOrderSummary();
}

/* We will call loadBagPage() from bag.html AFTER scripts load */

/* ---------------------------
   UPDATE HEADER CART COUNT
----------------------------*/
function updateCartIconCount(count) {
    const el = document.querySelector(".bag-item-count");
    if (!el) return;

    if (count > 0) {
        el.innerText = count;
        el.style.visibility = "visible";
    } else {
        el.style.visibility = "hidden";
    }
}

/* ---------------------------
   RENDER CART ITEMS
----------------------------*/
function renderCartItems() {
    const box = document.querySelector(".main-cart-summary");
    if (!box) return;

    if (cartDataItems.length === 0) {
        box.innerHTML = `<h2 style="text-align:center;">Your cart is empty</h2>`;
        return;
    }

    box.innerHTML = cartDataItems.map(item => {
        const p = productList.find(pr => pr._id === item.productId);
        if (!p) return "";

        return `
        <div class="cart-items-container">
            <img src="${p.image}" class="product-img">

            <div class="product-name">${p.name}</div>
            <div class="old-price">Rs. ${p.old_price || p.price}</div>
            <div class="new-price">Rs. ${p.price}</div>

            <div class="quantity">
                <button class="qty-btn" onclick="changeQty('${p._id}', -1)">−</button>
                <span class="qty-number">${item.qty}</span>
                <button class="qty-btn" onclick="changeQty('${p._id}', 1)">+</button>
            </div>

            <div class="cost">Rs. ${p.price * item.qty}</div>

            <div class="remove-from-cart" onclick="removeFromCart('${p._id}')">X</div>
        </div>
        `;
    }).join("");
}

/* ---------------------------
   CHANGE QUANTITY
----------------------------*/
async function changeQty(productId, delta) {
    const it = cartDataItems.find(i => i.productId === productId);
    if (!it) return;

    it.qty += delta;

    if (it.qty <= 0) {
        return removeFromCart(productId);
    }

    await saveCart();

    updateCartIconCount(cartDataItems.reduce((s, i) => s + i.qty, 0));

    loadBagPage();
}

/* ---------------------------
   REMOVE FROM CART
----------------------------*/
async function removeFromCart(productId) {
    cartDataItems = cartDataItems.filter(i => i.productId !== productId);
    await saveCart();

    updateCartIconCount(cartDataItems.reduce((s, i) => s + i.qty, 0));

    loadBagPage();
}

/* ---------------------------
   ORDER SUMMARY
----------------------------*/
function renderOrderSummary() {
    const box = document.querySelector(".order-summary");
    if (!box) return;

    if (cartDataItems.length === 0) {
        box.innerHTML = "";
        return;
    }

    const merged = cartDataItems.map(it => {
        const p = productList.find(pr => pr._id === it.productId);
        return p ? { ...p, qty: it.qty } : null;
    }).filter(Boolean);

    const subtotal = merged.reduce((sum, p) => sum + (p.old_price || p.price) * p.qty, 0);
    const total = merged.reduce((sum, p) => sum + p.price * p.qty, 0);
    const discount = subtotal - total;

    box.innerHTML = `
        <div class="order-sum-heading"><h1>ORDER SUMMARY</h1></div>

        <div class="amount-sec">
            <div class="subtotal-head">Subtotal: <p>Rs. ${subtotal}</p></div>
            <div class="discount-head">Discount: <p>Rs. ${discount}</p></div>
            <div class="total-head">TOTAL: <p>Rs. ${total}</p></div>
            <div class="quantity-head">TOTAL QUANTITY:
                <p>${merged.reduce((s,p)=>s+p.qty,0)}</p>
            </div>

            <a href="checkout.html">
                <button class="order-place">
                    <p>PLACE ORDER</p>
                    <div class="icons">
                        <i class="fa-brands fa-google-pay"></i>
                        <i class="fa-brands fa-cc-paypal"></i>
                        <i class="fa-brands fa-cc-mastercard"></i>
                    </div>
                </button>
            </a>

            <button class="empty-cart-btn" onclick="emptyCart()">EMPTY CART</button>
        </div>
    `;
}

/* ---------------------------
   EMPTY CART
----------------------------*/
async function emptyCart() {
    cartDataItems = [];
    await saveCart();

    updateCartIconCount(0);

    loadBagPage();
}

/* ---------------------------
   SAVE CART TO SERVER
----------------------------*/
async function saveCart() {
    await fetch("/api/cart/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: cartUserId, items: cartDataItems })
    });
}
