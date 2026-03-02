// ============================================
// ИМПОРТ ЗАВИСИМОСТЕЙ
// ============================================
const express = require('express');
const { nanoid } = require('nanoid');
const cors = require('cors');

// ============================================
// СОЗДАНИЕ СЕРВЕРА
// ============================================
const app = express();
const port = 3000; // порт, на котором будет работать сервер

// ============================================
// НАСТРОЙКА CORS (разрешаем запросы от клиента)
// ============================================
app.use(cors({ 
    origin: "http://localhost:3001", // адрес клиента
    methods: ["GET", "POST", "PATCH", "DELETE"], // разрешенные методы
    allowedHeaders: ["Content-Type", "Authorization"], // разрешенные заголовки
}));

// ============================================
// MIDDLEWARE (промежуточные обработчики)
// ============================================

// Для обработки JSON в запросах
app.use(express.json());

// Для логирования всех запросов (чтобы видеть, что происходит)
app.use((req, res, next) => {
    res.on('finish', () => {
        console.log(`[${new Date().toISOString()}] [${req.method}] ${res.statusCode} ${req.path}`);
        if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
            console.log('Body:', req.body);
        }
    });
    next();
});

// ============================================
// БАЗА ДАННЫХ (временная, в памяти)
// ============================================

let products = [
    {
        id: nanoid(6),
        name: "Игровой ноутбук ASUS ROG",
        category: "Ноутбуки",
        description: "Мощный игровой ноутбук с RTX 3060, 16GB RAM, 512GB SSD",
        price: 89990,
        stock: 5,
        rating: 4.8
    },
    {
        id: nanoid(6),
        name: "Смартфон iPhone 14",
        category: "Смартфоны",
        description: "6.1 дюймов, A15 Bionic, 128GB, камера 12MP",
        price: 79990,
        stock: 10,
        rating: 4.9
    },
    {
        id: nanoid(6),
        name: "Наушники Sony WH-1000XM5",
        category: "Аудио",
        description: "Беспроводные наушники с шумоподавлением",
        price: 29990,
        stock: 15,
        rating: 4.7
    },
    {
        id: nanoid(6),
        name: "Монитор Samsung Odyssey",
        category: "Мониторы",
        description: "27 дюймов, 240Hz, 1ms, QLED",
        price: 44990,
        stock: 7,
        rating: 4.6
    },
    {
        id: nanoid(6),
        name: "Клавиатура Logitech G Pro",
        category: "Периферия",
        description: "Механическая клавиатура для геймеров",
        price: 12990,
        stock: 20,
        rating: 4.5
    },
    {
        id: nanoid(6),
        name: "Мышь Razer DeathAdder V2",
        category: "Периферия",
        description: "Игровая мышь с сенсором 20K DPI",
        price: 5990,
        stock: 25,
        rating: 4.4
    },
    {
        id: nanoid(6),
        name: "Планшет iPad Air",
        category: "Планшеты",
        description: "10.9 дюймов, M1 чип, 64GB",
        price: 54990,
        stock: 8,
        rating: 4.8
    },
    {
        id: nanoid(6),
        name: "Умные часы Galaxy Watch 5",
        category: "Аксессуары",
        description: "Спортивные часы с отслеживанием здоровья",
        price: 24990,
        stock: 12,
        rating: 4.3
    },
    {
        id: nanoid(6),
        name: "Внешний SSD Samsung T7",
        category: "Хранение данных",
        description: "1TB, USB 3.2, скорость до 1050MB/s",
        price: 11990,
        stock: 30,
        rating: 4.7
    },
    {
        id: nanoid(6),
        name: "WiFi роутер TP-Link Archer",
        category: "Сетевое оборудование",
        description: "AX5400, гигабитные порты, Mesh поддержка",
        price: 8990,
        stock: 14,
        rating: 4.2
    }
];

// ============================================
// ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ (для поиска товара по ID)
// ============================================
function findProductOr404(id, res) {
    const product = products.find(p => p.id === id);
    if (!product) {
        res.status(404).json({ error: "Product not found" });
        return null;
    }
    return product;
}

// ============================================
// МАРШРУТЫ API (CRUD операции)
// ============================================

// ---------- GET: Получить все товары ----------
app.get("/api/products", (req, res) => {
    res.json(products);
});

// ---------- GET: Получить товар по ID ----------
app.get("/api/products/:id", (req, res) => {
    const id = req.params.id;
    const product = findProductOr404(id, res);
    if (!product) return;
    res.json(product);
});

// ---------- GET: Получить товары по категории ----------
app.get("/api/products/category/:category", (req, res) => {
    const category = req.params.category;
    const filteredProducts = products.filter(p => 
        p.category.toLowerCase() === category.toLowerCase()
    );
    res.json(filteredProducts);
});

// ---------- POST: Создать новый товар ----------
app.post("/api/products", (req, res) => {
    const { name, category, description, price, stock, rating } = req.body;
    
    // Проверка обязательных полей
    if (!name || !category || !description || !price || stock === undefined) {
        return res.status(400).json({ 
            error: "Заполните все обязательные поля: название, категория, описание, цена, количество" 
        });
    }
    
    const newProduct = {
        id: nanoid(6),
        name: name.trim(),
        category: category.trim(),
        description: description.trim(),
        price: Number(price),
        stock: Number(stock),
        rating: rating ? Number(rating) : 0
    };
    
    products.push(newProduct);
    res.status(201).json(newProduct);
});

// ---------- PATCH: Обновить товар ----------
app.patch("/api/products/:id", (req, res) => {
    const id = req.params.id;
    const product = findProductOr404(id, res);
    if (!product) return;
    
    // Проверяем, есть ли что обновлять
    if (Object.keys(req.body).length === 0) {
        return res.status(400).json({ error: "Нет данных для обновления" });
    }
    
    const { name, category, description, price, stock, rating } = req.body;
    
    if (name !== undefined) product.name = name.trim();
    if (category !== undefined) product.category = category.trim();
    if (description !== undefined) product.description = description.trim();
    if (price !== undefined) product.price = Number(price);
    if (stock !== undefined) product.stock = Number(stock);
    if (rating !== undefined) product.rating = Number(rating);
    
    res.json(product);
});

// ---------- DELETE: Удалить товар ----------
app.delete("/api/products/:id", (req, res) => {
    const id = req.params.id;
    const exists = products.some(p => p.id === id);
    
    if (!exists) {
        return res.status(404).json({ error: "Товар не найден" });
    }
    
    products = products.filter(p => p.id !== id);
    res.status(204).send();
});

// ============================================
// ОБРАБОТКА ОШИБОК
// ============================================

// 404 для несуществующих маршрутов
app.use((req, res) => {
    res.status(404).json({ error: "Маршрут не найден" });
});

// Глобальный обработчик ошибок
app.use((err, req, res, next) => {
    console.error("Необработанная ошибка:", err);
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
});

// ============================================
// ЗАПУСК СЕРВЕРА
// ============================================
app.listen(port, () => {
    console.log(`=================================`);
    console.log(`🚀 Сервер запущен!`);
    console.log(`📡 Адрес: http://localhost:${port}`);
    console.log(`📦 API товаров: http://localhost:${port}/api/products`);
    console.log(`=================================`);
});