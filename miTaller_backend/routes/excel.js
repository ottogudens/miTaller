const express = require('express');
const router = express.Router();
const { db } = require('../database.js');
const ExcelJS = require('exceljs');
const multer = require('multer');
const fs = require('fs');
const bcrypt = require('bcrypt');

const upload = multer({ dest: 'temp/' });

// ==========================================
// 1. CLIENTES (Lógica existente)
// ==========================================
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
        // Ejemplo
        sheet.addRow({ nombre: 'Juan Perez', email: 'juan@ejemplo.com', password: '123', telefono: '912345678', role: 'cliente' });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="plantilla_clientes.xlsx"');
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) { res.status(500).json({ error: 'Error excel' }); }
});

router.post('/restore/clientes', upload.single('excelFile'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file' });
    const tempPath = req.file.path;
    const workbook = new ExcelJS.Workbook();
    let count = 0;
    try {
        await workbook.xlsx.readFile(tempPath);
        const sheet = workbook.getWorksheet(1);
        const rows = [];
        sheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) { // Saltar cabecera
                rows.push({
                    nombre: row.getCell(1).value,
                    email: row.getCell(2).value,
                    pass: row.getCell(3).value,
                    tel: row.getCell(4).value,
                    role: row.getCell(5).value
                });
            }
        });

        for (const r of rows) {
            if (r.email && r.nombre) {
                const pass = r.pass ? r.pass.toString() : '123456';
                const hash = await bcrypt.hash(pass, 10);
                // Upsert (Insertar o actualizar si existe el email)
                await db('clientes').insert({
                    nombre: r.nombre, email: r.email, password: hash, telefono: r.tel, role: r.role || 'cliente'
                }).onConflict('email').merge();
                count++;
            }
        }
        
        fs.unlinkSync(tempPath);
        res.json({ message: `Procesados ${count} clientes.` });
    } catch (error) {
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
        console.error(error);
        res.status(500).json({ error: 'Error procesando clientes' });
    }
});

// ==========================================
// 2. VEHÍCULOS (MARCAS Y MODELOS) - NUEVO
// ==========================================

// Descargar Plantilla Marcas/Modelos
router.get('/download/vehiculos', async (req, res) => {
    try {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Marcas_Modelos');
        
        sheet.columns = [
            { header: 'Marca', key: 'marca', width: 25 },
            { header: 'Modelo', key: 'modelo', width: 25 }
        ];
        
        // Datos de ejemplo
        sheet.addRow({ marca: 'Toyota', modelo: 'Yaris' });
        sheet.addRow({ marca: 'Toyota', modelo: 'Hilux' });
        sheet.addRow({ marca: 'Chevrolet', modelo: 'Sail' });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="plantilla_marcas_modelos.xlsx"');
        
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) { res.status(500).json({ error: 'Error generando plantilla' }); }
});

// Subir y Procesar Marcas/Modelos
router.post('/restore/vehiculos', upload.single('excelFile'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file' });

    const tempPath = req.file.path;
    const workbook = new ExcelJS.Workbook();
    let countMarcas = 0;
    let countModelos = 0;

    try {
        await workbook.xlsx.readFile(tempPath);
        const sheet = workbook.getWorksheet(1);
        
        // Cache local para no consultar la DB en cada fila
        const marcasCache = {}; 
        
        // 1. Cargar marcas existentes en memoria
        const marcasExistentes = await db('marcas').select('*');
        marcasExistentes.forEach(m => marcasCache[m.nombre.toUpperCase()] = m.id);

        const rowsToProcess = [];
        sheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) {
                const marca = row.getCell(1).value ? row.getCell(1).value.toString().trim() : null;
                const modelo = row.getCell(2).value ? row.getCell(2).value.toString().trim() : null;
                if (marca && modelo) {
                    rowsToProcess.push({ marca, modelo });
                }
            }
        });

        // 2. Procesar filas
        for (const row of rowsToProcess) {
            const marcaUpper = row.marca.toUpperCase();
            let marcaId = marcasCache[marcaUpper];

            // Si la marca no existe, la creamos
            if (!marcaId) {
                const [newId] = await db('marcas').insert({ nombre: row.marca }).returning('id');
                // SQLite devuelve un objeto {id: X} o solo el número dependiendo de la versión
                marcaId = typeof newId === 'object' ? newId.id : newId;
                marcasCache[marcaUpper] = marcaId;
                countMarcas++;
            }

            // Insertar modelo (verificamos duplicado simple)
            const modeloExiste = await db('modelos').where({ nombre: row.modelo, marca_id: marcaId }).first();
            if (!modeloExiste) {
                await db('modelos').insert({ nombre: row.modelo, marca_id: marcaId });
                countModelos++;
            }
        }

        fs.unlinkSync(tempPath);
        res.json({ message: `Carga completa: ${countMarcas} marcas nuevas y ${countModelos} modelos nuevos.` });

    } catch (error) {
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
        console.error(error);
        res.status(500).json({ error: 'Error procesando vehículos' });
    }
});

module.exports = router;
