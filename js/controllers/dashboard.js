import { get, put } from '../modules/api.js';
import { showSuccess, showError, showConfirm } from '../modules/ui.js';

const dom = {};

export async function init() {
    console.log('📅 Inicializando Dashboard...');

    dom.listaPendientes = document.getElementById('lista-citas-pendientes-ul');
    dom.listaConfirmadas = document.getElementById('lista-citas-confirmadas-ul');
    dom.listaTerminadas = document.getElementById('lista-citas-terminadas-ul');

    // Delegación de eventos
    [dom.listaPendientes, dom.listaConfirmadas, dom.listaTerminadas].forEach(lista => {
        if (lista) lista.addEventListener('click', handleClickCita);
    });

    await cargarCitas();
}

async function cargarCitas() {
    if(dom.listaPendientes) dom.listaPendientes.innerHTML = '<div class="spinner"></div>';
    
    try {
        const citas = await get('/citas');
        const hoy = new Date().toISOString().slice(0, 10);
        
        renderLista(dom.listaPendientes, citas.filter(c => c.estado === 'Pendiente'), 'Pendiente');
        renderLista(dom.listaConfirmadas, citas.filter(c => c.estado === 'Confirmada'), 'Confirmada');
        renderLista(dom.listaTerminadas, citas.filter(c => c.estado === 'Terminada' && c.fecha_cita.startsWith(hoy)), 'Terminada');

    } catch (error) {
        if(dom.listaPendientes) dom.listaPendientes.innerHTML = '<li>Error al cargar citas.</li>';
    }
}

function renderLista(contenedor, citas, tipo) {
    if (!contenedor) return;
    if (citas.length === 0) {
        contenedor.innerHTML = '<li>Sin citas en esta lista.</li>';
        return;
    }

    contenedor.innerHTML = citas.map(c => {
        const fecha = new Date(c.fecha_cita).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' });
        let botones = '';

        if (tipo === 'Pendiente') {
            botones = `
                <div class="cita-item-acciones">
                    <button class="btn-confirmar" data-action="Confirmada" data-id="${c.cita_id}"><i class="fa-solid fa-check"></i> Confirmar</button>
                    <button class="btn-rechazar" data-action="Rechazada" data-id="${c.cita_id}"><i class="fa-solid fa-xmark"></i> Rechazar</button>
                </div>`;
        } else if (tipo === 'Confirmada') {
            const dataExtra = JSON.stringify({ cid: c.cliente_id, vid: c.vehiculo_id, pat: c.vehiculo_patente, serv: c.servicio_solicitado }).replace(/"/g, "&quot;");
            botones = `
                <div class="cita-item-acciones">
                    <button class="btn-terminar" data-action="Terminada" data-id="${c.cita_id}" data-extra="${dataExtra}">
                        <i class="fa-solid fa-flag-checkered"></i> Terminar Trabajo
                    </button>
                </div>`;
        }

        return `
            <li class="cita-item">
                <p><strong style="color:var(--secondary);">${fecha}</strong><br>
                ${c.cliente_nombre} <span style="background:#eee; padding:2px 5px; border-radius:4px; font-size:0.85em;">${c.vehiculo_patente}</span><br>
                <em style="color:var(--text-light);">${c.servicio_solicitado}</em></p>
                ${botones}
            </li>`;
    }).join('');
}

async function handleClickCita(e) {
    const btn = e.target.closest('button');
    if (!btn) return;

    const id = btn.dataset.id;
    const action = btn.dataset.action;
    const extra = btn.dataset.extra ? JSON.parse(btn.dataset.extra) : null;

    if (action === 'Terminada') await procesarTerminoCita(id, extra);
    else await cambiarEstadoCita(id, action);
}

async function cambiarEstadoCita(id, nuevoEstado) {
    if (!await showConfirm(`¿Marcar como ${nuevoEstado}?`)) return;
    try {
        await put(`/citas/${id}`, { estado: nuevoEstado });
        showSuccess(`Cita ${nuevoEstado}`);
        cargarCitas();
    } catch (error) { showError('No se pudo actualizar la cita'); }
}

async function procesarTerminoCita(id, data) {
    if (!await showConfirm('¿Finalizar trabajo?', 'La cita pasará a terminada.')) return;
    try {
        await put(`/citas/${id}`, { estado: 'Terminada' });
        const registrar = await showConfirm('Trabajo Finalizado', '¿Deseas crear la hoja de mantención ahora?', 'Ir a Mantención');
        if (registrar) {
            document.dispatchEvent(new CustomEvent('navegar-a-mantencion', { detail: data }));
        } else {
            cargarCitas();
        }
    } catch (error) { showError('Error al finalizar la cita'); }
}