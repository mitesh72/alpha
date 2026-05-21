/* ---------------------------
   MAIN FRONTEND (public/index.js)
----------------------------*/

let bagItems = []; // array of { productId, qty }
let userId = localStorage.getItem("loggedUserId") || null;

/* -------------------------------
   INIT
--------------------------------*/
async function initApp() {
    await loadCartFromServer();
    await loadProducts();
    initSearchBar();
    displayBagIcon();
    updateHeaderUI();
}
initApp();

/* -------------------------------
   LOAD CART FROM SERVER
--------------------------------*/
async function loadCartFromServer() {
    if (!userId) {
        bagItems = [];
        return;
    }

    try {
        const res = await fetch(`/api/cart/${userId}`);
        const data = await res.json();

        bagItems = (data.items || []).map(i => ({
            productId: i.productId.toString(),
            qty: i.qty
        }));

        console.log("Cart loaded:", bagItems);
    } catch (e) {
        console.error("Failed to load cart:", e);
        bagItems = [];
    }
}

/* -------------------------------
   SAVE CART TO SERVER
--------------------------------*/
async function saveCartToServer() {
    if (!userId) return;

    try {
        await fetch("/api/cart/update", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, items: bagItems })
        });
    } catch (e) {
        console.error("Failed to save cart:", e);
    }
}

/* -------------------------------
   ADD TO BAG (Only if logged in)
--------------------------------*/
async function addToBag(itemId) {
    let userId = localStorage.getItem("loggedUserId");

    if (!userId) {
        alert("Please login to add items to cart.");
        window.location.href = "/login";
        return;
    }

    const existing = bagItems.find(i => i.productId === itemId);

    if (existing) {
        existing.qty += 1;
    } else {
        bagItems.push({ productId: itemId, qty: 1 });
    }

    await saveCartToServer();
    displayBagIcon();
}

/* -------------------------------
   DISPLAY BAG ICON COUNT
--------------------------------*/
function displayBagIcon() {
    const el = document.querySelector(".bag-item-count");
    if (!el) return;

    const totalQty = bagItems.reduce((s, it) => s + it.qty, 0);

    if (totalQty > 0) {
        el.innerText = totalQty;
        el.style.visibility = "visible";
    } else {
        el.style.visibility = "hidden";
    }
}

/* -------------------------------
   LOAD PRODUCTS FOR HOME
--------------------------------*/
async function loadProducts() {
    try {
        const res = await fetch("/api/products");
        const products = await res.json();

        displayHeroSection(products);
        displayHeroSection2(products);
    } catch (e) {
        console.error("Error loading products:", e);
    }
}
function displayHeroSection(products) {
    const container = document.querySelector(".hero-sect-main");
    if (!container) return;

    container.innerHTML = products.slice(0, 6).map(p => {
        const discount = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : null;
        const stars =
            "★".repeat(Math.floor(p.rating || 4)) +
            "☆".repeat(5 - Math.floor(p.rating || 4));

        // Wrap the card inside an <a> linking to product.html?id=PRODUCT_ID
         return `

<div class="items-container">
<a href="/product.html?id=${p._id}" class="items-container-link">
    <div class="img-box">
        <img src="${p.image}" alt="${p.name}" class="item-image">
        ${discount ? `<span class="badge">${discount}% OFF</span>` : ""}
    </div>

    <div class="product-content">

        <div class="product-name">${p.name}</div>

        <div class="rating">
            <div class="stars">${stars}</div>
            <span class="reviews">(${p.reviews || 0})</span>
        </div>

        <div class="price">
            <span class="new">₹${p.price}</span>
            ${p.oldPrice ? `<span class="old">₹${p.oldPrice}</span>` : ""}
        </div>
</a>
        <button class="add" onclick="event.stopPropagation(); addToBag('${p._id}')">
            QUICK ADD
        </button>

    </div>

</div>

`;
    }).join("");
}

