// const API_URL = "http://localhost:5000";
const API_URL =
    window.location.port === "5501"
        ? "http://localhost:5000"
        : "";
export async function getFoodItems() {
    try {

        const response = await fetch(`${API_URL}/api/food-items`);
        // const response = await fetch(`/api/food-items`);

        const result = await response.json();

        console.log("Food API Response:", result);

        if (result.success) {
            return result.data;
        }

        return [];

    } catch (error) {
        console.error("Food API Error:", error);
        return [];
    }
}
