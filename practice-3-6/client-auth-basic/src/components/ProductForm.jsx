import { useState, useEffect } from "react";

export default function ProductForm({ product, onSubmit, onCancel }) {
    const [form, setForm] = useState({
        title: "",
        category: "",
        description: "",
        price: "",
        image: ""
    });

    useEffect(() => {
        if (product) {
            setForm({
                title: product.title || "",
                category: product.category || "",
                description: product.description || "",
                price: product.price || "",
                image: product.image || ""
            });
        } else {
            setForm({ title: "", category: "", description: "", price: "", image: "" });
        }
    }, [product]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(form);
    };

    return (
        <form onSubmit={handleSubmit} style={{ border: "1px solid #ccc", padding: 15, margin: "20px 0", borderRadius: 8 }}>
            <h3>{product ? "Редактировать" : "Создать"} товар</h3>
            <input
                name="title"
                placeholder="Название"
                value={form.title}
                onChange={handleChange}
                required
                style={{ width: "100%", padding: 8, margin: "5px 0" }}
            />
            <input
                name="category"
                placeholder="Категория"
                value={form.category}
                onChange={handleChange}
                required
                style={{ width: "100%", padding: 8, margin: "5px 0" }}
            />
            <textarea
                name="description"
                placeholder="Описание"
                value={form.description}
                onChange={handleChange}
                required
                style={{ width: "100%", padding: 8, margin: "5px 0" }}
            />
            <input
                name="price"
                type="number"
                placeholder="Цена"
                value={form.price}
                onChange={handleChange}
                required
                style={{ width: "100%", padding: 8, margin: "5px 0" }}
            />
            <input
                name="image"
                placeholder="URL фото (необязательно)"
                value={form.image}
                onChange={handleChange}
                style={{ width: "100%", padding: 8, margin: "5px 0" }}
            />
            <div>
                <button type="submit">{product ? "Обновить" : "Создать"}</button>
                <button type="button" onClick={onCancel}>Отмена</button>
            </div>
        </form>
    );
}