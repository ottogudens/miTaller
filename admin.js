const API_URL = '/api';
let tokenGuardado = null;
let usuarioLogueado = null;
let clienteSeleccionadoId = null; 
let vehiculoSeleccionadoId = null; 
let marcaSeleccionadaId = null;
let catPadreSeleccionadaId = null;
let marcasData = [];
let productosData = [];
let itemsMantenimiento = [];
let vehiculoSeleccionadoPatente = '';
let vehiculoSeleccionadoModelo = '';
const chartColors = ['#CC0000', '#2c3e50', '#e67e22', '#27ae60', '#8e44ad', '#2980b9', '#f1c40f'];

// DOM
let colDetalles, listaClientesUL, listaVehiculosUL, listaHistorialUL;
let detalleNombre, detalleInfo, btnPdfCliente, formCrearCliente, formAgregarVehiculo, logoutButton, formAgregarMantenimiento, formAdminAgendarCita;
let mantenimientoModal, closeMantenimientoModalBtn, formEditMantenimiento, overlay;
let clienteModal, closeClienteModalBtn, formEditCliente;
let vehiculoModal, closeVehiculoModalBtn, formEditVehiculo;
let listaCitasPendientesUL, listaCitasConfirmadasUL, listaCitasTerminadasUL;
let formBackupRestore, btnDescargarBackup, inputFileBackup, formExcelRestore, btnDescargarExcel, inputFileExcel;
let sidebarLinks, contentViews, selectMarca, selectModelo;
let formBuscadorPatente, resultadoBusqueda, btnIrCliente;
let formCrearMarca, listaConfigMarcas, formCrearModelo, listaConfigModelos, panelModelos, tituloModelosMarca;
let formBuscadorMantenciones, tbodyMantenciones, quickModal, closeQuickModalBtn, formQuickMantencion;
let formExcelVehiculos, btnDescargarExcelVehiculos, inputFileVehiculos;
let formCrearProducto, tbodyInventario, selectProductoMant, btnAddProducto, listaProductosAgregados;
let formCrearProveedor, listaProveedores, selectProdProveedor;
let formExcelProductos, btnDescargarExcelProductos, inputFileProductos;
let formCrearServicio, tbodyServicios, selectCatPadre, selectCatHija, formCrearCatPadre, listaCatPadres, panelCatHijos, formCrearCatHija, listaCatHijos;
let inputScanBarcode, selectServCatPadre, selectServCatHija;
let formScannerInventario, scannerInput, panelExistente, panelNuevo, formUpdateStock, formCrearScan;

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('gudexToken');
    const usuarioJSON = localStorage.getItem('gudexUser');
    if (!token || !usuarioJSON) { window.location.href = 'login.html'; return; }
    const usuario = JSON.parse(usuarioJSON);
    if (usuario.role !== 'admin') { window.location.href = 'index.html'; return; }
    tokenGuardado = token; usuarioLogueado = usuario;

    // ASIGNACIONES
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
    formExcelVehiculos = document.getElementById('form-excel-vehiculos');
    btnDescargarExcelVehiculos = document.getElementById('btn-descargar-excel-vehiculos');
    inputFileVehiculos = document.getElementById('excel-file-vehiculos');
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
    formBuscadorMantenciones = document.getElementById('form-buscador-mantenciones');
    tbodyMantenciones = document.getElementById('tbody-mantenciones');
    quickModal = document.getElementById('quick-mantencion-modal');
    closeQuickModalBtn = document.getElementById('close-quick-modal');
    formQuickMantencion = document.getElementById('form-quick-mantencion');
    formCrearProducto = document.getElementById('form-crear-producto');
    tbodyInventario = document.getElementById('tbody-inventario');
    selectProductoMant = document.getElementById('select-producto-mantencion');
    btnAddProducto = document.getElementById('btn-add-producto');
    listaProductosAgregados = document.getElementById('lista-productos-agregados');
    formCrearProveedor = document.getElementById('form-crear-proveedor');
    listaProveedores = document.getElementById('lista-proveedores');
    selectProdProveedor = document.getElementById('prod-proveedor');
    formExcelProductos = document.getElementById('form-excel-productos');
    btnDescargarExcelProductos = document.getElementById('btn-descargar-excel-productos');
    inputFileProductos = document.getElementById('excel-file-productos');
    selectCatPadre = document.getElementById('prod-cat-padre');
    selectCatHija = document.getElementById('prod-cat-hija');
    formCrearCatPadre = document.getElementById('form-crear-cat-padre');
    listaCatPadres = document.getElementById('lista-cat-padres');
    panelCatHijos = document.getElementById('panel-cat-hijos');
    formCrearCatHija = document.getElementById('form-crear-cat-hija');
    listaCatHijos = document.getElementById('lista-cat-hijos');
    inputScanBarcode = document.getElementById('input-scan-barcode');
    selectServCatPadre = document.getElementById('serv-cat-padre');
    selectServCatHija = document.getElementById('serv-cat-hija');
    formCrearServicio = document.getElementById('form-crear-servicio');
    tbodyServicios = document.getElementById('tbody-servicios');
    formScannerInventario = document.getElementById('form-scanner-inventario');
    scannerInput = document.getElementById('scanner-input');
    panelExistente = document.getElementById('panel-existente');
    panelNuevo = document.getElementById('panel-nuevo');
    formUpdateStock = document.getElementById('form-update-stock');
    formCrearScan = document.getElementById('form-crear-scan');

    const hoy = new Date().toISOString().split('T')[0];
    document.querySelectorAll('input[type="date"]').forEach(i => i.min = hoy);

    iniciarReloj();
    iniciarPanelAdmin();
});

function iniciarReloj() {
    const div = document.getElementById('reloj-sistema'); if(!div) return;
    const update = () => { const now = new Date(); div.innerHTML = `<div>${now.toLocaleDateString('es-CL')}</div><strong>${now.toLocaleTimeString('es-CL')}</strong>`; };
    update(); setInterval(update, 1000);
}

