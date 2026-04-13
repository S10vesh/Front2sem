import React from "react";
import { Link, useNavigate } from "react-router-dom";

function Navbar({ user, setUser }) {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        setUser(null);
        navigate("/login");
    };

    // Роли
    const isAdmin = user?.role === "admin";
    const isSeller = user?.role === "seller";
    const isUser = user?.role === "user";

    // Получаем русское название роли
    const getRoleName = () => {
        switch(user?.role) {
            case "admin": return "Администратор 👑";
            case "seller": return "Продавец 🛒";
            case "user": return "Пользователь 👤";
            default: return "";
        }
    };

    return (
        <nav style={styles.nav}>
            <div style={styles.container}>
                <Link to="/" style={styles.logo}>
                    🛒 Магазин
                </Link>
                <div style={styles.links}>
                    <Link to="/products" style={styles.link}>
                        Товары
                    </Link>
                    {isAdmin && (
                        <Link to="/users" style={styles.link}>
                            👥 Пользователи
                        </Link>
                    )}
                    {(isSeller || isAdmin) && (
                        <Link to="/products/new" style={styles.link}>
                            ➕ Добавить товар
                        </Link>
                    )}
                    {user ? (
                        <>
                            <span style={styles.userInfo}>
                                {user.username} ({getRoleName()})
                            </span>
                            <button onClick={handleLogout} style={styles.button}>
                                Выйти
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" style={styles.link}>
                                Вход
                            </Link>
                            <Link to="/register" style={styles.link}>
                                Регистрация
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}

const styles = {
    nav: {
        backgroundColor: "#333",
        color: "white",
        padding: "1rem",
    },
    container: {
        maxWidth: "1200px",
        margin: "0 auto",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
    },
    logo: {
        color: "white",
        textDecoration: "none",
        fontSize: "1.5rem",
        fontWeight: "bold",
    },
    links: {
        display: "flex",
        gap: "1rem",
        alignItems: "center",
    },
    link: {
        color: "white",
        textDecoration: "none",
    },
    userInfo: {
        color: "#4CAF50",
        marginRight: "0.5rem",
    },
    button: {
        backgroundColor: "#dc3545",
        color: "white",
        border: "none",
        padding: "0.25rem 0.75rem",
        borderRadius: "4px",
        cursor: "pointer",
    },
};

export default Navbar;