import { getCategories } from "./category.js";
import { getFoodItems } from "./food.js";
import { isLoggedIn, isAdmin, getUser, logout } from "./auth.js";
import { openFoodForm, deleteFood, escapeHtml } from "./menu-admin.js";
import { openCheckout, formatINR, calculateTotals, TAX_RATE } from "./checkout.js";
import { openLoginModal } from "./login-modal.js";

const allcard = document.getElementById("allCard");
const categoryContainer = document.getElementById("categoryContainer");
const yourcart = document.getElementById("cartSidebar");
const searchInput = document.querySelector("#searchInput");
const authBar = document.getElementById("authBar");

let categoryList = [];
let menuList = [];
let currentCategoryId = 1;
let foodCartArr = [];

async function loadFoodItems() {
    categoryList = await getCategories();
    menuList = await getFoodItems();

    renderAuthBar();
    createCategories(categoryList);
    createAllCard(menuList);
    restoreCart();
}

loadFoodItems();

//============================= Auth bar ====================================

function renderAuthBar() {
    if (!authBar) return;

    const user = getUser();

    if (!isLoggedIn() || !user) {
        authBar.innerHTML = `<button type="button" id="loginBtn" class="auth-login-btn">Login</button>`;
        document.getElementById("loginBtn").addEventListener("click", () => {
            openLoginModal({ onSuccess: onLoggedIn });
        });
        return;
    }

    authBar.innerHTML = `
        <span class="me-2">Hi, ${escapeHtml(user.name || user.email)}
            ${isAdmin() ? '<span class="badge bg-danger">Admin</span>' : ""}
        </span>
        ${isAdmin() ? '<button id="addMenuBtn" class="btn btn-sm btn-success me-2">+ Add Menu Item</button>' : ""}
        <button id="logoutBtn" class="btn btn-sm btn-outline-secondary">Logout</button>
    `;

    document.getElementById("logoutBtn").addEventListener("click", logout);

    document.getElementById("addMenuBtn")?.addEventListener("click", () => {
        openFoodForm({ categories: categoryList, onSaved: refreshMenu });
    });
}

// After a successful login: refresh the header and the cards (admin buttons)
function onLoggedIn() {
    renderAuthBar();
    filterFood(currentCategoryId);
}

// Reload menu from the server after add / edit / delete
async function refreshMenu() {
    menuList = await getFoodItems();
    if (searchInput) searchInput.value = "";
    filterFood(currentCategoryId);
}

//============================= Categories ==================================

function createCategories(categories) {
    let result = "";
    categories.forEach(category => {
        result += `
            <button
                type="button"
                class="category-btn ${category.category_id === 1 ? "active" : ""}"
                data-category-id="${category.category_id}">
                ${escapeHtml(category.name)}
            </button>
        `;
    });

    categoryContainer.innerHTML = result;

    document.querySelectorAll(".category-btn").forEach(button => {
        button.addEventListener("click", function () {
            document.querySelector(".category-btn.active")?.classList.remove("active");
            this.classList.add("active");
            filterFood(Number(this.dataset.categoryId));
        });
    });
}

function filterFood(categoryId) {
    currentCategoryId = categoryId;

    const filteredFood = categoryId === 1
        ? menuList
        : menuList.filter(food => food.category_id === categoryId);

    createAllCard(filteredFood);
}

//============================= Menu cards ==================================

function createAllCard(arr) {
    if (arr.length === 0) {
        allcard.innerHTML = `
            <div class="col-12 text-center">
                <h3>No food item found</h3>
            </div>
        `;
        return;
    }

    const admin = isAdmin();
    let result = "";

    arr.forEach(obj => {
        const adminButtons = admin ? `
            <div class="admin-actions mt-2">
                <button class="edit-btn btn btn-sm btn-outline-primary" data-id="${obj.food_id}">Edit</button>
                <button class="delete-btn btn btn-sm btn-outline-danger" data-id="${obj.food_id}">Delete</button>
            </div>` : "";

        result += `<div class="col-4 mb-4">
                        <div class="menu-card" id="${obj.food_id}">
                            <div class="menu-card-header">
                                <img src="${escapeHtml(obj.image_url)}" alt="${escapeHtml(obj.name)}">
                            </div>
                            <div class="menu-card-body">
                                <div class="menu-card-title">${escapeHtml(obj.name)}</div>
                                <div class="menu-card-description">${escapeHtml(obj.description)}</div>
                            </div>
                            <div class="menu-card-footer">
                                <div class="menu-price">₹${escapeHtml(obj.price)}</div>
                                <button class="add-btn"><i class="fa-solid fa-plus"></i> Add</button>
                            </div>
                            ${adminButtons}
                        </div>
                    </div>`;
    });

    allcard.innerHTML = result;
}

