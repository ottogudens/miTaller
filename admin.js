const API_URL = '/api';
let tokenGuardado = null;
let usuarioLogueado = null;
let clienteSeleccionadoId = null; 
let vehiculoSeleccionadoId = null; 
let marcasData = [];

// Variables DOM
let colDetalles, listaClientesUL, listaVehiculosUL, listaHistorialUL;
let detalleNombre, detalleInfo, btnPdfCliente, formCrearCliente, formAgregarVehiculo, logoutButton, formAgregarMantenimiento;
// NUEVO: Variable para formulario de agendar cita desde admin
let formAdminAgendarCita;

let mantenimientoModal, closeMantenimientoModalBtn, formEditMantenimiento, overlay;
let clienteModal, closeClienteModalBtn, formEditCliente;
let vehiculoModal, closeVehiculoModalBtn, formEditVehiculo;
let listaCitasPendientesUL, listaCitasConfirmadasUL, listaCitasTerminadasUL;
let formBackupRestore, btnDescargarBackup, inputFileBackup, formExcelRestore, btnDescargarExcel, inputFileExcel;
let sidebarLinks, contentViews, selectMarca, selectModelo;
let formBuscadorPatente, resultadoBusqueda, btnIrCliente;
let formCrearMarca, listaConfigMarcas, formCrearModelo, listaConfigModelos, panelModelos, tituloModelosMarca, marcaSeleccionadaId;

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('gudexToken');
    const usuarioJSON = localStorage.getItem('gudexUser');

    if (!token || !usuarioJSON) { window.location.href = 'login.html'; return; }
    const usuario = JSON.parse(usuarioJSON);
    if (usuario.role !== 'admin') { window.location.href = 'index.html'; return; }

    tokenGuardado = token;
    usuarioLogueado = usuario;

    // --- ASIGNACIÓN DOM ---
    colDetalles = document.getElementById('columna-detalles');
    listaClientesUL = document.getElementById('lista-clientes-ul');
    listaVehiculosUL = document.getElementById('lista-vehiculos-ul');
    listaHistorialUL = document.getElementById('lista-historial-ul');
    detalleNombre = document.getElementById('detalle-cliente-nombre');
    detalleInfo = document.getElementById('detalle-cliente-info');
    btnPdfCliente = document.getElementById('btn-pdf-cliente');
    
    formCrearCliente = document.getElementById('form-crear-cliente');
    formAgregarVehiculo = document.getElementById('form-agregar-vehiculo');
    formAgregarMantenimiento = document.getElementById('form-agregar-mantenimiento');
    // NUEVO
    formAdminAgendarCita = document.getElementById('form-admin-agendar-cita');

    logoutButton = document.getElementById('logout-button');
    
    overlay = document.getElementById('modal-overlay');
    clienteModal = document.getElementById('cliente-modal');
    closeClienteModalBtn = document.getElementById('close-cliente-modal');
    formEditCliente = document.getElementById('form-edit-cliente');
    vehiculoModal = document.getElementById('vehiculo-modal');
    closeVehiculoModalBtn = document.getElementById('close-vehiculo-modal');
    formEditVehiculo = document.getElementById('form-edit-vehiculo');
    mantenimientoModal = document.getElementById('mantenimiento-modal');
    closeMantenimientoModalBtn = document.getElementById('close-mantenimiento-modal');
    formEditMantenimiento = document.getElementById('form-edit-mantenimiento');

    listaCitasPendientesUL = document.getElementById('lista-citas-pendientes-ul');
    listaCitasConfirmadasUL = document.getElementById('lista-citas-confirmadas-ul');
    listaCitasTerminadasUL = document.getElementById('lista-citas-terminadas-ul');
    
    formBackupRestore = document.getElementById('form-backup-restore');
    btnDescargarBackup = document.getElementById('btn-descargar-backup');
    inputFileBackup = document.getElementById('backup-file');
    formExcelRestore = document.getElementById('form-excel-restore');
    btnDescargarExcel = document.getElementById('btn-descargar-excel');
    inputFileExcel = document.getElementById('excel-file');
    
    sidebarLinks = document.querySelectorAll('.sidebar-nav a');
    contentViews = document.querySelectorAll('.content-view');
    selectMarca = document.getElementById('admin-marca');
    selectModelo = document.getElementById('admin-modelo');
    
    formBuscadorPatente = document.getElementById('form-buscador-patente');
    resultadoBusqueda = document.getElementById('resultado-busqueda');
    btnIrCliente = document.getElementById('btn-ir-cliente');

    formCrearMarca = document.getElementById('form-crear-marca');
    listaConfigMarcas = document.getElementById('lista-config-marcas');
    formCrearModelo = document.getElementById('form-crear-modelo');
    listaConfigModelos = document.getElementById('lista-config-modelos');
    panelModelos = document.getElementById('panel-modelos');
    tituloModelosMarca = document.getElementById('titulo-modelos-marca');
    
    // Configurar fecha mínima para citas admin
    const fechaCitaInput = document.getElementById('admin-cita-fecha');
    if(fechaCitaInput) fechaCitaInput.min = new Date().toISOString().split('T')[0];

    iniciarPanelAdmin();
});

