const express = require('express');
const { nanoid } = require('nanoid');
const { products } = require('../data/db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Применяем middleware ко всем маршрутам товаров
router.use(authMiddleware);

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Получить список всех товаров
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список товаров
 *   post:
 *     summary: Создать новый товар
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - category
 *               - description
 *               - price
 *             properties:
 *               title:
 *                 type: string
 *                 example: Notebook
 *               category:
 *                 type: string
 *                 example: Electronics
 *               description:
 *                 type: string
 *                 example: A high-performance laptop
 *               price:
 *                 type: number
 *                 example: 999.99
 *     responses:
 *       201:
 *         description: Товар создан
 *       400:
 *         description: Неверные данные
 *       401:
 *         description: Не авторизован
 */

// Получить список всех товаров
router.get('/', (req, res) => {
    res.json(products);
});

// Создать новый товар
router.post('/', (req, res) => {
    const { title, category, description, price } = req.body;

    // Проверка обязательных полей
    if (!title || !category || !description || price === undefined) {
        return res.status(400).json({ 
            error: 'All fields are required: title, category, description, price' 
        });
    }

    // Проверка, что price - число
    const numericPrice = Number(price);
    if (isNaN(numericPrice) || numericPrice < 0) {
        return res.status(400).json({ error: 'Price must be a positive number' });
    }

    // Создание нового товара
    const newProduct = {
        id: nanoid(10),
        title,
        category,
        description,
        price: numericPrice,
        createdBy: req.user.sub,
        createdAt: new Date().toISOString()
    };

    products.push(newProduct);

    res.status(201).json(newProduct);
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Получить товар по ID
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Товар найден
 *       404:
 *         description: Товар не найден
 *   put:
 *     summary: Обновить товар
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *     responses:
 *       200:
 *         description: Товар обновлен
 *       404:
 *         description: Товар не найден
 *   delete:
 *     summary: Удалить товар
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Товар удален
 *       404:
 *         description: Товар не найден
 */

// Получить товар по id
router.get('/:id', (req, res) => {
    const { id } = req.params;
    const product = products.find(p => p.id === id);

    if (!product) {
        return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
});

// Обновить товар
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { title, category, description, price } = req.body;

    const productIndex = products.findIndex(p => p.id === id);

    if (productIndex === -1) {
        return res.status(404).json({ error: 'Product not found' });
    }

    // Обновление только переданных полей
    const updatedProduct = {
        ...products[productIndex],
        title: title !== undefined ? title : products[productIndex].title,
        category: category !== undefined ? category : products[productIndex].category,
        description: description !== undefined ? description : products[productIndex].description,
        price: price !== undefined ? Number(price) : products[productIndex].price,
        updatedAt: new Date().toISOString()
    };

    // Проверка price на валидность
    if (price !== undefined && (isNaN(updatedProduct.price) || updatedProduct.price < 0)) {
        return res.status(400).json({ error: 'Price must be a positive number' });
    }

    products[productIndex] = updatedProduct;

    res.json(updatedProduct);
});

// Удалить товар
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    const productIndex = products.findIndex(p => p.id === id);

    if (productIndex === -1) {
        return res.status(404).json({ error: 'Product not found' });
    }

    const deletedProduct = products[productIndex];
    products.splice(productIndex, 1);

    res.json({ 
        message: 'Product deleted successfully',
        deletedProduct: {
            id: deletedProduct.id,
            title: deletedProduct.title
        }
    });
});

module.exports = router;