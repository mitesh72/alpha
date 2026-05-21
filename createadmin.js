import mongoose from "mongoose";
import bcrypt from "bcrypt";
import collection from "./config.js";

const createAdmin = async () => {
    await mongoose.connect("mongodb://localhost:27017/userDetails");

    const adminExists = await collection.findOne({ role: "admin" });

    if (adminExists) {
        console.log("Admin already exists");
        process.exit();
    }

    const hash = await bcrypt.hash("admin123", 10);

    await collection.create({
        name: "admin1",
        password: hash,
        role: "admin"
    });

    console.log("Admin created successfully");
    process.exit();
};

createAdmin();
