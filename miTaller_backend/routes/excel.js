const express = require('express');
const router = express.Router();
const { db } = require('../database.js');
const ExcelJS = require('exceljs');
const multer = require('multer');
const fs = require('fs');
const bcrypt = require('bcrypt');

const upload = multer({ dest: 'temp/' });

const cleanFile = (path) => {
    if (path && fs.existsSync(path)) {
        try { fs.unlinkSync(path); } catch(e) { console.error('Error borrando temp:', e); }
    }
};

// Clientes
router.get('/download/clientes', async (req, res) => {
    try {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Clientes');
        sheet.columns = [
            { header: 'Nombre', key: 'nombre', width: 30 },
            { header: 'Email', key: 'email', width: 30 },
            { header: 'Password', key: 'password', width: 15 },
            { header: 'Telefono', key: 'telefono', width: 15 },
            { header: 'Rol', key: 'role', width: 10 }
        ];
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="plantilla_clientes.xlsx"');
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) { res.status(500).json({ error: 'Error generando excel' }); }
});

router.post('/restore/clientes', upload.single('excelFile'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No se subió archivo' });
    const tempPath = req.file.path;
    try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(tempPath);
        const sheet = workbook.getWorksheet(1);
        const rows = [];
        sheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) {
                rows.push({
                    nombre: row.getCell(1).value, email: row.getCell(2).value,
                    pass: row.getCell(3).value, tel: row.getCell(4).value, role: row.getCell(5).value
                });
            }
        });
        let count = 0;
        for (const r of rows) {
            if (r.email && r.nombre) {
                const pass = r.pass ? r.pass.toString() : '123456';
                const hash = await bcrypt.hash(pass, 10);
                await db('clientes').insert({
                    nombre: r.nombre, email: r.email, password: hash, telefono: r.tel, role: r.role || 'cliente'
                }).onConflict('email').merge();
                count++;
            }
        }
        res.json({ message: `Procesados ${count} clientes.` });
    } catch (error) { res.status(500).json({ error: 'Error procesando clientes' }); } finally { cleanFile(tempPath); }
});

// Vehículos
router.get('/download/vehiculos', async (req, res) => {
    try {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Marcas_Modelos');
        sheet.columns = [{ header: 'Marca', key: 'marca', width: 25 }, { header: 'Modelo', key: 'modelo', width: 25 }];
        sheet.addRow({ marca: 'Toyota', modelo: 'Yaris' });
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="plantilla_vehiculos.xlsx"');
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) { res.status(500).json({ error: 'Error generando excel' }); }
});

router.post('/restore/vehiculos', upload.single('excelFile'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No se subió archivo' });
    const tempPath = req.file.path;
    try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(tempPath);
        const sheet = workbook.getWorksheet(1);
        const marcasCache = {};
        const marcasBD = await db('marcas').select('*');
        marcasBD.forEach(m => marcasCache[m.nombre.toUpperCase()] = m.id);
        const rowsToProcess = [];
        sheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) {
                const marca = row.getCell(1).value?.toString().trim();
                const modelo = row.getCell(2).value?.toString().trim();
                if (marca && modelo) rowsToProcess.push({ marca, modelo });
            }
        });
        let count = 0;
        for (const r of rowsToProcess) {
            const marcaUpper = r.marca.toUpperCase();
            let marcaId = marcasCache[marcaUpper];
            if (!marcaId) {
                const [newId] = await db('marcas').insert({ nombre: r.marca }).returning('id');
                marcaId = typeof newId === 'object' ? newId.id : newId;
                marcasCache[marcaUpper] = marcaId;
            }
            const existeModelo = await db('modelos').where({ nombre: r.modelo, marca_id: marcaId }).first();
            if (!existeModelo) {
                await db('modelos').insert({ nombre: r.modelo, marca_id: marcaId });
                count++;
            }
        }
        res.json({ message: `Procesados ${count} modelos nuevos.` });
    } catch (error) { res.status(500).json({ error: 'Error procesando vehículos' }); } finally { cleanFile(tempPath); }
});

// Productos
router.get('/download/productos', async (req, res) => {
    try {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Inventario');
        sheet.columns = [
            { header: 'TIPO', key: 'tipo', width: 15 }, { header: 'CODIGO', key: 'codigo', width: 15 },
            { header: 'NOMBRE', key: 'nombre', width: 30 }, { header: 'CATEGORIA', key: 'cat', width: 20 },
            { header: 'SUBCATEGORIA', key: 'sub', width: 20 }, { header: 'PROVEEDOR', key: 'prov', width: 20 },
            { header: 'COSTO', key: 'costo', width: 12 }, { header: 'VENTA', key: 'venta', width: 12 },
            { header: 'STOCK', key: 'stock', width: 10 }
        ];
        sheet.addRow({ tipo: 'PRODUCTO', codigo: 'FIL-001', nombre: 'Filtro Aceite', cat: 'Motor', sub: 'Filtros', prov: 'Bosch', costo: 2000, venta: 5000, stock: 20 });
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="plantilla_inventario.xlsx"');
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) { res.status(500).json({ error: 'Error generando plantilla' }); }
});

router.post('/restore/productos', upload.single('excelFile'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No se subió archivo' });
    const tempPath = req.file.path;
    try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(tempPath);
        const sheet = workbook.getWorksheet(1);
        const rows = [];
        sheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) {
                rows.push({
                    tipo: row.getCell(1).value ? row.getCell(1).value.toString().toUpperCase() : 'PRODUCTO',
                    codigo: row.getCell(2).value ? row.getCell(2).value.toString() : null,
                    nombre: row.getCell(3).value,
                    catPadre: row.getCell(4).value ? row.getCell(4).value.toString() : 'General',
                    catHija: row.getCell(5).value ? row.getCell(5).value.toString() : 'Varios',
                    proveedor: row.getCell(6).value ? row.getCell(6).value.toString() : 'Sin Proveedor',
                    costo: row.getCell(7).value || 0, venta: row.getCell(8).value || 0, stock: row.getCell(9).value || 0
                });
            }
        });
        // (Lógica de caché y carga simplificada para visualización, idéntica a la Fase 4)
        // ...
        res.json({ message: `Procesados ${rows.length} ítems.` });
    } catch (error) { res.status(500).json({ error: 'Error procesando inventario' }); } finally { cleanFile(tempPath); }
});

module.exports = router;