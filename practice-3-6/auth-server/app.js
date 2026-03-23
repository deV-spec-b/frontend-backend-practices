const express = require('express');
const { nanoid } = require("nanoid");  
const bcrypt = require('bcrypt');    
const jwt = require('jsonwebtoken');
const cors = require('cors');

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
const port = 3002;

// CORS
app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Swagger настройки
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API интернет-магазина с авторизацией и ролями',
            version: '1.0.0',
            description: 'Регистрация, вход, управление товарами и пользователями (RBAC)',
        },
        servers: [
            {
                url: `http://localhost:${port}`,
                description: 'Локальный сервер',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [{
            bearerAuth: []
        }],
    },
    apis: ['./app.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Middleware
app.use(express.json());

// Базы данных
let users = [];
let products = [
    {
        id: nanoid(6),
        title: "Миксер планетарный",
        category: "Кухня",
        description: "Мощный миксер для теста. Планетарная система вращения, 5 скоростей, чаша 5л.",
        price: 7500,
        image: "/images/1.jpg"
    },
    {
        id: nanoid(6),
        title: "Блендер погружной",
        category: "Кухня",
        description: "Для смузи и супов. Мощность 800 Вт, насадка-венчик, мерный стакан.",
        price: 3500,
        image: "/images/2.jpg"
    },
    {
        id: nanoid(6),
        title: "Кофемашина",
        category: "Кофе",
        description: "Автоматическая, с капучинатором. Давление 15 бар, регулировка крепости.",
        price: 25000,
        image: "/images/3.jpg"
    },
    {
        id: nanoid(6),
        title: "Электрочайник",
        category: "Кухня",
        description: "Стеклянный, с подсветкой. Объём 1.7л, скрытый нагревательный элемент.",
        price: 2200,
        image: "/images/4.jpg"
    },
    {
        id: nanoid(6),
        title: "Тостер",
        category: "Кухня",
        description: "2 отделения, регулировка степени поджаривания, подогрев булочек.",
        price: 1800,
        image: "/images/5.jpg"
    },
    {
        id: nanoid(6),
        title: "Соковыжималка",
        category: "Кухня",
        description: "Для цитрусовых. Мощность 100 Вт, универсальные конусы.",
        price: 2900,
        image: "/images/6.jpg"
    },
    {
        id: nanoid(6),
        title: "Мясорубка",
        category: "Кухня",
        description: "Электрическая, насадки для кебаббе и колбас. Мощность 1500 Вт.",
        price: 5200,
        image: "/images/7.jpg"
    },
    {
        id: nanoid(6),
        title: "Холодильник",
        category: "Бытовая техника",
        description: "No Frost, 300л, электронное управление, зона свежести.",
        price: 42000,
        image: "/images/8.jpg"
    },
    {
        id: nanoid(6),
        title: "Микроволновка",
        category: "Бытовая техника",
        description: "С грилем, объём 20л, мощность 800 Вт, автоприготовление.",
        price: 8900,
        image: "/images/9.jpg"
    },
    {
        id: nanoid(6),
        title: "Посудомойка",
        category: "Бытовая техника",
        description: "Узкая, 60см, 10 комплектов, класс А, половинная загрузка.",
        price: 35000,
        image: "/images/10.jpg"
    }
];
let refreshTokens = new Set();

const JWT_SECRET = "access_secret_front_8";
const REFRESH_SECRET = "refresh_secret_front_8";
const ACCESS_EXPIRES_IN = "15m";
const REFRESH_EXPIRES_IN = "7d";

// Хеширование
async function hashPassword(password) {
    const rounds = 10;
    return bcrypt.hash(password, rounds);
}

async function verifyPassword(password, passwordHash) {
    return bcrypt.compare(password, passwordHash);
}

// Генерация токенов
function generateAccessToken(user) {
    return jwt.sign(
        {
            sub: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role
        },
        JWT_SECRET,
        { expiresIn: ACCESS_EXPIRES_IN }
    );
}

function generateRefreshToken(user) {
    return jwt.sign(
        {
            sub: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role
        },
        REFRESH_SECRET,
        { expiresIn: REFRESH_EXPIRES_IN }
    );
}

// Middleware аутентификации
function authMiddleware(req, res, next) {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
        return res.status(401).json({ error: "Missing or invalid Authorization header" });
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.user = payload;
        next();
    } catch (err) {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
}

// Middleware для проверки роли
function roleMiddleware(allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        
        const userRole = req.user.role;
        
        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({ error: 'Forbidden: insufficient permissions' });
        }
        
        next();
    };
}

