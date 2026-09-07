import { useEffect, useState } from 'react'
import { getProductos } from './services/api'
import ProductCard from './components/ProductCard'
import './App.css'

function App() {
  const [productos, setProductos] = useState([])
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

  if (productos.length === 0) {
    return (
      <div className="container">
        <h1>Catálogo de productos</h1>
        <p>No hay productos disponibles en este momento.</p>
      </div>
    )
  }

  return (
    <div className="container">
      <h1>Catálogo de productos</h1>

      <div className="productos-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
        {productos.map((producto) => (
          <ProductCard key={producto.id} producto={producto} />
        ))}
      </div>
    </div>
  )
}

export default App
