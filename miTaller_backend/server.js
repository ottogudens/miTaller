const express = require('express');
const { inicializarBaseDeDatos } = require('./database.js');
const cors = require('cors');

// --- Importar Middlewares ---
const { protegerRuta, soloAdmin } = require('./middleware/auth.js');

// --- Importar Rutas ---
const authRoutes = require('./routes/auth.js');
const clienteRoutes = require('./routes/clientes.js');
const vehiculoRoutes = require('./routes/vehiculos.js');
const citaRoutes = require('./routes/citas.js');
const mantenimientoRoutes = require('./routes/mantenimientos.js');
const vehiculosDataRoutes = require('./routes/vehiculos-data.js'); // Marcas y Modelos
const statsRoutes = require('./routes/stats.js'); // Estadísticas
const backupRoutes = require('./routes/backup.js');
const excelRoutes = require('./routes/excel.js');

const app = express();
const PORT = 3000;

// --- Configuración Global ---
app.use(express.json());
app.use(cors({
    exposedHeaders: ['Content-Disposition'] // Para permitir descargas de archivos
}));

// --- Middleware Anti-Caché (CRÍTICO para evitar errores de carga) ---
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Expires', '-1');
    res.set('Pragma', 'no-cache');
    next();
});

// --- Inicialización ---
async function iniciarServidor() {
    try {
        await inicializarBaseDeDatos();

        // --- Rutas Públicas ---
        app.use('/api/auth', authRoutes);
        app.get('/', (req, res) => res.send('Servidor GUDEX Operativo v2.0'));

        // --- Rutas Protegidas ---
        app.use('/api/clientes', protegerRuta, clienteRoutes);
        app.use('/api/vehiculos', protegerRuta, vehiculoRoutes);
        app.use('/api/citas', protegerRuta, citaRoutes);
        app.use('/api/mantenimientos', protegerRuta, mantenimientoRoutes);
        app.use('/api/vehiculos-data', protegerRuta, vehiculosDataRoutes);

        // --- Rutas de Administrador ---
        app.use('/api/stats', protegerRuta, soloAdmin, statsRoutes);
        app.use('/api/backup', protegerRuta, soloAdmin, backupRoutes);
        app.use('/api/excel', protegerRuta, soloAdmin, excelRoutes);

        app.listen(PORT, () => {
            console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Error fatal al iniciar el servidor:', error);
    }
}

iniciarServidor();
