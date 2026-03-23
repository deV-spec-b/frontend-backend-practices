export default function ProductList({ products, canEdit, canDelete, onEdit, onDelete }) {
    if (!products || products.length === 0) {
        return <div>Товаров пока нет</div>;
    }

    return (
        <div>
            {products.map(product => (
                <div key={product.id} style={{ border: "1px solid #ccc", margin: "10px 0", padding: 10, borderRadius: 8, display: "flex", gap: 15 }}>
                    <img
                        src={product.image || "https://via.placeholder.com/100?text=No+Image"}
                        alt={product.title}
                        style={{ width: 100, height: 100, objectFit: "cover", borderRadius: 8 }}
                        onError={(e) => e.target.src = "https://via.placeholder.com/100?text=No+Image"}
                    />
                    <div style={{ flex: 1 }}>
                        <h3>{product.title}</h3>
                        <p>Категория: {product.category}</p>
                        <p>{product.description}</p>
                        <p>Цена: {product.price} ₽</p>
                        {canEdit && <button onClick={() => onEdit(product)}>Редактировать</button>}
                        {canDelete && <button onClick={() => onDelete(product.id)}>Удалить</button>}
                    </div>
                </div>
            ))}
        </div>
    );
}