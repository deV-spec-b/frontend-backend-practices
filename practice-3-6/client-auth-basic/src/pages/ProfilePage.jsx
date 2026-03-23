import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";

export default function ProfilePage() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await api.getMe();
                setUser(response.data);
            } catch (err) {
                navigate("/login");
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        navigate("/login");
    };

    if (loading) return <div>Загрузка...</div>;

    return (
        <div style={{ maxWidth: 600, margin: "50px auto", padding: 20 }}>
            <h2>Профиль</h2>
            {user && (
                <div>
                    <p><strong>Email:</strong> {user.email}</p>
                    <p><strong>Имя:</strong> {user.first_name}</p>
                    <p><strong>Фамилия:</strong> {user.last_name}</p>
                    <p><strong>Роль:</strong> {user.role === "user" ? "Пользователь" : user.role === "seller" ? "Продавец" : "Администратор"}</p>
                </div>
            )}
            <button onClick={handleLogout}>Выйти</button>
            <button onClick={() => navigate("/products")}>К товарам</button>
            {user?.role === "admin" && (
                <button onClick={() => navigate("/admin/users")} style={{ marginLeft: 10 }}>Управление пользователями</button>
            )}
        </div>
    );
}