import React from "react";
import "./ProductItem.scss";

export default function ProductItem({ product, onEdit, onDelete }) {
    return (
        <div className="product-card">
            <div className="product-header">
                <h3 className="product-name">{product.name}</h3>
                <span className="product-category">{product.category}</span>
            </div>
            
            <p className="product-description">{product.description}</p>
            
            <div className="product-details">
                <div className="product-price">{product.price.toLocaleString()} ₽</div>
                <div className="product-stock">В наличии: {product.stock}</div>
                {product.rating > 0 && (
                    <div className="product-rating">
                        <span className="stars">{'★'.repeat(Math.floor(product.rating))}</span>
                        <span className="rating-value">{product.rating}</span>
                    </div>
                )}
            </div>
            
            <div className="product-actions">
                <button 
                    className="btn btn--edit" 
                    onClick={() => onEdit(product)}
                    title="Редактировать"
                >
                    ✏️ Редактировать
                </button>
                <button 
                    className="btn btn--delete" 
                    onClick={() => onDelete(product.id)}
                    title="Удалить"
                >
                    🗑️ Удалить
                </button>
            </div>
        </div>
    );
}