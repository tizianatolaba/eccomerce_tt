// Global State
let token = localStorage.getItem("jwt_token") || null;
let currentUser = null;
let cart = JSON.parse(localStorage.getItem("shopping_cart")) || [];
let products = [];
let arrepentirseOrderId = null; // Temp holder for cancellation target

// API URL Prefix
const API_URL = ""; 

// Toast Notification System
function showToast(message, type = "success") {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = `toast ${type === "error" ? "toast-error" : "toast-success"}`;
    
    const icon = type === "error" 
        ? '<i class="fa-solid fa-circle-exclamation"></i>' 
        : '<i class="fa-solid fa-circle-check"></i>';
        
    toast.innerHTML = `${icon} <span>${message}</span>`;
    container.appendChild(toast);
    
    // Auto-remove toast after 5 seconds (matching CSS animation)
    setTimeout(() => {
        toast.remove();
    }, 5000);
}

// Format currency in ARS ($)
function formatCurrency(value) {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0
    }).format(value);
}

// Fetch headers helper
function getHeaders() {
    const headers = {
        "Content-Type": "application/json"
    };
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
}

// --- App Initialization ---
document.addEventListener("DOMContentLoaded", () => {
    initEventListeners();
    updateCartCount();
    
    if (token) {
        fetchProfile();
    } else {
        updateAuthUI();
    }
    
    fetchProducts();
});

// --- Event Listeners Setup ---
function initEventListeners() {
    // Navigation Routing
    document.getElementById("nav-home-btn").addEventListener("click", (e) => { e.preventDefault(); showView("shop"); });
    document.getElementById("btn-shop-nav").addEventListener("click", (e) => { e.preventDefault(); showView("shop"); });
    document.getElementById("footer-btn-shop").addEventListener("click", (e) => { e.preventDefault(); showView("shop"); });
    document.getElementById("btn-legal-nav").addEventListener("click", (e) => { e.preventDefault(); showView("legal"); });
    document.getElementById("footer-btn-legal").addEventListener("click", (e) => { e.preventDefault(); showView("legal"); });
    
    // Redirect buttons
    document.querySelectorAll(".btn-shop-redirect").forEach(btn => {
        btn.addEventListener("click", () => showView("shop"));
    });

    // Legal Footer Links
    document.getElementById("footer-btn-privacy").addEventListener("click", (e) => {
        e.preventDefault();
        showView("legal");
        switchLegalTab("privacy");
    });
    document.getElementById("footer-btn-terms").addEventListener("click", (e) => {
        e.preventDefault();
        showView("legal");
        switchLegalTab("terms");
    });
    document.getElementById("footer-btn-arrepentimiento").addEventListener("click", (e) => {
        e.preventDefault();
        showView("legal");
        switchLegalTab("arrepentimiento-info");
    });
    document.getElementById("cart-privacy-link").addEventListener("click", (e) => {
        e.preventDefault();
        closeCart();
        showView("legal");
        switchLegalTab("privacy");
    });

    // Modals open/close
    document.getElementById("btn-login-open").addEventListener("click", () => openModal("login"));
    document.getElementById("btn-register-open").addEventListener("click", () => openModal("register"));
    document.getElementById("btn-profile-open").addEventListener("click", () => {
        showView("profile");
        fetchOrders();
    });
    
    document.getElementById("modal-login-close").addEventListener("click", () => closeModal("login"));
    document.getElementById("modal-register-close").addEventListener("click", () => closeModal("register"));
    document.getElementById("modal-arrepentimiento-close").addEventListener("click", () => closeModal("confirm-arrepentimiento"));
    document.getElementById("modal-delete-close").addEventListener("click", () => closeModal("confirm-delete"));
    
    document.getElementById("btn-arrepentirse-cancel").addEventListener("click", () => closeModal("confirm-arrepentimiento"));
    document.getElementById("btn-delete-cancel").addEventListener("click", () => closeModal("confirm-delete"));

    document.getElementById("link-go-register").addEventListener("click", (e) => {
        e.preventDefault();
        closeModal("login");
        openModal("register");
    });
    document.getElementById("link-go-login").addEventListener("click", (e) => {
        e.preventDefault();
        closeModal("register");
        openModal("login");
    });

    // Checkout Checkbox
    document.getElementById("cart-data-consent").addEventListener("change", (e) => {
        document.getElementById("btn-checkout").disabled = !e.target.checked || cart.length === 0;
    });

    // Form Submissions
    document.getElementById("form-login").addEventListener("submit", handleLoginSubmit);
    document.getElementById("form-register").addEventListener("submit", handleRegisterSubmit);
    
    // Cart drawer toggles
    document.getElementById("cart-toggle-btn").addEventListener("click", openCart);
    document.getElementById("cart-close-btn").addEventListener("click", closeCart);
    document.getElementById("cart-overlay").addEventListener("click", closeCart);

    // Filter Buttons
    document.querySelectorAll(".filter-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
            e.target.classList.add("active");
            const category = e.target.getAttribute("data-category");
            fetchProducts(category === "all" ? null : category);
        });
    });

    // Checkout
    document.getElementById("btn-checkout").addEventListener("click", handleCheckout);

    // Logout
    document.getElementById("btn-logout").addEventListener("click", handleLogout);

    // Legal tabs nested
    document.querySelectorAll(".legal-tab-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const tabId = e.target.getAttribute("data-tab");
            switchLegalTab(tabId);
        });
    });

    // Register Modal legal links inside form
    document.querySelectorAll(".legal-link-inside-form").forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            closeModal("register");
            showView("legal");
            switchLegalTab(e.target.getAttribute("data-target"));
        });
    });

    // Account deletion confirmation
    document.getElementById("btn-delete-account").addEventListener("click", () => {
        openModal("confirm-delete");
    });
    document.getElementById("btn-delete-confirm").addEventListener("click", handleDeleteAccount);

    // Arrepentimiento confirmation action
    document.getElementById("btn-arrepentirse-confirm").addEventListener("click", executeArrepentimiento);
}

