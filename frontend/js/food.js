// const API_URL = "http://localhost:5000";

async function getFoodItems() {
    try {

        const response = await fetch(`${API_URL}/api/food-items`);

        const result = await response.json();

        console.log("Food API Response:", result);

        if (result.success) {
            // displayFoodItems(result.data);
        }

    } catch (error) {
        console.error("Food API Error:", error);
    }
}

getFoodItems();