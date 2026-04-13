import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { products } from "../services/api";

function ProductForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
        name: "",
        price: "",
        description: "",
    });

    const isEdit = Boolean(id);

    useEffect(() => {
        if (isEdit) {
            fetchProduct();
        }
    }, [id]);

    const fetchProduct = async () => {
        try {
            const response = await products.getById(id);
            const product = response.data;
            setFormData({
                name: product.name,
                price: product.price,
                description: product.description || "",
            });
        } catch (err) {
            setError("Не удалось загрузить товар");
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            if (isEdit) {
                await products.update(id, formData);
            } else {
                await products.create(formData);
            }
            navigate("/products");
        } catch (err) {
            setError(err.response?.data?.error || "Ошибка сохранения товара");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card" style={{ maxWidth: "600px", margin: "0 auto" }}>
            <h2>{isEdit ? "Редактировать товар" : "Добавить товар"}</h2>
            {error && <div className="error">{error}</div>}
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Название *</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Цена *</label>
                    <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        required
                        step="0.01"
                    />
                </div>
                <div className="form-group">
                    <label>Описание</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows="4"
                    />
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                    <button type="submit" className="btn" disabled={loading}>
                        {loading ? "Сохранение..." : (isEdit ? "Обновить" : "Создать")}
                    </button>
                    <button type="button" className="btn btn-danger" onClick={() => navigate("/products")}>
                        Отмена
                    </button>
                </div>
            </form>
        </div>
    );
}

export default ProductForm;