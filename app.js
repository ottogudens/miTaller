const API_URL = '/api';
let usuarioLogueado = null;
let tokenGuardado = null;
let vehiculoActivo = null;
let listaDeVehiculos = [];

const sidebarLinks = document.querySelectorAll('.sidebar-nav a');
const contentViews = document.querySelectorAll('.content-view');

function verificarAutenticacion() {
    const token = localStorage.getItem('gudexToken');
    const usuarioJSON = localStorage.getItem('gudexUser');
    if (!token || !usuarioJSON) { window.location.href = 'login.html'; return false; }
    const usuario = JSON.parse(usuarioJSON);
    if (usuario.role === 'admin') { window.location.href = 'admin.html'; return false; }
    tokenGuardado = token; usuarioLogueado = usuario; return true;
}

document.addEventListener('DOMContentLoaded', () => {
    if (verificarAutenticacion()) {
        iniciarReloj(); // Reloj
        sidebarLinks.forEach(link => { link.addEventListener('click', (e) => { e.preventDefault(); showView(link.dataset.view); }); });
        cargarDatosPaginaCliente(); cargarEstadoCitas(); configurarInputFecha();
        document.getElementById('form-agendar').addEventListener('submit', handleAgendarCita);
        document.getElementById('logout-button').addEventListener('click', handleCerrarSesion);
        document.getElementById('selector-vehiculo').addEventListener('change', (e) => { handleSeleccionarVehiculo(listaDeVehiculos.find(v => v.id == e.target.value)); });
        document.getElementById('btn-agendar-sugerencia').addEventListener('click', handleAgendarSugerencia);
    }
});

function iniciarReloj() {
    const div = document.getElementById('reloj-sistema');
    if(!div) return;
    const update = () => { const now = new Date(); div.innerHTML = `<div>${now.toLocaleDateString('es-CL')}</div><strong>${now.toLocaleTimeString('es-CL')}</strong>`; };
    update(); setInterval(update, 1000);
}

function showView(viewId) { contentViews.forEach(v => v.classList.remove('active')); sidebarLinks.forEach(l => l.classList.remove('active')); document.getElementById(`view-${viewId}`).classList.add('active'); document.querySelector(`.sidebar-nav a[data-view="${viewId}"]`).classList.add('active'); }

async function cargarDatosPaginaCliente() {
    document.getElementById('bienvenida-usuario').innerHTML = `Hola, <strong>${usuarioLogueado.nombre}</strong>`;
    const res = await fetch(`${API_URL}/clientes/${usuarioLogueado.id}/vehiculos`, { headers: { 'Authorization': `Bearer ${tokenGuardado}` }, cache: 'no-store' });
    const vehiculos = await res.json(); listaDeVehiculos = vehiculos;
    const sel = document.getElementById('selector-vehiculo'); sel.innerHTML = '';
    if(vehiculos.length > 0) { vehiculos.forEach(v => sel.add(new Option(`${v.marca} ${v.modelo}`, v.id))); handleSeleccionarVehiculo(vehiculos[0]); } else { sel.innerHTML = '<option>Sin vehículos</option>'; }
}
function handleSeleccionarVehiculo(v) { if(!v) return; vehiculoActivo = v; document.getElementById('vehiculo-nombre').textContent = `${v.marca} ${v.modelo}`; document.getElementById('vehiculo-detalles').innerHTML = `<li><i class="fa-solid fa-hashtag"></i> Patente: <strong>${v.patente}</strong></li>`; cargarHistorial(v.id); }
async function cargarHistorial(id) { const res = await fetch(`${API_URL}/vehiculos/${id}/mantenimientos`, { headers: { 'Authorization': `Bearer ${tokenGuardado}` }, cache: 'no-store' }); const data = await res.json(); const tbody = document.getElementById('historial-tbody'); tbody.innerHTML = data.length ? '' : '<tr><td colspan="4">Sin historial</td></tr>'; const ult = data[0]; const sugText = document.getElementById('proxima-sugerencia-texto'); const btn = document.getElementById('btn-agendar-sugerencia'); if (ult && (ult.proximo_km_sugerido || ult.proxima_sugerencia)) { sugText.innerHTML = `<strong>Próximo:</strong> ${ult.proxima_sugerencia || ''} (${ult.proximo_km_sugerido || ''} km)`; btn.style.display = 'inline-block'; btn.dataset.servicio = `Mantención ${ult.proximo_km_sugerido || ''}`; } else { sugText.textContent = 'Sin sugerencias.'; btn.style.display = 'none'; } data.forEach(m => { const tr = document.createElement('tr'); tr.innerHTML = `<td>${m.fecha}</td><td>${m.trabajos_realizados}</td><td>${m.repuestos_usados}</td><td>${m.kilometraje}</td>`; tbody.appendChild(tr); }); }
function handleAgendarSugerencia(e) { showView('agendar'); document.getElementById('servicio-cita').value = e.target.dataset.servicio; }
async function handleAgendarCita(e) { e.preventDefault(); const datos = { fecha_cita: document.getElementById('fecha-cita-dia').value + 'T' + document.getElementById('fecha-cita-hora').value + ':00', servicio_solicitado: document.getElementById('servicio-cita').value, cliente_id: usuarioLogueado.id, vehiculo_id: vehiculoActivo.id }; await fetch(`${API_URL}/citas`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenGuardado}` }, body: JSON.stringify(datos) }); alert('Solicitud enviada'); cargarEstadoCitas(); showView('dashboard'); }
async function cargarEstadoCitas() { const res = await fetch(`${API_URL}/clientes/${usuarioLogueado.id}/citas`, { headers: { 'Authorization': `Bearer ${tokenGuardado}` }, cache: 'no-store' }); const citas = await res.json(); const ul = document.getElementById('lista-estado-citas'); ul.innerHTML = citas.length ? '' : '<li>Sin citas.</li>'; citas.forEach(c => { const li = document.createElement('li'); li.className = 'cita-cliente-item'; let icon = 'fa-clock'; if(c.estado === 'Confirmada') icon = 'fa-check-circle'; if(c.estado === 'Terminada') icon = 'fa-flag-checkered'; li.innerHTML = `<div><strong>${c.fecha_cita}</strong><br>${c.servicio_solicitado}</div><div class="cita-cliente-estado status-${c.estado.toLowerCase()}"><i class="fa-solid ${icon}"></i> ${c.estado}</div>`; ul.appendChild(li); }); }
function configuringInputFecha() { document.getElementById('fecha-cita-dia').min = new Date().toISOString().split('T')[0]; }
function configurarInputFecha() { document.getElementById('fecha-cita-dia').min = new Date().toISOString().split('T')[0]; }
function handleCerrarSesion() { localStorage.clear(); window.location.href = 'login.html'; }
