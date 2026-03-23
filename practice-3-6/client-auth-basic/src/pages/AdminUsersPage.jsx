import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";

export default function AdminUsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [editingUser, setEditingUser] = useState(null);
    const [editForm, setEditForm] = useState({ first_name: "", last_name: "", email: "" });
    const navigate = useNavigate();

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const response = await api.getUsers();
            setUsers(response.data);
        } catch (err) {
            if (err.response?.status === 403) {
                setError("Доступ запрещён. Только для администратора.");
            } else {
                setError("Ошибка загрузки пользователей");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateRole = async (userId, newRole) => {
        try {
            await api.updateUser(userId, { role: newRole });
            await loadUsers();
        } catch (err) {
            alert("Ошибка обновления роли");
        }
    };

    const handleBlockUser = async (userId) => {
        if (!window.confirm("Заблокировать пользователя?")) return;
        try {
            await api.deleteUser(userId);
            await loadUsers();
        } catch (err) {
            alert("Ошибка блокировки");
        }
    };

    const handleEditUser = (user) => {
        setEditingUser(user.id);
        setEditForm({
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email
        });
    };

    const handleSaveEdit = async (userId) => {
        try {
            await api.updateUser(userId, {
                first_name: editForm.first_name,
                last_name: editForm.last_name,
                email: editForm.email
            });
            setEditingUser(null);
            await loadUsers();
        } catch (err) {
            alert("Ошибка обновления данных пользователя");
        }
    };

    const handleCancelEdit = () => {
        setEditingUser(null);
        setEditForm({ first_name: "", last_name: "", email: "" });
    };

    const handleLogout = () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        navigate("/login");
    };

    if (loading) return <div>Загрузка...</div>;
    if (error) return <div style={{ color: "red", textAlign: "center", marginTop: 50 }}>{error}<br /><button onClick={() => navigate("/profile")}>Назад</button></div>;

    return (
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
                <h1>Управление пользователями</h1>
                <div>
                    <button onClick={() => navigate("/profile")}>Профиль</button>
                    <button onClick={handleLogout}>Выйти</button>
                </div>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                    <tr style={{ background: "#f0f0f0" }}>
                        <th style={{ border: "1px solid #ccc", padding: 8 }}>Email</th>
                        <th style={{ border: "1px solid #ccc", padding: 8 }}>Имя</th>
                        <th style={{ border: "1px solid #ccc", padding: 8 }}>Фамилия</th>
                        <th style={{ border: "1px solid #ccc", padding: 8 }}>Роль</th>
                        <th style={{ border: "1px solid #ccc", padding: 8 }}>Статус</th>
                        <th style={{ border: "1px solid #ccc", padding: 8 }}>Действия</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user.id}>
                            <td style={{ border: "1px solid #ccc", padding: 8 }}>
                                {editingUser === user.id ? (
                                    <input
                                        type="email"
                                        value={editForm.email}
                                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                        style={{ width: "100%", padding: 4 }}
                                    />
                                ) : (
                                    user.email
                                )}
                            </td>
                            <td style={{ border: "1px solid #ccc", padding: 8 }}>
                                {editingUser === user.id ? (
                                    <input
                                        type="text"
                                        value={editForm.first_name}
                                        onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                                        style={{ width: "100%", padding: 4 }}
                                    />
                                ) : (
                                    user.first_name
                                )}
                            </td>
                            <td style={{ border: "1px solid #ccc", padding: 8 }}>
                                {editingUser === user.id ? (
                                    <input
                                        type="text"
                                        value={editForm.last_name}
                                        onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                                        style={{ width: "100%", padding: 4 }}
                                    />
                                ) : (
                                    user.last_name
                                )}
                            </td>
                            <td style={{ border: "1px solid #ccc", padding: 8 }}>
                                <select
                                    value={user.role}
                                    onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                                    style={{ padding: 4 }}
                                >
                                    <option value="user">Пользователь</option>
                                    <option value="seller">Продавец</option>
                                    <option value="admin">Администратор</option>
                                </select>
                            </td>
                            <td style={{ border: "1px solid #ccc", padding: 8 }}>
                                {user.isActive ? "Активен" : "Заблокирован"}
                            </td>
                            <td style={{ border: "1px solid #ccc", padding: 8 }}>
                                {editingUser === user.id ? (
                                    <div>
                                        <button onClick={() => handleSaveEdit(user.id)} style={{ background: "#28a745", color: "white" }}>
                                            Сохранить
                                        </button>
                                        <button onClick={handleCancelEdit} style={{ marginLeft: 5 }}>
                                            Отмена
                                        </button>
                                    </div>
                                ) : (
                                    <div>
                                        <button onClick={() => handleEditUser(user)}>Редактировать</button>
                                        {user.isActive && (
                                            <button onClick={() => handleBlockUser(user.id)} style={{ marginLeft: 5, background: "#dc3545", color: "white" }}>
                                                Заблокировать
                                            </button>
                                        )}
                                    </div>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}