import { get, post, del } from '../modules/api.js';
import { showSuccess, showError, showLoading, closeLoading } from '../modules/ui.js';

const dom = {};

export async function init() {
    console.log('⚙️ Configuración...');
    dom.listaMarcas = document.getElementById('lista-config-marcas');
    dom.listaModelos = document.getElementById('lista-config-modelos');
    dom.formMarca = document.getElementById('form-crear-marca');
    dom.formModelo = document.getElementById('form-crear-modelo');
    dom.panelModelos = document.getElementById('panel-modelos');
    dom.formBackup = document.getElementById('form-backup-restore');
    dom.formExcelCli = document.getElementById('form-excel-restore');
    dom.formExcelVeh = document.getElementById('form-excel-vehiculos');
    dom.formExcelProd = document.getElementById('form-excel-productos');

    if(dom.formMarca) dom.formMarca.addEventListener('submit', handleCrearMarca);
    if(dom.formModelo) dom.formModelo.addEventListener('submit', handleCrearModelo);
    
    if(dom.listaMarcas) {
        dom.listaMarcas.addEventListener('click', e => {
            const btn = e.target.closest('.btn-delete');
            const li = e.target.closest('li');
            if(btn) return eliminarMarca(btn.dataset.id);
            if(li) seleccionarMarca(li.dataset.id, li.dataset.nombre);
        });
        await cargarMarcas();
    }

    if(dom.formBackup) dom.formBackup.addEventListener('submit', (e) => handleUpload(e, '/backup/restore'));
    if(dom.formExcelCli) dom.formExcelCli.addEventListener('submit', (e) => handleUpload(e, '/excel/restore/clientes', 'excelFile'));
    if(dom.formExcelVeh) dom.formExcelVeh.addEventListener('submit', (e) => handleUpload(e, '/excel/restore/vehiculos', 'excelFile'));
    if(dom.formExcelProd) dom.formExcelProd.addEventListener('submit', (e) => handleUpload(e, '/excel/restore/productos', 'excelFile'));
    
    document.getElementById('btn-descargar-backup')?.addEventListener('click', () => download('/backup/download'));
}

async function cargarMarcas() {
    try {
        const marcas = await get('/vehiculos-data/marcas');
        dom.listaMarcas.innerHTML = marcas.map(m => `<li data-id="${m.id}" data-nombre="${m.nombre}"><span>${m.nombre}</span><button class="btn-delete" data-id="${m.id}">X</button></li>`).join('');
    } catch (e) {}
}

async function seleccionarMarca(id, nombre) {
    document.getElementById('titulo-modelos-marca').textContent = `Modelos: ${nombre}`;
    dom.panelModelos.classList.remove('hidden');
    const modelos = await get(`/vehiculos-data/modelos-by-id/${id}`);
    dom.listaModelos.innerHTML = modelos.map(m => `<li><span>${m.nombre}</span><button class="btn-delete" onclick="window.borrarModelo(${m.id})">X</button></li>`).join('');
}

async function handleCrearMarca(e) {
    e.preventDefault();
    await post('/vehiculos-data/marcas', { nombre: document.getElementById('nueva-marca-nombre').value });
    showSuccess('Marca creada'); cargarMarcas();
}

async function handleUpload(e, endpoint, fieldName = 'backupFile') {
    e.preventDefault();
    const fileInput = e.target.querySelector('input[type="file"]');
    if(!fileInput.files[0]) return showError('Selecciona un archivo');
    const formData = new FormData();
    formData.append(fieldName, fileInput.files[0]);
    showLoading('Procesando...');
    try {
        const token = localStorage.getItem('gudexToken');
        const res = await fetch(`/api${endpoint}?token=${token}`, { method: 'POST', body: formData });
        const data = await res.json();
        closeLoading();
        if(res.ok) showSuccess(data.message || 'Éxito'); else showError(data.error);
    } catch (e) { closeLoading(); showError('Error conexión'); }
}

function download(endpoint) {
    const t = localStorage.getItem('gudexToken');
    window.location.href = `/api${endpoint}?token=${t}`;
}