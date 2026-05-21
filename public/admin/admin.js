// admin.js — Protected version
// Verifies admin token on page load, redirects if invalid

// -------------------------------------------------------
// 1. Check admin token on page load
// -------------------------------------------------------
(async function checkAdminAccess() {
    const token = localStorage.getItem("adminToken");

    if (!token) {
        alert("Access denied. Please login as admin.");
        window.location.href = "/login";
        return;
    }

    try {
        const res = await fetch("/admin/api/verify", {
            headers: { "x-admin-token": token }
        });
        const data = await res.json();

        if (!data.success) {
            alert("Session expired. Please login again.");
            localStorage.removeItem("adminToken");
            window.location.href = "/login";
        }
    } catch {
        alert("Could not verify admin access.");
        window.location.href = "/login";
    }
})();

// Helper — always attach admin token to fetch calls
function adminFetch(url, options = {}) {
    const token = localStorage.getItem("adminToken");
    options.headers = {
        ...(options.headers || {}),
        "x-admin-token": token
    };
    return fetch(url, options);
}

// -------------------------------------------------------
// 2. Load products on page load
// -------------------------------------------------------
document.addEventListener("DOMContentLoaded", loadProducts);

async function loadProducts() {
    const productList = document.getElementById("productList");
    productList.innerHTML = "<p>Loading...</p>";

    try {
        const res = await fetch("/api/products");
        const products = await res.json();

        if (products.length === 0) {
            productList.innerHTML = "<p>No products added.</p>";
            return;
        }

        productList.innerHTML = "";

        products.forEach(p => {
            const div = document.createElement("div");
            div.classList.add("product-card");

            div.innerHTML = `
                <div class="product-left" style="display:flex;align-items:center;">
                    <img src="${p.image}" width="70" height="70"
                         style="object-fit:cover; border-radius:6px;">
                    <div style="margin-left:10px;">
                        <strong>${p.name}</strong><br>
                        Price: ₹${p.price}
                        ${p.old_price ? `<br><span style="color:#999;text-decoration:line-through;">₹${p.old_price}</span>` : ""}
                    </div>
                </div>
                <button class="delete-btn" onclick="deleteProduct('${p._id}')">Delete</button>
            `;

            productList.appendChild(div);
        });

    } catch (err) {
        productList.innerHTML = "<p>Error loading products.</p>";
        console.error(err);
    }
}

// -------------------------------------------------------
// 3. Add product (with admin token)
// -------------------------------------------------------
document.getElementById("addProductForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);

    try {
        const res = await adminFetch("/api/products", {
            method: "POST",
            body: formData
        });

        const data = await res.json();

        if (data.success) {
            alert("Product added!");
            e.target.reset();
            loadProducts();
        } else {
            alert("Failed to add product: " + (data.message || "Unknown error"));
        }

    } catch (err) {
        alert("Error adding product");
        console.error(err);
    }
});

// -------------------------------------------------------
// 4. Delete product (with admin token)
// -------------------------------------------------------
async function deleteProduct(id) {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
        const res = await adminFetch(`/api/products/${id}`, { method: "DELETE" });
        const data = await res.json();

        if (data.success) {
            loadProducts();
        } else {
            alert("Delete failed");
        }
    } catch (err) {
        alert("Error deleting product");
        console.error(err);
    }
}

// -------------------------------------------------------
// 5. Logout
// -------------------------------------------------------
document.getElementById("logout").addEventListener("click", async () => {
    await fetch("/admin/api/logout", { method: "POST" });
    localStorage.removeItem("adminToken");
    localStorage.removeItem("loggedUserId");
    window.location.href = "/login";
});