const express = require('express');
const router = express.Router();
const { db } = require('../database.js');
const PDFDocument = require('pdfkit-table');
const path = require('path');
const fs = require('fs');

router.get('/cliente/:id', async (req, res) => {
    const clienteId = req.params.id;
    const usuarioSolicitante = req.user;

    if (usuarioSolicitante.role !== 'admin' && parseInt(usuarioSolicitante.id) !== parseInt(clienteId)) {
        return res.status(403).send('Acceso Denegado.');
    }

    try {
        const cliente = await db('clientes').where({ id: clienteId }).first();
        if (!cliente) return res.status(404).send('Cliente no encontrado');
        const vehiculos = await db('vehiculos').where({ cliente_id: clienteId });
        const vehiculoIds = vehiculos.map(v => v.id);
        let mantenimientos = [];
        if (vehiculoIds.length > 0) {
            mantenimientos = await db('mantenimientos')
                .whereIn('vehiculo_id', vehiculoIds)
                .join('vehiculos', 'mantenimientos.vehiculo_id', 'vehiculos.id')
                .select('mantenimientos.*', 'vehiculos.patente', 'vehiculos.modelo', 'vehiculos.marca')
                .orderBy('mantenimientos.fecha', 'desc');
        }

        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        res.setHeader('Content-Type', 'application/pdf');
        const nombreArchivo = `Ficha_GUDEX_${cliente.nombre.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
        res.setHeader('Content-Disposition', `attachment; filename=${nombreArchivo}`);
        doc.pipe(res);

        const logoPath = path.join(__dirname, '../logorojo.png');
        if (fs.existsSync(logoPath)) doc.image(logoPath, 50, 45, { width: 100 });

        doc.font('Helvetica-Bold').fontSize(18).text('GUDEX', 400, 50, { align: 'right' });
        doc.font('Helvetica').fontSize(10).text('Lubricentro y Serviteca', 400, 70, { align: 'right' });
        doc.text(`Fecha: ${new Date().toLocaleDateString('es-CL')}`, 400, 100, { align: 'right' });
        doc.moveDown(4);

        doc.rect(50, 140, 495, 25).fill('#f4f4f4').stroke();
        doc.fillColor('#CC0000').fontSize(12).font('Helvetica-Bold').text('INFORMACIÓN DEL CLIENTE', 60, 147);
        doc.fillColor('#000').fontSize(10).font('Helvetica');
        doc.text(`Nombre: ${cliente.nombre}`, 60, 175);
        doc.text(`Email: ${cliente.email}`, 60, 190);
        doc.moveDown(3);

        doc.font('Helvetica-Bold').fontSize(12).fillColor('#CC0000').text('HISTORIAL DE SERVICIOS', 50, doc.y);
        doc.moveDown(0.5);

        if (mantenimientos.length > 0) {
            const tableHistorial = {
                headers: ['Fecha', 'Vehículo', 'Trabajo Realizado', 'KM'],
                rows: mantenimientos.map(m => [
                    new Date(m.fecha).toLocaleDateString('es-CL'),
                    `${m.patente} (${m.marca})`,
                    m.trabajos_realizados,
                    m.kilometraje
                ])
            };
            await doc.table(tableHistorial, { width: 495 });
        } else {
            doc.font('Helvetica-Oblique').fontSize(10).fillColor('#666').text('No existen registros.');
        }
        doc.end();
    } catch (error) { console.error(error); if (!res.headersSent) res.status(500).send('Error generando PDF'); }
});

module.exports = router;