const express = require('express');
const router = express.Router();
const { db } = require('../database.js');

router.get('/marcas-top', async (req, res) => {
    try {
        const stats = await db('mantenimientos')
            .join('vehiculos', 'mantenimientos.vehiculo_id', 'vehiculos.id')
            .select('vehiculos.marca')
            .count('mantenimientos.id as total_mantenciones')
            .groupBy('vehiculos.marca')
            .orderBy('total_mantenciones', 'desc')
            .limit(5);
        res.json(stats);
    } catch (e) { res.status(500).json({ error: 'Error stats' }); }
});
module.exports = router;
