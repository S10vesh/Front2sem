import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { products } from "../services/api";

function ProductList() {
    const [productList, setProductList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [user, setUser] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const response = await products.getAll();
            setProductList(response.data);
            setError("");
        } catch (err) {
            setError("Не удалось загрузить товары");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Вы уверены, что хотите удалить этот товар?")) {
            try {
                await products.delete(id);
                fetchProducts();
            } catch (err) {
                setError("Не удалось удалить товар");
            }
        }
    };

    // Определяем права доступа по роли
    const canCreate = user && (user.role === "seller" || user.role === "admin");
    const canEdit = user && (user.role === "seller" || user.role === "admin");
    const canDelete = user && user.role === "admin";

    if (loading) return <div className="card">Загрузка...</div>;

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h1>Товары</h1>
                {canCreate && (
                    <Link to="/products/new" className="btn btn-success">
                        + Добавить товар
                    </Link>
                )}
            </div>

            {error && <div className="error">{error}</div>}

            {productList.length === 0 ? (
                <div className="card">Нет товаров. Добавьте первый товар!</div>
            ) : (
                <div className="products-grid">
                    {productList.map((product) => (
                        <div key={product.id} className="product-card">
                            <h3>{product.name}</h3>
                            <div className="price">{product.price} ₽</div>
                            <div style={{ color: "#666", fontSize: "14px" }}>
                                {product.description?.substring(0, 100)}
                            </div>
                            <div className="actions">
                                <Link to={`/products/${product.id}`} className="btn">
                                    Просмотр
                                </Link>
                                {canEdit && (
                                    <Link to={`/products/edit/${product.id}`} className="btn btn-warning">
                                        Редактировать
                                    </Link>
                                )}
                                {canDelete && (
                                    <button
                                        onClick={() => handleDelete(product.id)}
                                        className="btn btn-danger"
                                    >
                                        Удалить
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default ProductList;