function iniciarPanelAdmin() {
    document.querySelectorAll('.nav-toggle').forEach(t => t.addEventListener('click', (e) => { e.preventDefault(); t.parentElement.classList.toggle('open'); }));
    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const viewId = link.dataset.view;
            if (viewId === 'estadisticas') cargarEstadisticas();
            if (viewId === 'config-vehiculos') cargarConfigMarcas();
            if (viewId === 'mantenciones') handleBuscarMantenciones(null);
            if (viewId === 'inventario') { cargarInventario(); cargarProveedores(); cargarCategoriasPadres(); cargarCategoriasPadresSelect(); }
            if (viewId === 'servicios') { cargarServicios(); cargarCategoriasServicios(); }
            if (viewId === 'config-categorias') cargarCategoriasPadres();
            if (viewId === 'toma-inventario' && scannerInput) setTimeout(() => scannerInput.focus(), 500);
            showView(viewId);
        });
    });

    cargarDashboardCitas(); cargarListaClientes(); cargarDatosDeVehiculos(); cargarInventario();

    if(formCrearCliente) formCrearCliente.addEventListener('submit', handleCrearCliente);
    if(formAgregarVehiculo) formAgregarVehiculo.addEventListener('submit', handleAgregarVehiculo);
    if(formAgregarMantenimiento) formAgregarMantenimiento.addEventListener('submit', handleAgregarMantenimiento);
    if(formAdminAgendarCita) formAdminAgendarCita.addEventListener('submit', handleAdminAgendarCita);
    if(logoutButton) logoutButton.addEventListener('click', handleCerrarSesion);
    if(selectMarca) selectMarca.addEventListener('change', () => poblarSelectModelos(selectMarca.value));
    if(btnPdfCliente) btnPdfCliente.addEventListener('click', handleDescargarFichaCliente);
    if(formBuscadorPatente) formBuscadorPatente.addEventListener('submit', handleBuscarPatente);
    if(formCrearMarca) formCrearMarca.addEventListener('submit', handleCrearMarca);
    if(formCrearModelo) formCrearModelo.addEventListener('submit', handleCrearModelo);
    if(formBuscadorMantenciones) formBuscadorMantenciones.addEventListener('submit', handleBuscarMantenciones);
    if(formQuickMantencion) formQuickMantencion.addEventListener('submit', handleQuickMantencion);
    if(formCrearProducto) formCrearProducto.addEventListener('submit', handleCrearProducto);
    if(btnAddProducto) btnAddProducto.addEventListener('click', agregarProductoALista);
    if(formCrearProveedor) formCrearProveedor.addEventListener('submit', handleCrearProveedor);
    if(selectCatPadre) selectCatPadre.addEventListener('change', () => cargarCategoriasHijasSelect(selectCatPadre.value, selectCatHija));
    if(selectServCatPadre) selectServCatPadre.addEventListener('change', () => cargarCategoriasHijasSelect(selectServCatPadre.value, selectServCatHija));
    if(formCrearCatPadre) formCrearCatPadre.addEventListener('submit', handleCrearCatPadre);
    if(formCrearCatHija) formCrearCatHija.addEventListener('submit', handleCrearCatHija);
    if(formCrearServicio) formCrearServicio.addEventListener('submit', handleCrearServicio);
    if(inputScanBarcode) { inputScanBarcode.addEventListener('keypress', (e) => { if(e.key === 'Enter') { e.preventDefault(); handleScanBarcode(inputScanBarcode.value); } }); }
    if(formScannerInventario) { formScannerInventario.addEventListener('submit', (e) => { e.preventDefault(); const code = scannerInput.value.trim(); if(code) handleScanInventario(code); }); }
    if(formUpdateStock) formUpdateStock.addEventListener('submit', handleUpdateStock);
    if(formCrearScan) formCrearScan.addEventListener('submit', handleCrearScan);

    if(btnDescargarBackup) btnDescargarBackup.addEventListener('click', handleDescargarBackup);
    if(formBackupRestore) formBackupRestore.addEventListener('submit', handleRestaurarBackup);
    if(btnDescargarExcel) btnDescargarExcel.addEventListener('click', handleDescargarExcel);
    if(formExcelRestore) formExcelRestore.addEventListener('submit', handleRestaurarExcel);
    if(btnDescargarExcelVehiculos) btnDescargarExcelVehiculos.addEventListener('click', handleDescargarExcelVehiculos);
    if(formExcelVehiculos) formExcelVehiculos.addEventListener('submit', handleRestaurarExcelVehiculos);
    if(btnDescargarExcelProductos) btnDescargarExcelProductos.addEventListener('click', handleDescargarExcelProductos);
    if(formExcelProductos) formExcelProductos.addEventListener('submit', handleRestaurarExcelProductos);

    if(formEditCliente) formEditCliente.addEventListener('submit', handleUpdateCliente);
    if(formEditVehiculo) formEditVehiculo.addEventListener('submit', handleUpdateVehiculo);
    if(formEditMantenimiento) formEditMantenimiento.addEventListener('submit', handleUpdateMantenimiento);

    if(closeClienteModalBtn) closeClienteModalBtn.addEventListener('click', closeTodosModales);
    if(closeVehiculoModalBtn) closeVehiculoModalBtn.addEventListener('click', closeTodosModales);
    if(closeMantenimientoModalBtn) closeMantenimientoModalBtn.addEventListener('click', closeTodosModales);
    if(closeQuickModalBtn) closeQuickModalBtn.addEventListener('click', () => { quickModal.classList.remove('visible'); overlay.classList.remove('visible'); });
    if(overlay) overlay.addEventListener('click', closeTodosModales);
}

function showView(viewId) {
    contentViews.forEach(v => v.classList.remove('active'));
    sidebarLinks.forEach(l => l.classList.remove('active'));
    const viewToShow = document.getElementById(`view-${viewId}`);
    const link = document.querySelector(`.sidebar-nav a[data-view="${viewId}"]`);
    if(viewToShow) viewToShow.classList.add('active');
    if(link) { const parent = link.closest('.nav-group'); if(parent) parent.classList.add('open'); link.classList.add('active'); }
}

