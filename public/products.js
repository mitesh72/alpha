document.addEventListener("DOMContentLoaded", loadProducts);

async function loadProducts() {
    const container = document.getElementById("products-container");

    if (!container) return;

    try {
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

        const res = await fetch("/api/products");
        const products = await res.json();

        if (!products.length) {
            container.innerHTML = "<h2 style='color:white;text-align:center;'>No products found</h2>";
            return;
        }

        // 🔥 Use map (fast & clean)
       container.innerHTML = products.map(p => {

    const discount = p.oldPrice
        ? Math.round((1 - p.price / p.oldPrice) * 100)
        : null;

    const stars =
        "★".repeat(Math.floor(p.rating || 4)) +
        "☆".repeat(5 - Math.floor(p.rating || 4));

  return `

<div class="items-container">

<a href="/product.html?id=${p._id}">


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

    </div>

</a>

<button class="add" data-id="${p._id}">
    QUICK ADD
</button>

</div>

`;
}).join("");

        // 🔥 Event listener (clean)
        document.querySelectorAll(".add").forEach(btn => {
            btn.addEventListener("click", () => {
                const id = btn.getAttribute("data-id");
                addToBag(id);
            });
        });

    } catch (err) {
        console.error("Error loading products:", err);
        container.innerHTML = "<p style='color:red;text-align:center;'>Failed to load products</p>";
    }
}
let images = []

const mainImage = document.getElementById("mainImage")

if(mainImage){
  images = [mainImage.src]
}

let index = 0

function nextImage(){

  index++

  if(index >= images.length){
    index = 0
  }

  mainImage.src = images[index]
}

function prevImage(){

  index--

  if(index < 0){
    index = images.length - 1
  }

  mainImage.src = images[index]
}

function setImage(i){
  index = i
  mainImage.src = images[index]
}