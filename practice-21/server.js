const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { createClient } = require("redis");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3000;

// Секреты подписи
const ACCESS_SECRET = "access_secret";
const REFRESH_SECRET = "refresh_secret";

// Время жизни токенов
const ACCESS_EXPIRES_IN = "15m";
const REFRESH_EXPIRES_IN = "7d";

// Время хранения кэша
const USERS_CACHE_TTL = 60;      // 1 минута
const PRODUCTS_CACHE_TTL = 600;  // 10 минут

const redisClient = createClient({
    url: "redis://localhost:6379"
});

redisClient.on("error", (err) => {
    console.error("Redis error:", err);
});
    
async function initRedis() {
    await redisClient.connect();
    console.log("Redis connected");
}


let users = [];  
let products = [];
let refreshTokens = new Set();


function generateAccessToken(user) {
    return jwt.sign(
        {
            sub: user.id,
            username: user.username,
            role: user.role
        },
        ACCESS_SECRET,
        { expiresIn: ACCESS_EXPIRES_IN }
    );
}

function generateRefreshToken(user) {
    return jwt.sign(
        {
            sub: user.id,
            username: user.username,
            role: user.role
        },
        REFRESH_SECRET,
        { expiresIn: REFRESH_EXPIRES_IN }
    );
}

function authMiddleware(req, res, next) {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
        return res.status(401).json({ error: "Missing or invalid Authorization header" });
    }

    try {
        const payload = jwt.verify(token, ACCESS_SECRET);
        req.user = payload;
        next();
    } catch (err) {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
}

function roleMiddleware(allowedRoles) {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: "Forbidden" });
        }
        next();
    };
}

function cacheMiddleware(keyBuilder, ttl) {
    return async (req, res, next) => {
        try {
            const key = keyBuilder(req);
            const cachedData = await redisClient.get(key);
            if (cachedData) {
                return res.json({
                    source: "cache",
                    data: JSON.parse(cachedData)
                });
            }
            req.cacheKey = key;
            req.cacheTTL = ttl;
            next();
        } catch (err) {
            console.error("Cache read error:", err);
            next();
        }
    };
}

async function saveToCache(key, data, ttl) {
    try {
        await redisClient.set(key, JSON.stringify(data), { EX: ttl });
    } catch (err) {
        console.error("Cache save error:", err);
    }
}

async function invalidateUsersCache(userId = null) {
    try {
        await redisClient.del("users:all");
        if (userId) {
            await redisClient.del(`users:${userId}`);
        }
    } catch (err) {
        console.error("Users cache invalidate error:", err);
    }
}

async function invalidateProductsCache(productId = null) {
    try {
        await redisClient.del("products:all");
        if (productId) {
            await redisClient.del(`products:${productId}`);
        }
    } catch (err) {
        console.error("Products cache invalidate error:", err);
    }
}

app.post("/api/auth/register", async (req, res) => {
    const { username, password, role } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "username and password are required" });
    }

    const exists = users.some(u => u.username === username);
    if (exists) {
        return res.status(409).json({ error: "username already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = {
        id: String(users.length + 1),
        username,
        passwordHash,
        role: role || "user",
        blocked: false
    };

    users.push(user);
    await invalidateUsersCache(); // очищаем кэш при изменении

    res.status(201).json({
        id: user.id,
        username: user.username,
        role: user.role,
        blocked: user.blocked
    });
});

// Вход
app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "username and password are required" });
    }

    const user = users.find(u => u.username === username);
    if (!user || user.blocked) {
        return res.status(401).json({ error: "Invalid credentials or user is blocked" });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
        return res.status(401).json({ error: "Invalid credentials" });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    refreshTokens.add(refreshToken);

    res.json({ accessToken, refreshToken });
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
        const user = users.find(u => u.id === payload.sub);
        if (!user || user.blocked) {
            return res.status(401).json({ error: "User not found or blocked" });
        }

        refreshTokens.delete(refreshToken);
        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);
        refreshTokens.add(newRefreshToken);

        res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
    } catch (err) {
        return res.status(401).json({ error: "Invalid or expired refresh token" });
    }
});

// Получить текущего пользователя
app.get("/api/auth/me", authMiddleware, roleMiddleware(["user", "seller", "admin"]), (req, res) => {
    const user = users.find(u => u.id === req.user.sub);
    res.json({
        id: user.id,
        username: user.username,
        role: user.role,
        blocked: user.blocked
    });
});