// ESCANER TOMA INVENTARIO
async function handleScanInventario(code) {
    panelExistente.classList.add('hidden'); panelNuevo.classList.add('hidden');
    try {
        const res = await fetch(`${API_URL}/productos/barcode/${code}`, { headers: { 'Authorization': `Bearer ${tokenGuardado}` }, cache: 'no-store' });
        const data = await res.json();
        if (data.encontrado) {
            document.getElementById('scan-id').value = data.data.id;
            document.getElementById('scan-nombre').textContent = data.data.nombre;
            document.getElementById('scan-stock-actual').textContent = data.data.stock;
            document.getElementById('scan-nuevo-stock').value = '';
            panelExistente.classList.remove('hidden'); document.getElementById('scan-nuevo-stock').focus();
        } else {
            document.getElementById('scan-new-code').textContent = code;
            document.getElementById('new-scan-code').value = code;
            panelNuevo.classList.remove('hidden'); document.getElementById('new-scan-nombre').focus();
        }
    } catch (e) { alert('Error al escanear'); }
    scannerInput.value = '';
}
async function handleUpdateStock(e) {
    e.preventDefault(); const id = document.getElementById('scan-id').value; const nuevoStock = document.getElementById('scan-nuevo-stock').value;
    await fetch(`${API_URL}/productos/${id}/stock`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenGuardado}` }, body: JSON.stringify({ nuevo_stock: nuevoStock }) });
    alert('Stock Actualizado'); panelExistente.classList.add('hidden'); scannerInput.focus();
}
async function handleCrearScan(e) {
    e.preventDefault();
    const datos = { barcode: document.getElementById('new-scan-code').value, nombre: document.getElementById('new-scan-nombre').value, categoria: document.getElementById('new-scan-cat').value, costo: document.getElementById('new-scan-costo').value, precio_venta: document.getElementById('new-scan-precio').value, stock: document.getElementById('new-scan-stock').value, tipo: 'PRODUCTO' };
    await fetch(`${API_URL}/productos`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenGuardado}` }, body: JSON.stringify(datos) });
    alert('Producto Creado'); panelNuevo.classList.add('hidden'); document.getElementById('form-crear-scan').reset(); scannerInput.focus();
}

// ESCANER MANTENCION
function handleScanBarcode(code) {
    if(!code) return;
    const prod = productosData.find(p => p.barcode === code || p.codigo === code);
    if(prod) { itemsMantenimiento.push({ id: prod.id, nombre: prod.nombre, cantidad: 1, precio: prod.precio_venta, categoria: prod.categoria }); renderizarCarrito(); inputScanBarcode.value = ''; inputScanBarcode.focus(); } else { alert('No encontrado'); inputScanBarcode.value = ''; }
}