// Создание администратора при запуске
const createAdmin = async () => {
    const existingAdmin = users.find(u => u.email === "admin@example.com");
    if (!existingAdmin) {
        const hashedPassword = await bcrypt.hash("admin123", 10);
        users.push({
            id: nanoid(6),
            email: "admin@example.com",
            first_name: "Admin",
            last_name: "Adminov",
            hashedPassword: hashedPassword,
            role: "admin",
            isActive: true
        });
        console.log("✅ Администратор создан: admin@example.com / admin123");
    }
};

// ========== AUTH ==========

// Регистрация
app.post('/api/auth/register', async (req, res) => {
    const { email, first_name, last_name, password, role } = req.body;

    if (!email || !first_name || !last_name || !password) {
        return res.status(400).json({ error: 'Все поля обязательны' });
    }

    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
        return res.status(400).json({ error: 'Пользователь уже существует' });
    }

    const hashedPassword = await hashPassword(password);
    
    let userRole = 'user';
    if (role && ['user', 'seller', 'admin'].includes(role)) {
        userRole = role;
    }
    
    const newUser = {
        id: nanoid(6),
        email,
        first_name,
        last_name,
        hashedPassword,
        role: userRole,
        isActive: true
    };

    users.push(newUser);
    res.status(201).json({
        id: newUser.id,
        email: newUser.email,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        role: newUser.role
    });
});

// Вход
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email и пароль обязательны' });
    }

    const user = users.find(u => u.email === email);
    if (!user) {
        return res.status(401).json({ error: 'Неверные учетные данные' });
    }

    const isValid = await verifyPassword(password, user.hashedPassword);
    if (!isValid) {
        return res.status(401).json({ error: 'Неверные учетные данные' });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    refreshTokens.add(refreshToken);

    res.json({
        accessToken,
        refreshToken
    });
});

// Обновление токенов
app.post("/api/auth/refresh", (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(400).json({ error: "refreshToken is required" });
    }

    if (!refreshTokens.has(refreshToken)) {
        return res.status(401).json({ error: "Invalid refresh token" });
    }

    try {
        const payload = jwt.verify(refreshToken, REFRESH_SECRET);
        const user = users.find((u) => u.id === payload.sub);
        if (!user) {
            return res.status(401).json({ error: "User not found" });
        }

        refreshTokens.delete(refreshToken);
        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);
        refreshTokens.add(newRefreshToken);

        res.json({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
        });
    } catch (err) {
        return res.status(401).json({ error: "Invalid or expired refresh token" });
    }
});

// Получить текущего пользователя
app.get("/api/auth/me", authMiddleware, (req, res) => {
    const userId = req.user.sub;
    const user = users.find(u => u.id === userId);

    if (!user) {
        return res.status(404).json({ error: "Пользователь не найден" });
    }

    res.json({
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        isActive: user.isActive
    });
});

// ========== USERS (только админ) ==========

// GET /api/users - список всех пользователей
app.get('/api/users', 
    authMiddleware, 
    roleMiddleware(['admin']), 
    (req, res) => {
        const safeUsers = users.map(u => ({
            id: u.id,
            email: u.email,
            first_name: u.first_name,
            last_name: u.last_name,
            role: u.role,
            isActive: u.isActive
        }));
        res.json(safeUsers);
    }
);

