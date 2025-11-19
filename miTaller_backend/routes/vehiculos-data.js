const express = require('express');
const router = express.Router();
const { db } = require('../database.js');

// Middleware Anti-Caché
const noCache = (req, res, next) => {
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    next();
};

// --- MARCAS ---

// Leer todas
router.get('/marcas', noCache, async (req, res) => {
    try {
        const marcas = await db('marcas').select('id', 'nombre').orderBy('nombre', 'asc');
        res.json(marcas);
    } catch (error) {
        res.status(500).json({ error: 'Error marcas' });
    }
});

// Crear Marca
router.post('/marcas', async (req, res) => {
    const { nombre } = req.body;
    if (!nombre) return res.status(400).json({ error: 'Nombre requerido' });
    try {
        await db('marcas').insert({ nombre });
        res.status(201).json({ message: 'Marca creada' });
    } catch (error) {
        res.status(500).json({ error: 'Error crear marca' });
    }
});

// Borrar Marca
router.delete('/marcas/:id', async (req, res) => {
    try {
        await db('marcas').where({ id: req.params.id }).del();
        res.json({ message: 'Marca eliminada' });
    } catch (error) {
        res.status(500).json({ error: 'Error eliminar marca' });
    }
});

// --- MODELOS ---

// Leer modelos por nombre de marca (Para el formulario de vehículos)
router.get('/modelos/:marcaNombre', noCache, async (req, res) => {
    try {
        const modelos = await db('modelos')
            .join('marcas', 'modelos.marca_id', '=', 'marcas.id')
            .where('marcas.nombre', req.params.marcaNombre)
            .select('modelos.nombre')
            .orderBy('modelos.nombre', 'asc');
        res.json(modelos.map(m => m.nombre));
    } catch (error) {
        res.status(500).json({ error: 'Error modelos' });
    }
});

// Leer modelos por ID de marca (Para el panel de configuración)
router.get('/modelos-by-id/:marcaId', noCache, async (req, res) => {
    try {
        const modelos = await db('modelos')
            .where({ marca_id: req.params.marcaId })
            .select('id', 'nombre')
            .orderBy('nombre', 'asc');
        res.json(modelos);
    } catch (error) {
        res.status(500).json({ error: 'Error modelos ID' });
    }
});

// Crear Modelo
router.post('/modelos', async (req, res) => {
    const { nombre, marca_id } = req.body;
    if (!nombre || !marca_id) return res.status(400).json({ error: 'Faltan datos' });
    try {
        await db('modelos').insert({ nombre, marca_id });
        res.status(201).json({ message: 'Modelo creado' });
    } catch (error) {
        res.status(500).json({ error: 'Error crear modelo' });
    }
});

// Borrar Modelo
router.delete('/modelos/:id', async (req, res) => {
    try {
        await db('modelos').where({ id: req.params.id }).del();
        res.json({ message: 'Modelo eliminado' });
    } catch (error) {
        res.status(500).json({ error: 'Error eliminar modelo' });
    }
});

module.exports = router;
