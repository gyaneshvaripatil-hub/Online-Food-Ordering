const express = require("express");
const cors = require("cors");
require("dotenv").config();

const db = require("./config/db");
const categoryRoutes = require("./routes/categoryRoutes");
const foodRoutes = require("./routes/foodRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// For Cache-Control in Express, Status Code: 304
app.use((req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
});

// Test API
app.get("/", (req,res) => {
    res.json({
        success: true,
        message: "Online Food Ordering API is running"
    });
});

//Test MySQL Connection
app.get("/api/test/test-db", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT 1 AS result");

        res.json({
            success: true,
            message: "MySQL connected successfully",
            data: rows
        });
    } catch (error) {
        console.error("Database Error:", error);

        res.status(500).json({
            success:false,
            message: "Database connection failed",
            error: error.message
        });
    }
});

// Category API
app.use("/api/categories", categoryRoutes);

// Food API
app.use("/api/food-items", foodRoutes);


// Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on  http://localhost:${PORT}`);
});