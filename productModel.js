import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    old_price: { type: Number },
    description: { type: String },

   image: { type: String }
});

const Product = mongoose.model("products", ProductSchema);

export default Product;