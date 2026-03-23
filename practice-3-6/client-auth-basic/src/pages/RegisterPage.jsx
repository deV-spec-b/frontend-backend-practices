import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";

export default function RegisterPage() {
    const [form, setForm] = useState({ 
        email: "", 
        first_name: "", 
        last_name: "", 
        password: "",
        role: "user" 
    });
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        try {
            await api.register(form);
            navigate("/login");
        } catch (err) {
            setError(err.response?.data?.error || "Ошибка регистрации");
        }
    };

    return (
        <div style={{ maxWidth: 400, margin: "50px auto", padding: 20, border: "1px solid #ccc", borderRadius: 8 }}>
            <h2>Регистрация</h2>
            {error && <div style={{ color: "red" }}>{error}</div>}
            <form onSubmit={handleSubmit}>
                <input
                    name="email"
                    type="email"
                    placeholder="Email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    style={{ width: "100%", padding: 8, margin: "8px 0" }}
                />
                <input
                    name="first_name"
                    placeholder="Имя"
                    value={form.first_name}
                    onChange={handleChange}
                    required
                    style={{ width: "100%", padding: 8, margin: "8px 0" }}
                />
                <input
                    name="last_name"
                    placeholder="Фамилия"
                    value={form.last_name}
                    onChange={handleChange}
                    required
                    style={{ width: "100%", padding: 8, margin: "8px 0" }}
                />
                <input
                    name="password"
                    type="password"
                    placeholder="Пароль"
                    value={form.password}
                    onChange={handleChange}
                    required
                    style={{ width: "100%", padding: 8, margin: "8px 0" }}
                />
                
                {/* ДОБАВЛЯЕМ ВЫБОР РОЛИ */}
                <div style={{ margin: "8px 0" }}>
                    <label style={{ display: "block", marginBottom: 5 }}>Роль:</label>
                    <select
                        name="role"
                        value={form.role}
                        onChange={handleChange}
                        style={{ width: "100%", padding: 8 }}
                    >
                        <option value="user">Пользователь (только просмотр)</option>
                        <option value="seller">Продавец (создание и редактирование товаров)</option>
                        <option value="admin">Администратор (полный доступ)</option>
                    </select>
                </div>
                
                <button type="submit" style={{ padding: 8, width: "100%", marginTop: 10 }}>
                    Зарегистрироваться
                </button>
            </form>
            <p style={{ textAlign: "center", marginTop: 15 }}>
                Уже есть аккаунт? <a href="/login">Войти</a>
            </p>
        </div>
    );
}