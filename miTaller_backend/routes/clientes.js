const express = require('express');
const router = express.Router();
const { db } = require('../database.js');

const noCache = (req, res, next) => {
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');
  next();
};

/**
 * @swagger
 * tags:
 * - name: Clientes
 * description: Gestión de la cartera de clientes
 */

/**
 * @swagger
 * /clientes:
 * get:
 * summary: Obtener lista de todos los clientes
 * tags: [Clientes]
 * responses:
 * 200:
 * description: Lista de clientes recuperada exitosamente
 */
router.get('/', noCache, async (req, res) => {
  try {
    const clientes = await db('clientes').select('id', 'nombre', 'email', 'telefono', 'role');
    res.json(clientes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener clientes' });
  }
});

/**
 * @swagger
 * /clientes/{id}:
 * get:
 * summary: Obtener detalles de un cliente específico
 * tags: [Clientes]
 * parameters:
 * - in: path
 * name: id
 * schema:
 * type: integer
 * required: true
 * description: ID del cliente
 * responses:
 * 200:
 * description: Datos del cliente recuperados
 */
router.get('/:id', noCache, async (req, res) => {
  try {
    const cliente = await db('clientes').where({ id: req.params.id }).first();
    if (cliente) {
      const { password, ...datosCliente } = cliente;
      res.json(datosCliente);
    } else {
      res.status(404).json({ error: 'Cliente no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener cliente' });
  }
});

/**
 * @swagger
 * /clientes/{id}/vehiculos:
 * get:
 * summary: Obtener los vehículos de un cliente
 * tags: [Clientes]
 * parameters:
 * - in: path
 * name: id
 * schema:
 * type: integer
 * required: true
 * description: ID del cliente
 * responses:
 * 200:
 * description: Lista de vehículos del cliente
 */
router.get('/:id/vehiculos', noCache, async (req, res) => {
  try {
    const vehiculos = await db('vehiculos').where({ cliente_id: req.params.id });
    res.json(vehiculos);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener vehículos' });
  }
});

/**
 * @swagger
 * /clientes/{id}/citas:
 * get:
 * summary: Obtener historial de citas de un cliente
 * tags: [Clientes]
 * parameters:
 * - in: path
 * name: id
 * schema:
 * type: integer
 * required: true
 * description: ID del cliente
 * responses:
 * 200:
 * description: Historial de citas recuperado
 */
router.get('/:id/citas', noCache, async (req, res) => {
  try {
    const citas = await db('citas')
      .where({ 'citas.cliente_id': req.params.id })
      .join('vehiculos', 'citas.vehiculo_id', '=', 'vehiculos.id')
      .select(
        'citas.id as cita_id',
        'citas.fecha_cita',
        'citas.servicio_solicitado',
        'citas.estado',
        'vehiculos.patente as vehiculo_patente',
        'vehiculos.marca',
        'vehiculos.modelo'
      )
      .orderBy('citas.fecha_cita', 'desc');
    res.json(citas);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener las citas del cliente' });
  }
});

/**
 * @swagger
 * /clientes/{id}:
 * put:
 * summary: Actualizar datos de un cliente
 * tags: [Clientes]
 * parameters:
 * - in: path
 * name: id
 * schema:
 * type: integer
 * required: true
 * description: ID del cliente
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * nombre:
 * type: string
 * email:
 * type: string
 * telefono:
 * type: string
 * role:
 * type: string
 * responses:
 * 200:
 * description: Cliente actualizado correctamente
 */
router.put('/:id', async (req, res) => {
  const { nombre, email, telefono, role } = req.body;
  if (!nombre || !email) {
    return res.status(400).json({ error: 'Nombre y Email son obligatorios' });
  }
  try {
    await db('clientes').where({ id: req.params.id }).update({ nombre, email, telefono, role });
    res.json({ message: 'Cliente actualizado con éxito' });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar (posible email duplicado)' });
  }
});

/**
 * @swagger
 * /clientes/{id}:
 * delete:
 * summary: Eliminar un cliente
 * tags: [Clientes]
 * parameters:
 * - in: path
 * name: id
 * schema:
 * type: integer
 * required: true
 * description: ID del cliente a eliminar
 * responses:
 * 200:
 * description: Cliente eliminado con éxito
 */
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