// One delegated listener (set once) instead of re-attaching listeners on every render
allcard.addEventListener("click", async (e) => {
    const addBtn = e.target.closest(".add-btn");
    if (addBtn) {
        addMenu(addBtn);
        return;
    }

    if (!isAdmin()) return; // UI guard only; the server enforces the real rule

    const editBtn = e.target.closest(".edit-btn");
    if (editBtn) {
        const food = menuList.find(f => String(f.food_id) === editBtn.dataset.id);
        if (food) openFoodForm({ food, categories: categoryList, onSaved: refreshMenu });
        return;
    }

    const deleteBtn = e.target.closest(".delete-btn");
    if (deleteBtn) {
        const id = deleteBtn.dataset.id;
        const food = menuList.find(f => String(f.food_id) === id);
        if (!food || !confirm(`Delete "${food.name}" from the menu?`)) return;

        try {
            await deleteFood(id);
            removeFromCart(id);
            await refreshMenu();
        } catch (err) {
            alert(err.message);
        }
    }
});

//============================= Cart ========================================

const CART_KEY = "foodCart";

// Keep the cart in localStorage so it survives the trip to the login page
function saveCart() {
    localStorage.setItem(CART_KEY, JSON.stringify(
        foodCartArr.map(i => ({ food_id: i.food_id, itemCount: i.itemCount }))
    ));
}

function restoreCart() {
    let saved = [];
    try {
        saved = JSON.parse(localStorage.getItem(CART_KEY)) || [];
    } catch {
        saved = [];
    }

    saved.forEach(({ food_id, itemCount }) => {
        const menuObj = menuList.find(m => String(m.food_id) === String(food_id));
        if (!menuObj) return; // item was removed from the menu
        menuObj.itemCount = itemCount;
        foodCartArr.push(menuObj);
        renderCartItem(menuObj);
    });

    checkFoodCart(foodCartArr);
}

function getCartTotal() {
    return foodCartArr.reduce((sum, i) => sum + Number(i.price) * i.itemCount, 0);
}

// Total + "Proceed to Checkout" button, always kept at the bottom of the cart
function updateCartSummary() {
    let summary = document.getElementById("cartSummary");
    if (!summary) {
        summary = document.createElement("div");
        summary.id = "cartSummary";
        summary.className = "cart-summary";
        yourcart.appendChild(summary);
    }

    if (foodCartArr.length === 0) {
        summary.innerHTML = "";
        return;
    }

    const t = calculateTotals(getCartTotal());

    summary.innerHTML = `
        <div class="cart-summary-row"><span>Subtotal:</span><span>${formatINR(t.subtotal)}</span></div>
        <div class="cart-summary-row"><span>Tax (${Math.round(TAX_RATE * 100)}%):</span><span>${formatINR(t.tax)}</span></div>
        <div class="cart-summary-row"><span>Delivery Fee:</span><span>${formatINR(t.delivery)}</span></div>
        <div class="cart-summary-row cart-summary-total"><span>Total:</span><span>${formatINR(t.total)}</span></div>
        <button type="button" id="checkoutBtn" class="checkout-btn w-100">
            <i class="fa-solid fa-credit-card"></i>
            Proceed to Checkout
        </button>
    `;
    summary.querySelector("#checkoutBtn").addEventListener("click", handleCheckout);
}

