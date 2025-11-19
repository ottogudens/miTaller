const express = require('express');
const router = express.Router();
const { db } = require('../database.js');
const ExcelJS = require('exceljs'); // Biblioteca para Excel
const multer = require('multer'); // Para subir archivos
const fs = require('fs');     // Para manejar el sistema de archivos
const bcrypt = require('bcrypt'); // Para hashear passwords al subir

const upload = multer({ dest: 'temp/' }); // Directorio temporal

/**
 * [R]EAD: Descargar un respaldo de Clientes en Excel
 * Ruta: GET /api/excel/download/clientes
 */
router.get('/download/clientes', async (req, res) => {
    try {
        // 1. Obtener todos los clientes (¡sin el password!)
        const clientes = await db('clientes').select('id', 'nombre', 'email', 'telefono', 'role');

        // 2. Crear el libro de Excel en memoria
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Clientes');

        // 3. Definir las columnas
        worksheet.columns = [
            { header: 'id', key: 'id', width: 10 },
            { header: 'nombre', key: 'nombre', width: 30 },
            { header: 'email', key: 'email', width: 30 },
            { header: 'telefono', key: 'telefono', width: 15 },
            { header: 'role', key: 'role', width: 10 }
        ];

        // 4. Añadir los datos
        worksheet.addRows(clientes);

        // 5. Generar un nombre de archivo
        const timestamp = new Date().toISOString().slice(0, 10);
        const fileName = `gudex_clientes_backup_${timestamp}.xlsx`;

        // 6. Configurar la respuesta para forzar la descarga
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="${fileName}"`
        );

        // 7. Escribir el archivo en la respuesta y enviarlo
        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error("Error al generar Excel:", error);
        res.status(500).json({ error: "No se pudo generar el archivo Excel." });
    }
});

/**
 * [C]REATE: Subir y Restaurar Clientes desde Excel
 * Ruta: POST /api/excel/restore/clientes
 */
router.post('/restore/clientes', upload.single('excelFile'), async (req, res) => {
    
    if (!req.file) {
        return res.status(400).json({ error: 'No se subió ningún archivo.' });
    }

    const tempPath = req.file.path;
    const workbook = new ExcelJS.Workbook();
    let clientesParaUpsert = [];
    let errores = [];
    let contador = 0;

    try {
        await workbook.xlsx.readFile(tempPath);
        const worksheet = workbook.getWorksheet(1); // Tomamos la primera hoja

        // 1. Iteramos sobre cada fila (asumimos que la fila 1 es el header)
        worksheet.eachRow({ includeEmpty: false }, async (row, rowNumber) => {
            if (rowNumber > 1) { // Saltamos el header
                contador++;
                const rowData = {
                    nombre: row.getCell('nombre').value,
                    email: row.getCell('email').value,
                    password: row.getCell('password').value, // ¡DEBE VENIR EN TEXTO PLANO!
                    telefono: row.getCell('telefono').value,
                    role: row.getCell('role').value || 'cliente' // Default a 'cliente'
                };

                // 2. Validación de datos
                if (!rowData.email || !rowData.password || !rowData.nombre) {
                    errores.push(`Fila ${rowNumber}: Faltan 'nombre', 'email' o 'password'.`);
                    return; // Saltamos esta fila
                }

                // 3. Hashear la contraseña
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(rowData.password.toString(), salt);

                clientesParaUpsert.push({
                    nombre: rowData.nombre,
                    email: rowData.email.toLowerCase(),
                    password: hashedPassword,
                    telefono: rowData.telefono ? rowData.telefono.toString() : null,
                    role: rowData.role
                });
            }
        });

        // 4. Esperamos a que la iteración termine (aunque eachRow no es async-await)
        // Damos un pequeño delay para asegurar que el array se llene (solución simple)
        await new Promise(resolve => setTimeout(resolve, 500)); 

        if (clientesParaUpsert.length > 0) {
            // 5. Hacemos el "UPSERT" (Update or Insert)
            // Si el email ya existe, actualiza los datos. Si no, lo inserta.
            const resultado = await db('clientes')
                .insert(clientesParaUpsert)
                .onConflict('email') // Requiere que 'email' sea UNIQUE (lo es)
                .merge(); // Actualiza los campos si hay conflicto
        }

        // 6. Limpiar el archivo temporal
        fs.unlinkSync(tempPath); 

        res.status(200).json({
            mensaje: "Restauración de clientes completada.",
            totalFilasLeidas: contador,
            clientesProcesados: clientesParaUpsert.length,
            errores: errores
        });

    } catch (error) {
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
        console.error("Error al restaurar Excel:", error);
        res.status(500).json({ error: 'Error al procesar el archivo Excel.', detalle: error.message });
    }
});


module.exports = router;