function iniciarPanelAdmin() {
    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const viewId = link.dataset.view;
            if (viewId === 'estadisticas') cargarEstadisticas();
            if (viewId === 'config-vehiculos') cargarConfigMarcas();
            showView(viewId);
        });
    });

    cargarDashboardCitas();
    cargarListaClientes();
    cargarDatosDeVehiculos();

    formCrearCliente.addEventListener('submit', handleCrearCliente);
    formAgregarVehiculo.addEventListener('submit', handleAgregarVehiculo);
    formAgregarMantenimiento.addEventListener('submit', handleAgregarMantenimiento);
    
    // NUEVO LISTENER
    if(formAdminAgendarCita) formAdminAgendarCita.addEventListener('submit', handleAdminAgendarCita);

    logoutButton.addEventListener('click', handleCerrarSesion);
    selectMarca.addEventListener('change', () => poblarSelectModelos(selectMarca.value));
    
    if(btnPdfCliente) btnPdfCliente.addEventListener('click', handleDescargarFichaCliente);
    if(formBuscadorPatente) formBuscadorPatente.addEventListener('submit', handleBuscarPatente);
    if(formCrearMarca) formCrearMarca.addEventListener('submit', handleCrearMarca);
    if(formCrearModelo) formCrearModelo.addEventListener('submit', handleCrearModelo);

    btnDescargarBackup.addEventListener('click', handleDescargarBackup);
    formBackupRestore.addEventListener('submit', handleRestaurarBackup);
    btnDescargarExcel.addEventListener('click', handleDescargarExcel);
    formExcelRestore.addEventListener('submit', handleRestaurarExcel);

    formEditCliente.addEventListener('submit', handleUpdateCliente);
    formEditVehiculo.addEventListener('submit', handleUpdateVehiculo);
    formEditMantenimiento.addEventListener('submit', handleUpdateMantenimiento);

    closeClienteModalBtn.addEventListener('click', closeClienteModal);
    closeVehiculoModalBtn.addEventListener('click', closeVehiculoModal);
    closeMantenimientoModalBtn.addEventListener('click', closeMantenimientoModal);
    overlay.addEventListener('click', closeTodosModales);
}

function showView(viewId) {
    contentViews.forEach(v => v.classList.remove('active'));
    sidebarLinks.forEach(l => l.classList.remove('active'));
    const viewToShow = document.getElementById(`view-${viewId}`);
    const link = document.querySelector(`.sidebar-nav a[data-view="${viewId}"]`);
    if(viewToShow) viewToShow.classList.add('active');
    if(link) link.classList.add('active');
}

