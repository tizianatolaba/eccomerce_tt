export default function ProductCard({ producto, onAddToCart }) {
  if (!producto) return null;

  return (
    <div className="producto" style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '16px', margin: '8px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div>
        {producto.image_url && (
          <img
            src={producto.image_url}
            alt={producto.name}
            style={{ width: '100%', maxHeight: '180px', objectFit: 'cover', borderRadius: '4px' }}
          />
        )}
        <h2 style={{ fontSize: '1.2rem', margin: '8px 0' }}>{producto.name}</h2>
        <p style={{ fontSize: '0.9rem', color: '#666' }}>{producto.description}</p>
        <p><strong>Precio:</strong> ${producto.price.toFixed(2)}</p>
        <p><strong>Stock:</strong> {producto.stock}</p>
      </div>
      <button 
        onClick={() => onAddToCart && onAddToCart(producto)} 
        style={{ padding: '8px 16px', cursor: 'pointer', backgroundColor: '#00f2fe', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}
      >
        🛒 Agregar al carrito
      </button>
    </div>
  );
}