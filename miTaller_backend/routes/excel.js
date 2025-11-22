const express = require('express');
const router = express.Router();
const { db } = require('../database.js');
const ExcelJS = require('exceljs');
const multer = require('multer');
const fs = require('fs');
const bcrypt = require('bcrypt');

const upload = multer({ dest: 'temp/' });

// ==========================================
// 1. CLIENTES
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
            if (rowNumber > 1) {
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
        res.status(500).json({ error: 'Error procesando clientes' });
    }
});

// ==========================================
// 2. VEHÍCULOS
// ==========================================
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
    } catch (error) { res.status(500).json({ error: 'Error' }); }
});

router.post('/restore/vehiculos', upload.single('excelFile'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file' });
    const tempPath = req.file.path;
    const workbook = new ExcelJS.Workbook();
    let count = 0;
    try {
        await workbook.xlsx.readFile(tempPath);
        const sheet = workbook.getWorksheet(1);
        // Cache de marcas para eficiencia
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
        fs.unlinkSync(tempPath);
        res.json({ message: `Procesados ${count} modelos nuevos.` });
    } catch (error) {
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
        res.status(500).json({ error: 'Error procesando vehículos' });
    }
});

// ==========================================
// 3. INVENTARIO (PRODUCTOS, SERVICIOS, CATEGORÍAS) - ¡NUEVO!
// ==========================================
router.get('/download/productos', async (req, res) => {
    try {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Inventario');
        
        // Definir columnas explicativas
        sheet.columns = [
            { header: 'TIPO (PRODUCTO/SERVICIO)', key: 'tipo', width: 15 },
            { header: 'CODIGO', key: 'codigo', width: 15 },
            { header: 'NOMBRE', key: 'nombre', width: 30 },
            { header: 'CATEGORIA (Padre)', key: 'cat', width: 20 },
            { header: 'SUBCATEGORIA (Hija)', key: 'sub', width: 20 },
            { header: 'PROVEEDOR', key: 'prov', width: 20 },
            { header: 'COSTO', key: 'costo', width: 12 },
            { header: 'PRECIO VENTA', key: 'venta', width: 12 },
            { header: 'STOCK', key: 'stock', width: 10 }
        ];

        // Filas de ejemplo para guiar al usuario
        sheet.addRow({ tipo: 'PRODUCTO', codigo: 'FIL-001', nombre: 'Filtro Aceite', cat: 'Motor', sub: 'Filtros', prov: 'Bosch', costo: 2000, venta: 5000, stock: 20 });
        sheet.addRow({ tipo: 'SERVICIO', codigo: 'MO-001', nombre: 'Cambio Aceite', cat: 'Servicios', sub: 'Mantenimiento', prov: '', costo: 0, venta: 15000, stock: 0 });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="plantilla_inventario_completa.xlsx"');
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) { res.status(500).json({ error: 'Error generando plantilla' }); }
});

router.post('/restore/productos', upload.single('excelFile'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file' });
    const tempPath = req.file.path;
    const workbook = new ExcelJS.Workbook();
    let count = 0;
    
    try {
        await workbook.xlsx.readFile(tempPath);
        const sheet = workbook.getWorksheet(1);
        const rows = [];

        // 1. Leer Excel
        sheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) {
                rows.push({
                    tipo: row.getCell(1).value ? row.getCell(1).value.toString().toUpperCase() : 'PRODUCTO',
                    codigo: row.getCell(2).value ? row.getCell(2).value.toString() : null,
                    nombre: row.getCell(3).value,
                    catPadre: row.getCell(4).value ? row.getCell(4).value.toString() : 'General',
                    catHija: row.getCell(5).value ? row.getCell(5).value.toString() : 'Varios',
                    proveedor: row.getCell(6).value ? row.getCell(6).value.toString() : 'Sin Proveedor',
                    costo: row.getCell(7).value || 0,
                    venta: row.getCell(8).value || 0,
                    stock: row.getCell(9).value || 0
                });
            }
        });

        // 2. Procesar lógica relacional
        // Usamos cachés para no saturar la BD con consultas repetidas
        const cachePadres = {};
        const cacheHijas = {}; // Clave: "PadreID-NombreHija"
        const cacheProveedores = {};

        // Pre-cargar datos existentes
        const padresDB = await db('categorias').where({ es_padre: true });
        padresDB.forEach(p => cachePadres[p.nombre.toUpperCase()] = p.id);

        const proveedoresDB = await db('proveedores').select('*');
        proveedoresDB.forEach(p => cacheProveedores[p.nombre.toUpperCase()] = p.id);

        for (const r of rows) {
            if (!r.nombre) continue;

            // A. Gestionar Proveedor
            let provId = null;
            if (r.proveedor && r.tipo === 'PRODUCTO') {
                const provKey = r.proveedor.toUpperCase();
                if (cacheProveedores[provKey]) {
                    provId = cacheProveedores[provKey];
                } else {
                    const [newId] = await db('proveedores').insert({ nombre: r.proveedor }).returning('id');
                    provId = typeof newId === 'object' ? newId.id : newId;
                    cacheProveedores[provKey] = provId;
                }
            }

            // B. Gestionar Categoría PADRE
            const padreKey = r.catPadre.toUpperCase();
            let padreId = cachePadres[padreKey];
            if (!padreId) {
                const [newPId] = await db('categorias').insert({ nombre: r.catPadre, es_padre: true }).returning('id');
                padreId = typeof newPId === 'object' ? newPId.id : newPId;
                cachePadres[padreKey] = padreId;
            }

            // C. Gestionar Categoría HIJA
            // Necesitamos buscar si existe ESTA hija dentro de ESTE padre
            const hijaKey = `${padreId}-${r.catHija.toUpperCase()}`;
            let hijaId = cacheHijas[hijaKey];
            
            if (!hijaId) {
                // Buscar en BD por si ya existe pero no estaba en caché inicial
                const existeHija = await db('categorias').where({ nombre: r.catHija, padre_id: padreId }).first();
                if (existeHija) {
                    hijaId = existeHija.id;
                } else {
                    const [newHId] = await db('categorias').insert({ nombre: r.catHija, padre_id: padreId, es_padre: false }).returning('id');
                    hijaId = typeof newHId === 'object' ? newHId.id : newHId;
                }
                cacheHijas[hijaKey] = hijaId;
            }

            // D. Insertar/Actualizar Producto
            const productoData = {
                tipo: r.tipo,
                nombre: r.nombre,
                codigo: r.codigo,
                categoria_padre_id: padreId,
                categoria_hija_id: hijaId,
                proveedor_id: provId,
                costo: r.costo,
                precio_venta: r.venta,
                stock: r.stock,
                // Campos legacy de texto para compatibilidad visual rápida
                categoria: r.catPadre, 
                subcategoria: r.catHija
            };

            if (r.codigo) {
                // Si tiene código, intentamos actualizar (Upsert)
                const existeProd = await db('productos').where({ codigo: r.codigo }).first();
                if (existeProd) {
                    await db('productos').where({ id: existeProd.id }).update(productoData);
                } else {
                    await db('productos').insert(productoData);
                }
            } else {
                // Si no tiene código, insertamos siempre
                await db('productos').insert(productoData);
            }
            count++;
        }

        fs.unlinkSync(tempPath);
        res.json({ message: `Procesados ${count} ítems correctamente.` });

    } catch (error) {
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
        console.error(error);
        res.status(500).json({ error: 'Error procesando inventario' });
    }
});

module.exports = router;
