const express = require('express');
const router = express.Router();
const { db } = require('../database.js');

// Middleware Anti-Caché
const noCache = (req, res, next) => {
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    next();
};

/**
 * [C]REATE: Crear un nuevo vehículo
 * Ruta: POST /api/vehiculos
 */
router.post('/', async (req, res) => {
    const { patente, marca, modelo, anio, cliente_id } = req.body;

    // 1. Validación de Campos Obligatorios
    if (!patente || !marca || !modelo || !cliente_id) {
        console.log("Error 400: Faltan datos.", req.body); // Ver en consola del servidor
        return res.status(400).json({ error: 'Faltan datos obligatorios (Patente, Marca, Modelo o Cliente).' });
    }

    try {
        // 2. Verificar si la patente ya existe
        const existe = await db('vehiculos').where({ patente: patente }).first();
        if (existe) {
            return res.status(400).json({ error: 'La patente ya está registrada en el sistema.' });
        }

        // 3. Insertar
        const [id] = await db('vehiculos').insert({
            patente: patente.toUpperCase(), // Forzar mayúsculas
            marca,
            modelo,
            anio: anio ? parseInt(anio) : null, // Asegurar que sea número
            cliente_id
        });

        res.status(201).json({ id, message: 'Vehículo creado con éxito' });

    } catch (error) {
        console.error("Error SQL al crear vehículo:", error);
        res.status(500).json({ error: 'Error interno al guardar el vehículo' });
    }
});

/**
 * [R]EAD: Obtener mantenimientos de un vehículo (Para el historial)
 * Ruta: GET /api/vehiculos/:id/mantenimientos
 */
router.get('/:id/mantenimientos', noCache, async (req, res) => {
    try {
        const historial = await db('mantenimientos')
            .where({ vehiculo_id: req.params.id })
            .orderBy('fecha', 'desc');
        
        res.json(historial);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener historial' });
    }
});

// Editar vehículo
router.put('/:id', async (req, res) => {
    const { patente, marca, modelo, anio } = req.body;
    try {
        await db('vehiculos').where({ id: req.params.id }).update({ 
            patente, marca, modelo, anio 
        });
        res.json({ message: 'Vehículo actualizado' });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar vehículo' });
    }
});

// Eliminar vehículo
router.delete('/:id', async (req, res) => {
    try {
        await db('vehiculos').where({ id: req.params.id }).del();
        res.json({ message: 'Vehículo eliminado' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar vehículo' });
    }
});

module.exports = router;
