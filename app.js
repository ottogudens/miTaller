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
    
    tokenGuardado = token;
    usuarioLogueado = usuario;
    return true;
}

document.addEventListener('DOMContentLoaded', () => {
    if (verificarAutenticacion()) {
        
        // 1. ACTIVAR LOGOUT (Prioridad Alta)
        const btnLogout = document.getElementById('logout-button');
        if (btnLogout) {
            btnLogout.addEventListener('click', handleCerrarSesion);
        }

        // 2. Navegación Sidebar
        sidebarLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const viewId = link.dataset.view;
                showView(viewId);
            });
        });
        
        // 3. Carga de Datos
        cargarDatosPaginaCliente();
        cargarEstadoCitas();
        configurarInputFecha(); // <-- AHORA COINCIDE CON LA FUNCIÓN DE ABAJO

        // 4. Listeners Formularios
        const formAgendar = document.getElementById('form-agendar');
        if (formAgendar) formAgendar.addEventListener('submit', handleAgendarCita);

        const selVehiculo = document.getElementById('selector-vehiculo');
        if (selVehiculo) {
            selVehiculo.addEventListener('change', (e) => {
                const v = listaDeVehiculos.find(veh => veh.id == e.target.value);
                handleSeleccionarVehiculo(v);
            });
        }

        const btnSugerencia = document.getElementById('btn-agendar-sugerencia');
        if (btnSugerencia) btnSugerencia.addEventListener('click', handleAgendarSugerencia);
    }
});

function showView(viewId) {
    contentViews.forEach(v => v.classList.remove('active'));
    sidebarLinks.forEach(l => l.classList.remove('active'));
    const viewToShow = document.getElementById(`view-${viewId}`);
    const linkActive = document.querySelector(`.sidebar-nav a[data-view="${viewId}"]`);
    
    if(viewToShow) viewToShow.classList.add('active');
    if(linkActive) linkActive.classList.add('active');
}

async function cargarDatosPaginaCliente() {
    const bienvenida = document.getElementById('bienvenida-usuario');
    if(bienvenida) bienvenida.innerHTML = `Hola, <strong>${usuarioLogueado.nombre}</strong>`;
    
    try {
        const res = await fetch(`${API_URL}/clientes/${usuarioLogueado.id}/vehiculos`, { 
            headers: { 'Authorization': `Bearer ${tokenGuardado}` }, 
            cache: 'no-store' 
        });
        const vehiculos = await res.json();
        listaDeVehiculos = vehiculos;
        
        const sel = document.getElementById('selector-vehiculo');
        sel.innerHTML = '';
        
        if(vehiculos.length > 0) {
            vehiculos.forEach(v => sel.add(new Option(`${v.marca} ${v.modelo}`, v.id)));
            handleSeleccionarVehiculo(vehiculos[0]);
        } else {
            sel.innerHTML = '<option>Sin vehículos registrados</option>';
            document.getElementById('vehiculo-nombre').textContent = 'No hay vehículos';
            document.getElementById('vehiculo-detalles').innerHTML = '';
        }
    } catch (e) { console.error(e); }
}

function handleSeleccionarVehiculo(v) {
    if(!v) return;
    vehiculoActivo = v;
    document.getElementById('vehiculo-nombre').textContent = `${v.marca} ${v.modelo}`;
    document.getElementById('vehiculo-detalles').innerHTML = `<li><i class="fa-solid fa-hashtag"></i> Patente: <strong>${v.patente}</strong></li><li><i class="fa-solid fa-calendar"></i> Año: ${v.anio}</li>`;
    cargarHistorial(v.id);
}

