const jwt = require('jsonwebtoken');

const JWT_SECRET = 'your_super_secret_key_change_me_123456789';
const ACCESS_EXPIRES_IN = '15m';

function authMiddleware(req, res, next) {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
        return res.status(401).json({ 
            error: 'Missing or invalid Authorization header. Format: Bearer <token>' 
        });
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.user = payload; // Это устанавливает req.user
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' });
        }
        return res.status(401).json({ error: 'Invalid token' });
    }
}

module.exports = { authMiddleware, JWT_SECRET, ACCESS_EXPIRES_IN };