import { getCategories } from "./category.js"
import { getFoodItems } from "./food.js";

let categoryList = [];
let menuList = [];
async function loadFoodItems() {
    categoryList = await getCategories();
    menuList = await getFoodItems();

    // console.log("Categories Items:", categoryList);
    // console.log("Food Items:", menuList);
    createCategories(categoryList);
    createAllCard(menuList);
}

loadFoodItems();

function createCategories(categories) {
    
    let result = "";
    categories.forEach(category => {
        result += `
            <button 
                type="button"
                class="category-btn ${category.category_id === 1 ? 'active' : ''}"
                data-category-id="${category.category_id }">
                ${category.name}
            </button>
        `;

    });

    categoryContainer.innerHTML = result;

    // Add click event to buttons
    document.querySelectorAll(".category-btn").forEach(button => {
        button.addEventListener("click", function () {

            // Remove active from previous button
            document.querySelector(".category-btn.active")?.classList.remove("active");

            // Add active to clicked button
            this.classList.add("active");

            // Filter food
            filterFood(Number(this.dataset.categoryId));
        });
    });
}



function filterFood(categoryId) {

    let filteredFood;

    if (categoryId === 1) {
        filteredFood = menuList;
    } else {
        filteredFood = menuList.filter(
            food => food.category_id === categoryId
        );
    }

    createAllCard(filteredFood);
}

const allcard = document.getElementById('allCard');
const categoryContainer = document.getElementById("categoryContainer");
const yourcart = document.getElementById('cartSidebar');

function createAllCard(arr){

     if (arr.length === 0) {
        allcard.innerHTML = `
            <div class="col-12 text-center">
                <h3>No food item found</h3>
            </div>
        `;
        return;
    }

    let result = "";

    arr.forEach(obj => {
        result += `<div class="col-4 mb-4">
                        <div class="menu-card" id='${obj.food_id}'>
                            <div class="menu-card-header">
                                <img src="${obj.image_url}" alt="${obj.name}">
                            </div>
                            <div class="menu-card-body">
                                <div class="menu-card-title">
                                   ${obj.name}
                                </div>
                                <div class="menu-card-description">
                                   ${obj.description}
                                </div>
                            </div>
                            <div class="menu-card-footer">
                                <div class="menu-price">₹${obj.price}</div>
                                <button class="add-btn"><i class="fa-solid fa-plus"></i> Add</button>
                            </div>
                        </div>
                    </div>`
    });

    allcard.innerHTML = result;

    // Add click event after cards are created
    
    document.querySelectorAll(".add-btn").forEach(button => {

        button.addEventListener("click", function () {
            addMenu(this);
        });

    });
}

//============================= Add Menu ====================================

let foodCartArr = [];
function checkFoodCart(cartItems) {
    if(cartItems.length === 0){
        let div = document.createElement('div');
        div.classList.add("empty-cart");
        div.innerHTML = `<div><i class="fa-solid fa-inbox"></i></div>
                             <div>Your Cart Empty</div>`;
        yourcart.prepend(div);
       
    } else {

        let emptyCart = document.querySelector(".empty-cart");
        if (emptyCart) {
            emptyCart.remove();
        }
    }
}
checkFoodCart(foodCartArr);

function addMenu(ele) {
    let card = ele.closest(".menu-card");
    let addId = card.id;
    // let addId = ele.parentElement.parentElement.id;

    let menuObj = menuList.find(
        menu => String(menu.food_id) === String(addId)
    );
    
    if (!menuObj) {
        console.log("Food item not found");
        return;
    }

    // Check whether item already exists in cart
    let cartItem = foodCartArr.find(
        item => String(item.food_id) === String(addId)
    );
    // If item already exists
   
    if (cartItem) {
        cartItem.itemCount++;

        // Update only quantity
        let quantity = document.querySelector(`#cart-${addId} .itemCount`);

        if (quantity) {
            quantity.innerText = cartItem.itemCount;
        }
        return;
    }

    
    // First time adding item
    menuObj.itemCount = 1;

    foodCartArr.push(menuObj);    
    checkFoodCart(foodCartArr);

    // Create HTML only once
    let div = document.createElement('div');

    div.id = `cart-${addId}`;

    div.innerHTML = `
        <div class="cartItemContainer">
            <div class="cart-item">

                <div class="cart-item-info">

                    <div class="cart-item-name">
                        ${menuObj.name}
                    </div>

                    <div class="cart-item-price">
                        ₹${menuObj.price}
                    </div>

                    <div class="quantity-control">

                        <button class="quantity-btn decrease-btn">-</button>

                        <span class="itemCount"
                              style="width:300px; text-align:center; font-weight:bold;">
                            ${menuObj.itemCount}
                        </span>

                        <button class="quantity-btn increase-btn">+</button>

                    </div>

                </div>

                <button class="remove-btn">
                    <i class="fa-solid fa-trash"></i>
                </button>

            </div>
        </div>
    `;

    // Quantity +
    div.querySelector(".increase-btn")?.addEventListener("click", function () {
            onItemAdd(addId);
        });


    // Quantity -
    div.querySelector(".decrease-btn")?.addEventListener("click", function () {
            onItemRemove(addId);
        });

    yourcart.prepend(div);
}

function onItemAdd(id){
    let cartItem = foodCartArr.find(ele => String(ele.food_id) === id);
    if(cartItem){
        cartItem.itemCount++;
        let quantity = document.querySelector(`#cart-${id} .itemCount`)
        quantity.innerText = cartItem.itemCount;
    }
}

function onItemRemove(id){    
    let itemIndex = foodCartArr.findIndex(ele => String(ele.food_id) === id);
    foodCartArr[itemIndex].itemCount--;
    if(foodCartArr[itemIndex].itemCount === 0){
        foodCartArr.splice(itemIndex,1);
        document.querySelector(`#cart-${id}`).remove();
    }else{
        document.querySelector(`#cart-${id} .itemCount`).innerText = foodCartArr[itemIndex].itemCount;
    }
}


const searchInput = document.querySelector("#searchInput");

searchInput.addEventListener("input", function () {

    let searchValue = this.value.toLowerCase().trim();

    let filteredFood = menuList.filter(food =>
        food.name.toLowerCase().includes(searchValue)
    );

    if (filteredFood.length === 0) {
        document.querySelector("#allCard").innerHTML = `
            <div class="no-food">
                <h3>No food item found</h3>
            </div>
        `;
        return;
    }

    createAllCard(filteredFood);
});
