const express = require('express');
const router = express.Router();
const { db } = require('../database.js');

// Middleware Anti-Caché
const noCache = (req, res, next) => {
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    next();
};

// 1. Top 5 Marcas
router.get('/marcas-top', noCache, async (req, res) => {
    try {
        const stats = await db('mantenimientos')
            .join('vehiculos', 'mantenimientos.vehiculo_id', '=', 'vehiculos.id')
            .select('vehiculos.marca')
            .count('mantenimientos.id as total_mantenciones')
            .groupBy('vehiculos.marca')
            .orderBy('total_mantenciones', 'desc')
            .limit(5);
        res.json(stats);
    } catch (error) {
        console.error("Error stats marcas:", error);
        res.status(500).json({ error: 'Error al obtener estadísticas marcas' });
    }
});

// 2. Top 5 Modelos (NUEVO)
router.get('/modelos-top', noCache, async (req, res) => {
    try {
        const stats = await db('mantenimientos')
            .join('vehiculos', 'mantenimientos.vehiculo_id', '=', 'vehiculos.id')
            .select('vehiculos.marca', 'vehiculos.modelo')
            .count('mantenimientos.id as total_mantenciones')
            .groupBy('vehiculos.modelo', 'vehiculos.marca') // Agrupamos por ambos para precisión
            .orderBy('total_mantenciones', 'desc')
            .limit(5);
        res.json(stats);
    } catch (error) {
        console.error("Error stats modelos:", error);
        res.status(500).json({ error: 'Error al obtener estadísticas modelos' });
    }
});

module.exports = router;
