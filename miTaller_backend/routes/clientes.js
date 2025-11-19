const express = require('express');
const router = express.Router();
const { db } = require('../database.js');

// Middleware para evitar caché
const noCache = (req, res, next) => {
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');
    next();
};

// 1. Obtener TODOS los clientes (Lista)
router.get('/', noCache, async (req, res) => {
    try {
        const clientes = await db('clientes').select('id', 'nombre', 'email', 'telefono', 'role');
        res.json(clientes);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener clientes' });
    }
});

// 2. Obtener UN cliente (ESTA ES LA RUTA QUE TE FALTA)
router.get('/:id', noCache, async (req, res) => {
    try {
        const cliente = await db('clientes').where({ id: req.params.id }).first();
        
        if (cliente) {
            // Quitamos el password antes de enviarlo
            const { password, ...datosCliente } = cliente;
            res.json(datosCliente);
        } else {
            res.status(404).json({ error: 'Cliente no encontrado' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener cliente' });
    }
});

// 3. Obtener vehículos de un cliente
router.get('/:id/vehiculos', noCache, async (req, res) => {
    try {
        const vehiculos = await db('vehiculos').where({ cliente_id: req.params.id });
        res.json(vehiculos);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener vehículos' });
    }
});

// 4. Obtener citas de un cliente
router.get('/:id/citas', noCache, async (req, res) => {
    try {
        const citas = await db('citas')
            .where({ 'citas.cliente_id': req.params.id })
            .join('vehiculos', 'citas.vehiculo_id', '=', 'vehiculos.id')
            .select(
                'citas.id',
                'citas.fecha_cita',
                'citas.servicio_solicitado',
                'citas.estado',
                'vehiculos.patente as vehiculo_patente'
            )
            .orderBy('citas.fecha_cita', 'desc');
        
        res.json(citas);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener las citas del cliente', detalle: error.message });
    }
});

// 5. Actualizar cliente
router.put('/:id', async (req, res) => {
    const { nombre, email, telefono, role } = req.body;
    try {
        await db('clientes')
            .where({ id: req.params.id })
            .update({ nombre, email, telefono, role });
        res.json({ message: 'Cliente actualizado con éxito' });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar el cliente' });
    }
});

// 6. Eliminar cliente
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const count = await db('clientes').where({ id: id }).del();
        if (count > 0) {
            res.status(200).json({ message: 'Cliente eliminado con éxito' });
        } else {
            res.status(404).json({ error: 'Cliente no encontrado' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar el cliente' });
    }
});

module.exports = router;
