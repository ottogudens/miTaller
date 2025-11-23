import { get, post, put, del } from '../modules/api.js';
import { showSuccess, showError, showConfirm } from '../modules/ui.js';

let clienteSeleccionado = null;
let vehiculoSeleccionado = null;
let itemsMantenimiento = [];
let productosCache = [];
const dom = {};

export async function init() {
    console.log('🔧 Inicializando Controlador de Clientes...');
    dom.listaClientes = document.getElementById('lista-clientes-ul');
    dom.formCrear = document.getElementById('form-crear-cliente');
    dom.columnaDetalles = document.getElementById('columna-detalles');
    dom.detalleNombre = document.getElementById('detalle-cliente-nombre');
    dom.detalleInfo = document.getElementById('detalle-cliente-info');
    dom.btnPdf = document.getElementById('btn-pdf-cliente');
    dom.formVehiculo = document.getElementById('form-agregar-vehiculo');
    dom.listaVehiculos = document.getElementById('lista-vehiculos-ul');
    dom.formMant = document.getElementById('form-agregar-mantenimiento');
    dom.inputScan = document.getElementById('input-scan-barcode');
    dom.selectProd = document.getElementById('select-producto-mantencion');
    dom.inputCant = document.getElementById('cant-producto-mantencion');
    dom.btnAddProd = document.getElementById('btn-add-producto');
    dom.listaItems = document.getElementById('lista-productos-agregados');
    dom.modalEditar = document.getElementById('cliente-modal');
    dom.formEditar = document.getElementById('form-edit-cliente');

    if (dom.formCrear) dom.formCrear.addEventListener('submit', handleCrearCliente);
    if (dom.formVehiculo) dom.formVehiculo.addEventListener('submit', handleAgregarVehiculo);
    if (dom.formEditar) dom.formEditar.addEventListener('submit', handleActualizarCliente);
    if (dom.formMant) dom.formMant.addEventListener('submit', handleGuardarMantencion);
    if (dom.btnPdf) dom.btnPdf.addEventListener('click', descargarFicha);
    if (dom.btnAddProd) dom.btnAddProd.addEventListener('click', agregarItemManual);
    if (dom.inputScan) dom.inputScan.addEventListener('keypress', (e) => { if (e.key === 'Enter') { e.preventDefault(); handleScan(dom.inputScan.value); } });
    
    if (dom.listaItems) dom.listaItems.addEventListener('click', (e) => {
        if (e.target.closest('.btn-delete')) eliminarItemCarrito(e.target.closest('li').dataset.index);
    });

    if (dom.listaClientes) dom.listaClientes.addEventListener('click', (e) => {
        const item = e.target.closest('li');
        if (!item) return;
        if (e.target.closest('.btn-delete')) return eliminarCliente(item.dataset.id);
        if (e.target.closest('.btn-edit')) return abrirModalEditar(JSON.parse(item.dataset.cliente));
        seleccionarCliente(item.dataset.id);
    });

    if (dom.listaVehiculos) dom.listaVehiculos.addEventListener('click', (e) => {
        const item = e.target.closest('li');
        if (!item) return;
        if (e.target.closest('.btn-delete')) eliminarVehiculo(e.target.closest('.btn-delete').dataset.id);
        else seleccionarVehiculo(item.dataset.id, item.dataset.patente, item.dataset.modelo);
    });

    await Promise.all([cargarListaClientes(), cargarProductosCache()]);
}

async function cargarListaClientes() {
    try {
        const clientes = await get('/clientes');
        dom.listaClientes.innerHTML = clientes.map(c => `
            <li class="list-item" data-id="${c.id}" data-cliente='${JSON.stringify(c).replace(/'/g, "&#39;")}'>
                <span class="list-item-label"><i class="fa-solid fa-user"></i> ${c.nombre}</span>
                <div><button class="btn-edit"><i class="fa-solid fa-pen"></i></button><button class="btn-delete"><i class="fa-solid fa-trash"></i></button></div>
            </li>`).join('');
    } catch (e) { dom.listaClientes.innerHTML = '<li>Error cargando clientes</li>'; }
}

async function seleccionarCliente(id) {
    try {
        const c = await get(`/clientes/${id}`);
        clienteSeleccionado = c;
        dom.columnaDetalles.classList.remove('hidden');
        dom.detalleNombre.textContent = c.nombre;
        dom.detalleInfo.textContent = `${c.email} | ${c.telefono}`;
        vehiculoSeleccionado = null;
        if(document.getElementById('admin-mantenimiento-trabajos')) document.getElementById('admin-mantenimiento-trabajos').value = ''; 
        await cargarVehiculos(id);
    } catch (e) { showError('Error cargando cliente'); }
}

