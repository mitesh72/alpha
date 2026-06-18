import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import collection from "./config.js";

dotenv.config();

const createAdmin = async () => {
  console.log("MONGODB_URI exists:", !!process.env.MONGODB_URI);
  
  await mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("database connected"))
    .catch((err) => console.log("database connection error:", err.message));
};
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