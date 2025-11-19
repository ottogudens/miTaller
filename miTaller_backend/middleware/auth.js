const jwt = require('jsonwebtoken');
// Asegúrate de que esta clave sea IGUAL a la de routes/auth.js
const SECRET_KEY = 'tu_secreto_super_seguro'; 

const protegerRuta = (req, res, next) => {
    let token = null;

    // 1. Intentar leer del Header 'Authorization: Bearer <token>'
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    }

    // 2. Si no hay header, intentar leer de la URL '?token=<token>' (Para descargas)
    if (!token && req.query && req.query.token) {
        token = req.query.token;
    }

    // 3. Si después de ambos intentos no hay token, rechazar
    if (!token) {
        return res.status(401).json({ error: 'Acceso denegado: Token no proporcionado.' });
    }

    // 4. Verificar el token
    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Acceso denegado: Token inválido o expirado.' });
        }
        req.user = user; // Guardamos los datos del usuario en la petición
        next(); // Continuamos
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
