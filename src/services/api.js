const API_URL = "http://localhost:8000";

/**
 * Obtener productos desde la API de FastAPI
 */
export async function getProductos(params = {}) {
    const query = new URLSearchParams();

    if (params.skip !== undefined) query.append("skip", params.skip);
    if (params.limit !== undefined) query.append("limit", params.limit);
    else query.append("limit", "50");

    if (params.name) query.append("name", params.name);
    if (params.max_price) query.append("max_price", params.max_price);
    if (params.category) query.append("category", params.category);

    const response = await fetch(`${API_URL}/api/products?${query.toString()}`);
    if (!response.ok) {
        throw new Error("No se pudieron cargar los productos.");
    }
    return await response.json();
}

/**
 * Obtener un producto por ID
 */
export async function getProducto(id) {
    const response = await fetch(`${API_URL}/api/products/${id}`);
    if (!response.ok) {
        throw new Error("No se pudo encontrar el producto.");
    }
    return await response.json();
}

/**
 * Iniciar sesión de usuario
 */
export async function loginUser(email, password) {
    const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Error en el inicio de sesión.");
    }
    return await response.json();
}

/**
 * Registrar un nuevo usuario
 */
export async function registerUser(userData) {
    const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData)
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Error en el registro del usuario.");
    }
    return await response.json();
}
