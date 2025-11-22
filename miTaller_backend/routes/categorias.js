const express = require('express');
const router = express.Router();
const { db } = require('../database.js');

const noCache = (req, res, next) => { res.header('Cache-Control', 'private, no-cache'); next(); };

// Obtener Categorías Padres
router.get('/padres', noCache, async (req, res) => {
    try {
        const padres = await db('categorias').where({ es_padre: true }).orderBy('nombre');
        res.json(padres);
    } catch (e) { res.status(500).json({ error: 'Error' }); }
});

// Obtener Hijos de un Padre
router.get('/hijos/:padreId', noCache, async (req, res) => {
    try {
        const hijos = await db('categorias').where({ padre_id: req.params.padreId }).orderBy('nombre');
        res.json(hijos);
    } catch (e) { res.status(500).json({ error: 'Error' }); }
});

// Crear Categoría (Padre o Hijo)
router.post('/', async (req, res) => {
    const { nombre, padre_id } = req.body;
    try {
        // Si trae padre_id es Hijo, si no, es Padre
        const es_padre = !padre_id; 
        await db('categorias').insert({ nombre, padre_id: padre_id || null, es_padre });
        res.status(201).json({ message: 'Categoría creada' });
    } catch (e) { res.status(500).json({ error: 'Error crear' }); }
});

// Borrar Categoría
router.delete('/:id', async (req, res) => {
    try {
        await db('categorias').where({ id: req.params.id }).del();
        res.json({ message: 'Eliminada' });
    } catch (e) { res.status(500).json({ error: 'Error borrar' }); }
});

module.exports = router;
