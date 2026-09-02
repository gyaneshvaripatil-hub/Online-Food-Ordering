// const API_URL = "http://localhost:5000";
const API_URL =
    window.location.port === "5501"
        ? "http://localhost:5000"
        : "";
// const API_URL = "";

// Get all categories
export async function getCategories() {
    try {
        const response = await fetch(`${API_URL}/api/categories`);
        // const response = await fetch(`/api/categories`);

        const result = await response.json();

        console.log("Categories Response:", result);
        if (result.success) {
            return result.data;
        }

        return [];

    } catch (error) {
        console.error("API Error:", error);
        return [];
    }
}