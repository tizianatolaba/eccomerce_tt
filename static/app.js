
// --- Product Logic ---
async function fetchProducts(category = null) {
    const container = document.getElementById("product-list-container");

    // Estado de carga
    isLoading = true;
    error = null;

    container.innerHTML = `
        <div class="loading-spinner">
            <i class="fa-solid fa-spinner fa-spin"></i> Cargando drop...
        </div>
    `;

    try {
        let url = `${API_URL}/api/products`;

        if (category) {
            url += `?category=${encodeURIComponent(category)}`;
        }

        const response = await fetch(url);

        // Comprobar si la respuesta fue correcta
        if (!response.ok) {
            throw new Error(`Error cargando productos: ${response.status}`);
        }

        products = await response.json();
        renderProducts();

    } catch (err) {
        // Guardar el error
        error = "No se pudieron cargar los productos. Verificá que el backend esté funcionando.";

        console.error(err);

        // Mostrar el error en pantalla
        if (error !== null) {
            container.innerHTML = `
                <div class="empty-state text-red">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    <p>${error}</p>
                </div>
            `;
        }

    } finally {
        // Finaliza la carga
        isLoading = false;
    }
}

