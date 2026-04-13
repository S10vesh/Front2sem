import React, { useState, useEffect } from "react";
import { users } from "../services/api";

function UserList() {
    const [userList, setUserList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            setCurrentUser(JSON.parse(storedUser));
        }
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await users.getAll();
            setUserList(response.data);
            setError("");
        } catch (err) {
            setError("Не удалось загрузить пользователей");
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        try {
            await users.update(userId, { role: newRole });
            fetchUsers();
        } catch (err) {
            setError("Не удалось изменить роль");
        }
    };

    const handleBlockUser = async (userId) => {
        if (window.confirm("Вы уверены, что хотите заблокировать этого пользователя?")) {
            try {
                await users.delete(userId);
                fetchUsers();
            } catch (err) {
                setError("Не удалось заблокировать пользователя");
            }
        }
    };

    const handleUnblockUser = async (userId) => {
        try {
            await users.update(userId, { isActive: true });
            fetchUsers();
        } catch (err) {
            setError("Не удалось разблокировать пользователя");
        }
    };

    const getRoleName = (role) => {
        switch(role) {
            case "admin": return "Администратор 👑";
            case "seller": return "Продавец 🛒";
            default: return "Пользователь 👤";
        }
    };

    if (loading) return <div className="card">Загрузка...</div>;

    return (
        <div>
            <h1>Управление пользователями</h1>
            {error && <div className="error">{error}</div>}
            
            <div className="card">
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Имя пользователя</th>
                            <th>Роль</th>
                            <th>Статус</th>
                            <th>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {userList.map((u) => (
                            <tr key={u.id}>
                                <td>{u.id}</td>
                                <td>{u.username}</td>
                                <td>
                                    {currentUser?.id !== u.id ? (
                                        <select
                                            value={u.role}
                                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                            style={styles.select}
                                        >
                                            <option value="user">Пользователь</option>
                                            <option value="seller">Продавец</option>
                                            <option value="admin">Администратор</option>
                                        </select>
                                    ) : (
                                        getRoleName(u.role)
                                    )}
                                </td>
                                <td>
                                    <span style={{
                                        color: u.isActive ? "#28a745" : "#dc3545",
                                        fontWeight: "bold"
                                    }}>
                                        {u.isActive ? "Активен" : "Заблокирован"}
                                    </span>
                                </td>
                                <td>
                                    {currentUser?.id !== u.id && (
                                        <>
                                            {u.isActive ? (
                                                <button
                                                    onClick={() => handleBlockUser(u.id)}
                                                    className="btn btn-danger"
                                                    style={{ marginRight: "5px" }}
                                                >
                                                    Заблокировать
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleUnblockUser(u.id)}
                                                    className="btn btn-success"
                                                    style={{ marginRight: "5px" }}
                                                >
                                                    Разблокировать
                                                </button>
                                            )}
                                        </>
                                    )}
                                    {currentUser?.id === u.id && (
                                        <span style={{ color: "#666" }}>Это вы</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

const styles = {
    table: {
        width: "100%",
        borderCollapse: "collapse",
    },
    select: {
        padding: "5px",
        borderRadius: "4px",
        border: "1px solid #ddd",
    },
};

export default UserList;