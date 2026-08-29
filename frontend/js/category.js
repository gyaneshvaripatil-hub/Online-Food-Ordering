const API_URL = "http://localhost:5000";

// Get all categories
async function getCategories() {
    try {
        const response = await fetch(`${API_URL}/api/categories`);

        const data = await response.json();

        console.log("Categories Response:", data);

        return data;

    } catch (error) {
        console.error("API Error:", error);
    }
}

getCategories();