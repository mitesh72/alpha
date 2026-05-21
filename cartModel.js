import mongoose from "mongoose";

const cartSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    items: [
        {
            productId: String,
            qty: Number
        }
    ]
});

export default mongoose.model("Cart", cartSchema);
