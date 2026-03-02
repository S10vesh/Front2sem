import React from "react";
import ProductItem from "../ProductItem/ProductItem";
import "./ProductList.scss";

export default function ProductList({ products, onEdit, onDelete }) {
    if (!products || products.length === 0) {
        return <div className="empty-list">Товаров пока нет</div>;
    }

    return (
        <div className="products-grid">
            {products.map((product) => (
                <ProductItem 
                    key={product.id} 
                    product={product} 
                    onEdit={onEdit}
                    onDelete={onDelete}
                />
            ))}
        </div>
    );
}