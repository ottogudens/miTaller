const express = require('express');
const router = express.Router();
const { db } = require('../database.js');
const PDFDocument = require('pdfkit-table');
const path = require('path');
const fs = require('fs');

router.get('/cliente/:id', async (req, res) => {
    const clienteId = req.params.id;

    try {
        // 1. Obtener Datos
        const cliente = await db('clientes').where({ id: clienteId }).first();
        if (!cliente) return res.status(404).send('Cliente no encontrado');

        const vehiculos = await db('vehiculos').where({ cliente_id: clienteId });
        
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

        // 2. Configurar PDF
        const doc = new PDFDocument({ margin: 40, size: 'A4' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Ficha_${cliente.nombre.replace(/\s+/g, '_')}.pdf`);

        doc.pipe(res);

        // --- LOGO Y ENCABEZADO ---
        // Ruta a la imagen en la carpeta raíz del backend
        const logoPath = path.join(__dirname, '../logorojo.png');

        // Verificar si existe el logo antes de intentar ponerlo para evitar errores
        if (fs.existsSync(logoPath)) {
            // (ruta, x, y, opciones)
            doc.image(logoPath, 40, 30, { width: 80 }); 
        }

        // Título alineado
        doc.fontSize(20).font('Helvetica-Bold').text('GUDEX - Ficha Técnica', { align: 'center' });
        doc.fontSize(10).font('Helvetica').text('Reporte de Cliente y Servicios', { align: 'center' });
        doc.moveDown(3); // Espacio después del encabezado

        // --- DATOS CLIENTE ---
        doc.fontSize(14).font('Helvetica-Bold').text('Datos Personales', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica');
        doc.text(`Nombre: ${cliente.nombre}`);
        doc.text(`Email: ${cliente.email}`);
        doc.text(`Teléfono: ${cliente.telefono || 'No registrado'}`);
        doc.moveDown(2);

        // --- TABLA VEHÍCULOS ---
        doc.fontSize(14).font('Helvetica-Bold').text('Vehículos Registrados', { underline: true });
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
            doc.fontSize(10).font('Helvetica').text('No tiene vehículos registrados.');
        }
        doc.moveDown(2);

        // --- TABLA HISTORIAL ---
        doc.fontSize(14).font('Helvetica-Bold').text('Historial de Servicios', { underline: true });
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
            doc.fontSize(10).font('Helvetica').text('No hay registros de mantenimiento.');
        }

        // Pie de página
        doc.moveDown(2);
        doc.fontSize(8).fillColor('grey').text('Generado automáticamente por Sistema GUDEX', { align: 'center' });

        doc.end();

    } catch (error) {
        console.error('Error PDF:', error);
        res.status(500).send('Error generando PDF');
    }
});

module.exports = router;
