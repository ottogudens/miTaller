const express = require('express');
const router = express.Router();
const { db } = require('../database.js');

const noCache = (req, res, next) => { res.header('Cache-Control', 'private, no-cache'); next(); };

router.post('/', async (req, res) => {
    // Extraemos y limpiamos los datos para evitar errores de tipo
    const datos = {
        tipo: req.body.tipo || 'PRODUCTO',
        codigo: req.body.codigo || null,
        barcode: req.body.barcode || null,
        nombre: req.body.nombre,
        // Convertir vacíos a null
        categoria_padre_id: req.body.categoria_padre_id ? parseInt(req.body.categoria_padre_id) : null,
        categoria_hija_id: req.body.categoria_hija_id ? parseInt(req.body.categoria_hija_id) : null,
        proveedor_id: req.body.proveedor_id ? parseInt(req.body.proveedor_id) : null,
        // Convertir vacíos a 0
        costo: req.body.costo ? parseInt(req.body.costo) : 0,
        precio_venta: req.body.precio_venta ? parseInt(req.body.precio_venta) : 0,
        stock: req.body.stock ? parseInt(req.body.stock) : 0
    };

    console.log("Intentando guardar producto:", datos); // LOG PARA DEBUG

    try {
        await db('productos').insert(datos);
        res.status(201).json({ message: 'Guardado exitoso' });
    } catch (error) { 
        console.error("ERROR SQL PRODUCTOS:", error); // ESTO TE DIRÁ EL ERROR EXACTO
        res.status(500).json({ error: 'Error al guardar en base de datos' }); 
    }
});

// ... (Resto de las rutas GET y DELETE se mantienen igual) ...
router.get('/', noCache, async (req, res) => {
    const tipo = req.query.tipo; 
    try {
        let query = db('productos')
            .leftJoin('proveedores', 'productos.proveedor_id', 'proveedores.id')
            .leftJoin('categorias as catP', 'productos.categoria_padre_id', 'catP.id')
            .leftJoin('categorias as catH', 'productos.categoria_hija_id', 'catH.id')
            .select(
                'productos.*',
                'proveedores.nombre as proveedor_nombre',
                'catP.nombre as categoria_padre_nombre',
                'catH.nombre as categoria_hija_nombre'
            )
            .orderBy('productos.nombre');

        if (tipo) query = query.where('productos.tipo', tipo);
        const resultados = await query;
        res.json(resultados);
    } catch (error) { res.status(500).json({ error: 'Error al obtener' }); }
});

router.delete('/:id', async (req, res) => {
    try { await db('productos').where({ id: req.params.id }).del(); res.json({ message: 'Eliminado' }); } 
    catch (error) { res.status(500).json({ error: 'Error al eliminar' }); }
});

// Ruta barcode
router.get('/barcode/:code', noCache, async (req, res) => {
    const code = req.params.code;
    try {
        const producto = await db('productos').where('barcode', code).orWhere('codigo', code).first();
        if (producto) res.json({ encontrado: true, data: producto });
        else res.json({ encontrado: false });
    } catch (error) { res.status(500).json({ error: 'Error' }); }
});

// Ruta stock
router.put('/:id/stock', async (req, res) => {
    try { await db('productos').where({ id: req.params.id }).update({ stock: req.body.nuevo_stock }); res.json({ message: 'Ok' }); }
    catch (error) { res.status(500).json({ error: 'Error' }); }
});

module.exports = router;
