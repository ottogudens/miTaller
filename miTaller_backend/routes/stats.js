const express = require('express');
const router = express.Router();
const { db } = require('../database.js');

const noCache = (req, res, next) => { res.header('Cache-Control', 'private, no-cache'); next(); };

router.get('/marcas-top', noCache, async (req, res) => {
    try {
        const stats = await db('mantenimientos')
            .join('vehiculos', 'mantenimientos.vehiculo_id', '=', 'vehiculos.id')
            .select('vehiculos.marca')
            .count('mantenimientos.id as total_mantenciones')
            .groupBy('vehiculos.marca')
            .orderBy('total_mantenciones', 'desc').limit(5);
        res.json(stats);
    } catch (error) { res.status(500).json({ error: 'Error' }); }
});

router.get('/modelos-top', noCache, async (req, res) => {
    try {
        const stats = await db('mantenimientos')
            .join('vehiculos', 'mantenimientos.vehiculo_id', '=', 'vehiculos.id')
            .select('vehiculos.marca', 'vehiculos.modelo')
            .count('mantenimientos.id as total_mantenciones')
            .groupBy('vehiculos.modelo', 'vehiculos.marca')
            .orderBy('total_mantenciones', 'desc').limit(5);
        res.json(stats);
    } catch (error) { res.status(500).json({ error: 'Error' }); }
});

module.exports = router;