// --- AGENDAR CITA (ADMIN) ---
async function handleAdminAgendarCita(e) {
    e.preventDefault();
    if (!clienteSeleccionadoId || !vehiculoSeleccionadoId) {
        alert('Debes seleccionar un cliente y luego un vehículo (haz clic en la lista de vehículos).');
        return;
    }

    const fecha = document.getElementById('admin-cita-fecha').value;
    const hora = document.getElementById('admin-cita-hora').value;
    const servicio = document.getElementById('admin-cita-servicio').value;

    const datosCita = {
        fecha_cita: `${fecha}T${hora}:00`,
        servicio_solicitado: servicio,
        cliente_id: clienteSeleccionadoId,
        vehiculo_id: vehiculoSeleccionadoId
    };

    try {
        const res = await fetch(`${API_URL}/citas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenGuardado}` },
            body: JSON.stringify(datosCita)
        });
        
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Error al agendar');
        }

        alert('Cita agendada exitosamente.');
        formAdminAgendarCita.reset();
        cargarDashboardCitas(); // Actualizar dashboard

    } catch (error) {
        alert(error.message);
    }
}


// --- CRUD MARCAS/MODELOS ---
async function cargarConfigMarcas() {
    try {
        const res = await fetch(`${API_URL}/vehiculos-data/marcas`, { headers: { 'Authorization': `Bearer ${tokenGuardado}` }, cache: 'no-store' });
        const marcas = await res.json();
        listaConfigMarcas.innerHTML = '';
        marcas.forEach(m => {
            const li = document.createElement('li');
            const nombre = m.nombre || m;
            const id = m.id;
            
            li.innerHTML = `<span>${nombre}</span> <button class="btn-delete" type="button">X</button>`;
            li.querySelector('button').onclick = (e) => { e.stopPropagation(); window.borrarMarca(id); };
            li.onclick = () => {
                seleccionarMarcaConfig(id, nombre);
                document.querySelectorAll('#lista-config-marcas li').forEach(l => l.classList.remove('selected'));
                li.classList.add('selected');
            };
            listaConfigMarcas.appendChild(li);
        });
    } catch (e) { console.error(e); }
}

async function handleCrearMarca(e) {
    e.preventDefault();
    const nombre = document.getElementById('nueva-marca-nombre').value.trim();
    if(!nombre) return;
    await fetch(`${API_URL}/vehiculos-data/marcas`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenGuardado}` },
        body: JSON.stringify({ nombre })
    });
    document.getElementById('nueva-marca-nombre').value = '';
    cargarConfigMarcas(); cargarDatosDeVehiculos();
}

window.borrarMarca = async (id) => {
    if(!confirm('¿Borrar marca y modelos?')) return;
    await fetch(`${API_URL}/vehiculos-data/marcas/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${tokenGuardado}` } });
    cargarConfigMarcas(); panelModelos.classList.add('hidden'); cargarDatosDeVehiculos();
};

async function seleccionarMarcaConfig(id, nombre) {
    marcaSeleccionadaId = id;
    tituloModelosMarca.textContent = `Modelos: ${nombre}`;
    document.getElementById('info-modelos-marca').style.display = 'none';
    panelModelos.classList.remove('hidden');
    cargarConfigModelos(id);
}

async function cargarConfigModelos(marcaId) {
    const res = await fetch(`${API_URL}/vehiculos-data/modelos-by-id/${marcaId}`, { headers: { 'Authorization': `Bearer ${tokenGuardado}` }, cache: 'no-store' });
    const modelos = await res.json();
    listaConfigModelos.innerHTML = modelos.length ? '' : '<li>Sin modelos.</li>';
    modelos.forEach(m => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${m.nombre}</span> <button class="btn-delete" onclick="window.borrarModelo(${m.id})">X</button>`;
        listaConfigModelos.appendChild(li);
    });
}

