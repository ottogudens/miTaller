import { get, post } from '../modules/api.js';
import { showSuccess, showError, showLoading, closeLoading } from '../modules/ui.js';

const dom = {};
let usuario = null;
let vehiculosCache = [];
let vehiculoActivo = null;

export async function init(view) {
    usuario = JSON.parse(localStorage.getItem('gudexUser'));
    dom.listaCitas = document.getElementById('lista-estado-citas');
    dom.selectVehiculo = document.getElementById('selector-vehiculo');
    dom.infoVehiculo = document.getElementById('vehiculo-detalles');
    dom.nombreVehiculo = document.getElementById('vehiculo-nombre');
    dom.tbodyHistorial = document.getElementById('historial-tbody');
    dom.formAgendar = document.getElementById('form-agendar');
    dom.sugerenciaTxt = document.getElementById('proxima-sugerencia-texto');
    dom.btnSugerencia = document.getElementById('btn-agendar-sugerencia');
    dom.btnFicha = document.getElementById('btn-descargar-ficha');

    if (dom.selectVehiculo && !dom.selectVehiculo.hasAttribute('dl')) {
        dom.selectVehiculo.addEventListener('change', (e) => seleccionarVehiculo(e.target.value));
        dom.selectVehiculo.setAttribute('dl', 'true');
    }
    if (dom.formAgendar && !dom.formAgendar.hasAttribute('dl')) {
        dom.formAgendar.addEventListener('submit', handleAgendarCita);
        dom.formAgendar.setAttribute('dl', 'true');
        const inputFecha = document.getElementById('fecha-cita-dia');
        if(inputFecha) inputFecha.min = new Date().toISOString().split('T')[0];
    }
    if (dom.btnSugerencia && !dom.btnSugerencia.hasAttribute('dl')) {
        dom.btnSugerencia.addEventListener('click', handleClickSugerencia);
        dom.btnSugerencia.setAttribute('dl', 'true');
    }
    if (dom.btnFicha && !dom.btnFicha.hasAttribute('dl')) {
        dom.btnFicha.addEventListener('click', handleDescargarFicha);
        dom.btnFicha.setAttribute('dl', 'true');
    }

    if (view === 'dashboard') { cargarMisCitas(); if (!vehiculosCache.length) await cargarMisVehiculos(); }
    else if (view === 'vehiculos' || view === 'agendar') { if (!vehiculosCache.length) await cargarMisVehiculos(); }
}

function handleDescargarFicha() {
    const token = localStorage.getItem('gudexToken');
    window.open(`/api/reports/cliente/${usuario.id}?token=${token}`, '_blank');
}

async function cargarMisCitas() {
    if (dom.listaCitas) dom.listaCitas.innerHTML = '<li>Cargando...</li>';
    try {
        const citas = await get(`/clientes/${usuario.id}/citas`);
        if (!dom.listaCitas) return;
        dom.listaCitas.innerHTML = citas.length ? citas.map(c => {
            const color = c.estado === 'Confirmada' ? 'status-confirmada' : c.estado === 'Terminada' ? 'status-terminada' : 'status-pendiente';
            return `<li class="cita-cliente-item"><div><strong>${new Date(c.fecha_cita).toLocaleString('es-CL')}</strong><br>${c.servicio_solicitado}</div><div class="cita-cliente-estado ${color}">${c.estado}</div></li>`;
        }).join('') : '<li>Sin citas.</li>';
    } catch (error) { if(dom.listaCitas) dom.listaCitas.innerHTML = '<li>Error.</li>'; }
}

async function cargarMisVehiculos() {
    try {
        vehiculosCache = await get(`/clientes/${usuario.id}/vehiculos`);
        if (dom.selectVehiculo) {
            dom.selectVehiculo.innerHTML = '';
            vehiculosCache.forEach(v => dom.selectVehiculo.add(new Option(`${v.marca} ${v.modelo}`, v.id)));
            if(vehiculosCache.length) seleccionarVehiculo(vehiculosCache[0].id);
        }
    } catch (e) {}
}

async function seleccionarVehiculo(id) {
    vehiculoActivo = vehiculosCache.find(v => v.id == id);
    if (dom.nombreVehiculo) dom.nombreVehiculo.textContent = `${vehiculoActivo.marca} ${vehiculoActivo.modelo}`;
    if (dom.infoVehiculo) dom.infoVehiculo.innerHTML = `<li>Patente: <strong>${vehiculoActivo.patente}</strong></li>`;
    cargarHistorial(id);
}

async function cargarHistorial(id) {
    if (dom.tbodyHistorial) dom.tbodyHistorial.innerHTML = '<tr><td>Cargando...</td></tr>';
    try {
        const hist = await get(`/vehiculos/${id}/mantenimientos`);
        if(hist[0] && (hist[0].proxima_sugerencia)) {
            dom.sugerenciaTxt.innerHTML = `Próximo: ${hist[0].proxima_sugerencia}`;
            dom.btnSugerencia.style.display = 'inline-block';
            dom.btnSugerencia.dataset.servicio = hist[0].proxima_sugerencia;
        }
        dom.tbodyHistorial.innerHTML = hist.length ? hist.map(m => `<tr><td>${m.fecha}</td><td>${m.trabajos_realizados}</td><td>${m.repuestos_usados||'-'}</td><td>${m.kilometraje}</td></tr>`).join('') : '<tr><td colspan="4">Sin historial</td></tr>';
    } catch (e) {}
}

function handleClickSugerencia(e) {
    document.querySelector('.sidebar-nav a[data-view="agendar"]').click();
    setTimeout(() => document.getElementById('servicio-cita').value = e.target.dataset.servicio, 300);
}

async function handleAgendarCita(e) {
    e.preventDefault();
    showLoading('Enviando...');
    try {
        await post('/citas', {
            fecha_cita: `${document.getElementById('fecha-cita-dia').value}T${document.getElementById('fecha-cita-hora').value}:00`,
            servicio_solicitado: document.getElementById('servicio-cita').value,
            cliente_id: usuario.id, vehiculo_id: vehiculoActivo.id
        });
        closeLoading(); showSuccess('Cita solicitada'); dom.formAgendar.reset();
        document.querySelector('.sidebar-nav a[data-view="dashboard"]').click();
    } catch (e) { closeLoading(); showError('Error al agendar'); }
}