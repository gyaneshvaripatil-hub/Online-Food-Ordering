// checkout.js — checkout modal (your design) + order placing
import { authFetch, getUser } from "./auth.js";
import { escapeHtml } from "./menu-admin.js";

// true  = fake the order (no backend needed, for testing the UI)
// false = send the order to POST /orders on your backend
export const USE_MOCK_ORDERS = true;

export const TAX_RATE = 0.10;     // 10%
export const DELIVERY_FEE = 2.99; // change to match your currency / pricing

const PAYMENT_LABELS = {
    "credit-card": "Credit/Debit Card",
    "paypal": "PayPal",
    "google-pay": "Google Pay",
    "apple-pay": "Apple Pay",
    "cash": "Cash on Delivery"
};

const round2 = n => Math.round(n * 100) / 100;

export function formatINR(amount) {
    return "₹" + Number(amount).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

export function calculateTotals(subtotal) {
    const sub = round2(subtotal);
    const tax = round2(sub * TAX_RATE);
    const delivery = sub > 0 ? DELIVERY_FEE : 0;
    return { subtotal: sub, tax, delivery, total: round2(sub + tax + delivery) };
}

export function showSnackbar(message, type = "success") {
    document.getElementById("snackbar")?.remove();

    const bar = document.createElement("div");
    bar.id = "snackbar";
    bar.className = `snackbar snackbar-${type}`;
    bar.innerHTML = `<i class="fas fa-check-circle"></i> <span>${escapeHtml(message)}</span>`;
    document.body.appendChild(bar);

    // trigger the slide-in animation
    requestAnimationFrame(() => bar.classList.add("show"));

    setTimeout(() => {
        bar.classList.remove("show");
        setTimeout(() => bar.remove(), 300);
    }, 3500);
}

// Prices/totals are NOT sent: the server must look up prices and compute the total itself.
async function placeOrder(payload) {
    if (USE_MOCK_ORDERS) {
        await new Promise(resolve => setTimeout(resolve, 700)); // fake network delay
        return { order_id: "MOCK-" + Date.now().toString().slice(-6) };
    }
    // Expected response: { order_id: 123 }
    return authFetch("/orders", { method: "POST", body: JSON.stringify(payload) });
}

// items: [{ food_id, name, price, quantity }]
export function openCheckout({ items, onSuccess }) {
    if (document.getElementById("checkoutModal")) return;

    const user = getUser();
    const t = calculateTotals(items.reduce((sum, i) => sum + i.price * i.quantity, 0));

    const itemLines = items.map(i => `
        <div class="summary-row">
            <span>${escapeHtml(i.name)} × ${i.quantity}</span>
            <span>${formatINR(i.price * i.quantity)}</span>
        </div>`).join("");

    const modal = document.createElement("div");
    modal.className = "modal fade show";
    modal.id = "checkoutModal";
    modal.tabIndex = -1;
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("role", "dialog");
    modal.style.display = "block";

    modal.innerHTML = `
        <div class="modal-dialog modal-lg modal-dialog-scrollable">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title"><i class="fas fa-receipt"></i> Checkout</h5>
                    <button type="button" class="close checkout-close" id="checkoutClose" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body" id="checkoutBody">

                    <h6 class="mb-3 fw-bold"><i class="fas fa-map-pin"></i> Delivery Information</h6>
                    <div class="mb-4">
                        <label class="form-label" for="fullName">Full Name</label>
                        <input type="text" class="form-control" id="fullName" placeholder="Enter your full name"
                               value="${escapeHtml(user?.name ?? "")}">
                        <div class="invalid-feedback"></div>
                    </div>
                    <div class="mb-4">
                        <label class="form-label" for="email">Email</label>
                        <input type="email" class="form-control" id="email" placeholder="Enter your email"
                               value="${escapeHtml(user?.email ?? "")}">
                        <div class="invalid-feedback"></div>
                    </div>
                    <div class="mb-4">
                        <label class="form-label" for="phone">Phone Number</label>
                        <input type="tel" class="form-control" id="phone" placeholder="Enter your phone number">
                        <div class="invalid-feedback"></div>
                    </div>
                    <div class="mb-4">
                        <label class="form-label" for="address">Delivery Address</label>
                        <textarea class="form-control" id="address" rows="3" placeholder="Enter your delivery address"></textarea>
                        <div class="invalid-feedback"></div>
                    </div>

                    <hr>

                    <h6 class="mb-3 fw-bold"><i class="fas fa-credit-card"></i> Payment Method</h6>
                    <div class="mb-4 d-flex flex-column" id="paymentOptions">
                        <label class="payment-option selected">
                            <input type="radio" name="payment" value="credit-card">
                            <span><i class="fas fa-credit-card"></i> Credit/Debit Card</span>
                        </label>
                        <label class="payment-option">
                            <input type="radio" name="payment" value="paypal">
                            <span><i class="fab fa-paypal"></i> PayPal</span>
                        </label>
                        <label class="payment-option">
                            <input type="radio" name="payment" value="google-pay">
                            <span><i class="fab fa-google"></i> Google Pay</span>
                        </label>
                        <label class="payment-option">
                            <input type="radio" name="payment" value="apple-pay">
                            <span><i class="fab fa-apple"></i> Apple Pay</span>
                        </label>
                        <label class="payment-option">
                            <input type="radio" name="payment" value="cash" checked>
                            <span><i class="fas fa-money-bill"></i> Cash on Delivery</span>
                        </label>
                    </div>

                    <hr>

                    <h6 class="mb-3 fw-bold"><i class="fas fa-list"></i> Order Summary</h6>
                    <div class="order-summary-modal">
                        ${itemLines}
                        <hr>
                        <div class="summary-row"><span>Subtotal:</span><span>${formatINR(t.subtotal)}</span></div>
                        <div class="summary-row"><span>Tax (${Math.round(TAX_RATE * 100)}%):</span><span>${formatINR(t.tax)}</span></div>
                        <div class="summary-row"><span>Delivery Fee:</span><span>${formatINR(t.delivery)}</span></div>
                        <div class="summary-row total"><span>Total:</span><span>${formatINR(t.total)}</span></div>
                    </div>

                    <div class="alert alert-danger d-none" id="checkoutError"></div>

                    <button class="btn btn-lg w-100" id="placeOrderBtn"
                            style="background: linear-gradient(90deg, var(--primary-color, #e8541e), var(--secondary-color, #f7931e)); color: white; font-weight: 700;">
                        <i class="fas fa-check-circle"></i> Place Order Now
                    </button>
                </div>
            </div>
        </div>
    `;

    const backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop fade show";

    document.body.append(modal, backdrop);
    document.body.classList.add("modal-open");

    // ---------- close handling ----------
    function closeModal() {
        document.removeEventListener("keydown", onKey);
        modal.remove();
        backdrop.remove();
        document.body.classList.remove("modal-open");
    }
    function onKey(e) { if (e.key === "Escape") closeModal(); }

    document.addEventListener("keydown", onKey);
    modal.querySelector("#checkoutClose").addEventListener("click", closeModal);
    modal.addEventListener("mousedown", (e) => { if (e.target === modal) closeModal(); });

    // ---------- payment option highlight ----------
    modal.querySelector("#paymentOptions").addEventListener("change", () => {
        modal.querySelectorAll(".payment-option").forEach(label => {
            label.classList.toggle("selected", label.querySelector("input").checked);
        });
    });

    // ---------- validation ----------
    const rules = [
        { id: "fullName", test: v => v.length >= 2, msg: "Please enter your full name" },
        { id: "email", test: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), msg: "Please enter a valid email address" },
        { id: "phone", test: v => /^\d{10,15}$/.test(v.replace(/[\s()+-]/g, "")), msg: "Please enter a valid phone number" },
        { id: "address", test: v => v.length >= 10, msg: "Please enter your full delivery address" }
    ];

    rules.forEach(({ id }) => {
        modal.querySelector(`#${id}`).addEventListener("input", (e) => e.target.classList.remove("is-invalid"));
    });

    function validate() {
        let ok = true;
        rules.forEach(({ id, test, msg }) => {
            const input = modal.querySelector(`#${id}`);
            const valid = test(input.value.trim());
            input.classList.toggle("is-invalid", !valid);
            if (!valid) {
                input.nextElementSibling.textContent = msg;
                if (ok) input.focus(); // focus the first invalid field
                ok = false;
            }
        });
        return ok;
    }

    // ---------- place order ----------
    const placeBtn = modal.querySelector("#placeOrderBtn");
    const errorBox = modal.querySelector("#checkoutError");
    const btnHtml = placeBtn.innerHTML;

    placeBtn.addEventListener("click", async () => {
        errorBox.classList.add("d-none");
        if (!validate()) return;

        const payment = modal.querySelector('input[name="payment"]:checked').value;
        const payload = {
            items: items.map(i => ({ food_id: i.food_id, quantity: i.quantity })),
            customer: {
                name: modal.querySelector("#fullName").value.trim(),
                email: modal.querySelector("#email").value.trim(),
                phone: modal.querySelector("#phone").value.trim(),
                address: modal.querySelector("#address").value.trim()
            },
            payment_method: payment
        };

        placeBtn.disabled = true;
        placeBtn.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Placing order...`;
        
        try {
            await placeOrder(payload);

            closeModal();
            onSuccess?.();   // clears the cart
            showSnackbar("Your order is placed successfully.");
        } catch (err) {
            errorBox.textContent = err.message;
            errorBox.classList.remove("d-none");
            placeBtn.disabled = false;
            placeBtn.innerHTML = btnHtml;
        }
    });

    modal.querySelector("#fullName").focus();
}
