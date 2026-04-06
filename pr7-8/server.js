const express = require('express');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const authRoutes = require('./routes/auth');
const productsRoutes = require('./routes/products');

const app = express();
const port = 3000;

// !!! ВАЖНО: этот middleware ДОЛЖЕН быть ПЕРВЫМ !!!
app.use(express.json());  // Парсинг JSON из тела запроса

// Swagger конфигурация
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Auth & Products API',
            version: '1.0.0',
            description: 'API для изучения аутентификации и CRUD операций с товарами',
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
            bearerAuth: [],
        }],
    },
    apis: ['./routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Маршруты
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);

// Тестовый маршрут
app.get('/', (req, res) => {
    res.json({ 
        message: 'API работает!',
        endpoints: {
            docs: 'http://localhost:3000/api-docs',
            register: 'POST /api/auth/register',
            login: 'POST /api/auth/login',
            me: 'GET /api/auth/me (требуется токен)',
            products: 'GET/POST /api/products (требуется токен)',
            productById: 'GET/PUT/DELETE /api/products/:id (требуется токен)'
        }
    });
});

// Запуск сервера
app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
    console.log(`Swagger UI доступен по адресу http://localhost:${port}/api-docs`);
});