// GET /api/users/:id - получить пользователя по id
app.get('/api/users/:id',
    authMiddleware,
    roleMiddleware(['admin']),
    (req, res) => {
        const user = users.find(u => u.id === req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }
        
        res.json({
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role,
            isActive: user.isActive
        });
    }
);

// PUT /api/users/:id - обновить пользователя (админ)
app.put('/api/users/:id',
    authMiddleware,
    roleMiddleware(['admin']),
    (req, res) => {
        const user = users.find(u => u.id === req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }
        
        const { role, isActive, first_name, last_name, email } = req.body;
        
        if (role && ['user', 'seller', 'admin'].includes(role)) {
            user.role = role;
        }
        
        if (typeof isActive === 'boolean') {
            user.isActive = isActive;
        }
        
        if (first_name) {
            user.first_name = first_name;
        }
        
        if (last_name) {
            user.last_name = last_name;
        }
        
        if (email) {
            const emailExists = users.find(u => u.email === email && u.id !== user.id);
            if (emailExists) {
                return res.status(400).json({ error: 'Email уже используется' });
            }
            user.email = email;
        }
        
        res.json({
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role,
            isActive: user.isActive
        });
    }
);

// DELETE /api/users/:id - блокировка пользователя
app.delete('/api/users/:id',
    authMiddleware,
    roleMiddleware(['admin']),
    (req, res) => {
        const user = users.find(u => u.id === req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }
        
        user.isActive = false;
        
        res.json({
            message: 'Пользователь заблокирован',
            user: {
                id: user.id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                isActive: user.isActive
            }
        });
    }
);

// ========== PRODUCTS ==========

// GET все товары (user, seller, admin)
app.get('/api/products', authMiddleware, (req, res) => {
    res.json(products);
});

// GET товар по id (user, seller, admin)
app.get('/api/products/:id', authMiddleware, (req, res) => {
    const product = products.find(p => p.id === req.params.id);
    if (!product) {
        return res.status(404).json({ error: 'Товар не найден' });
    }
    res.json(product);
});

// POST создать товар (seller, admin)
app.post('/api/products',
    authMiddleware,
    roleMiddleware(['seller', 'admin']),
    (req, res) => {
        const { title, category, description, price, image } = req.body;

        if (!title || !category || !description || !price) {
            return res.status(400).json({ error: 'Все поля обязательны' });
        }

        const newProduct = {
            id: nanoid(6),
            title,
            category,
            description,
            price: Number(price),
            image: image || "https://via.placeholder.com/200?text=No+Image"
        };

        products.push(newProduct);
        res.status(201).json(newProduct);
    }
);

// PUT обновить товар (seller, admin)
app.put('/api/products/:id',
    authMiddleware,
    roleMiddleware(['seller', 'admin']),
    (req, res) => {
        const product = products.find(p => p.id === req.params.id);
        if (!product) {
            return res.status(404).json({ error: 'Товар не найден' });
        }

        const { title, category, description, price, image } = req.body;
        if (title) product.title = title;
        if (category) product.category = category;
        if (description) product.description = description;
        if (price) product.price = Number(price);
        if (image) product.image = image;

        res.json(product);
    }
);

// DELETE удалить товар (admin)
app.delete('/api/products/:id',
    authMiddleware,
    roleMiddleware(['admin']),
    (req, res) => {
        const index = products.findIndex(p => p.id === req.params.id);
        if (index === -1) {
            return res.status(404).json({ error: 'Товар не найден' });
        }
        products.splice(index, 1);
        res.status(204).send();
    }
);

// Создаём админа при запуске
createAdmin();

// Запуск сервера
app.listen(port, () => {
    console.log(`Сервер с авторизацией запущен на http://localhost:${port}`);
    console.log(`Swagger UI: http://localhost:${port}/api-docs`);
});