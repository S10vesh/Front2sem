const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

const PORT = 3000;

// Секреты подписи
const ACCESS_SECRET = "access_secret";
const REFRESH_SECRET = "refresh_secret";

// Время жизни токенов
const ACCESS_EXPIRES_IN = "15m";
const REFRESH_EXPIRES_IN = "7d";

// Хранилища
const users = [];      // { id, username, passwordHash, role, isActive }
const refreshTokens = new Set();
const products = [];
let nextUserId = 1;
let nextProductId = 1;

// ========== ФУНКЦИИ ГЕНЕРАЦИИ ТОКЕНОВ ==========
function generateAccessToken(user) {
    return jwt.sign(
        { sub: user.id, username: user.username, role: user.role },
        ACCESS_SECRET,
        { expiresIn: ACCESS_EXPIRES_IN }
    );
}

function generateRefreshToken(user) {
    return jwt.sign(
        { sub: user.id, username: user.username, role: user.role },
        REFRESH_SECRET,
        { expiresIn: REFRESH_EXPIRES_IN }
    );
}

// ========== MIDDLEWARE ==========
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
        if (!req.user) {
            return res.status(401).json({ error: "Not authenticated" });
        }
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: "Access denied: insufficient permissions" });
        }
        next();
    };
}

// ========== AUTH ЭНДПОИНТЫ ==========

// Регистрация (доступ: Гость)
app.post("/api/auth/register", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
    }

    const existingUser = users.find(u => u.username === username);
    if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    // По умолчанию создаем пользователя с ролью "user"
    const user = { 
        id: nextUserId++, 
        username, 
        passwordHash, 
        role: "user",
        isActive: true 
    };
    users.push(user);

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    refreshTokens.add(refreshToken);

    res.json({ 
        accessToken, 
        refreshToken, 
        user: { id: user.id, username: user.username, role: user.role } 
    });
});

// Вход (доступ: Гость)
app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
    }

    const user = users.find(u => u.username === username);
    if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!user.isActive) {
        return res.status(401).json({ error: "Account is blocked" });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
        return res.status(401).json({ error: "Invalid credentials" });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    refreshTokens.add(refreshToken);

    res.json({ 
        accessToken, 
        refreshToken, 
        user: { id: user.id, username: user.username, role: user.role } 
    });
});

// Обновление токенов (доступ: Гость)
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

        if (!user) {
            return res.status(401).json({ error: "User not found" });
        }

        if (!user.isActive) {
            return res.status(401).json({ error: "Account is blocked" });
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

// Получить информацию о текущем пользователе (доступ: Пользователь)
app.get("/api/auth/me", authMiddleware, (req, res) => {
    const user = users.find(u => u.id === req.user.sub);
    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }
    res.json({ id: user.id, username: user.username, role: user.role, isActive: user.isActive });
});

// ========== USER MANAGEMENT (только admin) ==========

// Получить список пользователей (admin)
app.get("/api/users", authMiddleware, roleMiddleware(["admin"]), (req, res) => {
    const userList = users.map(u => ({
        id: u.id,
        username: u.username,
        role: u.role,
        isActive: u.isActive
    }));
    res.json(userList);
});

// Получить пользователя по id (admin)
app.get("/api/users/:id", authMiddleware, roleMiddleware(["admin"]), (req, res) => {
    const userId = parseInt(req.params.id);
    const user = users.find(u => u.id === userId);
    
    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }
    
    res.json({
        id: user.id,
        username: user.username,
        role: user.role,
        isActive: user.isActive
    });
});

// Обновить пользователя (admin) - роль или статус блокировки
app.put("/api/users/:id", authMiddleware, roleMiddleware(["admin"]), async (req, res) => {
    const userId = parseInt(req.params.id);
    const { role, isActive, password } = req.body;
    
    const user = users.find(u => u.id === userId);
    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }
    
    // Нельзя менять роль/блокировку самого себя
    if (user.id === req.user.sub) {
        return res.status(400).json({ error: "Cannot modify your own account" });
    }
    
    if (role) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;
    if (password) {
        user.passwordHash = await bcrypt.hash(password, 10);
    }
    
    res.json({
        id: user.id,
        username: user.username,
        role: user.role,
        isActive: user.isActive
    });
});

// Заблокировать пользователя (admin)
app.delete("/api/users/:id", authMiddleware, roleMiddleware(["admin"]), (req, res) => {
    const userId = parseInt(req.params.id);
    const user = users.find(u => u.id === userId);
    
    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }
    
    if (user.id === req.user.sub) {
        return res.status(400).json({ error: "Cannot block yourself" });
    }
    
    user.isActive = false;
    res.json({ message: "User blocked successfully" });
});

// ========== PRODUCTS ЭНДПОИНТЫ (с ролями) ==========

// Получить список товаров (доступ: Пользователь)
app.get("/api/products", authMiddleware, (req, res) => {
    res.json(products);
});

// Получить товар по id (доступ: Пользователь)
app.get("/api/products/:id", authMiddleware, (req, res) => {
    const id = parseInt(req.params.id);
    const product = products.find(p => p.id === id);
    
    if (!product) {
        return res.status(404).json({ error: "Product not found" });
    }
    res.json(product);
});

// Создать товар (доступ: Продавец, Админ)
app.post("/api/products", authMiddleware, roleMiddleware(["seller", "admin"]), (req, res) => {
    const { name, price, description } = req.body;
    
    if (!name || !price) {
        return res.status(400).json({ error: "Name and price are required" });
    }
    
    const product = {
        id: nextProductId++,
        name,
        price: parseFloat(price),
        description: description || "",
        createdAt: new Date()
    };
    
    products.push(product);
    res.status(201).json(product);
});

// Обновить товар (доступ: Продавец, Админ)
app.put("/api/products/:id", authMiddleware, roleMiddleware(["seller", "admin"]), (req, res) => {
    const id = parseInt(req.params.id);
    const { name, price, description } = req.body;
    
    const product = products.find(p => p.id === id);
    if (!product) {
        return res.status(404).json({ error: "Product not found" });
    }
    
    if (name) product.name = name;
    if (price) product.price = parseFloat(price);
    if (description !== undefined) product.description = description;
    product.updatedAt = new Date();
    
    res.json(product);
});

// Удалить товар (доступ: Админ)
app.delete("/api/products/:id", authMiddleware, roleMiddleware(["admin"]), (req, res) => {
    const id = parseInt(req.params.id);
    const index = products.findIndex(p => p.id === id);
    
    if (index === -1) {
        return res.status(404).json({ error: "Product not found" });
    }
    
    products.splice(index, 1);
    res.json({ message: "Product deleted successfully" });
});

// Создание тестового админа при запуске (для удобства)
async function createTestAdmin() {
    const adminExists = users.find(u => u.username === "admin");
    if (!adminExists) {
        const passwordHash = await bcrypt.hash("admin123", 10);
        users.push({
            id: nextUserId++,
            username: "admin",
            passwordHash,
            role: "admin",
            isActive: true
        });
        console.log("✅ Тестовый админ создан: username: admin, password: admin123");
    }
}

// Запуск сервера
app.listen(PORT, async () => {
    await createTestAdmin();
    console.log(`========================================`);
    console.log(`Сервер запущен на http://localhost:${PORT}`);
    console.log(`========================================`);
    console.log(`\nРоли и права:`);
    console.log(`  👤 user     - только просмотр товаров`);
    console.log(`  🛒 seller   - просмотр + создание + редактирование товаров`);
    console.log(`  👑 admin    - все права + управление пользователями`);
    console.log(`\nТестовый админ: admin / admin123`);
});