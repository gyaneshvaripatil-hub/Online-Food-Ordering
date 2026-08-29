const express = require("express");

const {
    getFoodItems,
    getFoodItemById,
    createFoodItem,
    updateFoodItem,
    deleteFoodItem
} = require("../controllers/foodController");

const router = express.Router();

router.get("/", getFoodItems);

router.get("/:id", getFoodItemById);

router.post("/", createFoodItem);

router.put("/:id", updateFoodItem);

router.delete("/:id", deleteFoodItem);

module.exports = router;