async function cargarVehiculos(id) {
    const vehs = await get(`/clientes/${id}/vehiculos`);
    dom.listaVehiculos.innerHTML = vehs.length ? vehs.map(v => `
        <li class="list-item" data-id="${v.id}" data-patente="${v.patente}" data-modelo="${v.marca} ${v.modelo}" style="cursor:pointer;">
            <span class="list-item-label"><i class="fa-solid fa-car"></i> <strong>${v.patente}</strong> - ${v.marca} ${v.modelo}</span>
            <button class="btn-delete" data-id="${v.id}"><i class="fa-solid fa-trash"></i></button>
        </li>`).join('') : '<li>Sin vehículos</li>';
}

function seleccionarVehiculo(id, patente, modelo) {
    vehiculoSeleccionado = { id, patente, modelo };
    document.querySelectorAll('#lista-vehiculos-ul li').forEach(l => l.style.border = '1px solid #e9ecef');
    const item = document.querySelector(`#lista-vehiculos-ul li[data-id="${id}"]`);
    if(item) item.style.border = '2px solid #CC0000';
    showSuccess(`Vehículo seleccionado: ${patente}`);
}

async function cargarProductosCache() {
    try {
        productosCache = await get('/productos');
        dom.selectProd.innerHTML = '<option value="">Buscar manual...</option>';
        productosCache.forEach(p => {
            const label = p.tipo === 'SERVICIO' ? '[SERV]' : `(Stock: ${p.stock})`;
            dom.selectProd.add(new Option(`${label} ${p.nombre} - $${p.precio_venta}`, p.id));
        });
    } catch (e) { console.error('Error cache productos', e); }
}

function handleScan(code) {
    const p = productosCache.find(x => x.barcode === code || x.codigo === code);
    if (p) agregarAlCarrito(p, 1);
    else showError('Producto no encontrado');
    dom.inputScan.value = ''; dom.inputScan.focus();
}

function agregarItemManual() {
    const id = dom.selectProd.value;
    const cant = parseInt(dom.inputCant.value) || 1;
    const p = productosCache.find(x => x.id == id);
    if (p) agregarAlCarrito(p, cant);
}

function agregarAlCarrito(producto, cantidad) {
    itemsMantenimiento.push({ id: producto.id, nombre: producto.nombre, precio: producto.precio_venta, cantidad, categoria: producto.tipo });
    renderCarrito();
}

function renderCarrito() {
    dom.listaItems.innerHTML = itemsMantenimiento.map((item, idx) => `
        <li data-index="${idx}">
            <span>${item.nombre} (x${item.cantidad})</span>
            <span>$${(item.precio * item.cantidad).toLocaleString()} <button type="button" class="btn-delete" style="margin-left:5px;">X</button></span>
        </li>`).join('');
}

function eliminarItemCarrito(index) { itemsMantenimiento.splice(index, 1); renderCarrito(); }

async function handleGuardarMantencion(e) {
    e.preventDefault();
    if (!vehiculoSeleccionado) return showError('¡Selecciona un vehículo primero!');
    const datos = {
        fecha: document.getElementById('admin-mantenimiento-fecha').value,
        kilometraje: document.getElementById('admin-mantenimiento-km').value,
        trabajos_realizados: document.getElementById('admin-mantenimiento-trabajos').value,
        repuestos_usados: document.getElementById('admin-mantenimiento-repuestos').value,
        proxima_sugerencia: document.getElementById('admin-mantenimiento-sugerencia').value,
        proximo_km_sugerido: document.getElementById('admin-mantenimiento-prox-km').value,
        vehiculo_id: vehiculoSeleccionado.id, items: itemsMantenimiento
    };
    try {
        await post('/mantenimientos', datos);
        if (document.getElementById('imprimir-ticket').checked) generarTicket(datos);
        showSuccess('Mantención registrada');
        dom.formMant.reset(); itemsMantenimiento = []; renderCarrito();
    } catch (e) { showError(e.message); }
}

