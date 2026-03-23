import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        try {
            const response = await api.login({ email, password });
            localStorage.setItem("accessToken", response.data.accessToken);
            localStorage.setItem("refreshToken", response.data.refreshToken);
            window.location.href = "/products";
        } catch (err) {
            setError(err.response?.data?.error || "Ошибка входа");
        }
    };

    return (
        <div style={{ maxWidth: 400, margin: "50px auto", padding: 20, border: "1px solid #ccc", borderRadius: 8 }}>
            <h2>Вход</h2>
            {error && <div style={{ color: "red" }}>{error}</div>}
            <form onSubmit={handleSubmit}>
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: "100%", padding: 8, margin: "8px 0" }} />
                <input type="password" placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: "100%", padding: 8, margin: "8px 0" }} />
                <button type="submit" style={{ padding: 8, width: "100%" }}>Войти</button>
            </form>
            <p style={{ textAlign: "center" }}>Нет аккаунта? <a href="/register">Зарегистрироваться</a></p>
        </div>
    );
}