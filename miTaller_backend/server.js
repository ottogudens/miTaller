const express = require('express');
const cors = require('cors');
const { inicializarBaseDeDatos } = require('./database.js');
const { protegerRuta, soloAdmin } = require('./middleware/auth.js');

// --- SWAGGER ---
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger.js');

// --- IMPORTAR RUTAS ---
const authRoutes = require('./routes/auth.js');
const clienteRoutes = require('./routes/clientes.js');
const vehiculoRoutes = require('./routes/vehiculos.js');
const citaRoutes = require('./routes/citas.js');
const mantenimientoRoutes = require('./routes/mantenimientos.js');
const vehiculosDataRoutes = require('./routes/vehiculos-data.js');
const statsRoutes = require('./routes/stats.js');
const backupRoutes = require('./routes/backup.js');
const excelRoutes = require('./routes/excel.js');
const reportsRoutes = require('./routes/reports.js');
const productosRoutes = require('./routes/productos.js');
const proveedoresRoutes = require('./routes/proveedores.js');
const categoriasRoutes = require('./routes/categorias.js');

const app = express();
const PORT = process.env.PORT || 3000;

// --- MIDDLEWARES ---
app.use(express.json());
app.use(cors({ exposedHeaders: ['Content-Disposition'] }));

// Anti-Caché Global
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Expires', '-1');
    res.set('Pragma', 'no-cache');
    next();
});

// --- DOCUMENTACIÓN ---
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// --- INICIO ---
async function iniciarServidor() {
    try {
        await inicializarBaseDeDatos();

        // Rutas Públicas
        app.use('/api/auth', authRoutes);
        app.get('/', (req, res) => res.send('Servidor GUDEX Operativo. Docs en /api-docs'));

        // Rutas Admin
        app.use('/api/stats', protegerRuta, soloAdmin, statsRoutes);
        app.use('/api/backup', protegerRuta, soloAdmin, backupRoutes);
        app.use('/api/excel', protegerRuta, soloAdmin, excelRoutes);
        app.use('/api/productos', protegerRuta, soloAdmin, productosRoutes);
        app.use('/api/proveedores', protegerRuta, soloAdmin, proveedoresRoutes);
        app.use('/api/categorias', protegerRuta, soloAdmin, categoriasRoutes);

        // Rutas Operativas (Admin y Cliente)
        // Reportes se protege con token, pero el archivo reports.js valida si eres dueño o admin
        app.use('/api/reports', protegerRuta, reportsRoutes); 
        app.use('/api/clientes', protegerRuta, clienteRoutes);
        app.use('/api/vehiculos', protegerRuta, vehiculoRoutes);
        app.use('/api/citas', protegerRuta, citaRoutes);
        app.use('/api/mantenimientos', protegerRuta, mantenimientoRoutes);
        app.use('/api/vehiculos-data', protegerRuta, vehiculosDataRoutes);

        app.listen(PORT, () => {
            console.log(`🚀 Servidor iniciado en http://localhost:${PORT}`);
            console.log(`📚 Documentación disponible en http://localhost:${PORT}/api-docs`);
        });

    } catch (error) {
        console.error('Error fatal iniciando servidor:', error);
    }
}

iniciarServidor();