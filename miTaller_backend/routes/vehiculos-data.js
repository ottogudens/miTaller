const express = require('express');
const router = express.Router();
const { db } = require('../database.js');

const noCache = (req, res, next) => { res.header('Cache-Control', 'private, no-cache'); next(); };

router.get('/marcas', noCache, async (req, res) => {
    try {
        const marcas = await db('marcas').select('id', 'nombre').orderBy('nombre', 'asc');
        res.json(marcas);
    } catch (error) { res.status(500).json({ error: 'Error marcas' }); }
});

router.post('/marcas', async (req, res) => {
    const { nombre } = req.body;
    if (!nombre) return res.status(400).json({ error: 'Nombre requerido' });
    try {
        await db('marcas').insert({ nombre });
        res.status(201).json({ message: 'Marca creada' });
    } catch (error) { res.status(500).json({ error: 'Error crear marca' }); }
});

router.delete('/marcas/:id', async (req, res) => {
    try {
        await db('marcas').where({ id: req.params.id }).del();
        res.json({ message: 'Marca eliminada' });
    } catch (error) { res.status(500).json({ error: 'Error eliminar marca' }); }
});

router.get('/modelos/:marcaNombre', noCache, async (req, res) => {
    try {
        const modelos = await db('modelos')
            .join('marcas', 'modelos.marca_id', '=', 'marcas.id')
            .where('marcas.nombre', req.params.marcaNombre)
            .select('modelos.nombre')
            .orderBy('modelos.nombre', 'asc');
        res.json(modelos.map(m => m.nombre));
    } catch (error) { res.status(500).json({ error: 'Error modelos' }); }
});

router.get('/modelos-by-id/:marcaId', noCache, async (req, res) => {
    try {
        const modelos = await db('modelos').where({ marca_id: req.params.marcaId }).select('id', 'nombre').orderBy('nombre', 'asc');
        res.json(modelos);
    } catch (error) { res.status(500).json({ error: 'Error modelos ID' }); }
});

router.post('/modelos', async (req, res) => {
    const { nombre, marca_id } = req.body;
    if (!nombre || !marca_id) return res.status(400).json({ error: 'Faltan datos' });
    try {
        await db('modelos').insert({ nombre, marca_id });
        res.status(201).json({ message: 'Modelo creado' });
    } catch (error) { res.status(500).json({ error: 'Error crear modelo' }); }
});

router.delete('/modelos/:id', async (req, res) => {
    try {
        await db('modelos').where({ id: req.params.id }).del();
        res.json({ message: 'Modelo eliminado' });
    } catch (error) { res.status(500).json({ error: 'Error eliminar modelo' }); }
});

module.exports = router;