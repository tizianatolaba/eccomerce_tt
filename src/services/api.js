import React, { useState, useEffect } from 'react';
import { getProductos } from '../api';

const API_URL = "http://localhost:8000";
export const ListaProductos = () => {
    const [productos, setProductos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const cargarProductos = async () => {
            try {
                const data = await getProductos();
                setProductos(data);
            } catch (err) {
                setError("No se pudieron cargar los productos.");
            } finally {
                setCargando(false);
            }
        };

        cargarProductos();
    }, []); // El array vacío [] asegura que solo se ejecute una vez al montar

    if (cargando) return <p>Cargando productos...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;

    return (
        <div>
            <h2>Catálogo de Productos</h2>
            <ul>
                {productos.map((producto) => (
                    <li key={producto.id || producto._id}>
                        {producto.nombre} - ${producto.precio}
                    </li>
                ))}
            </ul>
        </div>
    );
};