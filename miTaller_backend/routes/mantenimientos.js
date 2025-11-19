const express = require('express');
const router = express.Router();
const { db } = require('../database.js');

router.post('/', async (req, res) => {
    const { fecha, kilometraje, trabajos_realizados, repuestos_usados, proxima_sugerencia, proximo_km_sugerido, vehiculo_id } = req.body;
    await db('mantenimientos').insert({ fecha, kilometraje, trabajos_realizados, repuestos_usados, proxima_sugerencia, proximo_km_sugerido, vehiculo_id });
    res.json({ message: 'Mantenimiento creado' });
});

router.get('/:id', async (req, res) => {
    const m = await db('mantenimientos').where({id: req.params.id}).first();
    res.json(m);
});

router.put('/:id', async (req, res) => {
    await db('mantenimientos').where({id: req.params.id}).update(req.body);
    res.json({msg: 'ok'});
});
router.delete('/:id', async (req, res) => {
    await db('mantenimientos').where({id: req.params.id}).del();
    res.json({msg: 'ok'});
});

module.exports = router;
