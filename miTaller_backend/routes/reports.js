const express = require('express');
const router = express.Router();
const { db } = require('../database.js');
const PDFDocument = require('pdfkit-table');

router.get('/cliente/:id', async (req, res) => {
    const clienteId = req.params.id;

    try {
        // 1. Obtener Datos del Cliente
        const cliente = await db('clientes').where({ id: clienteId }).first();
        if (!cliente) return res.status(404).send('Cliente no encontrado');

        // 2. Obtener Vehículos
        const vehiculos = await db('vehiculos').where({ cliente_id: clienteId });
        
        // 3. Obtener Historial Completo (Join para saber qué auto fue)
        // Buscamos mantenimientos donde el vehiculo_id pertenezca a este cliente
        const vehiculoIds = vehiculos.map(v => v.id);
        let mantenimientos = [];
        
        if (vehiculoIds.length > 0) {
            mantenimientos = await db('mantenimientos')
                .whereIn('vehiculo_id', vehiculoIds)
                .join('vehiculos', 'mantenimientos.vehiculo_id', 'vehiculos.id')
                .select(
                    'mantenimientos.fecha',
                    'mantenimientos.kilometraje',
                    'mantenimientos.trabajos_realizados',
                    'vehiculos.patente',
                    'vehiculos.modelo'
                )
                .orderBy('mantenimientos.fecha', 'desc');
        }

        // 4. Iniciar PDF
        const doc = new PDFDocument({ margin: 30, size: 'A4' });

        // Headers para forzar descarga
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Ficha_${cliente.nombre.replace(/\s+/g, '_')}.pdf`);

        doc.pipe(res);

        // --- TÍTULO ---
        doc.fontSize(20).text('GUDEX - Ficha Técnica de Cliente', { align: 'center' });
        doc.moveDown();

        // --- DATOS CLIENTE ---
        doc.fontSize(14).text('Datos Personales', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10);
        doc.text(`Nombre: ${cliente.nombre}`);
        doc.text(`Email: ${cliente.email}`);
        doc.text(`Teléfono: ${cliente.telefono || 'No registrado'}`);
        doc.moveDown(2);

        // --- TABLA VEHÍCULOS ---
        doc.fontSize(14).text('Vehículos Registrados', { underline: true });
        doc.moveDown(0.5);

        if (vehiculos.length > 0) {
            const tableVehiculos = {
                headers: ['Patente', 'Marca', 'Modelo', 'Año'],
                rows: vehiculos.map(v => [v.patente, v.marca, v.modelo, v.anio])
            };
            await doc.table(tableVehiculos, { 
                width: 500,
                prepareHeader: () => doc.font('Helvetica-Bold').fontSize(10),
                prepareRow: () => doc.font('Helvetica').fontSize(10)
            });
        } else {
            doc.fontSize(10).text('No hay vehículos registrados.');
        }
        doc.moveDown(2);

        // --- TABLA HISTORIAL ---
        doc.fontSize(14).text('Historial de Servicios', { underline: true });
        doc.moveDown(0.5);

        if (mantenimientos.length > 0) {
            const tableHistorial = {
                headers: ['Fecha', 'Vehículo', 'Trabajo Realizado', 'KM'],
                rows: mantenimientos.map(m => [
                    m.fecha,
                    `${m.modelo} (${m.patente})`,
                    m.trabajos_realizados,
                    m.kilometraje
                ])
            };
            await doc.table(tableHistorial, { 
                width: 500,
                prepareHeader: () => doc.font('Helvetica-Bold').fontSize(10),
                prepareRow: () => doc.font('Helvetica').fontSize(10)
            });
        } else {
            doc.fontSize(10).text('No hay registros de mantenimiento.');
        }

        doc.end();

    } catch (error) {
        console.error(error);
        res.status(500).send('Error generando PDF');
    }
});

module.exports = router;
