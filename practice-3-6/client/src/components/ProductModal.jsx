import React, { useEffect, useState } from 'react';

export default function ProductModal({ open, mode, initialProduct, onClose, onSubmit }) {
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [stock, setStock] = useState('');
    const [image, setImage] = useState('');

    useEffect(() => {
        if (!open) return;
        
        setName(initialProduct?.name || '');
        setCategory(initialProduct?.category || '');
        setDescription(initialProduct?.description || '');
        setPrice(initialProduct?.price != null ? String(initialProduct.price) : '');
        setStock(initialProduct?.stock != null ? String(initialProduct.stock) : '');
        setImage(initialProduct?.image || '');
    }, [open, initialProduct]);

    if (!open) return null;

    const title = mode === 'edit' ? 'Редактирование товара' : 'Создание товара';

    const handleSubmit = (e) => {
        e.preventDefault();
        
        const trimmedName = name.trim();
        const trimmedCategory = category.trim();
        const trimmedDesc = description.trim();
        const trimmedImage = image.trim();
        const parsedPrice = Number(price);
        const parsedStock = Number(stock);

        if (!trimmedName || !trimmedCategory || !trimmedDesc) {
            alert('Заполните все поля');
            return;
        }

        if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
            alert('Введите корректную цену');
            return;
        }

        if (!Number.isFinite(parsedStock) || parsedStock < 0) {
            alert('Введите корректное количество');
            return;
        }

        onSubmit({
            id: initialProduct?.id,
            name: trimmedName,
            category: trimmedCategory,
            description: trimmedDesc,
            price: parsedPrice,
            stock: parsedStock,
            image: trimmedImage
        });
    };

    return (
        <div className="backdrop" onMouseDown={onClose}>
            <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
                <div className="modal__header">
                    <div className="modal__title">{title}</div>
                    <button className="iconBtn" onClick={onClose}>✕</button>
                </div>
                <form className="form" onSubmit={handleSubmit}>
                    <label className="label">
                        Название
                        <input 
                            className="input"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Например, Миксер"
                            autoFocus
                        />
                    </label>
                    <label className="label">
                        Категория
                        <input 
                            className="input"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            placeholder="Например, Кухня"
                        />
                    </label>
                    <label className="label">
                        Описание
                        <textarea 
                            className="input"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Описание товара"
                            rows="3"
                        />
                    </label>

                    <label className='label'>
                        URL
                        <input
                            className='input'
                            value={image}
                            onChange={(e) => setImage(e.target.value)}
                            placeholder='https://example.com/image.jpg'
                        />
                    </label>

                    <label className="label">
                        Цена (₽)
                        <input 
                            className="input"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder="Например, 7500"
                            inputMode="numeric"
                        />
                    </label>
                    <label className="label">
                        Количество на складе
                        <input 
                            className="input"
                            value={stock}
                            onChange={(e) => setStock(e.target.value)}
                            placeholder="Например, 15"
                            inputMode="numeric"
                        />
                    </label>
                    <div className="modal__footer">
                        <button type="button" className="btn" onClick={onClose}>
                            Отмена
                        </button>
                        <button type="submit" className="btn btn--primary">
                            {mode === 'edit' ? 'Сохранить' : 'Создать'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}