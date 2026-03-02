import React, { useState, useEffect } from "react";
import "./ProductsPage.scss";
import ProductList from "../../components/ProductList/ProductList";
import ProductModal from "../../components/ProductModal/ProductModal";
import { api } from "../../api";

export default function ProductsPage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState("create");
    const [editingProduct, setEditingProduct] = useState(null);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("all");

    // Загрузка товаров
    useEffect(() => {
        loadProducts();
    }, []);

    // Получаем уникальные категории из товаров
    useEffect(() => {
        const uniqueCategories = [...new Set(products.map(p => p.category))];
        setCategories(uniqueCategories);
    }, [products]);

    const loadProducts = async () => {
        try {
            setLoading(true);
            const data = await api.getProducts();
            setProducts(data);
        } catch (err) {
            console.error(err);
            alert("Ошибка загрузки товаров");
        } finally {
            setLoading(false);
        }
    };

    const openCreateModal = () => {
        setModalMode("create");
        setEditingProduct(null);
        setModalOpen(true);
    };

    const openEditModal = (product) => {
        setModalMode("edit");
        setEditingProduct(product);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditingProduct(null);
    };

    const handleDelete = async (id) => {
        const ok = window.confirm("Вы уверены, что хотите удалить этот товар?");
        if (!ok) return;

        try {
            await api.deleteProduct(id);
            setProducts(prev => prev.filter(p => p.id !== id));
        } catch (err) {
            console.error(err);
            alert("Ошибка удаления товара");
        }
    };

    const handleSubmitModal = async (productData) => {
        try {
            if (modalMode === "create") {
                const newProduct = await api.createProduct(productData);
                setProducts(prev => [...prev, newProduct]);
            } else {
                const updatedProduct = await api.updateProduct(productData.id, productData);
                setProducts(prev => prev.map(p => 
                    p.id === productData.id ? updatedProduct : p
                ));
            }
        } catch (err) {
            console.error(err);
            alert("Ошибка сохранения товара");
        }
    };

    // Фильтрация товаров по категории
    const filteredProducts = selectedCategory === "all" 
        ? products 
        : products.filter(p => p.category === selectedCategory);

    return (
        <div className="page">
            <header className="header">
                <div className="header__inner">
                    <div className="brand">🛒 Интернет-магазин</div>
                    <div className="header__right">React + Express</div>
                </div>
            </header>

            <main className="main">
                <div className="container">
                    <div className="toolbar">
                        <h1 className="title">Каталог товаров</h1>
                        <button className="btn btn--primary" onClick={openCreateModal}>
                            + Добавить товар
                        </button>
                    </div>

                    {/* Фильтр по категориям */}
                    {categories.length > 0 && (
                        <div className="categories">
                            <button 
                                className={`category-btn ${selectedCategory === "all" ? "active" : ""}`}
                                onClick={() => setSelectedCategory("all")}
                            >
                                Все товары
                            </button>
                            {categories.map(category => (
                                <button
                                    key={category}
                                    className={`category-btn ${selectedCategory === category ? "active" : ""}`}
                                    onClick={() => setSelectedCategory(category)}
                                >
                                    {category}
                                </button>
                            ))}
                        </div>
                    )}

                    {loading ? (
                        <div className="loading">Загрузка товаров...</div>
                    ) : (
                        <ProductList 
                            products={filteredProducts}
                            onEdit={openEditModal}
                            onDelete={handleDelete}
                        />
                    )}
                </div>
            </main>

            <footer className="footer">
                <div className="footer__inner">
                    © {new Date().getFullYear()} Интернет-магазин. Все права защищены.
                </div>
            </footer>

            <ProductModal
                open={modalOpen}
                mode={modalMode}
                initialProduct={editingProduct}
                onClose={closeModal}
                onSubmit={handleSubmitModal}
            />
        </div>
    );
}