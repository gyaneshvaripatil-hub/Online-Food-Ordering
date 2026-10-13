// menu-admin.js — admin-only menu create / update / delete + the form dialog
import { authFetch, isAdmin } from "./auth.js";

export function escapeHtml(value = "") {
    return String(value).replace(/[&<>"']/g, c => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
}

function requireAdmin() {
    if (!isAdmin()) throw new Error("Admin access required");
}

export async function createFood(food) {
    requireAdmin();
    return authFetch("/foods", { method: "POST", body: JSON.stringify(food) });
}

export async function updateFood(id, food) {
    requireAdmin();
    return authFetch(`/foods/${id}`, { method: "PUT", body: JSON.stringify(food) });
}

export async function deleteFood(id) {
    requireAdmin();
    return authFetch(`/foods/${id}`, { method: "DELETE" });
}

// Opens a modal form. Pass `food` to edit, omit it to add a new item.
export function openFoodForm({ food = null, categories = [], onSaved }) {
    requireAdmin();
    const isEdit = Boolean(food);

    // category_id 1 is "All", so it is not a real category to assign
    const options = categories
        .filter(c => c.category_id !== 1)
        .map(c => `<option value="${c.category_id}" ${food?.category_id === c.category_id ? "selected" : ""}>
                        ${escapeHtml(c.name)}</option>`)
        .join("");

    const dialog = document.createElement("dialog");
    dialog.style.cssText = "border:none;border-radius:12px;padding:24px;width:min(460px,92vw);";
    dialog.innerHTML = `
        <form id="foodForm">
            <h5 style="margin-bottom:16px">${isEdit ? "Edit" : "Add"} Menu Item</h5>
            <div class="alert alert-danger d-none" id="foodFormError"></div>

            <label class="form-label">Name</label>
            <input class="form-control mb-2" name="name" required value="${escapeHtml(food?.name ?? "")}">

            <label class="form-label">Description</label>
            <textarea class="form-control mb-2" name="description" rows="2">${escapeHtml(food?.description ?? "")}</textarea>

            <label class="form-label">Price (₹)</label>
            <input class="form-control mb-2" name="price" type="number" min="0" step="0.01" required value="${food?.price ?? ""}">

            <label class="form-label">Image URL</label>
            <input class="form-control mb-2" name="image_url" type="url" value="${escapeHtml(food?.image_url ?? "")}">

            <label class="form-label">Category</label>
            <select class="form-select mb-3" name="category_id" required>${options}</select>

            <div style="display:flex;gap:8px;justify-content:flex-end">
                <button type="button" class="btn btn-outline-secondary" id="cancelFoodBtn">Cancel</button>
                <button type="submit" class="btn btn-primary" id="saveFoodBtn">${isEdit ? "Update" : "Add"}</button>
            </div>
        </form>
    `;

    document.body.appendChild(dialog);
    const form = dialog.querySelector("#foodForm");
    const errorBox = dialog.querySelector("#foodFormError");
    const saveBtn = dialog.querySelector("#saveFoodBtn");

    dialog.querySelector("#cancelFoodBtn").addEventListener("click", () => dialog.close());
    dialog.addEventListener("close", () => dialog.remove());

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        errorBox.classList.add("d-none");

        const raw = Object.fromEntries(new FormData(form));
        const payload = {
            name: raw.name.trim(),
            description: raw.description.trim(),
            price: Number(raw.price),
            image_url: raw.image_url.trim(),
            category_id: Number(raw.category_id)
        };

        if (!payload.name || Number.isNaN(payload.price) || payload.price < 0) {
            errorBox.textContent = "Please enter a valid name and price.";
            errorBox.classList.remove("d-none");
            return;
        }

        saveBtn.disabled = true;
        try {
            if (isEdit) await updateFood(food.food_id, payload);
            else await createFood(payload);

            dialog.close();
            await onSaved?.();
        } catch (err) {
            errorBox.textContent = err.message;
            errorBox.classList.remove("d-none");
        } finally {
            saveBtn.disabled = false;
        }
    });

    dialog.showModal();
}
