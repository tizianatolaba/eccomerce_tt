import { useEffect, useState } from 'react'
import { getProductos } from './services/api'
import ProductCard from './components/ProductCard'
import './App.css'

function App() {
  const [productos, setProductos] = useState([])
  const [carrito, setCarrito] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setIsLoading(true)
    setError(null)

    getProductos()
      .then((data) => {
        setProductos(data)
      })
      .catch((err) => {
        console.error('Error al obtener productos:', err)
        setError(
          'No se pudieron cargar los productos. Verificá que el backend esté funcionando.'
        )
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [])

  const handleAddToCart = (producto) => {
    setCarrito((prevCarrito) => {
      const existe = prevCarrito.find((item) => item.producto.id === producto.id)
      if (existe) {
        if (existe.cantidad >= producto.stock) {
          alert(`Sin stock suficiente para agregar más unidades de "${producto.name}"`)
          return prevCarrito
        }
        return prevCarrito.map((item) =>
          item.producto.id === producto.id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        )
      } else {
        return [...prevCarrito, { producto, cantidad: 1 }]
      }
    })
  }

  const handleUpdateQuantity = (productoId, nuevaCantidad) => {
    if (nuevaCantidad <= 0) {
      handleRemoveFromCart(productoId)
      return
    }
    setCarrito((prevCarrito) =>
      prevCarrito.map((item) =>
        item.producto.id === productoId
          ? { ...item, cantidad: nuevaCantidad }
          : item
      )
    )
  }

  const handleRemoveFromCart = (productoId) => {
    setCarrito((prevCarrito) =>
      prevCarrito.filter((item) => item.producto.id !== productoId)
    )
  }

  const totalItemsCount = carrito.reduce((sum, item) => sum + item.cantidad, 0)
  const totalCompra = carrito.reduce(
    (sum, item) => sum + item.producto.price * item.cantidad,
    0
  )

  if (isLoading) {
    return (
      <div className="container">
        <h1>Catálogo de productos</h1>
        <p>Cargando productos...</p>
      </div>
    )
  }

  if (error !== null) {
    return (
      <div className="container">
        <h1>Catálogo de productos</h1>
        <p className="error-message" style={{ color: 'red' }}>{error}</p>
      </div>
    )
  }

  return (
    <div className="container" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Catálogo de productos</h1>

      {/* Resumen del Carrito y Suma Total */}
      <div className="cart-summary-box" style={{ background: '#f5f7fa', padding: '16px', borderRadius: '8px', marginBottom: '24px', border: '1px solid #e1e8ed' }}>
        <h2 style={{ marginTop: 0 }}>🛒 Tu Carrito de Compras ({totalItemsCount} ítems)</h2>
        {carrito.length === 0 ? (
          <p style={{ color: '#666' }}>El carrito está vacío. Hacé clic en "Agregar al carrito" en cualquier producto.</p>
        ) : (
          <div>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {carrito.map((item) => (
                <li key={item.producto.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e1e8ed', padding: '8px 0' }}>
                  <span>
                    <strong>{item.producto.name}</strong> - ${item.producto.price.toFixed(2)} x {item.cantidad} = ${(item.producto.price * item.cantidad).toFixed(2)}
                  </span>
                  <div>
                    <button onClick={() => handleUpdateQuantity(item.producto.id, item.cantidad - 1)} style={{ marginRight: '4px', padding: '2px 8px' }}>-</button>
                    <button onClick={() => handleUpdateQuantity(item.producto.id, item.cantidad + 1)} style={{ marginRight: '8px', padding: '2px 8px' }}>+</button>
                    <button onClick={() => handleRemoveFromCart(item.producto.id)} style={{ backgroundColor: '#ff4d4f', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer' }}>Eliminar</button>
                  </div>
                </li>
              ))}
            </ul>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '8px', borderTop: '2px solid #333' }}>
              <h3 style={{ margin: 0 }}>Suma Total de la Compra:</h3>
              <h2 style={{ margin: 0, color: '#00b3a4' }}>${totalCompra.toFixed(2)}</h2>
            </div>
          </div>
        )}
      </div>

      {productos.length === 0 ? (
        <p>No hay productos disponibles en este momento.</p>
      ) : (
        <div className="productos-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
          {productos.map((producto) => (
            <ProductCard 
              key={producto.id} 
              producto={producto} 
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default App