function generarTicket(datos) {
    const itemsHtml = datos.items.map(i => `<div>- ${i.nombre} x${i.cantidad} ($${i.precio*i.cantidad})</div>`).join('');
    const w = window.open('', 'PRINT', 'height=600,width=400');
    w.document.write(`<html><head><style>body{font-family:monospace;font-size:12px;width:72mm;}</style></head><body><center><b>GUDEX SERVITECA</b><br>Ticket</center><hr>Cliente: ${clienteSeleccionado.nombre}<br>Vehículo: ${vehiculoSeleccionado.patente}<br>Fecha: ${datos.fecha}<hr><b>Trabajos:</b><br>${datos.trabajos_realizados}<br><b>Insumos:</b><br>${itemsHtml}<hr><center>Gracias</center></body></html>`);
    w.document.close(); w.focus(); setTimeout(() => { w.print(); w.close(); }, 500);
}

export async function abrirPerfilCliente(id) { await seleccionarCliente(id); }
export async function prepararMantencionExterna(datos) {
    await seleccionarCliente(datos.cid);
    setTimeout(() => {
        seleccionarVehiculo(datos.vid, datos.pat, 'Vehículo Cita');
        document.getElementById('admin-mantenimiento-trabajos').value = datos.serv;
        dom.formMant.scrollIntoView({behavior:'smooth'});
    }, 500);
}

async function handleCrearCliente(e) {
    e.preventDefault();
    try {
        await post('/auth/register', {
            nombre: document.getElementById('admin-nombre').value,
            email: document.getElementById('admin-email').value,
            password: document.getElementById('admin-password').value,
            telefono: document.getElementById('admin-telefono').value,
            role: document.getElementById('admin-role').value
        });
        showSuccess('Cliente creado'); dom.formCrear.reset(); cargarListaClientes();
    } catch (e) { showError(e.message); }
}

async function handleAgregarVehiculo(e) {
    e.preventDefault();
    if(!clienteSeleccionado) return showError('Selecciona cliente');
    try {
        await post('/vehiculos', {
            patente: document.getElementById('admin-patente').value,
            marca: document.getElementById('admin-marca').value,
            modelo: document.getElementById('admin-modelo').value,
            anio: document.getElementById('admin-anio').value,
            cliente_id: clienteSeleccionado.id
        });
        showSuccess('Vehículo agregado'); dom.formVehiculo.reset(); cargarVehiculos(clienteSeleccionado.id);
    } catch (e) { showError(e.message); }
}

function descargarFicha() {
    if(clienteSeleccionado) {
        const t = localStorage.getItem('gudexToken');
        window.open(`/api/reports/cliente/${clienteSeleccionado.id}?token=${t}`, '_blank');
    }
}

function abrirModalEditar(cliente) {
    document.getElementById('edit-cliente-id').value = cliente.id;
    document.getElementById('edit-cliente-nombre').value = cliente.nombre;
    document.getElementById('edit-cliente-email').value = cliente.email;
    document.getElementById('edit-cliente-telefono').value = cliente.telefono;
    document.getElementById('edit-cliente-role').value = cliente.role;
    dom.modalEditar.classList.add('visible');
    document.getElementById('modal-overlay').classList.add('visible');
}

async function handleActualizarCliente(e) {
    e.preventDefault();
    const id = document.getElementById('edit-cliente-id').value;
    const datos = {
        nombre: document.getElementById('edit-cliente-nombre').value,
        email: document.getElementById('edit-cliente-email').value,
        telefono: document.getElementById('edit-cliente-telefono').value,
        role: document.getElementById('edit-cliente-role').value
    };
    try {
        await put(`/clientes/${id}`, datos);
        showSuccess('Cliente actualizado');
        dom.modalEditar.classList.remove('visible');
        document.getElementById('modal-overlay').classList.remove('visible');
        cargarListaClientes();
        if (clienteSeleccionado && clienteSeleccionado.id == id) seleccionarCliente(id);
    } catch (error) { showError('Error al actualizar cliente'); }
}

async function eliminarCliente(id) {
    if (!await showConfirm('¿Eliminar Cliente?', 'Se borrarán también sus vehículos e historial.')) return;
    try {
        await del(`/clientes/${id}`);
        showSuccess('Cliente eliminado');
        dom.columnaDetalles.classList.add('hidden');
        clienteSeleccionado = null;
        cargarListaClientes();
    } catch (error) { showError('No se pudo eliminar el cliente.'); }
}

async function eliminarVehiculo(id) {
    if (!await showConfirm('¿Borrar vehículo?')) return;
    try {
        await del(`/vehiculos/${id}`);
        if (clienteSeleccionado) cargarVehiculos(clienteSeleccionado.id);
        showSuccess('Vehículo eliminado');
    } catch (error) { showError('Error al eliminar vehículo'); }
}