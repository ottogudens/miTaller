import { get } from '../modules/api.js';
import { showError, showLoading, closeLoading } from '../modules/ui.js';

const dom = {};
let clienteEncontradoId = null;

export async function init() {
    console.log('🔍 Inicializando Recepción...');
    dom.form = document.getElementById('form-buscador-patente');
    dom.input = document.getElementById('busqueda-patente');
    dom.resultados = document.getElementById('resultado-busqueda');
    dom.btnIrCliente = document.getElementById('btn-ir-cliente');
    dom.listaHistorial = document.getElementById('res-lista-historial');
    dom.txtPatente = document.getElementById('res-patente');
    dom.txtVehiculo = document.getElementById('res-marca-modelo');
    dom.txtAnio = document.getElementById('res-anio');
    dom.txtCliente = document.getElementById('res-cliente');
    dom.txtEmail = document.getElementById('res-email');
    dom.txtTel = document.getElementById('res-telefono');

    if (dom.form) dom.form.addEventListener('submit', handleBuscar);
    if (dom.btnIrCliente) {
        dom.btnIrCliente.addEventListener('click', () => {
            if (clienteEncontradoId) document.dispatchEvent(new CustomEvent('navegar-a-cliente', { detail: { id: clienteEncontradoId } }));
        });
    }
    if(dom.input) setTimeout(() => dom.input.focus(), 500);
}

async function handleBuscar(e) {
    e.preventDefault();
    const patente = dom.input.value.trim().toUpperCase();
    if (patente.length < 4) return showError('Ingresa una patente válida');
    showLoading('Buscando...');
    try {
        const data = await get(`/vehiculos/buscar/${patente}`);
        closeLoading();
        renderizarResultados(data);
    } catch (error) {
        closeLoading();
        dom.resultados.classList.add('hidden');
        showError('Vehículo no encontrado');
    }
}

function renderizarResultados(data) {
    const v = data.datos;
    const historial = data.historial || [];
    clienteEncontradoId = v.cliente_id_real || v.cliente_id;
    dom.txtPatente.textContent = v.patente;
    dom.txtVehiculo.textContent = `${v.marca} ${v.modelo}`;
    dom.txtAnio.textContent = v.anio || '---';
    dom.txtCliente.textContent = v.cliente_nombre;
    dom.txtEmail.textContent = v.cliente_email;
    dom.txtTel.textContent = v.cliente_telefono || '---';

    if (historial.length === 0) {
        dom.listaHistorial.innerHTML = '<li>Sin historial.</li>';
    } else {
        dom.listaHistorial.innerHTML = historial.map(m => `
            <li class="list-item" style="flex-direction:column; align-items:flex-start;">
                <p><strong>${m.fecha}</strong> (${m.kilometraje} km)</p>
                <p style="color:var(--text-light); font-size:0.9rem; margin-top:4px;">${m.trabajos_realizados}</p>
            </li>`).join('');
    }
    dom.resultados.classList.remove('hidden');
}