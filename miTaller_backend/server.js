const express = require('express');
const cors = require('cors');
const { inicializarBaseDeDatos } = require('./database.js');
const { protegerRuta, soloAdmin } = require('./middleware/auth.js');

// --- IMPORTAR RUTAS ---
const authRoutes = require('./routes/auth.js');
const clienteRoutes = require('./routes/clientes.js');
const vehiculoRoutes = require('./routes/vehiculos.js');
const citaRoutes = require('./routes/citas.js');
const mantenimientoRoutes = require('./routes/mantenimientos.js');
const vehiculosDataRoutes = require('./routes/vehiculos-data.js'); // Marcas/Modelos
const statsRoutes = require('./routes/stats.js');
const backupRoutes = require('./routes/backup.js');
const excelRoutes = require('./routes/excel.js');
const reportsRoutes = require('./routes/reports.js');
const productosRoutes = require('./routes/productos.js');    // Inventario
const proveedoresRoutes = require('./routes/proveedores.js'); // Proveedores
const categoriasRoutes = require('./routes/categorias.js');   // Categorías Productos

const app = express();
const PORT = 3000;

// --- MIDDLEWARES GLOBALES ---
app.use(express.json());
app.use(cors({ exposedHeaders: ['Content-Disposition'] }));

// Anti-Caché Global (Previene error 304)
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Expires', '-1');
    res.set('Pragma', 'no-cache');
    next();
});

// --- INICIO ---
async function iniciarServidor() {
    try {
        // 1. Crear/Verificar Tablas
        await inicializarBaseDeDatos();

        // 2. Rutas Públicas
        app.use('/api/auth', authRoutes);
        app.get('/', (req, res) => res.send('Servidor GUDEX v5.0 (Full ERP) Operativo'));

        // 3. Rutas Admin (Configuración y Gestión)
        app.use('/api/stats', protegerRuta, soloAdmin, statsRoutes);
        app.use('/api/backup', protegerRuta, soloAdmin, backupRoutes);
        app.use('/api/excel', protegerRuta, soloAdmin, excelRoutes);
        app.use('/api/reports', protegerRuta, soloAdmin, reportsRoutes);
        app.use('/api/productos', protegerRuta, soloAdmin, productosRoutes);
        app.use('/api/proveedores', protegerRuta, soloAdmin, proveedoresRoutes);
        app.use('/api/categorias', protegerRuta, soloAdmin, categoriasRoutes);

        // 4. Rutas Operativas (Admin y Cliente)
        app.use('/api/clientes', protegerRuta, clienteRoutes);
        app.use('/api/vehiculos', protegerRuta, vehiculoRoutes);
        app.use('/api/citas', protegerRuta, citaRoutes);
        app.use('/api/mantenimientos', protegerRuta, mantenimientoRoutes);
        app.use('/api/vehiculos-data', protegerRuta, vehiculosDataRoutes);

        app.listen(PORT, () => {
            console.log(`🚀 Servidor iniciado en http://localhost:${PORT}`);
        });

    } catch (error) {
        console.error('Error fatal iniciando servidor:', error);
    }
}

iniciarServidor();
