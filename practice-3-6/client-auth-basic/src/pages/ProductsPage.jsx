import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import ProductForm from "../components/ProductForm";
import ProductList from "../components/ProductList";

export default function ProductsPage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingProduct, setEditingProduct] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [userRole, setUserRole] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await api.getMe();
                setUserRole(response.data.role);
            } catch (err) {
                console.error("Ошибка загрузки пользователя");
            }
        };
        fetchUser();
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            const response = await api.getProducts();
            setProducts(response.data);
        } catch (err) {
            console.error("Ошибка загрузки товаров");
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingProduct(null);
        setShowForm(true);
    };

    const handleEdit = (product) => {
        setEditingProduct(product);
        setShowForm(true);
    };

    const handleSubmit = async (formData) => {
        try {
            if (editingProduct) {
                await api.updateProduct(editingProduct.id, formData);
            } else {
                await api.createProduct(formData);
            }
            setShowForm(false);
            setEditingProduct(null);
            await loadProducts();
        } catch (err) {
            alert(err.response?.data?.error || "Ошибка сохранения");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Удалить товар?")) return;
        try {
            await api.deleteProduct(id);
            await loadProducts();
        } catch (err) {
            alert(err.response?.data?.error || "Ошибка удаления");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        navigate("/login");
    };

    const canCreate = userRole === "seller" || userRole === "admin";
    const canEdit = userRole === "seller" || userRole === "admin";
    const canDelete = userRole === "admin";

    if (loading) return <div>Загрузка...</div>;

    return (
        <div style={{ maxWidth: 800, margin: "0 auto", padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
                <h1>Товары</h1>
                <div>
                    <button onClick={() => navigate("/profile")}>Профиль</button>
                    <button onClick={handleLogout}>Выйти</button>
                </div>
            </div>

            {canCreate && !showForm && (
                <button onClick={handleCreate} style={{ marginBottom: 20 }}>
                    + Новый товар
                </button>
            )}

            {showForm && (
                <ProductForm
                    product={editingProduct}
                    onSubmit={handleSubmit}
                    onCancel={() => {
                        setShowForm(false);
                        setEditingProduct(null);
                    }}
                />
            )}

            <ProductList
                products={products}
                canEdit={canEdit}
                canDelete={canDelete}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />
        </div>
    );
}