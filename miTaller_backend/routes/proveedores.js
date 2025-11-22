const express = require('express');
const router = express.Router();
const { db } = require('../database.js');

const noCache = (req, res, next) => { res.header('Cache-Control', 'private, no-cache'); next(); };

router.get('/', noCache, async (req, res) => {
    try {
        const proveedores = await db('proveedores').orderBy('nombre', 'asc');
        res.json(proveedores);
    } catch (error) { res.status(500).json({ error: 'Error al obtener proveedores' }); }
});

router.post('/', async (req, res) => {
    const { nombre, rut, telefono, email, direccion } = req.body;
    if (!nombre) return res.status(400).json({ error: 'Nombre obligatorio' });
    try {
        await db('proveedores').insert({ nombre, rut, telefono, email, direccion });
        res.status(201).json({ message: 'Proveedor creado' });
    } catch (error) { res.status(500).json({ error: 'Error al crear proveedor' }); }
});

router.delete('/:id', async (req, res) => {
    try {
        await db('proveedores').where({ id: req.params.id }).del();
        res.json({ message: 'Proveedor eliminado' });
    } catch (error) { res.status(500).json({ error: 'Error al eliminar' }); }
});

module.exports = router;
