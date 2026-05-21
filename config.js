import mongoose from "mongoose";

mongoose.connect("mongodb://localhost:27017/userDetails")
  .then(() => console.log("database connected successfully"))
  .catch(() => console.log("database cannot be connected"));

const LoginSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true  // prevents duplicate usernames
  },
  password: {
    type: String,
    required: true
  },
   role: {                    
    type: String,
    enum: ["user", "admin"],
    default: "user"
  }
});

const collection = mongoose.model("users", LoginSchema);
export default collection;