// SERVICIOS
async function cargarCategoriasServicios() {
    const res = await fetch(`${API_URL}/categorias/padres`, { headers: { 'Authorization': `Bearer ${tokenGuardado}` }, cache: 'no-store' }); const padres = await res.json();
    if(selectServCatPadre) { selectServCatPadre.innerHTML = '<option value="">Categoría</option>'; padres.forEach(p => selectServCatPadre.add(new Option(p.nombre, p.id))); }
}
async function handleCrearServicio(e) {
    e.preventDefault(); const datos = { tipo: 'SERVICIO', nombre: document.getElementById('serv-nombre').value, categoria_padre_id: document.getElementById('serv-cat-padre').value, categoria_hija_id: document.getElementById('serv-cat-hija').value, precio_venta: document.getElementById('serv-precio').value, stock: 0 };
    await fetch(`${API_URL}/productos`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenGuardado}` }, body: JSON.stringify(datos) });
    alert('Servicio creado'); document.getElementById('form-crear-servicio').reset(); cargarServicios();
}
async function cargarServicios() {
    const res = await fetch(`${API_URL}/productos?tipo=SERVICIO`, { headers: { 'Authorization': `Bearer ${tokenGuardado}` }, cache: 'no-store' }); const servicios = await res.json(); tbodyServicios.innerHTML = '';
    servicios.forEach(s => { const tr = document.createElement('tr'); tr.innerHTML = `<td>${s.nombre}</td><td>${s.categoria_hija_nombre||s.categoria_padre_nombre||'-'}</td><td>$${s.precio_venta}</td><td><button class="btn-delete" onclick="window.borrarProducto(${s.id})">X</button></td>`; tbodyServicios.appendChild(tr); });
}

// CATEGORIAS
async function cargarCategoriasPadres() { const res = await fetch(`${API_URL}/categorias/padres`, { headers: { 'Authorization': `Bearer ${tokenGuardado}` }, cache: 'no-store' }); const padres = await res.json(); if(listaCatPadres) { listaCatPadres.innerHTML = ''; padres.forEach(p => { const li = document.createElement('li'); li.innerHTML = `<span>${p.nombre}</span> <button class="btn-delete" onclick="borrarCategoria(${p.id})">X</button>`; li.onclick = (e) => { if(e.target.tagName==='BUTTON') return; catPadreSeleccionadaId = p.id; panelCatHijos.classList.remove('hidden'); cargarCategoriasHijasConfig(p.id); }; listaCatPadres.appendChild(li); }); } }
async function cargarCategoriasPadresSelect() { const res = await fetch(`${API_URL}/categorias/padres`, { headers: { 'Authorization': `Bearer ${tokenGuardado}` }, cache: 'no-store' }); const padres = await res.json(); if(selectCatPadre) { selectCatPadre.innerHTML = '<option value="">Categoría</option>'; padres.forEach(p => selectCatPadre.add(new Option(p.nombre, p.id))); } }
async function cargarCategoriasHijasSelect(padreId, targetSelect) { if(!padreId || !targetSelect) return; const res = await fetch(`${API_URL}/categorias/hijos/${padreId}`, { headers: { 'Authorization': `Bearer ${tokenGuardado}` }, cache: 'no-store' }); const hijos = await res.json(); targetSelect.innerHTML = '<option value="">Subcategoría</option>'; hijos.forEach(h => targetSelect.add(new Option(h.nombre, h.id))); }
async function cargarCategoriasHijasConfig(padreId) { const res = await fetch(`${API_URL}/categorias/hijos/${padreId}`, { headers: { 'Authorization': `Bearer ${tokenGuardado}` }, cache: 'no-store' }); const hijos = await res.json(); listaCatHijos.innerHTML = ''; hijos.forEach(h => { const li = document.createElement('li'); li.innerHTML = `<span>${h.nombre}</span> <button class="btn-delete" onclick="borrarCategoria(${h.id})">X</button>`; listaCatHijos.appendChild(li); }); }
async function handleCrearCatPadre(e) { e.preventDefault(); const nombre = document.getElementById('cat-padre-nombre').value; await fetch(`${API_URL}/categorias`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenGuardado}` }, body: JSON.stringify({ nombre }) }); cargarCategoriasPadres(); cargarCategoriasPadresSelect(); document.getElementById('cat-padre-nombre').value = ''; }
async function handleCrearCatHija(e) { e.preventDefault(); const nombre = document.getElementById('cat-hija-nombre').value; if(!catPadreSeleccionadaId) return; await fetch(`${API_URL}/categorias`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenGuardado}` }, body: JSON.stringify({ nombre, padre_id: catPadreSeleccionadaId }) }); cargarCategoriasHijasConfig(catPadreSeleccionadaId); document.getElementById('cat-hija-nombre').value = ''; }
window.borrarCategoria = async(id) => { if(confirm('¿Borrar?')) await fetch(`${API_URL}/categorias/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${tokenGuardado}` } }); cargarCategoriasPadres(); panelCatHijos.classList.add('hidden'); };

// INVENTARIO
async function cargarInventario() {
    const res = await fetch(`${API_URL}/productos`, { headers: { 'Authorization': `Bearer ${tokenGuardado}` }, cache: 'no-store' }); productosData = await res.json();
    if(tbodyInventario) { tbodyInventario.innerHTML = productosData.length ? '' : '<tr><td colspan="7">Sin productos.</td></tr>'; productosData.filter(p => p.tipo !== 'SERVICIO').forEach(p => { const tr = document.createElement('tr'); tr.innerHTML = `<td>${p.barcode||p.codigo||'-'}</td><td>${p.nombre}</td><td>${p.categoria_hija_nombre||p.subcategoria||p.categoria}</td><td><small>${p.proveedor_nombre||'-'}</small></td><td>${p.stock}</td><td>$${p.precio_venta}</td><td><button class="btn-delete" style="padding:0.2rem 0.5rem;" onclick="window.borrarProducto(${p.id})">X</button></td>`; tbodyInventario.appendChild(tr); }); }
    if(selectProductoMant) { selectProductoMant.innerHTML = '<option value="">Buscar ítem...</option>'; productosData.forEach(p => { const tipo = p.tipo === 'SERVICIO' ? '[SERV]' : `(Stock: ${p.stock})`; selectProductoMant.add(new Option(`${tipo} ${p.nombre} - $${p.precio_venta}`, p.id)); }); }
}
async function handleCrearProducto(e) { e.preventDefault(); const datos = { tipo: 'PRODUCTO', barcode: document.getElementById('prod-barcode').value, codigo: document.getElementById('prod-codigo').value, nombre: document.getElementById('prod-nombre').value, categoria_padre_id: document.getElementById('prod-cat-padre').value, categoria_hija_id: document.getElementById('prod-cat-hija').value, proveedor_id: document.getElementById('prod-proveedor').value, costo: document.getElementById('prod-costo').value, precio_venta: document.getElementById('prod-precio').value, stock: document.getElementById('prod-stock').value }; await fetch(`${API_URL}/productos`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenGuardado}` }, body: JSON.stringify(datos) }); alert('Producto guardado'); document.getElementById('form-crear-producto').reset(); cargarInventario(); }
window.borrarProducto = async (id) => { if(!confirm('¿Borrar?')) return; await fetch(`${API_URL}/productos/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${tokenGuardado}` } }); cargarInventario(); cargarServicios(); };
async function cargarProveedores() { const res = await fetch(`${API_URL}/proveedores`, { headers: { 'Authorization': `Bearer ${tokenGuardado}` }, cache: 'no-store' }); const provs = await res.json(); if(listaProveedores) { listaProveedores.innerHTML = ''; provs.forEach(p => { const li = document.createElement('li'); li.innerHTML = `<span>${p.nombre}</span> <button class="btn-delete" onclick="window.borrarProveedor(${p.id})">X</button>`; listaProveedores.appendChild(li); }); } if(selectProdProveedor) { selectProdProveedor.innerHTML = '<option value="">-- Selecciona --</option>'; provs.forEach(p => selectProdProveedor.add(new Option(p.nombre, p.id))); } }
async function handleCrearProveedor(e) { e.preventDefault(); const datos = { nombre: document.getElementById('prov-nombre').value, rut: document.getElementById('prov-rut').value, telefono: document.getElementById('prov-telefono').value, email: document.getElementById('prov-email').value }; await fetch(`${API_URL}/proveedores`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenGuardado}` }, body: JSON.stringify(datos) }); alert('Creado'); document.getElementById('form-crear-proveedor').reset(); cargarProveedores(); }
window.borrarProveedor = async (id) => { if(!confirm('¿Borrar?')) return; await fetch(`${API_URL}/proveedores/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${tokenGuardado}` } }); cargarProveedores(); };

function agregarProductoALista() { const id = selectProductoMant.value; const cant = parseInt(document.getElementById('cant-producto-mantencion').value); if(!id) return; const prod = productosData.find(p => p.id == id); itemsMantenimiento.push({ id: prod.id, nombre: prod.nombre, cantidad: cant, precio: prod.precio_venta, categoria: prod.categoria }); renderizarCarrito(); }
function renderizarCarrito() { listaProductosAgregados.innerHTML = ''; itemsMantenimiento.forEach((item, index) => { const li = document.createElement('li'); li.innerHTML = `<span>${item.nombre} (x${item.cantidad})</span> <span>$${item.precio * item.cantidad} <button type="button" class="btn-delete" onclick="window.eliminarDelCarrito(${index})">X</button></span>`; listaProductosAgregados.appendChild(li); }); }
window.eliminarDelCarrito = (index) => { itemsMantenimiento.splice(index, 1); renderizarCarrito(); };
async function handleAgregarMantenimiento(e) { e.preventDefault(); if(!vehiculoSeleccionadoId) return alert('Selecciona vehículo'); const datos = { fecha: document.getElementById('admin-mantenimiento-fecha').value, kilometraje: document.getElementById('admin-mantenimiento-km').value, trabajos_realizados: document.getElementById('admin-mantenimiento-trabajos').value, repuestos_usados: document.getElementById('admin-mantenimiento-repuestos').value, proxima_sugerencia: document.getElementById('admin-mantenimiento-sugerencia').value, proximo_km_sugerido: document.getElementById('admin-mantenimiento-prox-km').value, vehiculo_id: vehiculoSeleccionadoId, items: itemsMantenimiento }; const res = await fetch(`${API_URL}/mantenimientos`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenGuardado}` }, body: JSON.stringify(datos) }); if(res.ok) { if(document.getElementById('imprimir-ticket').checked) { const nombreCliente = document.getElementById('detalle-cliente-nombre').textContent; generarTicketTermico({ ...datos, cliente: nombreCliente, patente: vehiculoSeleccionadoPatente, modelo: vehiculoSeleccionadoModelo }); document.getElementById('imprimir-ticket').checked = false; } alert('Registrado'); formAgregarMantenimiento.reset(); itemsMantenimiento = []; renderizarCarrito(); cargarInventario(); window.seleccionarVehiculo(vehiculoSeleccionadoId, '', ''); } else alert('Error'); }
function generarTicketTermico(datos) { let itemsHtml = ''; if(datos.items && datos.items.length > 0) { itemsHtml += '<div class="item"><div class="label">Insumos:</div>'; datos.items.forEach(i => { itemsHtml += `<div>- ${i.nombre} x${i.cantidad} ($${i.precio*i.cantidad})</div>`; }); itemsHtml += '</div>'; } const ventana = window.open('', 'PRINT', 'height=600,width=400'); ventana.document.write(`<html><head><title>Ticket</title><style>body{font-family:'Courier New',monospace;width:72mm;margin:0;padding:5px;font-size:12px;color:#000;}.header{text-align:center;margin-bottom:10px;}.label{font-weight:bold;}hr{border:none;border-top:1px dashed #000;}</style></head><body><div class="header"><b>GUDEX SERVITECA</b><br>Comprobante</div><div class="info">Cliente: ${datos.cliente}<br>Vehículo: ${datos.modelo||''}<br>Patente: ${datos.patente||''}<br>Fecha: ${datos.fecha}<br>KM: ${datos.kilometraje}</div><hr><div class="content"><div class="item"><span class="label">Trabajo:</span><br>${datos.trabajos_realizados}</div>${itemsHtml}<br>${datos.repuestos_usados ? 'Ext: '+datos.repuestos_usados : ''}</div><div class="footer">Gracias por su preferencia</div></body></html>`); ventana.document.close(); ventana.focus(); setTimeout(() => { ventana.print(); ventana.close(); }, 500); }

