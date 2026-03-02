const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

let products = [
    { id: 1, name: 'Миксер планетарный', price: 7500 },
    { id: 2, name: 'Блендер погружной', price: 3500 },
    { id: 3, name: 'Кофемашина', price: 25000 }
];

app.get('/products', (req, res) => {
    res.json(products);
});

app.get('/products/:id', (req, res) => {
    const product = products.find(p => p.id === parseInt(req.params.id));
    
    if (!product) {
        return res.status(404).json({ message: 'Товар не найден' });
    }
    
    res.json(product);
});

app.post('/products', (req, res) => {
    const { name, price } = req.body;
    
    if (!name || !price) {
        return res.status(400).json({ message: 'Название и цена обязательны' });
    }
    
    const newProduct = {
        id: products.length + 1,
        name,
        price
    };
    
    products.push(newProduct);
    res.status(201).json(newProduct);
});

app.put('/products/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const { name, price } = req.body;
    
    const productIndex = products.findIndex(p => p.id === id);
    
    if (productIndex === -1) {
        return res.status(404).json({ message: 'Товар не найден' });
    }
    
    if (!name || !price) {
        return res.status(400).json({ message: 'Название и цена обязательны' });
    }
    
    products[productIndex] = { id, name, price };
    res.json(products[productIndex]);
});

app.delete('/products/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const productIndex = products.findIndex(p => p.id === id);
    
    if (productIndex === -1) {
        return res.status(404).json({ message: 'Товар не найден' });
    }
    
    products.splice(productIndex, 1);
    res.json({ message: 'Товар удалён' });
});

app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
    console.log('Доступные маршруты:');
    console.log('- GET    /products');
    console.log('- GET    /products/:id');
    console.log('- POST   /products');
    console.log('- PUT    /products/:id');
    console.log('- DELETE /products/:id');
});