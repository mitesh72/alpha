// seedProducts.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "./productModel.js";

dotenv.config();

const items = [
    { id: '001', image: 'beardoil.jpg', product_name: 'Beard Growth Oil', old_price: 699, new_price: 499 },
    { id: '002', image: 'beardshinner.jpg', product_name: 'Beard Shinner', old_price: 559, new_price: 449 },
    { id: '003', image: 'faceserum.jpg', product_name: 'Face Serum', old_price: 669, new_price: 599 },
];

const items2 = [
    { id: '004', image: 'perfume1.jpg', product_name: 'Dominant Perfume', old_price: 2499, new_price: 1399 },
    { id: '005', image: 'perfume2.jpg', product_name: 'Ellicit Man Perfume', old_price: 2499, new_price: 1199 },
    { id: '006', image: 'perfume3.jpg', product_name: 'More Men Perfume', old_price: 2499, new_price: 1099 },
];

const items3 = [
    { id: '007', image: 'groomingkit.jpg', product_name: "Men's grooming Kit", new_price: 948 },
    { id: '008', image: 'facewashandserum.jpg', product_name: 'Face Wash & Face Serum Combo', new_price: 998 },
    { id: '009', image: 'oilandshinner.jpg', product_name: 'Beard Oil & Beard Shinner Combo', new_price: 948 },
    { id: '010', image: 'waxandserum.webp', product_name: 'Hair Wax & Hair Serum Combo', new_price: 1398 },
];

const items4 = [
    { id: '011', image: 'faceserum.jpg', product_name: 'Face Serum', old_price: 660, new_price: 559 },
    { id: '012', image: 'facewash.jpg', product_name: 'Face Wash', old_price: 450, new_price: 399 },
    { id: '013', image: 'de-tan.jpg', product_name: 'De-Tan Face Scrub', old_price: 650, new_price: 599 },
    { id: '014', image: 'cleanser.jpg', product_name: 'Cleanser & Moisturiser', old_price: 650, new_price: 599 },
    { id: '015', image: 'de-tanfacepack.jpg', product_name: 'De-Tan Face Pack', old_price: 660, new_price: 599 },
];

const allProducts = [...items, ...items2, ...items3, ...items4];

mongoose
    .connect(process.env.MONGO_URI)
    .then(async () => {
        console.log("MongoDB connected!");

        // 🔥 CLEAR OLD DATA
        await Product.deleteMany({});

        // 🔥 NEW FORMAT (MULTIPLE IMAGES)
        const formatted = allProducts.map((p) => ({
            name: p.product_name,
            price: p.new_price,
            old_price: p.old_price || null,
            description: p.product_name,

            // ✅ matches productModel.js schema (single 'image' field)
            image: "/uploads/" + p.image
        }));

        await Product.insertMany(formatted);

        console.log("All products inserted successfully!");
        const count = await Product.countDocuments();
console.log("Products in DB:", count);
        process.exit();
    })
    .catch((err) => console.error(err));