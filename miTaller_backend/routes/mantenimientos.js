const express = require('express');
const router = express.Router();
const { db } = require('../database.js');

// Middleware Anti-Caché
const noCache = (req, res, next) => {
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    next();
};

// ============================================================
// 1. RUTAS ESPECÍFICAS (Buscador)
// ============================================================

router.get('/buscar/global', noCache, async (req, res) => {
    let query = req.query.q || '';
    
    try {
        // --- LÓGICA DE CONVERSIÓN DE FECHA (DD-MM-YYYY -> YYYY-MM-DD) ---
        const fechaRegex = /^(\d{2})-(\d{2})-(\d{4})$/; // Detecta 20-11-2024
        const match = query.match(fechaRegex);
        
        let terminoBusqueda = query;

        if (match) {
            // Si es fecha chilena, la invertimos para la BD
            const [_, dia, mes, anio] = match;
            terminoBusqueda = `${anio}-${mes}-${dia}`;
        }
        // ---------------------------------------------------------------

        let baseQuery = db('mantenimientos')
            .join('vehiculos', 'mantenimientos.vehiculo_id', 'vehiculos.id')
            .join('clientes', 'vehiculos.cliente_id', 'clientes.id')
            .select(
                'mantenimientos.*',
                'vehiculos.patente',
                'vehiculos.marca',
                'vehiculos.modelo',
                'clientes.nombre as cliente_nombre'
            )
            .orderBy('mantenimientos.fecha', 'desc');

        if (terminoBusqueda) {
            baseQuery = baseQuery.where(function() {
                this.where('vehiculos.patente', 'like', `%${terminoBusqueda}%`)
                    .orWhere('clientes.nombre', 'like', `%${terminoBusqueda}%`)
                    .orWhere('mantenimientos.fecha', 'like', `%${terminoBusqueda}%`);
            });
        } else {
            baseQuery = baseQuery.limit(50);
        }

        const resultados = await baseQuery;
        res.json(resultados);

    } catch (error) {
        console.error("Error búsqueda global:", error);
        res.status(500).json({ error: 'Error al buscar mantenimientos' });
    }
});


// ============================================================
// 2. RUTAS CRUD ESTÁNDAR
// ============================================================

// [C]REATE
router.post('/', async (req, res) => {
    const { fecha, kilometraje, trabajos_realizados, repuestos_usados, proxima_sugerencia, proximo_km_sugerido, vehiculo_id } = req.body;
    try {
        const [id] = await db('mantenimientos').insert({
            fecha, kilometraje, trabajos_realizados, repuestos_usados, proxima_sugerencia, proximo_km_sugerido, vehiculo_id
        });
        res.status(201).json({ id, message: 'Mantenimiento registrado' });
    } catch (error) {
        res.status(500).json({ error: 'Error al registrar mantenimiento' });
    }
});

// [R]EAD: Por ID (IMPORTANTE: Debe ir DESPUÉS de /buscar/global)
router.get('/:id', noCache, async (req, res) => {
    try {
        const m = await db('mantenimientos').where({id: req.params.id}).first();
        if (m) res.json(m);
        else res.status(404).json({ error: 'No encontrado' });
    } catch (e) { res.status(500).json({ error: 'Error al obtener' }); }
});

// [U]PDATE
router.put('/:id', async (req, res) => {
    const { fecha, kilometraje, trabajos_realizados, repuestos_usados, proxima_sugerencia, proximo_km_sugerido } = req.body;
    try {
        await db('mantenimientos').where({ id: req.params.id }).update({
            fecha, kilometraje, trabajos_realizados, repuestos_usados, proxima_sugerencia, proximo_km_sugerido
        });
        res.json({ message: 'Mantenimiento actualizado' });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar' });
    }
});

// [D]ELETE
router.delete('/:id', async (req, res) => {
    try {
        await db('mantenimientos').where({ id: req.params.id }).del();
        res.json({ message: 'Eliminado' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar' });
    }
});

module.exports = router;
