import { useEffect, useState } from 'react';
import { getProductos, getCurrentUser, createOrder } from './services/api';
import ProductCard from './components/ProductCard';
import AuthModal from './components/AuthModal';
import OrdersModal from './components/OrdersModal';
import './App.css';

function App() {
  const [productos, setProductos] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Auth & Modals state
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [showOrdersModal, setShowOrdersModal] = useState(false);

  // Checkout state
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);

  // Cargar productos
  const loadProducts = () => {
    return getProductos()
      .then((data) => setProductos(data))
      .catch((err) => {
        console.error('Error al obtener productos:', err);
        setError('No se pudieron cargar los productos. Verificá que el backend esté funcionando.');
      });
  };

  useEffect(() => {
    setIsLoading(true);
    loadProducts().finally(() => setIsLoading(false));
  }, []);

  // Verificar sesión existente con token
  useEffect(() => {
    if (token) {
      getCurrentUser(token)
        .then((userData) => {
          setUser(userData);
        })
        .catch(() => {
          // Token inválido o expirado
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        });
    }
  }, [token]);

  const handleAuthSuccess = (newToken, userData) => {
    setToken(newToken);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setOrderSuccess(null);
  };

  const handleAddToCart = (producto) => {
    if (!producto) return;

    if (producto.stock <= 0) {
      alert(`El sticker "${producto.name}" no cuenta con stock disponible.`);
      return;
    }

    setCarrito((prevCarrito) => {
      const existe = prevCarrito.find((item) => item.producto.id === producto.id);
      if (existe) {
        if (existe.cantidad >= producto.stock) {
          alert(`Sin stock suficiente para agregar más unidades de "${producto.name}".`);
          return prevCarrito;
        }
        return prevCarrito.map((item) =>
          item.producto.id === producto.id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        );
      } else {
        return [...prevCarrito, { producto, cantidad: 1 }];
      }
    });
  };

  const handleUpdateQuantity = (productoId, nuevaCantidad) => {
    if (nuevaCantidad <= 0) {
      handleRemoveFromCart(productoId);
      return;
    }
    setCarrito((prevCarrito) =>
      prevCarrito.map((item) => {
        if (item.producto.id === productoId) {
          if (nuevaCantidad > item.producto.stock) {
            alert(`Sin stock suficiente para agregar más unidades de "${item.producto.name}".`);
            return item;
          }
          return { ...item, cantidad: nuevaCantidad };
        }
        return item;
      })
    );
  };

  const handleRemoveFromCart = (productoId) => {
    setCarrito((prevCarrito) =>
      prevCarrito.filter((item) => item.producto.id !== productoId)
    );
  };

  const handleClearCart = () => {
    setCarrito([]);
  };

  // Realizar la compra (Checkout)
  const handleCheckout = async () => {
    setOrderSuccess(null);

    // Si no está autenticado, abrir modal de login
    if (!token || !user) {
      alert('Para finalizar la compra debés iniciar sesión o registrarte.');
      setAuthMode('login');
      setShowAuthModal(true);
      return;
    }

    if (carrito.length === 0) {
      alert('El carrito está vacío.');
      return;
    }

    setIsProcessingOrder(true);

    try {
      const itemsToSubmit = carrito.map((item) => ({
        product_id: item.producto.id,
        quantity: item.cantidad
      }));

      const newOrder = await createOrder(token, itemsToSubmit);

      setOrderSuccess({
        id: newOrder.id,
        total: Number(newOrder.total_price).toFixed(2),
        itemsCount: totalStickersCount
      });

      // Vaciar carrito y recargar productos para refrescar stock actualizado
      setCarrito([]);
      await loadProducts();
    } catch (err) {
      alert(`Error al procesar la compra: ${err.message}`);
    } finally {
      setIsProcessingOrder(false);
    }
  };

  // Cantidad total de stickers en el carrito
  const totalStickersCount = carrito.reduce((sum, item) => sum + item.cantidad, 0);

  // Suma total de los precios por la cantidad de stickers guardados
  const totalCompra = carrito.reduce(
    (sum, item) => sum + Number(item.producto.price) * item.cantidad,
    0
  );

  if (isLoading) {
    return (
      <div className="container" style={{ padding: '40px', textAlign: 'center' }}>
        <h1>🏷️ StickerZone - Tienda Online</h1>
        <p>Cargando productos...</p>
      </div>
    );
  }

  if (error !== null) {
    return (
      <div className="container" style={{ padding: '40px', textAlign: 'center' }}>
        <h1>🏷️ StickerZone - Tienda Online</h1>
        <p className="error-message" style={{ color: 'red' }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* BARRA SUPERIOR / CABECERA DE USUARIO */}
      <header style={{
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center',
        padding: '16px 20px',
        backgroundColor: '#1e293b',
        color: '#fff',
        borderRadius: '8px',
        marginBottom: '24px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.6rem', color: '#38bdf8' }}>🏷️ StickerZone</h1>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Catálogo Oficial de Stickers</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {user ? (
            <>
              <span style={{ fontSize: '0.95rem' }}>
                👤 Hola, <strong>{user.name}</strong>
              </span>
              <button
                onClick={() => setShowOrdersModal(true)}
                style={{
                  backgroundColor: '#3b82f6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '8px 14px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '0.85rem'
                }}
              >
                📦 Mis Pedidos
              </button>
              <button
                onClick={handleLogout}
                style={{
                  backgroundColor: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '8px 14px',
                  cursor: 'pointer',
                  fontSize: '0.85rem'
                }}
              >
                🚪 Cerrar Sesión
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}
                style={{
                  backgroundColor: '#0284c7',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '8px 16px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '0.9rem'
                }}
              >
                🔑 Iniciar Sesión
              </button>
              <button
                onClick={() => { setAuthMode('register'); setShowAuthModal(true); }}
                style={{
                  backgroundColor: '#10b981',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '8px 16px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '0.9rem'
                }}
              >
                📝 Registrarse
              </button>
            </>
          )}
        </div>
      </header>

      {/* MENSAJE DE EXITO AL REALIZAR COMPRA */}
      {orderSuccess && (
        <div style={{
          backgroundColor: '#d1fae5',
          border: '2px solid #10b981',
          color: '#065f46',
          padding: '16px 20px',
          borderRadius: '8px',
          marginBottom: '24px',
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h3 style={{ margin: '0 0 4px 0' }}>🎉 ¡Compra realizada con éxito!</h3>
            <p style={{ margin: 0, fontSize: '0.95rem' }}>
              Se ha generado el <strong>Pedido #{orderSuccess.id}</strong> por un total de <strong>${orderSuccess.total}</strong> ({orderSuccess.itemsCount} stickers).
            </p>
          </div>
          <button
            onClick={() => setShowOrdersModal(true)}
            style={{
              backgroundColor: '#059669',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              padding: '8px 16px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Ver mis pedidos
          </button>
        </div>
      )}

      {/* RESUMEN DEL CARRITO Y SUMA TOTAL DE PRECIOS */}
      <div className="cart-summary-box" style={{ background: '#f8fafc', padding: '20px', borderRadius: '8px', marginBottom: '24px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 style={{ marginTop: 0, marginBottom: 0, fontSize: '1.3rem' }}>
            🛒 Tu Carrito de Compras ({totalStickersCount} {totalStickersCount === 1 ? 'sticker' : 'stickers'})
          </h2>
          {carrito.length > 0 && (
            <button 
              onClick={handleClearCart}
              style={{ backgroundColor: '#64748b', color: '#fff', border: 'none', borderRadius: '4px', padding: '6px 12px', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              Vaciar carrito
            </button>
          )}
        </div>

        {carrito.length === 0 ? (
          <p style={{ color: '#64748b', margin: 0 }}>
            El carrito está vacío. Hacé clic en <strong>"Agregar a tu carrito"</strong> en cualquiera de los stickers del catálogo.
          </p>
        ) : (
          <div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px 0' }}>
              {carrito.map((item) => {
                const subtotal = Number(item.producto.price) * item.cantidad;
                return (
                  <li 
                    key={item.producto.id} 
                    style={{ 
                      display: 'flex', 
                      justify: 'space-between', 
                      alignItems: 'center', 
                      borderBottom: '1px solid #e2e8f0', 
                      padding: '10px 0' 
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '1.05rem', color: '#1e293b' }}>{item.producto.name}</strong>
                      <div style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '2px' }}>
                        ${Number(item.producto.price).toFixed(2)} c/u x {item.cantidad} {item.cantidad === 1 ? 'unidad' : 'unidades'} = <strong style={{ color: '#0f172a' }}>${subtotal.toFixed(2)}</strong>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button 
                        onClick={() => handleUpdateQuantity(item.producto.id, item.cantidad - 1)} 
                        style={{ padding: '4px 10px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#fff', fontWeight: 'bold' }}
                        title="Disminuir cantidad"
                      >
                        -
                      </button>
                      <span style={{ fontWeight: 'bold', minWidth: '24px', textAlign: 'center' }}>{item.cantidad}</span>
                      <button 
                        onClick={() => handleUpdateQuantity(item.producto.id, item.cantidad + 1)} 
                        style={{ padding: '4px 10px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#fff', fontWeight: 'bold' }}
                        title="Aumentar cantidad"
                      >
                        +
                      </button>
                      <button 
                        onClick={() => handleRemoveFromCart(item.producto.id)} 
                        style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', padding: '6px 10px', cursor: 'pointer', marginLeft: '8px', fontSize: '0.85rem' }}
                      >
                        Eliminar
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '2px solid #334155' }}>
              <div>
                <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#334155' }}>Suma Total de la Compra: </span>
                <span style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#0284c7', marginLeft: '8px' }}>${totalCompra.toFixed(2)}</span>
              </div>

              <button
                onClick={handleCheckout}
                disabled={isProcessingOrder}
                style={{
                  backgroundColor: isProcessingOrder ? '#94a3b8' : '#10b981',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '12px 24px',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  cursor: isProcessingOrder ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                {isProcessingOrder ? 'Procesando Compra...' : '🛍️ Finalizar Compra'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CATALOGO DE PRODUCTOS */}
      <h2 style={{ fontSize: '1.4rem', color: '#1e293b', marginBottom: '16px' }}>Catálogo de Stickers Disponibles</h2>
      {productos.length === 0 ? (
        <p>No hay stickers disponibles en este momento.</p>
      ) : (
        <div className="productos-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
          {productos.map((producto) => (
            <ProductCard
              key={producto.id}
              producto={producto}
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>
      )}

      {/* MODALES DE AUTENTICACION Y PEDIDOS */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
        onAuthSuccess={handleAuthSuccess}
      />

      <OrdersModal
        isOpen={showOrdersModal}
        onClose={() => setShowOrdersModal(false)}
        token={token}
      />
    </div>
  );
}

export default App;
