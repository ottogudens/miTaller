const express = require('express');
const { inicializarBaseDeDatos } = require('./database.js');
const cors = require('cors');

// Middlewares
const { protegerRuta, soloAdmin } = require('./middleware/auth.js');

// Rutas
const authRoutes = require('./routes/auth.js');
const clienteRoutes = require('./routes/clientes.js');
const vehiculoRoutes = require('./routes/vehiculos.js');
const citaRoutes = require('./routes/citas.js');
const mantenimientoRoutes = require('./routes/mantenimientos.js');
const vehiculosDataRoutes = require('./routes/vehiculos-data.js');
const statsRoutes = require('./routes/stats.js');
const backupRoutes = require('./routes/backup.js');
const excelRoutes = require('./routes/excel.js');
const reportsRoutes = require('./routes/reports.js'); // <-- NUEVO

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors({ exposedHeaders: ['Content-Disposition'] }));

// Anti-Caché Global
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Expires', '-1');
    res.set('Pragma', 'no-cache');
    next();
});

async function iniciarServidor() {
    try {
        await inicializarBaseDeDatos();

        // Públicas
        app.use('/api/auth', authRoutes);
        app.get('/', (req, res) => res.send('Servidor GUDEX Operativo v2.5'));

        // Admin (Sistemas y Reportes)
        app.use('/api/stats', protegerRuta, soloAdmin, statsRoutes);
        app.use('/api/backup', protegerRuta, soloAdmin, backupRoutes);
        app.use('/api/excel', protegerRuta, soloAdmin, excelRoutes);
        app.use('/api/reports', protegerRuta, soloAdmin, reportsRoutes); // <-- NUEVA RUTA

        // Protegidas
        app.use('/api/clientes', protegerRuta, clienteRoutes);
        app.use('/api/vehiculos', protegerRuta, vehiculoRoutes);
        app.use('/api/citas', protegerRuta, citaRoutes);
        app.use('/api/mantenimientos', protegerRuta, mantenimientoRoutes);
        app.use('/api/vehiculos-data', protegerRuta, vehiculosDataRoutes);

        app.listen(PORT, () => {
            console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Error fatal:', error);
    }
}

iniciarServidor();
