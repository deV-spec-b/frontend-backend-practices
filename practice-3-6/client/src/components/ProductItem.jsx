import React from 'react';

export default function ProductItem({ product, onEdit, onDelete }) {
    return (
        <div className="productRow">
            <img 
                src={product.image} 
                alt={product.name} 
                className="product-image" 
                onError={(e) => e.target.src = 'https://via.placeholder.com/200?text=No+Image'}
            />
            
            <div className="productMain">
                <div className="productId">#{product.id}</div>
                <div className="productName">{product.name}</div>
                <div className="productCategory">{product.category}</div>
                <div className="productPrice">{product.price} ₽</div>
                <div className="productStock">В наличии: {product.stock}</div>
            </div>
            
            <div className="productDescription">{product.description}</div>
            
            <div className="productActions">
                <button className="btn" onClick={() => onEdit(product)}>
                    Редактировать
                </button>
                <button className="btn btn--danger" onClick={() => onDelete(product.id)}>
                    Удалить
                </button>
            </div>
        </div>
    );
}