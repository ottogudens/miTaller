const express = require('express');
const router = express.Router();
const { db } = require('../database.js');

// Middleware Anti-Caché
const noCache = (req, res, next) => {
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    next();
};

// --- MARCAS ---

// [R]EAD: Obtener todas las marcas (con ID)
router.get('/marcas', noCache, async (req, res) => {
    try {
        // Devolvemos ID y Nombre para poder gestionar
        const marcas = await db('marcas').select('id', 'nombre').orderBy('nombre', 'asc');
        res.json(marcas);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener las marcas' });
    }
});

// [C]REATE: Crear Marca
router.post('/marcas', async (req, res) => {
    const { nombre } = req.body;
    if (!nombre) return res.status(400).json({ error: 'Nombre requerido' });
    try {
        await db('marcas').insert({ nombre });
        res.status(201).json({ message: 'Marca creada' });
    } catch (error) {
        res.status(500).json({ error: 'Error al crear (¿Duplicada?)' });
    }
});

// [D]ELETE: Eliminar Marca
router.delete('/marcas/:id', async (req, res) => {
    try {
        await db('marcas').where({ id: req.params.id }).del();
        res.json({ message: 'Marca eliminada' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar' });
    }
});

// --- MODELOS ---

// [R]EAD: Obtener modelos por nombre de marca (Para el select del formulario)
router.get('/modelos/:marcaNombre', noCache, async (req, res) => {
    const { marcaNombre } = req.params;
    try {
        const modelos = await db('modelos')
            .join('marcas', 'modelos.marca_id', '=', 'marcas.id')
            .where('marcas.nombre', marcaNombre)
            .select('modelos.nombre')
            .orderBy('modelos.nombre', 'asc');
        
        // Retornamos solo array de strings para compatibilidad con lo existente
        res.json(modelos.map(m => m.nombre));
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener los modelos' });
    }
});

// [R]EAD: Obtener modelos por ID de marca (Para la gestión)
router.get('/modelos-by-id/:marcaId', noCache, async (req, res) => {
    try {
        const modelos = await db('modelos')
            .where({ marca_id: req.params.marcaId })
            .select('id', 'nombre')
            .orderBy('nombre', 'asc');
        res.json(modelos);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener modelos' });
    }
});

// [C]REATE: Crear Modelo
router.post('/modelos', async (req, res) => {
    const { nombre, marca_id } = req.body;
    if (!nombre || !marca_id) return res.status(400).json({ error: 'Datos incompletos' });
    try {
        await db('modelos').insert({ nombre, marca_id });
        res.status(201).json({ message: 'Modelo creado' });
    } catch (error) {
        res.status(500).json({ error: 'Error al crear modelo' });
    }
});

// [D]ELETE: Eliminar Modelo
router.delete('/modelos/:id', async (req, res) => {
    try {
        await db('modelos').where({ id: req.params.id }).del();
        res.json({ message: 'Modelo eliminado' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar' });
    }
});

module.exports = router;