async function cargarHistorial(id) {
    try {
        const res = await fetch(`${API_URL}/vehiculos/${id}/mantenimientos`, { headers: { 'Authorization': `Bearer ${tokenGuardado}` }, cache: 'no-store' });
        const data = await res.json();
        const tbody = document.getElementById('historial-tbody');
        tbody.innerHTML = data.length ? '' : '<tr><td colspan="4" style="text-align:center; padding:1rem;">No hay historial disponible.</td></tr>';
        
        const ult = data[0];
        const sugText = document.getElementById('proxima-sugerencia-texto');
        const btn = document.getElementById('btn-agendar-sugerencia');
        
        if (ult && (ult.proximo_km_sugerido || ult.proxima_sugerencia)) {
            sugText.innerHTML = `<strong><i class="fa-solid fa-wrench"></i> Próximo Servicio:</strong> ${ult.proxima_sugerencia || 'Mantención programada'} <br> <strong><i class="fa-solid fa-gauge"></i> A los:</strong> ${ult.proximo_km_sugerido ? ult.proximo_km_sugerido + ' km' : 'N/A'}`;
            btn.style.display = 'inline-block';
            btn.dataset.servicio = `Mantención ${ult.proximo_km_sugerido || ''}`;
        } else {
            sugText.textContent = 'No tienes mantenciones pendientes sugeridas.';
            btn.style.display = 'none';
        }

        data.forEach(m => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${m.fecha}</td><td>${m.trabajos_realizados}</td><td>${m.repuestos_usados}</td><td>${m.kilometraje}</td>`;
            tbody.appendChild(tr);
        });
    } catch (e) { console.error(e); }
}

function handleAgendarSugerencia(e) {
    showView('agendar');
    document.getElementById('servicio-cita').value = e.target.dataset.servicio;
}

async function handleAgendarCita(e) {
    e.preventDefault();
    if (!vehiculoActivo) return alert("No hay vehículo seleccionado.");
    
    const datos = {
        fecha_cita: document.getElementById('fecha-cita-dia').value + 'T' + document.getElementById('fecha-cita-hora').value + ':00',
        servicio_solicitado: document.getElementById('servicio-cita').value,
        cliente_id: usuarioLogueado.id,
        vehiculo_id: vehiculoActivo.id
    };
    
    try {
        const res = await fetch(`${API_URL}/citas`, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenGuardado}` }, 
            body: JSON.stringify(datos) 
        });
        
        if(res.ok) {
            alert('¡Solicitud enviada con éxito!');
            cargarEstadoCitas();
            showView('dashboard');
        } else {
            alert('Error al agendar. Horario no disponible.');
        }
    } catch (e) { console.error(e); alert('Error de conexión'); }
}

async function cargarEstadoCitas() {
    try {
        const res = await fetch(`${API_URL}/clientes/${usuarioLogueado.id}/citas`, { headers: { 'Authorization': `Bearer ${tokenGuardado}` }, cache: 'no-store' });
        const citas = await res.json();
        const ul = document.getElementById('lista-estado-citas');
        ul.innerHTML = citas.length ? '' : '<li style="padding:1rem; color:#666;">No tienes citas agendadas.</li>';
        
        citas.forEach(c => {
            const li = document.createElement('li'); li.className = 'cita-cliente-item';
            let iconClass = 'fa-clock';
            if(c.estado === 'Confirmada') iconClass = 'fa-check-circle';
            if(c.estado === 'Terminada') iconClass = 'fa-flag-checkered';
            if(c.estado === 'Rechazada') iconClass = 'fa-circle-xmark';

            const fecha = new Date(c.fecha_cita).toLocaleString('es-CL', { dateStyle: 'full', timeStyle: 'short' });

            li.innerHTML = `
                <div class="cita-cliente-info">
                    <p style="font-size:1.1rem;"><strong>${c.servicio_solicitado}</strong></p>
                    <p style="color:var(--text-light);"><i class="fa-regular fa-calendar"></i> ${fecha}</p>
                    <p style="color:var(--text-light);"><i class="fa-solid fa-car"></i> ${c.vehiculo_patente}</p>
                </div>
                <div class="cita-cliente-estado status-${c.estado.toLowerCase()}">
                    <i class="fa-solid ${iconClass}"></i> ${c.estado}
                </div>
            `;
            ul.appendChild(li);
        });
    } catch (e) { console.error(e); }
}

// --- FUNCIÓN CORREGIDA (NOMBRE CORRECTO) ---
function configurarInputFecha() {
    const input = document.getElementById('fecha-cita-dia');
    if(input) {
        input.min = new Date().toISOString().split('T')[0];
    }
}

function handleCerrarSesion() {
    localStorage.clear();
    window.location.href = 'login.html';
}
