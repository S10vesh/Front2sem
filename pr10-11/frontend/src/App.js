import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Login from "./components/Login";
import Register from "./components/Register";
import ProductList from "./components/ProductList";
import ProductForm from "./components/ProductForm";
import ProductDetail from "./components/ProductDetail";
import UserList from "./components/UserList";
import "./App.css";

function App() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    // Проверка роли для доступа к /users
    const isAdmin = user?.role === "admin";

    return (
        <BrowserRouter>
            <Navbar user={user} setUser={setUser} />
            <div className="container">
                <Routes>
                    <Route path="/login" element={
                        !user ? <Login setUser={setUser} /> : <Navigate to="/products" />
                    } />
                    <Route path="/register" element={
                        !user ? <Register setUser={setUser} /> : <Navigate to="/products" />
                    } />
                    <Route path="/products" element={
                        user ? <ProductList /> : <Navigate to="/login" />
                    } />
                    <Route path="/products/new" element={
                        user && (user.role === "seller" || user.role === "admin") ? <ProductForm /> : <Navigate to="/products" />
                    } />
                    <Route path="/products/:id" element={
                        user ? <ProductDetail /> : <Navigate to="/login" />
                    } />
                    <Route path="/products/edit/:id" element={
                        user && (user.role === "seller" || user.role === "admin") ? <ProductForm /> : <Navigate to="/products" />
                    } />
                    <Route path="/users" element={
                        isAdmin ? <UserList /> : <Navigate to="/products" />
                    } />
                    <Route path="/" element={<Navigate to="/products" />} />
                </Routes>
            </div>
        </BrowserRouter>
    );
}

export default App;