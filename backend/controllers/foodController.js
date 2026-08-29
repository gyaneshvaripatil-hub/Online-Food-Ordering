const db = require("../config/db");

// GET all food items
const getFoodItems = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                food_id,
                category_id,
                name,
                description,
                price,
                image_url,
                is_available
            FROM food_items
            ORDER BY food_id ASC
        `);

        res.json({
            success: true,
            message: "Food items fetched successfully",
            data: rows
        });

    } catch (error) {
        console.error("Get Food Items Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch food items",
            error: error.message
        });
    }
};


// GET food item by ID
const getFoodItemById = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await db.query(
            `SELECT 
                food_id,
                category_id,
                name,
                description,
                price,
                image_url,
                is_available
             FROM food_items
             WHERE food_id = ?`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Food item not found"
            });
        }

        res.json({
            success: true,
            message: "Food item fetched successfully",
            data: rows[0]
        });

    } catch (error) {
        console.error("Get Food Item Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch food item",
            error: error.message
        });
    }
};


// CREATE food item
const createFoodItem = async (req, res) => {
    try {
        const {
            category_id,
            name,
            description,
            price,
            image_url,
            is_available
        } = req.body;

        if (!category_id || !name || price === undefined) {
            return res.status(400).json({
                success: false,
                message: "category_id, name and price are required"
            });
        }

        const [result] = await db.query(
            `INSERT INTO food_items
            (category_id, name, description, price, image_url, is_available)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                category_id,
                name,
                description || null,
                price,
                image_url || null,
                is_available ?? 1
            ]
        );

        res.status(201).json({
            success: true,
            message: "Food item created successfully",
            data: {
                food_id: result.insertId,
                category_id,
                name,
                description: description || null,
                price,
                image_url: image_url || null,
                is_available: is_available ?? 1
            }
        });

    } catch (error) {
        console.error("Create Food Item Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create food item",
            error: error.message
        });
    }
};


// UPDATE food item
const updateFoodItem = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            category_id,
            name,
            description,
            price,
            image_url,
            is_available
        } = req.body;

        if (!category_id || !name || price === undefined) {
            return res.status(400).json({
                success: false,
                message: "category_id, name and price are required"
            });
        }

        const [result] = await db.query(
            `UPDATE food_items
             SET category_id = ?,
                 name = ?,
                 description = ?,
                 price = ?,
                 image_url = ?,
                 is_available = ?
             WHERE food_id = ?`,
            [
                category_id,
                name,
                description || null,
                price,
                image_url || null,
                is_available ?? 1,
                id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Food item not found"
            });
        }

        res.json({
            success: true,
            message: "Food item updated successfully"
        });

    } catch (error) {
        console.error("Update Food Item Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update food item",
            error: error.message
        });
    }
};


// DELETE food item
const deleteFoodItem = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.query(
            "DELETE FROM food_items WHERE food_id = ?",
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Food item not found"
            });
        }

        res.json({
            success: true,
            message: "Food item deleted successfully"
        });

    } catch (error) {
        console.error("Delete Food Item Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete food item",
            error: error.message
        });
    }
};


module.exports = {
    getFoodItems,
    getFoodItemById,
    createFoodItem,
    updateFoodItem,
    deleteFoodItem
};