// GET /api/users - список всех пользователей (кэш 1 минута)
app.get(
    "/api/users",
    authMiddleware,
    roleMiddleware(["admin"]),
    cacheMiddleware(() => "users:all", USERS_CACHE_TTL),
    async (req, res) => {
        const data = users.map(u => ({
            id: u.id,
            username: u.username,
            role: u.role,
            blocked: u.blocked
        }));
        await saveToCache(req.cacheKey, data, req.cacheTTL);
        res.json({ source: "server", data });
    }
);

// GET /api/users/:id - получить пользователя по ID (кэш 1 минута)
app.get(
    "/api/users/:id",
    authMiddleware,
    roleMiddleware(["admin"]),
    cacheMiddleware((req) => `users:${req.params.id}`, USERS_CACHE_TTL),
    async (req, res) => {
        const user = users.find(u => u.id === req.params.id);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        const data = {
            id: user.id,
            username: user.username,
            role: user.role,
            blocked: user.blocked
        };
        await saveToCache(req.cacheKey, data, req.cacheTTL);
        res.json({ source: "server", data });
    }
);

// PUT /api/users/:id - обновить пользователя (очищает кэш)
app.put("/api/users/:id", authMiddleware, roleMiddleware(["admin"]), async (req, res) => {
    const { username, role, blocked } = req.body;
    const user = users.find(u => u.id === req.params.id);
    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }
    if (username !== undefined) user.username = username;
    if (role !== undefined) user.role = role;
    if (blocked !== undefined) user.blocked = blocked;

    await invalidateUsersCache(user.id);

    res.json({
        id: user.id,
        username: user.username,
        role: user.role,
        blocked: user.blocked
    });
});

// DELETE /api/users/:id - заблокировать пользователя (очищает кэш)
app.delete("/api/users/:id", authMiddleware, roleMiddleware(["admin"]), async (req, res) => {
    const user = users.find(u => u.id === req.params.id);
    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }

    user.blocked = true;
    await invalidateUsersCache(user.id);

    res.json({ message: "User blocked", id: user.id });
});

// GET /api/products - список товаров (кэш 10 минут)
app.get(
    "/api/products",
    authMiddleware,
    roleMiddleware(["user", "seller", "admin"]),
    cacheMiddleware(() => "products:all", PRODUCTS_CACHE_TTL),
    async (req, res) => {
        await saveToCache(req.cacheKey, products, req.cacheTTL);
        res.json({ source: "server", data: products });
    }
);

// GET /api/products/:id - товар по ID (кэш 10 минут)
app.get(
    "/api/products/:id",
    authMiddleware,
    roleMiddleware(["user", "seller", "admin"]),
    cacheMiddleware((req) => `products:${req.params.id}`, PRODUCTS_CACHE_TTL),
    async (req, res) => {
        const product = products.find(p => p.id === req.params.id);
        if (!product) {
            return res.status(404).json({ error: "Product not found" });
        }
        await saveToCache(req.cacheKey, product, req.cacheTTL);
        res.json({ source: "server", data: product });
    }
);

// POST /api/products - создание товара (очищает кэш)
app.post("/api/products", authMiddleware, roleMiddleware(["seller", "admin"]), async (req, res) => {
    const { name, price, description } = req.body;
    const newProduct = {
        id: String(products.length + 1),
        name,
        price,
        description
    };
    products.push(newProduct);
    await invalidateProductsCache();
    res.status(201).json(newProduct);
});

// PUT /api/products/:id - обновление товара (очищает кэш)
app.put("/api/products/:id", authMiddleware, roleMiddleware(["seller", "admin"]), async (req, res) => {
    const product = products.find(p => p.id === req.params.id);
    if (!product) {
        return res.status(404).json({ error: "Product not found" });
    }
    const { name, price, description } = req.body;
    if (name !== undefined) product.name = name;
    if (price !== undefined) product.price = price;
    if (description !== undefined) product.description = description;
    await invalidateProductsCache(product.id);
    res.json(product);
});

// DELETE /api/products/:id - удаление товара (очищает кэш)
app.delete("/api/products/:id", authMiddleware, roleMiddleware(["admin"]), async (req, res) => {
    const index = products.findIndex(p => p.id === req.params.id);
    if (index === -1) {
        return res.status(404).json({ error: "Product not found" });
    }
    products.splice(index, 1);
    await invalidateProductsCache(req.params.id);
    res.json({ message: "Product deleted" });
});

initRedis().then(() => {
    app.listen(PORT, () => {
        console.log(`Сервер запущен на http://localhost:${PORT}`);
    });
});