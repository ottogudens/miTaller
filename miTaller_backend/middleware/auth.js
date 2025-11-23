const jwt = require('jsonwebtoken');

// Seguridad: Usar variable de entorno. Fallback solo para desarrollo.
const SECRET_KEY = process.env.JWT_SECRET || 'clave_insegura_fallback';

const protegerRuta = (req, res, next) => {
    let token = null;

    // 1. Intentar leer del Header 'Authorization: Bearer <token>'
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    }

    // 2. Si no hay header, intentar leer de la URL (Para descargas de PDF/Excel)
    if (!token && req.query && req.query.token) {
        token = req.query.token;
    }

    if (!token) {
        return res.status(401).json({ error: 'Acceso denegado: Token no proporcionado.' });
    }

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Acceso denegado: Token inválido o expirado.' });
        }
        req.user = user; // Guardamos los datos del usuario en la petición
        next();
    });
};

const soloAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Acceso denegado: Se requieren privilegios de administrador.' });
    }
};

module.exports = { protegerRuta, soloAdmin };