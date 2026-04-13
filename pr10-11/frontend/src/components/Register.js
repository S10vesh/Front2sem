import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../services/api";

function Register({ setUser }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        try {
            const response = await auth.register({ username, password });
            const { accessToken, refreshToken, user } = response.data;

            localStorage.setItem("accessToken", accessToken);
            localStorage.setItem("refreshToken", refreshToken);
            localStorage.setItem("user", JSON.stringify(user));
            setUser(user);

            navigate("/products");
        } catch (err) {
            setError(err.response?.data?.error || "Ошибка регистрации");
        }
    };

    return (
        <div className="card" style={{ maxWidth: "400px", margin: "50px auto" }}>
            <h2>Регистрация</h2>
            {error && <div className="error">{error}</div>}
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Имя пользователя</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Пароль</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" className="btn" style={{ width: "100%" }}>
                    Зарегистрироваться
                </button>
            </form>
        </div>
    );
}

export default Register;