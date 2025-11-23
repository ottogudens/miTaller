const express = require('express');
const router = express.Router();
const { db } = require('../database.js');

const noCache = (req, res, next) => { res.header('Cache-Control', 'private, no-cache'); next(); };

/**
 * @swagger
 * tags:
 * - name: Productos
 * description: Gestión de inventario y servicios
 */

/**
 * @swagger
 * /productos:
 * get:
 * summary: Obtener lista de productos
 * tags: [Productos]
 * parameters:
 * - in: query
 * name: tipo
 * schema:
 * type: string
 * enum: [PRODUCTO, SERVICIO]
 * description: Filtrar por tipo (opcional)
 * responses:
 * 200:
 * description: Lista de productos recuperada
 */
router.get('/', noCache, async (req, res) => {
    const tipo = req.query.tipo; 
    try {
        let query = db('productos')
            .leftJoin('proveedores', 'productos.proveedor_id', 'proveedores.id')
            .leftJoin('categorias as catP', 'productos.categoria_padre_id', 'catP.id')
            .leftJoin('categorias as catH', 'productos.categoria_hija_id', 'catH.id')
            .select('productos.*', 'proveedores.nombre as proveedor_nombre', 'catP.nombre as categoria_padre_nombre', 'catH.nombre as categoria_hija_nombre')
            .orderBy('productos.nombre');
        if (tipo) query = query.where('productos.tipo', tipo);
        const resultados = await query;
        res.json(resultados);
    } catch (error) { res.status(500).json({ error: 'Error al obtener el inventario.' }); }
});

/**
 * @swagger
 * /productos:
 * post:
 * summary: Crear un nuevo producto o servicio
 * tags: [Productos]
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - nombre
 * properties:
 * nombre:
 * type: string
 * tipo:
 * type: string
 * costo:
 * type: integer
 * precio_venta:
 * type: integer
 * stock:
 * type: integer
 * responses:
 * 201:
 * description: Creado exitosamente
 */
router.post('/', async (req, res) => {
    try {
        const tipo = req.body.tipo || 'PRODUCTO';
        const nombre = req.body.nombre ? req.body.nombre.trim() : null;
        const costo = req.body.costo ? parseInt(req.body.costo) : 0;
        const precio_venta = req.body.precio_venta ? parseInt(req.body.precio_venta) : 0;
        const stock = req.body.stock ? parseInt(req.body.stock) : 0;
        if (!nombre) return res.status(400).json({ error: 'El nombre del producto es obligatorio.' });
        if (costo < 0 || precio_venta < 0 || stock < 0) return res.status(400).json({ error: 'No se permiten valores negativos.' });
        const datos = {
            tipo, codigo: req.body.codigo || null, barcode: req.body.barcode || null, nombre,
            categoria_padre_id: req.body.categoria_padre_id ? parseInt(req.body.categoria_padre_id) : null,
            categoria_hija_id: req.body.categoria_hija_id ? parseInt(req.body.categoria_hija_id) : null,
            proveedor_id: req.body.proveedor_id ? parseInt(req.body.proveedor_id) : null,
            costo, precio_venta, stock,
            categoria: req.body.categoria_padre_id ? 'Categorizado' : 'General' 
        };
        await db('productos').insert(datos);
        res.status(201).json({ message: 'Producto guardado correctamente' });
    } catch (error) { console.error("ERROR SQL PRODUCTOS:", error); res.status(500).json({ error: 'Error interno al guardar.' }); }
});

router.delete('/:id', async (req, res) => {
    try { await db('productos').where({ id: req.params.id }).del(); res.json({ message: 'Producto eliminado correctamente' }); } 
    catch (error) { res.status(500).json({ error: 'Error al eliminar el producto.' }); }
});

router.get('/barcode/:code', noCache, async (req, res) => {
    const code = req.params.code;
    try {
        const producto = await db('productos').where('barcode', code).orWhere('codigo', code).first();
        if (producto) res.json({ encontrado: true, data: producto });
        else res.json({ encontrado: false });
    } catch (error) { res.status(500).json({ error: 'Error al buscar código.' }); }
});

router.put('/:id/stock', async (req, res) => {
    const nuevoStock = parseInt(req.body.nuevo_stock);
    if (isNaN(nuevoStock) || nuevoStock < 0) return res.status(400).json({ error: 'Stock inválido.' });
    try { await db('productos').where({ id: req.params.id }).update({ stock: nuevoStock }); res.json({ message: 'Stock actualizado.' }); } 
    catch (error) { res.status(500).json({ error: 'Error al actualizar stock.' }); }
});

module.exports = router;