function checkFoodCart(cartItems) {
    if (cartItems.length === 0) {
        if (!document.querySelector(".empty-cart")) {
            const div = document.createElement("div");
            div.classList.add("empty-cart");
            div.innerHTML = `<div><i class="fa-solid fa-inbox"></i></div>
                             <div>Your Cart Empty</div>`;
            yourcart.prepend(div);
        }
    } else {
        document.querySelector(".empty-cart")?.remove();
    }
    updateCartSummary();
}
checkFoodCart(foodCartArr);

function removeFromCart(id) {
    const index = foodCartArr.findIndex(item => String(item.food_id) === String(id));
    if (index === -1) return;
    foodCartArr.splice(index, 1);
    document.querySelector(`#cart-${id}`)?.remove();
    checkFoodCart(foodCartArr);
    saveCart();
}

function renderCartItem(menuObj) {
    const id = menuObj.food_id;

    const div = document.createElement("div");
    div.id = `cart-${id}`;

    div.innerHTML = `
        <div class="cartItemContainer">
            <div class="cart-item">
                <div class="cart-item-info">
                    <div class="cart-item-name">${escapeHtml(menuObj.name)}</div>
                    <div class="cart-item-price">₹${escapeHtml(menuObj.price)}</div>

                    <div class="quantity-control">
                        <button class="quantity-btn decrease-btn">-</button>
                        <span class="itemCount" style="width:300px; text-align:center; font-weight:bold;">
                            ${menuObj.itemCount}
                        </span>
                        <button class="quantity-btn increase-btn">+</button>
                    </div>
                </div>

                <button class="remove-btn"><i class="fa-solid fa-trash"></i></button>
            </div>
        </div>
    `;

    div.querySelector(".increase-btn").addEventListener("click", () => onItemAdd(id));
    div.querySelector(".decrease-btn").addEventListener("click", () => onItemRemove(id));
    div.querySelector(".remove-btn").addEventListener("click", () => removeFromCart(id));

    yourcart.prepend(div);
}

function addMenu(ele) {
    const addId = ele.closest(".menu-card").id;

    const menuObj = menuList.find(menu => String(menu.food_id) === String(addId));
    if (!menuObj) {
        console.log("Food item not found");
        return;
    }

    const cartItem = foodCartArr.find(item => String(item.food_id) === String(addId));

    if (cartItem) {
        onItemAdd(addId);
        return;
    }

    menuObj.itemCount = 1;
    foodCartArr.push(menuObj);
    renderCartItem(menuObj);
    checkFoodCart(foodCartArr);
    saveCart();
}

function onItemAdd(id) {
    const cartItem = foodCartArr.find(ele => String(ele.food_id) === String(id));
    if (!cartItem) return;

    cartItem.itemCount++;
    document.querySelector(`#cart-${id} .itemCount`).innerText = cartItem.itemCount;
    updateCartSummary();
    saveCart();
}

function onItemRemove(id) {
    const cartItem = foodCartArr.find(ele => String(ele.food_id) === String(id));
    if (!cartItem) return;

    cartItem.itemCount--;

    if (cartItem.itemCount === 0) {
        removeFromCart(id);
    } else {
        document.querySelector(`#cart-${id} .itemCount`).innerText = cartItem.itemCount;
        updateCartSummary();
        saveCart();
    }
}

//============================= Checkout ====================================

function handleCheckout() {
    if (foodCartArr.length === 0) return;

    // No login check, so the Checkout popup opens directly
    openCheckout({
        items: foodCartArr.map(i => ({
            food_id: i.food_id,
            name: i.name,
            price: Number(i.price),
            quantity: i.itemCount
        })),
        onSuccess: clearCart
    });
}

function clearCart() {
    foodCartArr.forEach(i => document.querySelector(`#cart-${i.food_id}`)?.remove());
    foodCartArr = [];
    localStorage.removeItem(CART_KEY);
    checkFoodCart(foodCartArr);
}

//============================= Search ======================================

searchInput.addEventListener("input", function () {
    const searchValue = this.value.toLowerCase().trim();

    const filteredFood = menuList.filter(food =>
        food.name.toLowerCase().includes(searchValue)
    );

    createAllCard(filteredFood);
});
