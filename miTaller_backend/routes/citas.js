const express = require('express');
const router = express.Router();
const { db } = require('../database.js');

router.post('/', async (req, res) => {
    const { fecha_cita, servicio_solicitado, cliente_id, vehiculo_id } = req.body;
    // Validación simple de duplicados
    const existe = await db('citas').where({ fecha_cita }).whereIn('estado', ['Pendiente', 'Confirmada']).first();
    if (existe) return res.status(409).json({ error: 'Horario ocupado' });
    
    await db('citas').insert({ fecha_cita, servicio_solicitado, cliente_id, vehiculo_id });
    res.status(201).json({ message: 'Cita creada' });
});

router.get('/', async (req, res) => {
    const citas = await db('citas')
        .join('clientes', 'citas.cliente_id', 'clientes.id')
        .join('vehiculos', 'citas.vehiculo_id', 'vehiculos.id')
        .select('citas.id as cita_id', 'citas.*', 'clientes.nombre as cliente_nombre', 'vehiculos.patente as vehiculo_patente')
        .orderBy('fecha_cita', 'asc');
    res.json(citas);
});

router.put('/:id', async (req, res) => {
    const { estado } = req.body;
    await db('citas').where({ id: req.params.id }).update({ estado });
    res.json({ message: 'Estado actualizado' });
});
module.exports = router;