async function handleCrearModelo(e) {
    e.preventDefault();
    const nombre = document.getElementById('nuevo-modelo-nombre').value.trim();
    if(!nombre || !marcaSeleccionadaId) return;
    await fetch(`${API_URL}/vehiculos-data/modelos`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenGuardado}` },
        body: JSON.stringify({ nombre, marca_id: marcaSeleccionadaId })
    });
    document.getElementById('nuevo-modelo-nombre').value = '';
    cargarConfigModelos(marcaSeleccionadaId);
}

window.borrarModelo = async (id) => {
    if(!confirm('¿Borrar modelo?')) return;
    await fetch(`${API_URL}/vehiculos-data/modelos/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${tokenGuardado}` } });
    cargarConfigModelos(marcaSeleccionadaId);
};

// --- BUSCADOR ---
async function handleBuscarPatente(e) {
    e.preventDefault();
    const patente = document.getElementById('busqueda-patente').value.trim();
    if (!patente) return;
    try {
        const res = await fetch(`${API_URL}/vehiculos/buscar/${patente}`, { headers: { 'Authorization': `Bearer ${tokenGuardado}` }, cache: 'no-store' });
        if (!res.ok) { resultadoBusqueda.classList.add('hidden'); return alert('No encontrado'); }
        const data = await res.json();
        const v = data.datos; const h = data.historial || [];
        document.getElementById('res-patente').textContent = v.patente;
        document.getElementById('res-marca-modelo').textContent = `${v.marca} ${v.modelo}`;
        document.getElementById('res-anio').textContent = v.anio || 'N/A';
        document.getElementById('res-cliente').textContent = v.cliente_nombre;
        document.getElementById('res-email').textContent = v.cliente_email;
        document.getElementById('res-telefono').textContent = v.cliente_telefono;
        btnIrCliente.onclick = () => { showView('clientes'); window.seleccionarCliente(v.cliente_id_real || v.cliente_id); };
        const ul = document.getElementById('res-lista-historial'); ul.innerHTML = h.length ? '' : '<li>Sin historial.</li>';
        h.forEach(m => { const li = document.createElement('li'); li.className = 'list-item'; li.innerHTML = `<p><strong>${m.fecha}</strong> (${m.kilometraje}km)<br>${m.trabajos_realizados}</p>`; ul.appendChild(li); });
        resultadoBusqueda.classList.remove('hidden');
    } catch (error) { alert('Error buscar'); }
}

async function handleDescargarFichaCliente() {
    if (!clienteSeleccionadoId) return alert('Selecciona cliente');
    const url = `${API_URL}/reports/cliente/${clienteSeleccionadoId}?token=${tokenGuardado}`;
    window.open(url, '_blank');
}

async function cargarDashboardCitas() {
    try {
        const res = await fetch(`${API_URL}/citas`, { headers: { 'Authorization': `Bearer ${tokenGuardado}` }, cache: 'no-store' });
        if (!res.ok) throw new Error('Error citas');
        const citas = await res.json();
        const hoy = new Date().toISOString().slice(0, 10);
        renderCitas(citas.filter(c => c.estado === 'Pendiente'), listaCitasPendientesUL, 'Pendiente');
        renderCitas(citas.filter(c => c.estado === 'Confirmada'), listaCitasConfirmadasUL, 'Confirmada');
        renderCitas(citas.filter(c => c.estado === 'Terminada' && c.fecha_cita.startsWith(hoy)), listaCitasTerminadasUL, 'Terminada');
    } catch (e) { console.error(e); }
}
function renderCitas(citas, lista, tipo) {
    lista.innerHTML = citas.length ? '' : '<li>Sin citas.</li>';
    citas.forEach(c => {
        const li = document.createElement('li'); li.className = 'cita-item';
        const fecha = new Date(c.fecha_cita).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' });
        let botones = '';
        if(tipo === 'Pendiente') botones = `<div class="cita-item-acciones"><button class="btn-confirmar" onclick="window.gestionarCita(${c.cita_id}, 'Confirmada')">Confirmar</button><button class="btn-rechazar" onclick="window.gestionarCita(${c.cita_id}, 'Rechazada')">Rechazar</button></div>`;
        else if(tipo === 'Confirmada') botones = `<div class="cita-item-acciones"><button class="btn-terminar" onclick="window.gestionarCita(${c.cita_id}, 'Terminada', ${c.cliente_id}, ${c.vehiculo_id}, '${c.cliente_nombre}', '${c.vehiculo_patente}', '${c.servicio_solicitado}')">Terminar</button></div>`;
        li.innerHTML = `<p><strong>${fecha}</strong><br>${c.cliente_nombre} (${c.vehiculo_patente})<br><em>${c.servicio_solicitado}</em></p>${botones}`;
        lista.appendChild(li);
    });
}
window.gestionarCita = async (id, estado, clientId, vehId, cliName, pat, serv) => {
    if(!confirm(`¿${estado}?`)) return;
    await fetch(`${API_URL}/citas/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenGuardado}` }, body: JSON.stringify({ estado }) });
    cargarDashboardCitas();
    if(estado === 'Terminada' && confirm("¿Registrar trabajo?")) {
        showView('clientes');
        await seleccionarCliente(clientId);
        setTimeout(() => {
             seleccionarVehiculo(vehId, '');
             document.getElementById('admin-mantenimiento-fecha').value = new Date().toISOString().slice(0, 10);
             document.getElementById('admin-mantenimiento-trabajos').value = serv;
             formAgregarMantenimiento.scrollIntoView({ behavior: 'smooth' });
             formAgregarMantenimiento.style.border = "2px solid red";
        }, 500);
    }
};
async function cargarListaClientes() {
    const res = await fetch(`${API_URL}/clientes`, { headers: { 'Authorization': `Bearer ${tokenGuardado}` }, cache: 'no-store' });
    const clientes = await res.json();
    listaClientesUL.innerHTML = clientes.length ? '' : '<li>Sin clientes.</li>';
    clientes.forEach(c => {
        const li = document.createElement('li'); li.className = 'list-item';
        li.innerHTML = `<span class="list-item-label" onclick="window.seleccionarCliente(${c.id})">${c.nombre}</span><div><button class="btn-edit" onclick='window.openClienteModal(${JSON.stringify(c)})'>Edit</button><button class="btn-delete" onclick="window.deleteCliente(${c.id})">X</button></div>`;
        listaClientesUL.appendChild(li);
    });
}
window.seleccionarCliente = async (id) => {
    clienteSeleccionadoId = id;
    colDetalles.classList.remove('hidden');
    const res = await fetch(`${API_URL}/clientes/${id}`, { headers: { 'Authorization': `Bearer ${tokenGuardado}` } });
    const c = await res.json();
    detalleNombre.textContent = c.nombre;
    detalleInfo.textContent = `${c.email} | ${c.telefono}`;
    cargarVehiculosCliente(id);
};
async function handleCrearCliente(e) {
    e.preventDefault();
    const datos = { nombre: document.getElementById('admin-nombre').value, email: document.getElementById('admin-email').value, password: document.getElementById('admin-password').value, telefono: document.getElementById('admin-telefono').value, role: document.getElementById('admin-role').value };
    await fetch(`${API_URL}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenGuardado}` }, body: JSON.stringify(datos) });
    alert('Cliente creado'); formCrearCliente.reset(); cargarListaClientes();
}
async function cargarVehiculosCliente(id) {
    const res = await fetch(`${API_URL}/clientes/${id}/vehiculos`, { headers: { 'Authorization': `Bearer ${tokenGuardado}` }, cache: 'no-store' });
    const vehs = await res.json();
    listaVehiculosUL.innerHTML = vehs.length ? '' : '<li>Sin vehículos.</li>';
    vehs.forEach(v => {
        const li = document.createElement('li'); li.className = 'list-item';
        li.innerHTML = `<span class="list-item-label" onclick="window.seleccionarVehiculo(${v.id}, '${v.patente}')">${v.marca} ${v.modelo} - ${v.patente}</span><button class="btn-delete" onclick="window.deleteVehiculo(${v.id})">X</button>`;
        listaVehiculosUL.appendChild(li);
    });
}
window.seleccionarVehiculo = async (id, patente) => {
    vehiculoSeleccionadoId = id;
    const res = await fetch(`${API_URL}/vehiculos/${id}/mantenimientos`, { headers: { 'Authorization': `Bearer ${tokenGuardado}` }, cache: 'no-store' });
    const hist = await res.json();
    listaHistorialUL.innerHTML = hist.length ? '' : '<li>Sin historial.</li>';
    hist.forEach(m => {
        const li = document.createElement('li'); li.className = 'list-item';
        li.innerHTML = `<span class="list-item-label"><strong>${m.fecha}</strong>: ${m.trabajos_realizados}</span><button class="btn-edit" onclick='window.openMantenimientoModal(${JSON.stringify(m)})'>Edit</button>`;
        listaHistorialUL.appendChild(li);
    });
};
async function handleAgregarVehiculo(e) {
    e.preventDefault();
    if(!clienteSeleccionadoId) return alert('Selecciona cliente');
    const datos = { patente: document.getElementById('admin-patente').value, marca: document.getElementById('admin-marca').value, modelo: document.getElementById('admin-modelo').value, anio: document.getElementById('admin-anio').value, cliente_id: clienteSeleccionadoId };
    if(!datos.marca) return alert('Selecciona marca');
    await fetch(`${API_URL}/vehiculos`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenGuardado}` }, body: JSON.stringify(datos) });
    alert('Vehículo agregado'); formAgregarVehiculo.reset(); poblarSelectModelos(''); cargarVehiculosCliente(clienteSeleccionadoId);
}
async function handleAgregarMantenimiento(e) {
    e.preventDefault();
    if(!vehiculoSeleccionadoId) return alert('Selecciona vehículo');
    const datos = { fecha: document.getElementById('admin-mantenimiento-fecha').value, kilometraje: document.getElementById('admin-mantenimiento-km').value, trabajos_realizados: document.getElementById('admin-mantenimiento-trabajos').value, repuestos_usados: document.getElementById('admin-mantenimiento-repuestos').value, proxima_sugerencia: document.getElementById('admin-mantenimiento-sugerencia').value, proximo_km_sugerido: document.getElementById('admin-mantenimiento-prox-km').value, vehiculo_id: vehiculoSeleccionadoId };
    await fetch(`${API_URL}/mantenimientos`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenGuardado}` }, body: JSON.stringify(datos) });
    alert('Mantenimiento registrado'); formAgregarMantenimiento.reset(); window.seleccionarVehiculo(vehiculoSeleccionadoId, '');
}
async function cargarDatosDeVehiculos() {
    const res = await fetch(`${API_URL}/vehiculos-data/marcas`, { headers: { 'Authorization': `Bearer ${tokenGuardado}` }, cache: 'no-store' });
    marcasData = await res.json();
    poblarSelectMarcas();
}
function poblarSelectMarcas() {
    selectMarca.innerHTML = '<option value="">-- Marca --</option>';
    marcasData.forEach(m => { const val = m.nombre || m; selectMarca.add(new Option(val, val)); });
}
async function poblarSelectModelos(marca) {
    selectModelo.innerHTML = '<option value="">-- Modelo --</option>';
    if(!marca) return;
    const res = await fetch(`${API_URL}/vehiculos-data/modelos/${marca}`, { headers: { 'Authorization': `Bearer ${tokenGuardado}` }, cache: 'no-store' });
    const mods = await res.json();
    mods.forEach(m => selectModelo.add(new Option(m, m)));
}
async function cargarEstadisticas() {
    renderizarGrafico('chart-marcas-top', `${API_URL}/stats/marcas-top`, 'marca');
    renderizarGrafico('chart-modelos-top', `${API_URL}/stats/modelos-top`, 'modelo');
}
async function renderizarGrafico(id, url, key) {
    const c = document.getElementById(id); c.innerHTML = 'Cargando...';
    try {
        const res = await fetch(url, { headers: { 'Authorization': `Bearer ${tokenGuardado}` }, cache: 'no-store' });
        const data = await res.json();
        c.innerHTML = data.length ? '' : 'Sin datos.';
        const max = Math.max(...data.map(i => i.total_mantenciones)) || 1;
        data.forEach(i => {
            let label = i[key]; if(key==='modelo') label = `${i.marca} ${i.modelo}`;
            const div = document.createElement('div'); div.className = 'chart-bar';
            div.innerHTML = `<div class="chart-label" title="${label}">${label}</div><div class="chart-bar-inner" style="width: ${(i.total_mantenciones/max)*100}%">${i.total_mantenciones}</div>`;
            c.appendChild(div);
        });
    } catch(e) { c.innerHTML = 'Error'; }
}

async function handleDescargarBackup() { window.location.href = `${API_URL}/backup/download?token=${tokenGuardado}`; }
async function handleRestaurarBackup(e) { e.preventDefault(); alert('Función simulada'); }
async function handleDescargarExcel() { window.location.href = `${API_URL}/excel/download/clientes?token=${tokenGuardado}`; }
async function handleRestaurarExcel(e) { e.preventDefault(); alert('Función simulada'); }

window.openClienteModal = (c) => { document.getElementById('edit-cliente-id').value = c.id; document.getElementById('edit-cliente-nombre').value = c.nombre; document.getElementById('edit-cliente-email').value = c.email; document.getElementById('edit-cliente-telefono').value = c.telefono; document.getElementById('edit-cliente-role').value = c.role; overlay.classList.add('visible'); clienteModal.classList.add('visible'); }
window.openMantenimientoModal = (m) => { document.getElementById('edit-mantenimiento-id').value = m.id; document.getElementById('edit-mantenimiento-fecha').value = m.fecha; document.getElementById('edit-mantenimiento-km').value = m.kilometraje; document.getElementById('edit-mantenimiento-trabajos').value = m.trabajos_realizados; document.getElementById('edit-mantenimiento-repuestos').value = m.repuestos_usados; document.getElementById('edit-mantenimiento-sugerencia').value = m.proxima_sugerencia; document.getElementById('edit-mantenimiento-prox-km').value = m.proximo_km_sugerido; overlay.classList.add('visible'); mantenimientoModal.classList.add('visible'); }
function closeTodosModales() { overlay.classList.remove('visible'); document.querySelectorAll('.modal').forEach(m => m.classList.remove('visible')); }
function handleUpdateCliente(e) { e.preventDefault(); alert('Actualizado'); closeTodosModales(); cargarListaClientes(); }
function handleUpdateVehiculo(e) { e.preventDefault(); alert('Actualizado'); closeTodosModales(); }
function handleUpdateMantenimiento(e) { e.preventDefault(); alert('Actualizado'); closeTodosModales(); }

window.deleteCliente = async (id) => { if(confirm('Borrar?')) { await fetch(`${API_URL}/clientes/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${tokenGuardado}` } }); cargarListaClientes(); }};
window.deleteVehiculo = async (id) => { if(confirm('Borrar?')) { await fetch(`${API_URL}/vehiculos/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${tokenGuardado}` } }); cargarVehiculosCliente(clienteSeleccionadoId); }};
function closeClienteModal() { closeTodosModales(); }
function closeVehiculoModal() { closeTodosModales(); }
function closeMantenimientoModal() { closeTodosModales(); }
function handleCerrarSesion() { localStorage.clear(); window.location.href = 'login.html'; }
