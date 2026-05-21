// category.js — with Filter & Sort

let allCategoryProducts = []; // store original list for re-filtering

async function loadCategoryProducts(keywords) {
    // Show skeletons immediately
    const container = document.querySelector(".category-products");
    if (container) {
        container.innerHTML = Array(8).fill(`
            <div class="items-container skeleton-card">
                <div class="img-box skeleton-box"></div>
                <div class="product-content">
                    <div class="skeleton-line" style="width:80%;height:14px;margin-bottom:10px;"></div>
                    <div class="skeleton-line" style="width:50%;height:12px;margin-bottom:10px;"></div>
                    <div class="skeleton-line" style="width:40%;height:14px;"></div>
                </div>
            </div>
        `).join("");
    }

    try {
        const res = await fetch("/api/products");
        const products = await res.json();

        allCategoryProducts = products.filter(p =>
            keywords.some(k => p.name.toLowerCase().includes(k.toLowerCase()))
        );

        injectFilterBar();
        applyFilterSort(); // initial render

    } catch (err) {
        console.error("Error loading category products", err);
    }
}

// -------------------------------------------------------
// Inject the filter/sort bar above .category-products
// -------------------------------------------------------
function injectFilterBar() {
    const container = document.querySelector(".category-products");

    const bar = document.createElement("div");
    bar.id = "filter-bar";
    bar.innerHTML = `
        <div id="filter-left">
            <span id="product-count"></span>
        </div>
        <div id="filter-right">
            <select id="sort-select" onchange="applyFilterSort()">
                <option value="default">Sort: Default</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="discount">Highest Discount</option>
                <option value="rating">Top Rated</option>
            </select>

            <select id="price-filter" onchange="applyFilterSort()">
                <option value="all">All Prices</option>
                <option value="0-299">Under ₹299</option>
                <option value="300-599">₹300 – ₹599</option>
                <option value="600-999">₹600 – ₹999</option>
                <option value="1000+">₹1000+</option>
            </select>

            <label id="discount-toggle">
                <input type="checkbox" id="discount-only" onchange="applyFilterSort()">
                On Sale Only
            </label>
        </div>
    `;

    container.parentNode.insertBefore(bar, container);
    injectFilterStyles();
}

// -------------------------------------------------------
// Apply current filter + sort and re-render
// -------------------------------------------------------
function applyFilterSort() {
    let products = [...allCategoryProducts];

    const sort          = document.getElementById("sort-select").value;
    const priceRange    = document.getElementById("price-filter").value;
    const discountOnly  = document.getElementById("discount-only").checked;

    // 1. Filter: discount only
    if (discountOnly) {
        products = products.filter(p => p.old_price && p.old_price > p.price);
    }

    // 2. Filter: price range
    if (priceRange !== "all") {
        if (priceRange === "1000+") {
            products = products.filter(p => p.price >= 1000);
        } else {
            const [min, max] = priceRange.split("-").map(Number);
            products = products.filter(p => p.price >= min && p.price <= max);
        }
    }

    // 3. Sort
    if (sort === "price-asc") {
        products.sort((a, b) => a.price - b.price);
    } else if (sort === "price-desc") {
        products.sort((a, b) => b.price - a.price);
    } else if (sort === "discount") {
        products.sort((a, b) => {
            const da = a.old_price ? Math.round((1 - a.price / a.old_price) * 100) : 0;
            const db = b.old_price ? Math.round((1 - b.price / b.old_price) * 100) : 0;
            return db - da;
        });
    } else if (sort === "rating") {
        products.sort((a, b) => (b.rating || 4) - (a.rating || 4));
    }

    // Update count
    const countEl = document.getElementById("product-count");
    if (countEl) countEl.textContent = `${products.length} product${products.length !== 1 ? "s" : ""}`;

    displayCategoryItems(products);
}

// -------------------------------------------------------
// Render product cards
// -------------------------------------------------------
function displayCategoryItems(products) {
    const container = document.querySelector(".category-products");

    if (!products.length) {
        container.innerHTML = `
            <div style="text-align:center;padding:60px 20px;color:#aaa;">
                <div style="font-size:40px;margin-bottom:12px;">🔍</div>
                <h3 style="color:#eee;">No products match your filters</h3>
                <p style="margin-top:8px;">Try changing the sort or price range</p>
            </div>`;
        return;
    }

    container.innerHTML = products.map(item => {
        const discount = item.old_price
            ? Math.round((1 - item.price / item.old_price) * 100)
            : null;

        const stars = "★".repeat(Math.floor(item.rating || 4)) +
                      "☆".repeat(5 - Math.floor(item.rating || 4));

        return `
<div class="items-container">
  <a href="/product.html?id=${item._id}" style="text-decoration:none;color:inherit;">
    <div class="img-box">
        <img src="${item.image}" alt="${item.name}" class="item-image">
        ${discount ? `<span class="badge">${discount}% OFF</span>` : ""}
    </div>
    <div class="product-content">
        <div class="product-name">${item.name}</div>
        <div class="rating">
            <div class="stars">${stars}</div>
            <span class="reviews">(${item.reviews || 0})</span>
        </div>
        <div class="price">
            <span class="new">₹${item.price}</span>
            ${item.old_price ? `<span class="old">₹${item.old_price}</span>` : ""}
        </div>
    </div>
  </a>
  <button class="add" onclick="addToBag('${item._id}')">QUICK ADD</button>
</div>`;
    }).join("");
}

// -------------------------------------------------------
// Inject filter bar styles
// -------------------------------------------------------
function injectFilterStyles() {
    if (document.getElementById("filter-bar-styles")) return;

    const style = document.createElement("style");
    style.id = "filter-bar-styles";
    style.textContent = `
        #filter-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 12px;
            padding: 14px 20px;
            background: #111;
            border-radius: 12px;
            margin: 16px auto;
            max-width: 1100px;
            border: 1px solid #2a2a2a;
        }

        #filter-left {
            color: #aaa;
            font-size: 13px;
        }

        #filter-right {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 10px;
        }

        #filter-right select {
            background: #1a1a1a;
            color: #eee;
            border: 1px solid #333;
            border-radius: 8px;
            padding: 8px 12px;
            font-size: 13px;
            cursor: pointer;
            outline: none;
            transition: border-color 0.2s;
        }
        #filter-right select:hover,
        #filter-right select:focus {
            border-color: #f5c542;
        }

        #discount-toggle {
            display: flex;
            align-items: center;
            gap: 6px;
            color: #eee;
            font-size: 13px;
            cursor: pointer;
            background: #1a1a1a;
            border: 1px solid #333;
            border-radius: 8px;
            padding: 8px 12px;
            transition: border-color 0.2s;
        }
        #discount-toggle:hover { border-color: #f5c542; }

        #discount-only {
            accent-color: #f5c542;
            width: 14px;
            height: 14px;
            cursor: pointer;
        }

        @media (max-width: 600px) {
            #filter-bar { flex-direction: column; align-items: flex-start; }
            #filter-right { width: 100%; }
            #filter-right select { flex: 1; }
        }
    `;
    document.head.appendChild(style);
}