// --- MANTENCIONES GLOBAL ---
async function handleBuscarMantenciones(e) {
    if(e) e.preventDefault(); const query = document.getElementById('input-buscar-mantencion').value.trim();
    try { const res = await fetch(`${API_URL}/mantenimientos/buscar/global?q=${query}`, { headers: { 'Authorization': `Bearer ${tokenGuardado}` }, cache: 'no-store' }); const data = await res.json(); tbodyMantenciones.innerHTML = data.length ? '' : '<tr><td colspan="5" style="text-align:center;">Sin resultados</td></tr>'; data.forEach(m => { let fechaVis = m.fecha; if(m.fecha && m.fecha.includes('-')) { const [y,mm,d] = m.fecha.split('-'); fechaVis = `${d}-${mm}-${y}`; } const tr = document.createElement('tr'); tr.innerHTML = `<td><strong>${fechaVis}</strong></td><td>${m.patente} <br><small style="color:gray;">${m.marca}</small></td><td>${m.cliente_nombre}</td><td style="max-width:300px;">${m.trabajos_realizados}</td><td><button class="btn-descargar" onclick='window.reimprimirTicket(${JSON.stringify(m)})' title="Imprimir" style="padding:0.3rem 0.6rem;margin-right:5px;"><i class="fa-solid fa-print"></i></button><button class="btn-edit" onclick='window.openMantenimientoModal(${JSON.stringify(m)})' title="Editar"><i class="fa-solid fa-pen"></i></button><button class="btn-delete" onclick="window.deleteMantenimiento(${m.id})" title="Eliminar"><i class="fa-solid fa-trash"></i></button></td>`; tbodyMantenciones.appendChild(tr); }); } catch(e) { console.error(e); }
}
window.reimprimirTicket = (m) => { generarTicketTermico({ ...m, cliente: m.cliente_nombre, modelo: `${m.marca} ${m.modelo}`, items: [] }); };
window.promptNuevaMantencion = () => { overlay.classList.add('visible'); quickModal.classList.add('visible'); document.getElementById('quick-patente').value = ''; document.getElementById('quick-patente').focus(); };
async function handleQuickMantencion(e) { e.preventDefault(); const patente = document.getElementById('quick-patente').value.trim(); const res = await fetch(`${API_URL}/vehiculos/buscar/${patente}`, { headers: { 'Authorization': `Bearer ${tokenGuardado}` }, cache: 'no-store' }); if(!res.ok) return alert('Patente no encontrada'); const data = await res.json(); closeTodosModales(); showView('clientes'); await seleccionarCliente(data.datos.cliente_id_real || data.datos.cliente_id); setTimeout(() => { seleccionarVehiculo(data.datos.id, patente, `${data.datos.marca} ${data.datos.modelo}`); formAgregarMantenimiento.scrollIntoView({behavior:'smooth'}); formAgregarMantenimiento.style.border = "2px solid red"; }, 500); }

