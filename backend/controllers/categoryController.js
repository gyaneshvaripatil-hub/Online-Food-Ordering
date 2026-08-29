const db = require("../config/db");

// GET all categories
const getCategories = async (req, res) => {
    try {
        const [rows] = await db.query (
            "SELECT *FROM categories ORDER BY category_id DESC"
        );
        res.json({
            success: true,
            message: "Categories fetched successfully",
            data: rows
        });

    } catch (error) {
        console.error("Get Categories Error:", error);

        res.status(500).json({
            success: false,
             message: "Failed to fetch categories",
            error: error.message
        });
    }
};

// GET category by ID
const getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await db.query(
            "SELECT * FROM categories WHERE category_id = ?",
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        res.json({
            success: true,
            message: "Category fetched successfully",
            data: rows[0]
        });

    } catch (error) {
        console.error("Get Category Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch category",
            error: error.message
        });
    }
};

// CREATE category
const createCategory = async (req, res) => {
    try {
        const { name, image_url } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Category name is required"
            });
        }

        const [result] = await db.query(
            "INSERT INTO categories (name, image_url) VALUES (?, ?)",
            [name, image_url || null]
        );

        res.status(201).json({
            success: true,
            message: "Category created successfully",
            data: {
                category_id: result.insertId,
                name,
                image_url: image_url || null
            }
        });

    } catch (error) {
        console.error("Create Category Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create category",
            error: error.message
        });
    }
};

// UPDATE category
const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, image_url } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Category name is required"
            });
        }

        const [result] = await db.query(
            "UPDATE categories SET name = ?, image_url = ? WHERE category_id = ?",
            [name, image_url || null, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        res.json({
            success: true,
            message: "Category updated successfully"
        });

    } catch (error) {
        console.error("Update Category Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update category",
            error: error.message
        });
    }
};

// DELETE category
const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.query(
            "DELETE FROM categories WHERE category_id = ?",
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        res.json({
            success: true,
            message: "Category deleted successfully"
        });

    } catch (error) {
        console.error("Delete Category Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete category",
            error: error.message
        });
    }
};


module.exports = {
    getCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
};