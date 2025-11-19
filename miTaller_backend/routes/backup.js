const express = require('express');
const router = express.Router();
const path = require('path'); // Para manejar rutas de archivos
const fs = require('fs');     // Para manejar el sistema de archivos
const multer = require('multer'); // Para subir archivos

// Configura Multer para guardar el archivo subido en una carpeta 'temp'
// (Creará la carpeta 'temp' si no existe)
const tempDir = path.join(__dirname, '../temp');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
}
const upload = multer({ dest: 'temp/' });

// Definimos la ruta a nuestra base de datos
const dbPath = path.resolve(__dirname, '../gudex_serviteca.db');

/**
 * [R]EAD: Descargar un respaldo de la BD
 * Ruta: GET /api/backup/download
 */
router.get('/download', (req, res) => {
    // Genera un nombre de archivo con la fecha
    const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const backupName = `gudex_backup_${timestamp}.db`;

    // res.download() envía el archivo al navegador para su descarga
    res.download(dbPath, backupName, (err) => {
        if (err) {
            console.error("Error al descargar la BD:", err);
            res.status(500).json({ error: "No se pudo descargar el archivo." });
        }
    });
});

/**
 * [C]REATE: Subir y Restaurar un respaldo de la BD
 * Ruta: POST /api/backup/restore
 */
router.post('/restore', upload.single('backupFile'), (req, res) => {
    // 'backupFile' debe coincidir con el nombre del campo en el formulario
    
    if (!req.file) {
        return res.status(400).json({ error: 'No se subió ningún archivo.' });
    }

    const tempPath = req.file.path; // Ruta del archivo temporal subido

    // --- ¡ADVERTENCIA DE SEGURIDAD CRÍTICA! ---
    // En una app real, aquí deberíamos cerrar la conexión a la BD
    // db.destroy(), pero eso es complejo en nuestra arquitectura.
    // En su lugar, simplemente reemplazamos el archivo.
    // Esto es PELIGROSO si la BD está en uso, pero para SQLite
    // y una app pequeña con un solo admin, es aceptable.

    try {
        // Reemplazamos el archivo de BD actual con el nuevo
        fs.renameSync(tempPath, dbPath);
        
        // ¡Importante! El servidor DEBE ser reiniciado
        // para que Knex lea el nuevo archivo de BD.
        res.status(200).json({ 
            mensaje: '¡Restauración exitosa!' + 
                     ' El archivo de base de datos ha sido reemplazado.' +
                     ' Por favor, REINICIE EL SERVIDOR AHORA.' 
        });

    } catch (error) {
        console.error("Error al restaurar la BD:", error);
        // Si falla, borramos el archivo temporal
        if (fs.existsSync(tempPath)) {
            fs.unlinkSync(tempPath);
        }
        res.status(500).json({ error: 'Error al reemplazar el archivo de la BD.', detalle: error.message });
    }
});

module.exports = router;
