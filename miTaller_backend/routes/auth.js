const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { db } = require('../database.js');
const SECRET_KEY = 'tu_secreto_super_seguro';

router.post('/register', async (req, res) => {
    const { nombre, email, password, telefono, role } = req.body;
    try {
        const hash = await bcrypt.hash(password, 10);
        await db('clientes').insert({ nombre, email, password: hash, telefono, role: role || 'cliente' });
        res.status(201).json({ message: 'Usuario creado' });
    } catch (e) { res.status(500).json({ error: 'Error registro' }); }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await db('clientes').where({ email }).first();
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ error: 'Credenciales inválidas' });
        }
        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, SECRET_KEY);
        res.json({ token, user: { id: user.id, nombre: user.nombre, role: user.role } });
    } catch (e) { res.status(500).json({ error: 'Error login' }); }
});
module.exports = router;
