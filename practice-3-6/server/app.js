const express = require('express');
const { nanoid } = require('nanoid');
const cors = require('cors');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
const port = 3001; 

// Swagger definition, описание основного API
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API интернет-магазина',
            version: '1.0.0',
            description: 'API для управления товарами'
        },
        servers: [
            {
                url: `http://localhost:3001`,
                description: 'Локальный сервер'
            }
        ]
    },
    apis: ['./app.js'] // тут наши комментарии
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
// Подключаем Swagger UI по адресу /api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Разрешаем CORS для React-клиента
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3002'],
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type']
}));

// Middleware для парсинга JSON
app.use(express.json());

// Middleware для логирования запросов
app.use((req, res, next) => {
    res.on('finish', () => {
        console.log(`[${new Date().toISOString()}] [${req.method}] ${res.statusCode} ${req.path}`);
        if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
            console.log('Body:', req.body);
        }
    });
    next();
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       required:
 *         - name
 *         - category
 *         - description
 *         - price
 *         - stock
 *         - image
 *       properties:
 *         id:
 *           type: string
 *           description: Уникальный ID товара
 *         name:
 *           type: string
 *           description: Название товара
 *         category:
 *           type: string
 *           description: Категория товара
 *         description:
 *           type: string
 *           description: Описание товара
 *         price:
 *           type: number
 *           description: Цена товара
 *         stock:
 *           type: integer
 *           description: Количество на складе
 *         image:
 *           type: string
 *           description: URL изображения товара
 *       example:
 *         id: "abc123"
 *         name: "Миксер планетарный"
 *         category: "Кухня"
 *         description: "Мощный миксер для теста"
 *         price: 7500
 *         stock: 15
 *         image: "https://images.unsplash.com/photo-1594385208974-2e75f8d7c7b4?w=200"
 */

// База данных товаров 
let products = [
    { id: nanoid(6), name: 'Миксер планетарный', category: 'Кухня', description: 'Мощный миксер для теста', price: 7500, stock: 15, image: 'https://cdn1.ozone.ru/s3/multimedia-1-h/7139637233.jpg'},
    { id: nanoid(6), name: 'Блендер погружной', category: 'Кухня', description: 'Для смузи и супов', price: 3500, stock: 23, image: 'https://main-cdn.sbermegamarket.ru/big1/hlr-system/213/044/840/012/014/42/600005499975b0.jpeg'},
    { id: nanoid(6), name: 'Кофемашина', category: 'Кофе', description: 'Автоматическая, с капучинатором', price: 25000, stock: 7, image: 'https://avatars.mds.yandex.net/get-mpic/5228105/img_id640538597810839335.png/orig'},
    { id: nanoid(6), name: 'Электрочайник', category: 'Кухня', description: 'Стеклянный, с подсветкой', price: 2200, stock: 31, image: 'https://avatars.mds.yandex.net/get-mpic/4331935/2a00000193f2260f34fd25cc88f8e86fc465/orig'},
    { id: nanoid(6), name: 'Тостер', category: 'Кухня', description: '2 отделения, регулировка', price: 1800, stock: 19, image: 'https://avatars.mds.yandex.net/get-mpic/4579830/img_id4781799816326028633.jpeg/orig' },
    { id: nanoid(6), name: 'Соковыжималка', category: 'Кухня', description: 'Для цитрусовых', price: 2900, stock: 12, image: 'https://avatars.mds.yandex.net/get-mpic/5191310/img_id7710564569276325638.jpeg/orig' },
    { id: nanoid(6), name: 'Мясорубка', category: 'Кухня', description: 'Электрическая, насадки', price: 5200, stock: 9, image: 'https://cdn1.ozone.ru/s3/multimedia-q/c600/6295553438.jpg' },
    { id: nanoid(6), name: 'Холодильник', category: 'Бытовая техника', description: 'No Frost, 300л', price: 42000, stock: 4, image: 'https://avatars.mds.yandex.net/get-mpic/4032471/img_id4696386583988452706.jpeg/orig' },
    { id: nanoid(6), name: 'Микроволновка', category: 'Бытовая техника', description: 'С грилем', price: 8900, stock: 11, image: 'https://avatars.mds.yandex.net/get-mpic/12569791/2a0000018ebd834fa1ef959a86d643b8dbbc/orig' },
    { id: nanoid(6), name: 'Посудомойка', category: 'Бытовая техника', description: 'Узкая, 60см', price: 35000, stock: 3, image: 'https://img.mvideo.ru/Pdb/small_pic/480/400193477b4.jpg' }
];

// Функция-помощник для получения пользователя из списка
function findProductOr404(id, res) {
    const product = products.find(p => p.id === id);
    if (!product) {
        res.status(404).json({ error: 'Товар не найден' });
        return null;
    }
    return product;
}

// Функция помощник

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Создает новый товар
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - category
 *               - description
 *               - price
 *               - stock
 *               - image
 *             properties:
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               stock:
 *                 type: integer
 *               image:
 *                 type: string
 *     responses:
 *       201:
 *         description: Товар создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Ошибка валидации
 */

// POST /api/products - создание товара
app.post('/api/products', (req, res) => {
    const { name, category, description, price, stock, image } = req.body;
    
    if (!name || !category || !description || !price || !stock) {
        return res.status(400).json({ error: 'Все поля обязательны' });
    }
    
    const newProduct = {
        id: nanoid(6),
        name: name.trim(),
        category: category.trim(),
        description: description.trim(),
        price: Number(price),
        stock: Number(stock),
        image: image.trim()
    };
    
    products.push(newProduct);
    res.status(201).json(newProduct);
});

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Возвращает список всех товаров
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Список товаров
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */

// GET /api/products - список всех товаров
app.get('/api/products', (req, res) => {
    res.json(products);
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Возвращает товар по ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID товара
 *     responses:
 *       200:
 *         description: Данные товара
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Товар не найден
 */

// GET /api/products/:id - товар по ID
app.get('/api/products/:id', (req, res) => {
    const product = findProductOr404(req.params.id, res);
    if (product) res.json(product);
});

/**
 * @swagger
 * /api/products/{id}:
 *   patch:
 *     summary: Обновляет существующий товар
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID товара
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               stock:
 *                 type: integer
 *               image:
 *                 type: string
 *     responses:
 *       200:
 *         description: Обновленный товар
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Нет данных для обновления
 *       404:
 *         description: Товар не найден
 */

// PATCH /api/products/:id - обновление товара
app.patch('/api/products/:id', (req, res) => {
    const id = req.params.id;
    const product = findProductOr404(id, res);
    if (!product) return;
    
    if (req.body?.name === undefined && req.body?.category === undefined && 
        req.body?.description === undefined && req.body?.price === undefined && 
        req.body?.stock === undefined) {
        return res.status(400).json({ error: 'Нет данных для обновления' });
    }
    
    const { name, category, description, price, stock, image } = req.body;
    
    if (name !== undefined) product.name = name.trim();
    if (category !== undefined) product.category = category.trim();
    if (description !== undefined) product.description = description.trim();
    if (price !== undefined) product.price = Number(price);
    if (stock !== undefined) product.stock = Number(stock);
    if (image !== undefined) product.image = image.trim();
    
    res.json(product);
});

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Удаляет товар
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID товара
 *     responses:
 *       204:
 *         description: Товар успешно удален (нет тела ответа)
 *       404:
 *         description: Товар не найден
 */

// DELETE /api/products/:id - удаление товара
app.delete('/api/products/:id', (req, res) => {
    const id = req.params.id;
    const exists = products.some(p => p.id === id);
    
    if (!exists) return res.status(404).json({ error: 'Товар не найден' });
    
    products = products.filter(p => p.id !== id);
    // правильные 204 без тела
    res.status(204).send();
});

// 404 для всех остальных маршрутов
app.use((req, res) => {
    res.status(404).json({ error: 'Маршрут не найден' });
});

// Глобальный обработчик ошибок(чтобы сервер не падал)
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

// Запуск сервера
app.listen(port, () => {
    console.log(`Сервер интернет-магазина запущен на http://localhost:${port}`);
});