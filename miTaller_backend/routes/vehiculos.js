const express = require('express');
const router = express.Router();
const { db } = require('../database.js');

// Middleware Anti-Caché (Para asegurar datos frescos)
const noCache = (req, res, next) => {
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    next();
};

// [C]REATE: Crear vehículo
router.post('/', async (req, res) => {
    const { patente, marca, modelo, anio, cliente_id } = req.body;

    if (!patente || !marca || !modelo || !cliente_id) {
        return res.status(400).json({ error: 'Faltan datos obligatorios.' });
    }

    try {
        const existe = await db('vehiculos').where({ patente: patente }).first();
        if (existe) {
            return res.status(400).json({ error: 'La patente ya está registrada.' });
        }

        const [id] = await db('vehiculos').insert({
            patente: patente.toUpperCase(),
            marca,
            modelo,
            anio: anio ? parseInt(anio) : null,
            cliente_id
        });

        res.status(201).json({ id, message: 'Vehículo creado con éxito' });
    } catch (error) {
        console.error("Error SQL:", error);
        res.status(500).json({ error: 'Error interno al guardar el vehículo' });
    }
});

// [R]EAD: Obtener mantenimientos de un vehículo (Historial)
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

// [R]EAD: BUSCADOR POR PATENTE (LÓGICA DE BÚSQUEDA COMPLETA)
router.get('/buscar/:patente', noCache, async (req, res) => {
    const patente = req.params.patente.toUpperCase();
    
    try {
        // 1. Buscar el Vehículo unido con los datos del Cliente
        const vehiculo = await db('vehiculos')
            .join('clientes', 'vehiculos.cliente_id', '=', 'clientes.id')
            .where({ 'vehiculos.patente': patente })
            .select(
                'vehiculos.*', 
                'clientes.nombre as cliente_nombre', 
                'clientes.email as cliente_email',
                'clientes.telefono as cliente_telefono',
                'clientes.id as cliente_id_real'
            )
            .first();

        if (!vehiculo) {
            return res.status(404).json({ error: 'Patente no encontrada' });
        }

        // 2. Buscar el Historial de Mantenimientos de ese vehículo
        const historial = await db('mantenimientos')
            .where({ vehiculo_id: vehiculo.id })
            .orderBy('fecha', 'desc');

        // 3. Enviar respuesta combinada
        res.json({
            datos: vehiculo,
            historial: historial
        });

    } catch (error) {
        console.error("Error en buscador:", error);
        res.status(500).json({ error: 'Error interno al buscar vehículo' });
    }
});

// [U]PDATE: Editar vehículo
router.put('/:id', async (req, res) => {
    const { patente, marca, modelo, anio } = req.body;
    try {
        await db('vehiculos').where({ id: req.params.id }).update({ patente, marca, modelo, anio });
        res.json({ message: 'Vehículo actualizado' });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar' });
    }
});

// [D]ELETE: Eliminar vehículo
router.delete('/:id', async (req, res) => {
    try {
        await db('vehiculos').where({ id: req.params.id }).del();
        res.json({ message: 'Vehículo eliminado' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar' });
    }
});

module.exports = router;
