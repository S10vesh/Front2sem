const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3000;

// Секреты подписи
const ACCESS_SECRET = process.env.ACCESS_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET;

// Время жизни токенов
const ACCESS_EXPIRES_IN = process.env.ACCESS_EXPIRES_IN;
const REFRESH_EXPIRES_IN = process.env.REFRESH_EXPIRES_IN;

// Хранилища в памяти
const users = []; // { id, username, passwordHash }
const refreshTokens = new Set();
let nextId = 1;

// Функция генерации access-токена
function generateAccessToken(user) {
    return jwt.sign(
        {
            sub: user.id,
            username: user.username,
        },
        ACCESS_SECRET,
        {
            expiresIn: ACCESS_EXPIRES_IN,
        }
    );
}

// Функция генерации refresh-токена
function generateRefreshToken(user) {
    return jwt.sign(
        {
            sub: user.id,
            username: user.username,
        },
        REFRESH_SECRET,
        {
            expiresIn: REFRESH_EXPIRES_IN,
        }
    );
}

// Middleware для проверки access-токена
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

// ========== ЭНДПОИНТЫ ==========

// Регистрация
app.post("/api/auth/register", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
    }

    // Проверка на существующего пользователя
    const existingUser = users.find(u => u.username === username);
    if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
    }

    // Хеширование пароля
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Создание пользователя
    const user = {
        id: nextId++,
        username,
        passwordHash,
    };
    
    users.push(user);

    // Генерация токенов
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    
    // Сохранение refresh-токена
    refreshTokens.add(refreshToken);

    res.status(201).json({
        accessToken,
        refreshToken,
        user: { id: user.id, username: user.username }
    });
});

// Вход в систему
app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
    }

    // Поиск пользователя
    const user = users.find(u => u.username === username);
    if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
    }

    // Проверка пароля
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
        return res.status(401).json({ error: "Invalid credentials" });
    }

    // Генерация токенов
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    
    // Сохранение refresh-токена
    refreshTokens.add(refreshToken);

    res.json({
        accessToken,
        refreshToken,
        user: { id: user.id, username: user.username }
    });
});

// Обновление пары токенов
app.post("/api/auth/refresh", (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(400).json({ error: "refreshToken is required" });
    }

    // Проверка наличия refresh-токена в хранилище
    if (!refreshTokens.has(refreshToken)) {
        return res.status(401).json({ error: "Invalid refresh token" });
    }

    try {
        // Верификация refresh-токена
        const payload = jwt.verify(refreshToken, REFRESH_SECRET);
        
        // Поиск пользователя
        const user = users.find(u => u.id === payload.sub);
        if (!user) {
            return res.status(401).json({ error: "User not found" });
        }

        // Ротация refresh-токена: удаляем старый
        refreshTokens.delete(refreshToken);
        
        // Генерируем новую пару токенов
        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);
        
        // Сохраняем новый refresh-токен
        refreshTokens.add(newRefreshToken);

        res.json({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
        });
    } catch (err) {
        return res.status(401).json({ error: "Invalid or expired refresh token" });
    }
});

// Защищенный маршрут для примера
app.get("/api/protected", authMiddleware, (req, res) => {
    res.json({
        message: "This is a protected route",
        user: req.user
    });
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`========================================`);
    console.log(`Сервер запущен на http://localhost:${PORT}`);
    console.log(`========================================`);
    console.log(`\nДоступные эндпоинты:`);
    console.log(`  POST   /api/auth/register - регистрация`);
    console.log(`  POST   /api/auth/login    - вход`);
    console.log(`  POST   /api/auth/refresh  - обновление токенов`);
    console.log(`  GET    /api/protected     - защищенный маршрут`);
    console.log(`\nПримеры запросов для тестирования:`);
    console.log(`\n1. Регистрация:`);
    console.log(`   curl -X POST http://localhost:3000/api/auth/register \\`);
    console.log(`     -H "Content-Type: application/json" \\`);
    console.log(`     -d '{"username":"user1","password":"123456"}'`);
    console.log(`\n2. Вход:`);
    console.log(`   curl -X POST http://localhost:3000/api/auth/login \\`);
    console.log(`     -H "Content-Type: application/json" \\`);
    console.log(`     -d '{"username":"user1","password":"123456"}'`);
    console.log(`\n3. Обновление токена:`);
    console.log(`   curl -X POST http://localhost:3000/api/auth/refresh \\`);
    console.log(`     -H "Content-Type: application/json" \\`);
    console.log(`     -d '{"refreshToken":"ВАШ_REFRESH_ТОКЕН"}'`);
    console.log(`\n4. Доступ к защищенному маршруту:`);
    console.log(`   curl -X GET http://localhost:3000/api/protected \\`);
    console.log(`     -H "Authorization: Bearer ВАШ_ACCESS_ТОКЕН"`);
    console.log(`========================================`);
});