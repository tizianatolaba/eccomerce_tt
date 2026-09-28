export default function ProductCard({ producto, onAddToCart }) {
  if (!producto) return null;

  const sinStock = producto.stock <= 0;

  return (
    <div 
      className="producto" 
      style={{ 
        border: '1px solid #ccc', 
        borderRadius: '8px', 
        padding: '16px', 
        margin: '8px 0', 
        display: 'flex', 
        flexDirection: 'column', 
        justify: 'space-between',
        backgroundColor: '#fff',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}
    >
      <div>
        {producto.image_url && (
          <img
            src={producto.image_url}
            alt={producto.name}
            style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '4px' }}
          />
        )}
        <h3 style={{ fontSize: '1.1rem', margin: '12px 0 8px 0' }}>{producto.name}</h3>
        <p style={{ fontSize: '0.85rem', color: '#666', minHeight: '40px' }}>{producto.description}</p>
        <p style={{ margin: '4px 0' }}><strong>Precio:</strong> ${Number(producto.price).toFixed(2)}</p>
        <p style={{ margin: '4px 0 12px 0', color: sinStock ? 'red' : 'inherit' }}>
          <strong>Stock:</strong> {sinStock ? 'Sin stock' : `${producto.stock} unidades`}
        </p>
      </div>
      <button 
        onClick={() => onAddToCart && onAddToCart(producto)} 
        disabled={sinStock}
        style={{ 
          padding: '10px 16px', 
          cursor: sinStock ? 'not-allowed' : 'pointer', 
          backgroundColor: sinStock ? '#cccccc' : '#00b3a4', 
          color: sinStock ? '#666666' : '#ffffff',
          border: 'none', 
          borderRadius: '4px', 
          fontWeight: 'bold',
          width: '100%'
        }}
      >
        {sinStock ? 'Sin Stock' : '🛒 Agregar a tu carrito'}
      </button>
    </div>
  );
}