// --- Navigation Routing ---
function showView(viewId) {
    document.querySelectorAll(".view").forEach(view => {
        view.classList.add("hidden");
    });
    document.getElementById(`view-${viewId}`).classList.remove("hidden");
    
    // Update active nav links
    document.querySelectorAll(".nav-link").forEach(link => link.classList.remove("active"));
    if (viewId === "shop") {
        document.getElementById("btn-shop-nav").classList.add("active");
    } else if (viewId === "legal") {
        document.getElementById("btn-legal-nav").classList.add("active");
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function switchLegalTab(tabId) {
    document.querySelectorAll(".legal-tab-btn").forEach(btn => {
        btn.classList.remove("active");
        if (btn.getAttribute("data-tab") === tabId) {
            btn.classList.add("active");
        }
    });
    
    document.querySelectorAll(".legal-tab-content").forEach(content => {
        content.classList.add("hidden");
    });
    document.getElementById(`tab-${tabId}`).classList.remove("hidden");
}

// --- Modals Controller ---
function openModal(modalId) {
    document.getElementById(`modal-${modalId}`).classList.add("open");
}

function closeModal(modalId) {
    document.getElementById(`modal-${modalId}`).classList.remove("open");
}

// --- Product Logic ---
async function fetchProducts(category = null) {
    const container = document.getElementById("product-list-container");
    container.innerHTML = `<div class="loading-spinner"><i class="fa-solid fa-spinner fa-spin"></i> Cargando drop...</div>`;
    
    try {
        let url = `${API_URL}/api/products`;
        if (category) {
            url += `?category=${encodeURIComponent(category)}`;
        }
        
        const response = await fetch(url);
        if (!response.ok) throw new Error("Error cargando productos");
        
        products = await response.json();
        renderProducts();
    } catch (err) {
        container.innerHTML = `<div class="empty-state text-red"><i class="fa-solid fa-triangle-exclamation"></i> <p>Error al conectar con el servidor.</p></div>`;
        console.error(err);
    }
}

function renderProducts() {
    const container = document.getElementById("product-list-container");
    if (products.length === 0) {
        container.innerHTML = `<div class="empty-state"><i class="fa-solid fa-tags"></i><p>No hay productos disponibles en esta categoría.</p></div>`;
        return;
    }
    
    container.innerHTML = products.map(product => {
        const inStock = product.stock > 0;
        const stockBadgeClass = inStock ? "in-stock" : "";
        const stockText = inStock ? "Disponible" : "Sin Stock";
        
        return `
            <div class="product-card">
                <div class="product-img-wrapper">
                    <img src="${product.image_url}" alt="${product.name}" class="product-img" onerror="this.src='https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80'">
                    <div class="product-tags-wrapper">
                        ${product.category ? product.category.split(',').map(cat => `<span class="product-tag">${cat.trim()}</span>`).join('') : ''}
                    </div>
                    <span class="product-stock-tag ${stockBadgeClass}">${stockText}</span>
                </div>
                <div class="product-info">
                    <h3 class="product-title">${product.name}</h3>
                    <p class="product-desc">${product.description}</p>
                    <div class="product-footer">
                        <span class="product-price">${formatCurrency(product.price)}</span>
                        <button 
                            class="btn btn-primary" 
                            onclick="addToCart(${product.id})"
                            ${inStock ? "" : "disabled"}
                        >
                            ${inStock ? '<i class="fa-solid fa-cart-plus"></i> Añadir' : 'Agotado'}
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join("");
}

// --- Cart Operations ---
function openCart() {
    document.getElementById("cart-drawer").classList.add("open");
    document.getElementById("cart-overlay").classList.add("open");
    renderCart();
}

function closeCart() {
    document.getElementById("cart-drawer").classList.remove("open");
    document.getElementById("cart-overlay").classList.remove("open");
}

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const cartItem = cart.find(item => item.product_id === productId);
    if (cartItem) {
        if (cartItem.quantity < product.stock) {
            cartItem.quantity++;
            showToast(`Añadido otro ${product.name} al carrito`, "success");
        } else {
            showToast(`Máximo stock disponible alcanzado (${product.stock} unidades)`, "error");
        }
    } else {
        cart.push({
            product_id: product.id,
            quantity: 1,
            product: product
        });
        showToast(`${product.name} añadido al carrito`, "success");
    }
    
    saveCart();
    updateCartCount();
    if (document.getElementById("cart-drawer").classList.contains("open")) {
        renderCart();
    }
}

function updateCartCount() {
    const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById("cart-count").innerText = totalQty;
    
    // Enable checkout button if cart has items and data consent is checked
    const consentChecked = document.getElementById("cart-data-consent").checked;
    document.getElementById("btn-checkout").disabled = !consentChecked || cart.length === 0;
}

function saveCart() {
    localStorage.setItem("shopping_cart", JSON.stringify(cart));
}

function updateQty(productId, delta) {
    const cartItem = cart.find(item => item.product_id === productId);
    if (!cartItem) return;
    
    const product = cartItem.product;
    const newQty = cartItem.quantity + delta;
    
    if (newQty <= 0) {
        cart = cart.filter(item => item.product_id !== productId);
    } else if (newQty > product.stock) {
        showToast(`Stock insuficiente. Disponible: ${product.stock}`, "error");
        return;
    } else {
        cartItem.quantity = newQty;
    }
    
    saveCart();
    updateCartCount();
    renderCart();
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.product_id !== productId);
    saveCart();
    updateCartCount();
    renderCart();
    showToast("Producto eliminado del carrito", "success");
}

function renderCart() {
    const container = document.getElementById("cart-items-container");
    if (cart.length === 0) {
        container.innerHTML = `
            <div class="empty-cart-state">
                <i class="fa-solid fa-cart-shopping"></i>
                <p>El carrito está vacío</p>
            </div>
        `;
        document.getElementById("cart-total-price").innerText = "$0.00";
        return;
    }
    
    let total = 0;
    container.innerHTML = cart.map(item => {
        const itemTotal = item.product.price * item.quantity;
        total += itemTotal;
        return `
            <div class="cart-item">
                <img src="${item.product.image_url}" alt="${item.product.name}" class="cart-item-img" onerror="this.src='https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80'">
                <div class="cart-item-details">
                    <div>
                        <div class="cart-item-name">${item.product.name}</div>
                        <div class="cart-item-price">${formatCurrency(item.product.price)}</div>
                    </div>
                    <div class="cart-item-actions">
                        <div class="qty-controls">
                            <button class="qty-btn" onclick="updateQty(${item.product_id}, -1)">-</button>
                            <span class="qty-val">${item.quantity}</span>
                            <button class="qty-btn" onclick="updateQty(${item.product_id}, 1)">+</button>
                        </div>
                        <button class="item-remove-btn" onclick="removeFromCart(${item.product_id})">
                            <i class="fa-regular fa-trash-can"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join("");
    
    document.getElementById("cart-total-price").innerText = formatCurrency(total);
}

// --- Authentication Controllers ---
async function fetchProfile() {
    try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
            headers: getHeaders()
        });
        
        if (response.ok) {
            currentUser = await response.json();
            updateAuthUI();
        } else {
            // Token expired/invalid
            handleLogoutSilently();
        }
    } catch (err) {
        console.error("Error fetching profile:", err);
    }
}

function updateAuthUI() {
    const authNav = document.getElementById("auth-nav-container");
    const userNav = document.getElementById("user-menu-container");
    
    if (currentUser) {
        authNav.classList.add("hidden");
        userNav.classList.remove("hidden");
        document.getElementById("user-display-name").innerText = currentUser.name;
        
        // Populate profile view details
        document.getElementById("profile-name").innerText = currentUser.name;
        document.getElementById("profile-email").innerText = currentUser.email;
        document.getElementById("profile-role").innerText = currentUser.role.toUpperCase();
        
        const dateCreated = new Date(currentUser.created_at);
        document.getElementById("profile-created").innerText = dateCreated.toLocaleDateString('es-AR');
    } else {
        authNav.classList.remove("hidden");
        userNav.classList.add("hidden");
        
        document.getElementById("profile-name").innerText = "Invitado";
        document.getElementById("profile-email").innerText = "";
    }
}

async function handleLoginSubmit(e) {
    e.preventDefault();
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;
    
    try {
        const response = await fetch(`${API_URL}/api/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            token = data.access_token;
            localStorage.setItem("jwt_token", token);
            showToast("¡Sesión iniciada con éxito!", "success");
            closeModal("login");
            await fetchProfile();
            
            // Clear inputs
            document.getElementById("form-login").reset();
        } else {
            showToast(data.detail || "Error al iniciar sesión. Verifique sus datos.", "error");
        }
    } catch (err) {
        showToast("Error de conexión con el servidor", "error");
        console.error(err);
    }
}

async function handleRegisterSubmit(e) {
    e.preventDefault();
    const name = document.getElementById("register-name").value;
    const email = document.getElementById("register-email").value;
    const password = document.getElementById("register-password").value;
    const consent = document.getElementById("register-data-consent").checked;
    
    if (!consent) {
        showToast("Debe consentir el procesamiento de datos.", "error");
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/api/auth/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name,
                email,
                password,
                data_consent: consent
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast("Registro exitoso. ¡Inicia sesión para comprar!", "success");
            closeModal("register");
            
            // Auto login after registration
            document.getElementById("login-email").value = email;
            document.getElementById("login-password").value = password;
            openModal("login");
            
            document.getElementById("form-register").reset();
        } else {
            showToast(data.detail || "Ocurrió un error en el registro", "error");
        }
    } catch (err) {
        showToast("Error de conexión con el servidor", "error");
        console.error(err);
    }
}

function handleLogout() {
    token = null;
    currentUser = null;
    localStorage.removeItem("jwt_token");
    updateAuthUI();
    showView("shop");
    showToast("Sesión cerrada con éxito.", "success");
}

function handleLogoutSilently() {
    token = null;
    currentUser = null;
    localStorage.removeItem("jwt_token");
    updateAuthUI();
}

// --- Account Suppression (Ley 25.326 ARCO rights) ---
async function handleDeleteAccount() {
    closeModal("confirm-delete");
    try {
        const response = await fetch(`${API_URL}/api/auth/delete-data`, {
            method: "DELETE",
            headers: getHeaders()
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast(data.detail || "Tus datos personales y cuenta fueron eliminados del sistema.", "success");
            handleLogoutSilently();
            showView("shop");
        } else {
            showToast(data.detail || "No se pudo procesar la solicitud de eliminación de datos.", "error");
        }
    } catch (err) {
        showToast("Error al conectar con el servidor", "error");
        console.error(err);
    }
}

// --- Order Checkout Logic ---
async function handleCheckout() {
    if (!currentUser) {
        showToast("Debes iniciar sesión para finalizar tu compra.", "error");
        openModal("login");
        return;
    }
    
    const consent = document.getElementById("cart-data-consent").checked;
    if (!consent) {
        showToast("Debe aceptar la política de protección de datos.", "error");
        return;
    }
    
    const orderItems = cart.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity
    }));
    
    try {
        const response = await fetch(`${API_URL}/api/orders`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({ items: orderItems })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast("¡Compra realizada con éxito!", "success");
            
            // Clear cart
            cart = [];
            saveCart();
            updateCartCount();
            closeCart();
            
            // Refresh catalog (as stocks changed) and show user profile orders
            fetchProducts();
            showView("profile");
            fetchOrders();
        } else {
            showToast(data.detail || "Error al procesar la compra.", "error");
        }
    } catch (err) {
        showToast("Error de conexión al procesar el checkout", "error");
        console.error(err);
    }
}

// --- Fetch User Orders History ---
async function fetchOrders() {
    const container = document.getElementById("orders-list-container");
    container.innerHTML = `<div class="loading-spinner"><i class="fa-solid fa-spinner fa-spin"></i> Cargando historial...</div>`;
    
    try {
        const response = await fetch(`${API_URL}/api/orders`, {
            headers: getHeaders()
        });
        
        if (!response.ok) throw new Error("Error obteniendo compras");
        
        const orders = await response.json();
        renderOrders(orders);
    } catch (err) {
        container.innerHTML = `<div class="empty-state text-red"><i class="fa-solid fa-triangle-exclamation"></i> <p>Error al cargar el historial.</p></div>`;
        console.error(err);
    }
}

function renderOrders(orders) {
    const container = document.getElementById("orders-list-container");
    if (orders.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-receipt"></i>
                <p>Aún no realizaste ninguna compra.</p>
                <button class="btn btn-primary btn-shop-redirect">Ir a la Tienda</button>
            </div>
        `;
        // Re-bind redirect
        container.querySelector(".btn-shop-redirect").addEventListener("click", () => showView("shop"));
        return;
    }
    
    container.innerHTML = orders.map(order => {
        const dateCreated = new Date(order.created_at);
        const now = new Date();
        
        // Calculate days elapsed for Botón de Arrepentimiento (10 days limit)
        const diffTime = Math.abs(now - dateCreated);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        const isEligibleForArrepentimiento = order.status !== "Cancelled/Arrepentido" && diffDays <= 10;
        
        let statusBadgeClass = "";
        let statusText = "";
        if (order.status === "Paid") {
            statusBadgeClass = "paid";
            statusText = "Pagado";
        } else if (order.status === "Cancelled/Arrepentido") {
            statusBadgeClass = "cancelled";
            statusText = "Devuelto (Arrepentido)";
        } else {
            statusText = order.status;
        }

        const itemsHtml = order.items.map(item => `
            <div class="order-prod-item">
                <span class="order-prod-name">${item.product.name}</span>
                <span class="order-prod-qty">x${item.quantity}</span>
                <span class="order-prod-price">${formatCurrency(item.price_at_purchase * item.quantity)}</span>
            </div>
        `).join("");

        const arrepentimientoButton = isEligibleForArrepentimiento 
            ? `<button class="btn btn-danger" onclick="confirmArrepentimiento(${order.id})">
                 <i class="fa-solid fa-arrow-rotate-left"></i> Botón de Arrepentimiento
               </button>`
            : "";

        return `
            <div class="order-card">
                <div class="order-header-row">
                    <div class="order-meta-info">
                        <span class="order-id-txt">Pedido #${order.id}</span>
                        <span class="order-date-txt">${dateCreated.toLocaleString('es-AR')}</span>
                    </div>
                    <span class="order-status-badge ${statusBadgeClass}">${statusText}</span>
                </div>
                <div class="order-products-list">
                    ${itemsHtml}
                </div>
                <div class="order-summary-row">
                    <span class="order-total-amount">Total Pagado: <span>${formatCurrency(order.total_price)}</span></span>
                    ${arrepentimientoButton}
                </div>
            </div>
        `;
    }).join("");
}

// --- Botón de Arrepentimiento Trigger ---
function confirmArrepentimiento(orderId) {
    arrepentirseOrderId = orderId;
    openModal("confirm-arrepentimiento");
}

async function executeArrepentimiento() {
    if (!arrepentirseOrderId) return;
    
    closeModal("confirm-arrepentimiento");
    try {
        const response = await fetch(`${API_URL}/api/orders/${arrepentirseOrderId}/arrepentirse`, {
            method: "POST",
            headers: getHeaders()
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast("Arrepentimiento procesado con éxito. Se reintegrará tu pago.", "success");
            // Refresh lists
            fetchOrders();
            fetchProducts();
        } else {
            showToast(data.detail || "No se pudo procesar el arrepentimiento.", "error");
        }
    } catch (err) {
        showToast("Error de conexión al procesar el arrepentimiento", "error");
        console.error(err);
    } finally {
        arrepentirseOrderId = null;
    }
}