function displayHeroSection2(products) {
    const container = document.querySelector(".hero-sec4-content");
    if (!container) return;

    const latest = [...products].reverse().slice(0, 6);

    container.innerHTML = latest.map(p => {
        const discount = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : null;
        const stars =
            "★".repeat(Math.floor(p.rating || 4)) +
            "☆".repeat(5 - Math.floor(p.rating || 4));

        return `

<div class="items-container">
<a href="/product.html?id=${p._id}" class="items-container-link">
    <div class="img-box">
        <img src="${p.image}" alt="${p.name}" class="item-image">
        ${discount ? `<span class="badge">${discount}% OFF</span>` : ""}
    </div>

    <div class="product-content">

        <div class="product-name">${p.name}</div>

        <div class="rating">
            <div class="stars">${stars}</div>
            <span class="reviews">(${p.reviews || 0})</span>
        </div>

        <div class="price">
            <span class="new">₹${p.price}</span>
            ${p.oldPrice ? `<span class="old">₹${p.oldPrice}</span>` : ""}
        </div>
</a>
        <button class="add" onclick="event.stopPropagation(); addToBag('${p._id}')">
            QUICK ADD
        </button>

    </div>

</div>

`;
    }).join("");
}


/* -------------------------------
   SEARCH SYSTEM
--------------------------------*/
function initSearchBar() {
    const searchInput = document.querySelector(".search-input");
    const searchResults = document.querySelector(".search-results");

    if (!searchInput || !searchResults) return;

    let searchData = [];

    async function loadSearchProducts() {
        const res = await fetch("/api/products");
        searchData = await res.json();
    }

    loadSearchProducts();

    searchInput.addEventListener("input", function () {
        const text = this.value.toLowerCase().trim();
        if (!text) {
            searchResults.style.display = "none";
            return;
        }

        const filtered = searchData.filter(p =>
            p.name.toLowerCase().includes(text)
        );

        searchResults.innerHTML = "";

        if (filtered.length === 0) {
            searchResults.innerHTML = `<div class="result-item">No results</div>`;
        } else {
            filtered.forEach(p => {
                const div = document.createElement("div");
                div.className = "result-item";
                div.innerHTML = `
                    <img src="${p.image}">
                    <span>${p.name}</span>
                `;
                div.onclick = () => goToProduct(p.name);
                searchResults.appendChild(div);
            });
        }

        searchResults.style.display = "block";
    });

    document.addEventListener("click", e => {
        if (!e.target.closest(".searching"))
            searchResults.style.display = "none";
    });
}

/* -------------------------------
   SEARCH → REDIRECT
--------------------------------*/
function goToProduct(name) {
    name = name.toLowerCase();
    if (name.includes("hair")) window.location.href = "hair.html";
    else if (name.includes("beard")) window.location.href = "beard.html";
    else if (name.includes("face")) window.location.href = "face.html";
    else if (name.includes("perfume")) window.location.href = "perfume.html";
    else if (name.includes("combo")) window.location.href = "combo.html";
    else if (name.includes("kit")) window.location.href = "grooming.html";
}

/* -------------------------------
   HEADER LOGIN / LOGOUT UI
--------------------------------*/
function updateHeaderUI() {
    const loggedUserId = localStorage.getItem("loggedUserId");

    const loginLink = document.querySelector(".login-link");
    const userBox = document.querySelector(".user-logged-in");

    if (loggedUserId) {
        if (loginLink) loginLink.style.display = "none";
        if (userBox) userBox.style.display = "flex";
    } else {
        if (loginLink) loginLink.style.display = "block";
        if (userBox) userBox.style.display = "none";
    }
}

/* -------------------------------
   LOGOUT CLICK HANDLER
--------------------------------*/
document.addEventListener("click", async (e) => {
    if (e.target.classList.contains("logout-btn")) {

        localStorage.removeItem("loggedUserId");

        await fetch("/admin/api/logout", { method: "POST" });

        window.location.reload();
    }
});
