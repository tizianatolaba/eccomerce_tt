export default function ProductCard({ producto }) {
  if (!producto) return null;

  return (
    <div className="producto" style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '16px', margin: '8px' }}>
      {producto.image_url && (
        <img
          src={producto.image_url}
          alt={producto.name}
          style={{ width: '100%', maxHeight: '180px', objectFit: 'cover', borderRadius: '4px' }}
        />
      )}
      <h2>{producto.name}</h2>
      <p>{producto.description}</p>
      <p><strong>Precio:</strong> ${producto.price}</p>
      <p><strong>Stock:</strong> {producto.stock}</p>
      <button style={{ padding: '8px 16px', cursor: 'pointer' }}>Agregar al carrito</button>
    </div>
  );
}