const express = require("express");
const app = express();

app.use(express.json());

// VERY IMPORTANT — serve static files
app.use(express.static("public")); 

// Your API
app.get("/api/products", async (req, res) => {
    // return products

    
});

// Start server
app.listen(3007, () => console.log("Server running on 3007"));