// --- RESTO ---
async function handleBuscarPatente(e) { e.preventDefault(); const p = document.getElementById('busqueda-patente').value.trim(); if(!p)return; try { const res = await fetch(`${API_URL}/vehiculos/buscar/${p}`, { headers: { 'Authorization': `Bearer ${tokenGuardado}` }, cache: 'no-store' }); if(!res.ok) { resultadoBusqueda.classList.add('hidden'); return alert('No encontrado'); } const data = await res.json(); const v = data.datos; const h = data.historial||[]; document.getElementById('res-patente').textContent = v.patente; document.getElementById('res-marca-modelo').textContent = `${v.marca} ${v.modelo}`; document.getElementById('res-anio').textContent = v.anio; document.getElementById('res-cliente').textContent = v.cliente_nombre; document.getElementById('res-email').textContent = v.cliente_email; document.getElementById('res-telefono').textContent = v.cliente_telefono; btnIrCliente.onclick = () => { showView('clientes'); window.seleccionarCliente(v.cliente_id_real || v.cliente_id); const link = document.querySelector('[data-view="clientes"]'); if(link) { link.classList.add('active'); link.closest('.nav-group').classList.add('open'); } }; const ul = document.getElementById('res-lista-historial'); ul.innerHTML = h.length ? '' : '<li>Sin historial.</li>'; h.forEach(m => { const li = document.createElement('li'); li.className = 'list-item'; li.innerHTML = `<p><strong>${m.fecha}</strong> (${m.kilometraje}km)<br>${m.trabajos_realizados}</p>`; ul.appendChild(li); }); resultadoBusqueda.classList.remove('hidden'); } catch (error) { alert('Error buscar'); } }
async function cargarDashboardCitas() { try { const res = await fetch(`${API_URL}/citas`, { headers: { 'Authorization': `Bearer ${tokenGuardado}` }, cache: 'no-store' }); const citas = await res.json(); const hoy = new Date().toISOString().slice(0, 10); renderCitas(citas.filter(c => c.estado === 'Pendiente'), listaCitasPendientesUL, 'Pendiente'); renderCitas(citas.filter(c => c.estado === 'Confirmada'), listaCitasConfirmadasUL, 'Confirmada'); renderCitas(citas.filter(c => c.estado === 'Terminada' && c.fecha_cita.startsWith(hoy)), listaCitasTerminadasUL, 'Terminada'); } catch (e) { console.error(e); } }
function renderCitas(citas, lista, tipo) { lista.innerHTML = citas.length ? '' : '<li>Sin citas.</li>'; citas.forEach(c => { const li = document.createElement('li'); li.className = 'cita-item'; const fecha = new Date(c.fecha_cita).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' }); let botones = ''; if(tipo === 'Pendiente') botones = `<div class="cita-item-acciones"><button class="btn-confirmar" onclick="window.gestionarCita(${c.cita_id}, 'Confirmada')"><i class="fa-solid fa-check"></i> Confirmar</button><button class="btn-rechazar" onclick="window.gestionarCita(${c.cita_id}, 'Rechazada')"><i class="fa-solid fa-xmark"></i> Rechazar</button></div>`; else if(tipo === 'Confirmada') botones = `<div class="cita-item-acciones"><button class="btn-terminar" onclick="window.gestionarCita(${c.cita_id}, 'Terminada', ${c.cliente_id}, ${c.vehiculo_id}, '${c.cliente_nombre}', '${c.vehiculo_patente}', '${c.servicio_solicitado}')"><i class="fa-solid fa-flag-checkered"></i> Terminar</button></div>`; li.innerHTML = `<p><strong>${fecha}</strong><br>${c.cliente_nombre} (${c.vehiculo_patente})<br><em>${c.servicio_solicitado}</em></p>${botones}`; lista.appendChild(li); }); }
window.gestionarCita = async (id, estado, clientId, vehId, cliName, pat, serv) => { if(!confirm(`¿${estado}?`)) return; await fetch(`${API_URL}/citas/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenGuardado}` }, body: JSON.stringify({ estado }) }); cargarDashboardCitas(); if(estado === 'Terminada' && confirm("¿Registrar en historial?")) { document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active')); const clLink = document.querySelector('[data-view="clientes"]'); if(clLink) { clLink.classList.add('active'); clLink.closest('.nav-group').classList.add('open'); } showView('clientes'); await seleccionarCliente(clientId); setTimeout(() => { seleccionarVehiculo(vehId, pat, ''); document.getElementById('admin-mantenimiento-trabajos').value = serv; formAgregarMantenimiento.scrollIntoView({ behavior: 'smooth' }); formAgregarMantenimiento.style.border = "2px solid var(--primary)"; setTimeout(() => formAgregarMantenimiento.style.border = "1px solid var(--border)", 3000); }, 600); } };
async function handleAdminAgendarCita(e) { e.preventDefault(); if (!clienteSeleccionadoId || !vehiculoSeleccionadoId) return alert('Selecciona Cliente y Vehículo.'); const datos = { fecha_cita: document.getElementById('admin-cita-fecha').value + 'T' + document.getElementById('admin-cita-hora').value + ':00', servicio_solicitado: document.getElementById('admin-cita-servicio').value, cliente_id: clienteSeleccionadoId, vehiculo_id: vehiculoSeleccionadoId }; const res = await fetch(`${API_URL}/citas`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenGuardado}` }, body: JSON.stringify(datos) }); if(res.ok) { alert('Agendada.'); formAdminAgendarCita.reset(); cargarDashboardCitas(); } else alert('Error.'); }
async function cargarListaClientes() { const res = await fetch(`${API_URL}/clientes`, { headers: { 'Authorization': `Bearer ${tokenGuardado}` }, cache: 'no-store' }); const clientes = await res.json(); listaClientesUL.innerHTML = clientes.length ? '' : '<li>Sin clientes.</li>'; clientes.forEach(c => { const li = document.createElement('li'); li.className = 'list-item'; li.innerHTML = `<span class="list-item-label" onclick="window.seleccionarCliente(${c.id})"><i class="fa-solid fa-user"></i> ${c.nombre}</span><div><button class="btn-edit" onclick='window.openClienteModal(${JSON.stringify(c)})'><i class="fa-solid fa-pen"></i></button><button class="btn-delete" onclick="window.deleteCliente(${c.id})"><i class="fa-solid fa-trash"></i></button></div>`; listaClientesUL.appendChild(li); }); }
window.seleccionarCliente = async (id) => { clienteSeleccionadoId = id; colDetalles.classList.remove('hidden'); const res = await fetch(`${API_URL}/clientes/${id}`, { headers: { 'Authorization': `Bearer ${tokenGuardado}` } }); const c = await res.json(); detalleNombre.textContent = c.nombre; detalleInfo.textContent = `${c.email} | ${c.telefono}`; cargarVehiculosCliente(id); };
async function handleCrearCliente(e) { e.preventDefault(); const datos = { nombre: document.getElementById('admin-nombre').value, email: document.getElementById('admin-email').value, password: document.getElementById('admin-password').value, telefono: document.getElementById('admin-telefono').value, role: document.getElementById('admin-role').value }; await fetch(`${API_URL}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenGuardado}` }, body: JSON.stringify(datos) }); alert('Cliente creado'); formCrearCliente.reset(); cargarListaClientes(); }
async function cargarVehiculosCliente(id) { const res = await fetch(`${API_URL}/clientes/${id}/vehiculos`, { headers: { 'Authorization': `Bearer ${tokenGuardado}` }, cache: 'no-store' }); const vehs = await res.json(); listaVehiculosUL.innerHTML = vehs.length ? '' : '<li>Sin vehículos.</li>'; vehs.forEach(v => { const li = document.createElement('li'); li.className = 'list-item'; li.innerHTML = `<span class="list-item-label" onclick="window.seleccionarVehiculo(${v.id}, '${v.patente}', '${v.marca} ${v.modelo}')"><i class="fa-solid fa-car"></i> ${v.marca} ${v.modelo} (${v.patente})</span><button class="btn-delete" onclick="window.deleteVehiculo(${v.id})"><i class="fa-solid fa-trash"></i></button>`; listaVehiculosUL.appendChild(li); }); }
window.seleccionarVehiculo = async (id, patente, modelo) => { vehiculoSeleccionadoId = id; if(patente) vehiculoSeleccionadoPatente = patente; if(modelo) vehiculoSeleccionadoModelo = modelo; const res = await fetch(`${API_URL}/vehiculos/${id}/mantenimientos`, { headers: { 'Authorization': `Bearer ${tokenGuardado}` }, cache: 'no-store' }); const hist = await res.json(); listaHistorialUL.innerHTML = hist.length ? '' : '<li>Sin historial.</li>'; hist.forEach(m => { const li = document.createElement('li'); li.className = 'list-item'; li.innerHTML = `<span class="list-item-label"><strong>${m.fecha}</strong>: ${m.trabajos_realizados}</span><button class="btn-edit" onclick='window.openMantenimientoModal(${JSON.stringify(m)})'><i class="fa-solid fa-pen"></i></button>`; listaHistorialUL.appendChild(li); }); };
async function handleAgregarVehiculo(e) { e.preventDefault(); if(!clienteSeleccionadoId) return alert('Selecciona cliente'); const datos = { patente: document.getElementById('admin-patente').value, marca: document.getElementById('admin-marca').value, modelo: document.getElementById('admin-modelo').value, anio: document.getElementById('admin-anio').value, cliente_id: clienteSeleccionadoId }; if(!datos.marca) return alert('Marca requerida'); await fetch(`${API_URL}/vehiculos`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenGuardado}` }, body: JSON.stringify(datos) }); alert('Agregado'); formAgregarVehiculo.reset(); poblarSelectModelos(''); cargarVehiculosCliente(clienteSeleccionadoId); }
async function handleDescargarFichaCliente() { if (!clienteSeleccionadoId) return alert('Selecciona cliente'); window.open(`${API_URL}/reports/cliente/${clienteSeleccionadoId}?token=${tokenGuardado}`, '_blank'); }
async function cargarConfigMarcas() { const res = await fetch(`${API_URL}/vehiculos-data/marcas`, { headers: { 'Authorization': `Bearer ${tokenGuardado}` }, cache: 'no-store' }); const marcas = await res.json(); listaConfigMarcas.innerHTML = ''; marcas.forEach(m => { const li = document.createElement('li'); const nombre = m.nombre || m; const id = m.id; li.innerHTML = `<span>${nombre}</span> <button class="btn-delete" type="button">X</button>`; li.querySelector('button').onclick = (e) => { e.stopPropagation(); window.borrarMarca(id); }; li.onclick = () => { seleccionarMarcaConfig(id, nombre); document.querySelectorAll('#lista-config-marcas li').forEach(l => l.classList.remove('selected')); li.classList.add('selected'); }; listaConfigMarcas.appendChild(li); }); }
async function handleCrearMarca(e) { e.preventDefault(); const nombre = document.getElementById('nueva-marca-nombre').value.trim(); if(!nombre) return; await fetch(`${API_URL}/vehiculos-data/marcas`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenGuardado}` }, body: JSON.stringify({ nombre }) }); document.getElementById('nueva-marca-nombre').value = ''; cargarConfigMarcas(); cargarDatosDeVehiculos(); }
window.borrarMarca = async (id) => { if(!confirm('¿Borrar marca y modelos?')) return; await fetch(`${API_URL}/vehiculos-data/marcas/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${tokenGuardado}` } }); cargarConfigMarcas(); panelModelos.classList.add('hidden'); cargarDatosDeVehiculos(); };
async function seleccionarMarcaConfig(id, nombre) { marcaSeleccionadaId = id; tituloModelosMarca.textContent = `Modelos: ${nombre}`; document.getElementById('info-modelos-marca').style.display = 'none'; panelModelos.classList.remove('hidden'); cargarConfigModelos(id); }
async function cargarConfigModelos(marcaId) { const res = await fetch(`${API_URL}/vehiculos-data/modelos-by-id/${marcaId}`, { headers: { 'Authorization': `Bearer ${tokenGuardado}` }, cache: 'no-store' }); const modelos = await res.json(); listaConfigModelos.innerHTML = modelos.length ? '' : '<li>Sin modelos.</li>'; modelos.forEach(m => { const li = document.createElement('li'); li.innerHTML = `<span>${m.nombre}</span> <button class="btn-delete" onclick="window.borrarModelo(${m.id})">X</button>`; listaConfigModelos.appendChild(li); }); }
async function handleCrearModelo(e) { e.preventDefault(); const nombre = document.getElementById('nuevo-modelo-nombre').value.trim(); if(!nombre || !marcaSeleccionadaId) return alert('Selecciona marca'); await fetch(`${API_URL}/vehiculos-data/modelos`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenGuardado}` }, body: JSON.stringify({ nombre, marca_id: marcaSeleccionadaId }) }); document.getElementById('nuevo-modelo-nombre').value = ''; cargarConfigModelos(marcaSeleccionadaId); }
window.borrarModelo = async (id) => { if(!confirm('¿Borrar?')) return; await fetch(`${API_URL}/vehiculos-data/modelos/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${tokenGuardado}` } }); cargarConfigModelos(marcaSeleccionadaId); };
async function cargarDatosDeVehiculos() { const res = await fetch(`${API_URL}/vehiculos-data/marcas`, { headers: { 'Authorization': `Bearer ${tokenGuardado}` }, cache: 'no-store' }); marcasData = await res.json(); poblarSelectMarcas(); }
function poblarSelectMarcas() { selectMarca.innerHTML = '<option value="">-- Marca --</option>'; marcasData.forEach(m => { const val = m.nombre || m; selectMarca.add(new Option(val, val)); }); }
async function poblarSelectModelos(marca) { selectModelo.innerHTML = '<option value="">-- Modelo --</option>'; if(!marca) return; const res = await fetch(`${API_URL}/vehiculos-data/modelos/${marca}`, { headers: { 'Authorization': `Bearer ${tokenGuardado}` }, cache: 'no-store' }); const mods = await res.json(); mods.forEach(m => selectModelo.add(new Option(m, m))); }
async function cargarEstadisticas() { renderizarGrafico('chart-marcas-top', `${API_URL}/stats/marcas-top`, 'marca'); renderizarGrafico('chart-modelos-top', `${API_URL}/stats/modelos-top`, 'modelo'); }
async function renderizarGrafico(id, url, key) { const c = document.getElementById(id); c.innerHTML = 'Cargando...'; try { const res = await fetch(url, { headers: { 'Authorization': `Bearer ${tokenGuardado}` }, cache: 'no-store' }); const data = await res.json(); c.innerHTML = data.length ? '' : 'Sin datos.'; const max = Math.max(...data.map(i => i.total_mantenciones)) || 1; data.forEach((item, idx) => { const color = chartColors[idx % chartColors.length]; let label = item[key]; if(key==='modelo') label = `${item.marca} ${item.modelo}`; const div = document.createElement('div'); div.className = 'chart-bar'; div.innerHTML = `<div class="chart-label" title="${label}">${label}</div><div class="chart-track"><div class="chart-bar-inner" style="width: ${(item.total_mantenciones/max)*100}%; background-color: ${color};">${item.total_mantenciones}</div></div>`; c.appendChild(div); }); } catch(e) { c.innerHTML = 'Error'; } }
async function handleDescargarBackup() { window.location.href = `${API_URL}/backup/download?token=${tokenGuardado}`; }
async function handleRestaurarBackup(e) { e.preventDefault(); const file = document.getElementById('backup-file').files[0]; if(!file) return alert('Archivo?'); const formData = new FormData(); formData.append('backupFile', file); const res = await fetch(`${API_URL}/backup/restore?token=${tokenGuardado}`, { method: 'POST', body: formData }); if(res.ok) alert('Restaurado.'); else alert('Error.'); }
async function handleDescargarExcel() { window.location.href = `${API_URL}/excel/download/clientes?token=${tokenGuardado}`; }
async function handleRestaurarExcel(e) { e.preventDefault(); const file = document.getElementById('excel-file').files[0]; if(!file) return alert('Archivo?'); const formData = new FormData(); formData.append('excelFile', file); const res = await fetch(`${API_URL}/excel/restore/clientes?token=${tokenGuardado}`, { method: 'POST', body: formData }); if(res.ok) { alert('Cargado.'); cargarListaClientes(); } else alert('Error.'); }
async function handleDescargarExcelVehiculos() { window.location.href = `${API_URL}/excel/download/vehiculos?token=${tokenGuardado}`; }
async function handleRestaurarExcelVehiculos(e) { e.preventDefault(); const file = document.getElementById('excel-file-vehiculos').files[0]; if(!file) return alert('Archivo?'); const formData = new FormData(); formData.append('excelFile', file); const res = await fetch(`${API_URL}/excel/restore/vehiculos?token=${tokenGuardado}`, { method: 'POST', body: formData }); if(res.ok) { alert('Cargado.'); cargarConfigMarcas(); } else alert('Error.'); }
async function handleDescargarExcelProductos() { window.location.href = `${API_URL}/excel/download/productos?token=${tokenGuardado}`; }
async function handleRestaurarExcelProductos(e) { e.preventDefault(); const file = document.getElementById('excel-file-productos').files[0]; if(!file) return alert('Archivo?'); const formData = new FormData(); formData.append('excelFile', file); const res = await fetch(`${API_URL}/excel/restore/productos?token=${tokenGuardado}`, { method: 'POST', body: formData }); if(res.ok) { alert('Cargado.'); cargarInventario(); } else alert('Error.'); }
window.openClienteModal = (c) => { document.getElementById('edit-cliente-id').value = c.id; document.getElementById('edit-cliente-nombre').value = c.nombre; document.getElementById('edit-cliente-email').value = c.email; document.getElementById('edit-cliente-telefono').value = c.telefono; document.getElementById('edit-cliente-role').value = c.role; overlay.classList.add('visible'); clienteModal.classList.add('visible'); }
window.openMantenimientoModal = (m) => { document.getElementById('edit-mantenimiento-id').value = m.id; document.getElementById('edit-mantenimiento-fecha').value = m.fecha; document.getElementById('edit-mantenimiento-km').value = m.kilometraje; document.getElementById('edit-mantenimiento-trabajos').value = m.trabajos_realizados; document.getElementById('edit-mantenimiento-repuestos').value = m.repuestos_usados; document.getElementById('edit-mantenimiento-sugerencia').value = m.proxima_sugerencia; document.getElementById('edit-mantenimiento-prox-km').value = m.proximo_km_sugerido; overlay.classList.add('visible'); mantenimientoModal.classList.add('visible'); }
function closeTodosModales() { overlay.classList.remove('visible'); document.querySelectorAll('.modal').forEach(m => m.classList.remove('visible')); }
function handleUpdateCliente(e) { e.preventDefault(); alert('Actualizado'); closeTodosModales(); cargarListaClientes(); }
function handleUpdateVehiculo(e) { e.preventDefault(); alert('Actualizado'); closeTodosModales(); }
function handleUpdateMantenimiento(e) { e.preventDefault(); alert('Actualizado'); closeTodosModales(); }
window.deleteCliente = async (id) => { if(confirm('¿Borrar?')) { await fetch(`${API_URL}/clientes/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${tokenGuardado}` } }); cargarListaClientes(); }};
window.deleteVehiculo = async (id) => { if(confirm('¿Borrar?')) { await fetch(`${API_URL}/vehiculos/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${tokenGuardado}` } }); cargarVehiculosCliente(clienteSeleccionadoId); }};
window.deleteMantenimiento = async (id) => { if(confirm('¿Borrar mantención?')) { await fetch(`${API_URL}/mantenimientos/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${tokenGuardado}` } }); handleBuscarMantenciones(null); }};
function closeClienteModal() { closeTodosModales(); }
function closeVehiculoModal() { closeTodosModales(); }
function closeMantenimientoModal() { closeTodosModales(); }
function handleCerrarSesion() { localStorage.clear(); window.location.href = 'login.html'; }
