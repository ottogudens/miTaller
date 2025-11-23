const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const tempDir = path.join(__dirname, '../temp');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
}
const upload = multer({ dest: 'temp/' });

const dbPath = path.resolve(__dirname, '../gudex_serviteca.db');

router.get('/download', (req, res) => {
    const timestamp = new Date().toISOString().slice(0, 10);
    const backupName = `gudex_backup_${timestamp}.db`;
    res.download(dbPath, backupName, (err) => {
        if (err) console.error("Error descarga BD:", err);
    });
});

router.post('/restore', upload.single('backupFile'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No se subió archivo.' });
    const tempPath = req.file.path;

    try {
        fs.renameSync(tempPath, dbPath);
        res.status(200).json({ message: 'Restauración exitosa. Por favor, reinicia el servidor.' });
    } catch (error) {
        console.error("Error restore BD:", error);
        if (fs.existsSync(tempPath)) {
            try { fs.unlinkSync(tempPath); } catch(e) {}
        }
        res.status(500).json({ error: 'Error al restaurar base de datos.' });
    }
});

module.exports = router;