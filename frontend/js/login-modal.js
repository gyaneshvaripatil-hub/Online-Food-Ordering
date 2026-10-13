// login-modal.js — login popup styled like the Shopping Cart modal
import { login } from "./auth.js";

const STYLE_ID = "auth-modal-style";

function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
        /* Login button shown in the header (white, to match the orange header) */
        .auth-login-btn {
            background: #fff;
            color: #e8541e;
            border: 2px solid #fff;
            border-radius: 10px;
            padding: 7px 20px;
            font-weight: 700;
            cursor: pointer;
            transition: transform .15s, box-shadow .15s;
        }
        .auth-login-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,.2); }

        /* Popup */
        .auth-modal {
            border: none;
            padding: 0;
            border-radius: 16px;
            width: min(500px, 92vw);
            margin: 16px auto auto auto;      /* sits near the top, like the cart popup */
            overflow: hidden;
            box-shadow: 0 20px 50px rgba(0,0,0,.35);
        }
        .auth-modal::backdrop { background: rgba(0,0,0,.45); backdrop-filter: blur(3px); }

        .auth-modal-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px 20px;
            background: linear-gradient(90deg, #ff7a2f, #f7931e);
            color: #fff;
        }
        .auth-modal-header h2 { margin: 0; font-size: 1.45rem; font-weight: 700; }
        .auth-close {
            background: none;
            border: none;
            font-size: 2rem;
            line-height: 1;
            color: #7a3b0c;
            cursor: pointer;
            padding: 0 4px;
        }
        .auth-close:hover { color: #fff; }

        .auth-modal-body { background: #fff; padding: 22px 20px 24px; }
        .auth-modal-body label { display: block; font-weight: 600; margin: 0 0 6px; color: #333; }
        .auth-modal-body input {
            width: 100%;
            padding: 11px 14px;
            border: 2px solid #f1c9b2;
            border-radius: 12px;
            outline: none;
            font-size: 1rem;
            box-sizing: border-box;
        }
        .auth-modal-body input:focus { border-color: #e8541e; }
        .auth-field { margin-bottom: 16px; }
        .auth-pass { position: relative; }
        .auth-pass input { padding-right: 70px; }
        .auth-toggle {
            position: absolute;
            right: 10px;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            color: #e8541e;
            font-weight: 600;
            cursor: pointer;
        }
        .auth-error {
            background: #fde8e8;
            color: #b42318;
            border-radius: 10px;
            padding: 10px 12px;
            margin-bottom: 14px;
            font-size: .95rem;
        }
        .auth-error[hidden] { display: none; }
        .auth-submit {
            width: 100%;
            padding: 12px;
            border: none;
            border-radius: 12px;
            background: linear-gradient(135deg, #e8541e, #f09a1a);
            color: #fff;
            font-weight: 700;
            font-size: 1.05rem;
            cursor: pointer;
        }
        .auth-submit:disabled { opacity: .7; cursor: not-allowed; }
    `;
    document.head.appendChild(style);
}

injectStyles();

// Opens the login popup. onSuccess runs after a successful login.
export function openLoginModal({ onSuccess } = {}) {
    if (document.querySelector(".auth-modal")) return;
    injectStyles();

    const dialog = document.createElement("dialog");
    dialog.className = "auth-modal";
    dialog.innerHTML = `
        <div class="auth-modal-header">
            <h2>Login</h2>
            <button type="button" class="auth-close" aria-label="Close">&times;</button>
        </div>

        <form class="auth-modal-body">
            <div class="auth-error" hidden></div>

            <div class="auth-field">
                <label for="authEmail">Email</label>
                <input id="authEmail" name="email" type="email" required autocomplete="username" placeholder="you@example.com">
            </div>

            <div class="auth-field">
                <label for="authPassword">Password</label>
                <div class="auth-pass">
                    <input id="authPassword" name="password" type="password" required autocomplete="current-password" placeholder="Enter your password">
                    <button type="button" class="auth-toggle">Show</button>
                </div>
            </div>

            <button type="submit" class="auth-submit">Login</button>
        </form>
    `;

    document.body.appendChild(dialog);

    const form = dialog.querySelector("form");
    const errorBox = dialog.querySelector(".auth-error");
    const submitBtn = dialog.querySelector(".auth-submit");
    const passInput = form.elements.password;
    const toggleBtn = dialog.querySelector(".auth-toggle");

    dialog.querySelector(".auth-close").addEventListener("click", () => dialog.close());
    dialog.addEventListener("close", () => dialog.remove());

    // Click on the dark backdrop closes the popup
    dialog.addEventListener("click", (e) => {
        if (e.target === dialog) dialog.close();
    });

    toggleBtn.addEventListener("click", () => {
        const show = passInput.type === "password";
        passInput.type = show ? "text" : "password";
        toggleBtn.textContent = show ? "Hide" : "Show";
    });

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        errorBox.hidden = true;

        submitBtn.disabled = true;
        submitBtn.textContent = "Logging in...";

        try {
            await login(form.elements.email.value.trim(), passInput.value);
            dialog.close();
            onSuccess?.();
        } catch (err) {
            errorBox.textContent = err.message;
            errorBox.hidden = false;
            submitBtn.disabled = false;
            submitBtn.textContent = "Login";
        }
    });

    dialog.showModal();
    form.elements.email.focus();
}
