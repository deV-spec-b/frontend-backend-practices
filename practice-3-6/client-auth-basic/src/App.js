import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProfilePage from "./pages/ProfilePage";
import ProductsPage from "./pages/ProductsPage";
import AdminUsersPage from "./pages/AdminUsersPage";

const isAuthenticated = () => localStorage.getItem("accessToken") !== null;

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/profile" element={isAuthenticated() ? <ProfilePage /> : <Navigate to="/login" />} />
                <Route path="/products" element={isAuthenticated() ? <ProductsPage /> : <Navigate to="/login" />} />
                <Route path="/admin/users" element={isAuthenticated() ? <AdminUsersPage /> : <Navigate to="/login" />} />
                <Route path="/" element={<Navigate to="/products" />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;