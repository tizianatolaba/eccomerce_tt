const API_URL = 'http://127.0.0.1:8000';

export async function getProductos() {
  const respuesta = await fetch(`${API_URL}/productos`);

  if (!respuesta.ok) {
    throw new Error(`Error en la petición: ${respuesta.status} ${respuesta.statusText}`);
  }

  return await respuesta.json();
}
