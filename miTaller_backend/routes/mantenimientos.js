const express = require('express');
const router = express.Router();
const { db } = require('../database.js');

const noCache = (req, res, next) => {
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    next();
};

router.post('/', async (req, res) => {
    const { fecha, kilometraje, trabajos_realizados, repuestos_usados, proxima_sugerencia, proximo_km_sugerido, vehiculo_id, items } = req.body;
    try {
        await db.transaction(async (trx) => {
            let totalServicio = 0;
            if (items && items.length > 0) {
                items.forEach(i => { totalServicio += (i.precio * i.cantidad); });
            }
            const [mantenimientoId] = await trx('mantenimientos').insert({
                fecha, kilometraje, trabajos_realizados, repuestos_usados,
                proxima_sugerencia, proximo_km_sugerido, vehiculo_id,
                total_servicio: totalServicio
            });
            if (items && items.length > 0) {
                const mId = typeof mantenimientoId === 'object' ? mantenimientoId.id : mantenimientoId;
                for (const item of items) {
                    await trx('mantenimiento_items').insert({
                        mantenimiento_id: mId, producto_id: item.id, cantidad: item.cantidad,
                        precio_unitario: item.precio, subtotal: item.precio * item.cantidad
                    });
                    if (item.categoria !== 'Servicio') {
                        await trx('productos').where({ id: item.id }).decrement('stock', item.cantidad);
                    }
                }
            }
        });
        res.status(201).json({ message: 'Mantenimiento registrado' });
    } catch (error) { console.error(error); res.status(500).json({ error: 'Error al registrar mantenimiento' }); }
});

router.get('/buscar/global', noCache, async (req, res) => {
    let query = req.query.q || '';
    const fechaRegex = /^(\d{2})-(\d{2})-(\d{4})$/; 
    const match = query.match(fechaRegex);
    let tb = query; if (match) { const [_, d, m, a] = match; tb = `${a}-${m}-${d}`; }
    try {
        let q = db('mantenimientos')
            .join('vehiculos', 'mantenimientos.vehiculo_id', 'vehiculos.id')
            .join('clientes', 'vehiculos.cliente_id', 'clientes.id')
            .select('mantenimientos.*', 'vehiculos.patente', 'vehiculos.marca', 'vehiculos.modelo', 'clientes.nombre as cliente_nombre')
            .orderBy('mantenimientos.fecha', 'desc');
        if (tb) q.where(function() { this.where('vehiculos.patente', 'like', `%${tb}%`).orWhere('clientes.nombre', 'like', `%${tb}%`).orWhere('mantenimientos.fecha', 'like', `%${tb}%`); });
        else q.limit(5);
        const r = await q; res.json(r);
    } catch (e) { res.status(500).json({ error: 'Error' }); }
});

router.get('/:id', noCache, async (req, res) => { try { const m = await db('mantenimientos').where({id: req.params.id}).first(); res.json(m); } catch (e) { res.status(500).json({error:'Error'}); } });
router.put('/:id', async (req, res) => { try { await db('mantenimientos').where({id: req.params.id}).update(req.body); res.json({msg:'Ok'}); } catch (e) { res.status(500).json({error:'Error'}); } });
router.delete('/:id', async (req, res) => { try { await db('mantenimientos').where({id: req.params.id}).del(); res.json({msg:'Ok'}); } catch (e) { res.status(500).json({error:'Error'}); } });

module.exports = router;