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
// ... (código anterior: create, get historial, update, delete) ...

/**
 * [R]EAD: BUSCADOR POR PATENTE (NUEVA FUNCIONALIDAD)
 * Busca el vehículo, trae los datos del dueño y todo su historial de mantenciones.
 */
router.get('/buscar/:patente', noCache, async (req, res) => {
    const patente = req.params.patente.toUpperCase(); // Convertir a mayúsculas
    
    try {
        // 1. Buscar Vehículo y Dueño (JOIN)
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
            return res.status(404).json({ error: 'Patente no encontrada en el sistema.' });
        }

        // 2. Buscar Historial de ese vehículo
        const historial = await db('mantenimientos')
            .where({ vehiculo_id: vehiculo.id })
            .orderBy('fecha', 'desc');

        // 3. Responder con todo el paquete de datos
        res.json({
            datos: vehiculo,
            historial: historial
        });

    } catch (error) {
        console.error("Error en buscador:", error);
        res.status(500).json({ error: 'Error interno al buscar vehículo' });
    }
});

module.exports = router;
