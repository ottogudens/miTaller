const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { db } = require('../database.js');

const SECRET_KEY = process.env.JWT_SECRET || 'clave_insegura_fallback';

/**
 * @swagger
 * tags:
 * - name: Autenticación
 * description: Registro y Login de usuarios
 */

/**
 * @swagger
 * /auth/register:
 * post:
 * summary: Registra un nuevo usuario
 * tags: [Autenticación]
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - nombre
 * - email
 * - password
 * properties:
 * nombre:
 * type: string
 * email:
 * type: string
 * format: email
 * password:
 * type: string
 * telefono:
 * type: string
 * role:
 * type: string
 * enum: [cliente, admin]
 * responses:
 * 201:
 * description: Usuario creado exitosamente
 * 400:
 * description: Datos faltantes
 * 500:
 * description: Error interno
 */
router.post('/register', async (req, res) => {
    const { nombre, email, password, telefono, role } = req.body;
    try {
        if(!email || !password || !nombre) {
             return res.status(400).json({ error: 'Faltan datos obligatorios (Nombre, Email, Password)' });
        }
        const hash = await bcrypt.hash(password, 10);
        await db('clientes').insert({ nombre, email, password: hash, telefono, role: role || 'cliente' });
        res.status(201).json({ message: 'Usuario creado exitosamente' });
    } catch (e) { 
        console.error(e);
        res.status(500).json({ error: 'Error al registrar usuario.' }); 
    }
});

/**
 * @swagger
 * /auth/login:
 * post:
 * summary: Iniciar sesión
 * tags: [Autenticación]
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - email
 * - password
 * properties:
 * email:
 * type: string
 * example: admin@gudex.cl
 * password:
 * type: string
 * example: admin123
 * responses:
 * 200:
 * description: Login exitoso
 * 400:
 * description: Credenciales inválidas
 */
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await db('clientes').where({ email }).first();
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ error: 'Credenciales inválidas' });
        }
        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, SECRET_KEY, { expiresIn: '8h' });
        res.json({ token, user: { id: user.id, nombre: user.nombre, role: user.role } });
    } catch (e) { 
        console.error(e);
        res.status(500).json({ error: 'Error en el servidor durante el login' }); 
    }
});

module.exports = router;