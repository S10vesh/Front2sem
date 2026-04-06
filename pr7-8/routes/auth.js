const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { nanoid } = require('nanoid');
const { users } = require('../data/db');
const { authMiddleware, JWT_SECRET, ACCESS_EXPIRES_IN } = require('../middleware/auth');

const router = express.Router();

// Функция хеширования пароля
async function hashPassword(password) {
    const rounds = 10;
    return bcrypt.hash(password, rounds);
}

// Функция проверки пароля
async function verifyPassword(password, passwordHash) {
    return bcrypt.compare(password, passwordHash);
}

// ============ РЕГИСТРАЦИЯ ============
router.post('/register', async (req, res) => {
    const { email, first_name, last_name, password } = req.body;

    if (!email || !first_name || !last_name || !password) {
        return res.status(400).json({ 
            error: 'All fields are required: email, first_name, last_name, password' 
        });
    }

    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
        return res.status(400).json({ error: 'User with this email already exists' });
    }

    const hashedPassword = await hashPassword(password);

    const newUser = {
        id: nanoid(10),
        email,
        first_name,
        last_name,
        password_hash: hashedPassword
    };

    users.push(newUser);

    res.status(201).json({
        id: newUser.id,
        email: newUser.email,
        first_name: newUser.first_name,
        last_name: newUser.last_name
    });
});

// ============ ВХОД ============
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ 
            error: 'Email and password are required' 
        });
    }

    const user = users.find(u => u.email === email);
    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    const accessToken = jwt.sign(
        { 
            sub: user.id, 
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name
        },
        JWT_SECRET,
        { expiresIn: ACCESS_EXPIRES_IN }
    );

    res.json({ accessToken });
});

// ============ ПОЛУЧЕНИЕ ИНФОРМАЦИИ О СЕБЕ ============
// ВАЖНО: добавлен authMiddleware!
router.get('/me', authMiddleware, (req, res) => {
    // Теперь req.user существует, потому что authMiddleware его установил
    const userId = req.user.sub;
    const user = users.find(u => u.id === userId);

    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    res.json({
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name
    });
});

module.exports = router;