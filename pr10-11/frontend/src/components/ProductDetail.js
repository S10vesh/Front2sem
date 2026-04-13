import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { products } from "../services/api";

function ProductDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [user, setUser] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        fetchProduct();
    }, [id]);

    const fetchProduct = async () => {
        try {
            const response = await products.getById(id);
            setProduct(response.data);
        } catch (err) {
            setError("Не удалось загрузить товар");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (window.confirm("Вы уверены, что хотите удалить этот товар?")) {
            try {
                await products.delete(id);
                navigate("/products");
            } catch (err) {
                setError("Не удалось удалить товар");
            }
        }
    };

    // Определяем права доступа по роли
    const canEdit = user && (user.role === "seller" || user.role === "admin");
    const canDelete = user && user.role === "admin";

    if (loading) return <div className="card">Загрузка...</div>;
    if (error) return <div className="error">{error}</div>;
    if (!product) return <div className="error">Товар не найден</div>;

    return (
        <div className="card">
            <h1>{product.name}</h1>
            <div style={{ fontSize: "24px", color: "#28a745", margin: "15px 0" }}>
                {product.price} ₽
            </div>
            {product.description && (
                <div style={{ margin: "15px 0", lineHeight: "1.6" }}>
                    <strong>Описание:</strong>
                    <p>{product.description}</p>
                </div>
            )}
            <div style={{ color: "#666", fontSize: "12px", margin: "10px 0" }}>
                Создан: {new Date(product.createdAt).toLocaleString()}
            </div>
            {product.updatedAt && (
                <div style={{ color: "#666", fontSize: "12px", margin: "5px 0" }}>
                    Обновлен: {new Date(product.updatedAt).toLocaleString()}
                </div>
            )}
            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                {canEdit && (
                    <Link to={`/products/edit/${product.id}`} className="btn btn-warning">
                        Редактировать
                    </Link>
                )}
                {canDelete && (
                    <button onClick={handleDelete} className="btn btn-danger">
                        Удалить
                    </button>
                )}
                <Link to="/products" className="btn">
                    Назад к списку
                </Link>
            </div>
        </div>
    );
}

export default ProductDetail;