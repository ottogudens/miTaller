const express = require('express');
const router = express.Router();
const { db } = require('../database.js');

/**
 * [R]EAD: Obtener TODAS las marcas
 * Ruta: GET /api/marcas
 */
router.get('/', async (req, res) => {
    try {
        const marcas = await db('marcas').orderBy('nombre', 'asc');
        res.status(200).json(marcas);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener las marcas', detalle: error.message });
    }
});

/**
 * [R]EAD: Obtener todos los modelos de UNA marca
 * Ruta: GET /api/marcas/1/modelos
 */
router.get('/:id/modelos', async (req, res) => {
    const { id } = req.params;
    try {
        const modelos = await db('modelos').where({ marca_id: id }).orderBy('nombre', 'asc');
        res.status(200).json(modelos);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener los modelos', detalle: error.message });
    }
});

/**
 * [C]REATE: Añadir una nueva marca
 * Ruta: POST /api/marcas
 */
router.post('/', async (req, res) => {
    const { nombre } = req.body;
    if (!nombre) {
        return res.status(400).json({ error: 'El nombre es obligatorio.' });
    }
    try {
        const [id] = await db('marcas').insert({ nombre: nombre }).returning('id');
        res.status(201).json({ id: id.id, nombre: nombre });
    } catch (error) {
        if (error.message.includes('UNIQUE')) {
            return res.status(409).json({ error: 'Esa marca ya existe.' });
        }
        res.status(500).json({ error: 'Error al crear la marca', detalle: error.message });
    }
});

/**
 * [C]REATE: Añadir un nuevo modelo a una marca
 * Ruta: POST /api/marcas/modelos (Cambiado de :id/modelos para simplicidad)
 */
router.post('/modelos', async (req, res) => {
    const { nombre, marca_id } = req.body;
    if (!nombre || !marca_id) {
        return res.status(400).json({ error: 'El nombre y marca_id son obligatorios.' });
    }
    try {
        const [id] = await db('modelos').insert({ nombre: nombre, marca_id: marca_id }).returning('id');
        res.status(201).json({ id: id.id, nombre: nombre, marca_id: marca_id });
    } catch (error) {
        res.status(500).json({ error: 'Error al crear el modelo', detalle: error.message });
    }
});

/**
 * [D]ELETE: Borrar una marca
 * Ruta: DELETE /api/marcas/1
 */
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Borrar una marca también borrará sus modelos (por 'onDelete: CASCADE' en DB)
        const count = await db('marcas').where({ id: id }).del();
        if (count > 0) {
            res.status(200).json({ mensaje: 'Marca eliminada con éxito' });
        } else {
            res.status(404).json({ error: 'Marca no encontrada' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar la marca', detalle: error.message });
    }
});

/**
 * [D]ELETE: Borrar un modelo
 * Ruta: DELETE /api/marcas/modelos/1
 */
router.delete('/modelos/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const count = await db('modelos').where({ id: id }).del();
        if (count > 0) {
            res.status(200).json({ mensaje: 'Modelo eliminado con éxito' });
        } else {
            res.status(404).json({ error: 'Modelo no encontrado' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar el modelo', detalle: error.message });
    }
});

module.exports = router;
