import { get, post, del } from '../modules/api.js';
import { showSuccess, showError, showConfirm } from '../modules/ui.js';

const dom = {};

export async function init() {
    console.log('📦 Inicializando Inventario...');
    dom.tbodyInventario = document.getElementById('tbody-inventario');
    dom.formProducto = document.getElementById('form-crear-producto');
    dom.formProveedor = document.getElementById('form-crear-proveedor');
    dom.listaProveedores = document.getElementById('lista-proveedores');
    dom.selCatPadre = document.getElementById('prod-cat-padre');
    dom.selCatHija = document.getElementById('prod-cat-hija');
    dom.selProveedor = document.getElementById('prod-proveedor');

    if (dom.formProducto) dom.formProducto.addEventListener('submit', handleCrearProducto);
    if (dom.formProveedor) dom.formProveedor.addEventListener('submit', handleCrearProveedor);
    if (dom.selCatPadre) dom.selCatPadre.addEventListener('change', (e) => cargarCategoriasHijas(e.target.value, dom.selCatHija));
    if (dom.tbodyInventario) dom.tbodyInventario.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-delete');
        if (btn) eliminarProducto(btn.dataset.id);
    });
    if (dom.listaProveedores) dom.listaProveedores.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-delete');
        if (btn) eliminarProveedor(btn.dataset.id);
    });

    await Promise.all([cargarInventario(), cargarProveedores(), cargarCategoriasPadres(dom.selCatPadre)]);
}

export async function initServicios() {
    console.log('🔧 Inicializando Servicios...');
    dom.tbodyServicios = document.getElementById('tbody-servicios');
    dom.formServicio = document.getElementById('form-crear-servicio');
    dom.selServPadre = document.getElementById('serv-cat-padre');
    dom.selServHija = document.getElementById('serv-cat-hija');

    if (dom.formServicio) dom.formServicio.addEventListener('submit', handleCrearServicio);
    if (dom.selServPadre) dom.selServPadre.addEventListener('change', (e) => cargarCategoriasHijas(e.target.value, dom.selServHija));
    if (dom.tbodyServicios) dom.tbodyServicios.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-delete');
        if (btn) eliminarProducto(btn.dataset.id, true);
    });

    await Promise.all([cargarServicios(), cargarCategoriasPadres(dom.selServPadre)]);
}

async function cargarInventario() {
    dom.tbodyInventario.innerHTML = '<tr><td colspan="7" class="text-center">Cargando...</td></tr>';
    try {
        const productos = await get('/productos?tipo=PRODUCTO');
        if (productos.length === 0) {
            dom.tbodyInventario.innerHTML = '<tr><td colspan="7" class="text-center">Sin productos.</td></tr>';
            return;
        }
        dom.tbodyInventario.innerHTML = productos.map(p => `
            <tr>
                <td>${p.barcode || p.codigo || '-'}</td><td>${p.nombre}</td>
                <td>${p.categoria_hija_nombre || p.categoria_padre_nombre || 'General'}</td>
                <td><small>${p.proveedor_nombre || '-'}</small></td>
                <td><strong>${p.stock}</strong></td><td>$${p.precio_venta}</td>
                <td><button class="btn-delete" data-id="${p.id}"><i class="fa-solid fa-trash"></i></button></td>
            </tr>`).join('');
    } catch (error) { dom.tbodyInventario.innerHTML = '<tr><td colspan="7">Error.</td></tr>'; }
}

async function handleCrearProducto(e) {
    e.preventDefault();
    const data = {
        tipo: 'PRODUCTO', barcode: document.getElementById('prod-barcode').value, codigo: document.getElementById('prod-codigo').value,
        nombre: document.getElementById('prod-nombre').value, categoria_padre_id: dom.selCatPadre.value, categoria_hija_id: dom.selCatHija.value,
        proveedor_id: dom.selProveedor.value, costo: document.getElementById('prod-costo').value,
        precio_venta: document.getElementById('prod-precio').value, stock: document.getElementById('prod-stock').value
    };
    try { await post('/productos', data); showSuccess('Producto guardado'); dom.formProducto.reset(); cargarInventario(); } 
    catch (error) { showError(error.message); }
}

async function eliminarProducto(id, esServicio = false) {
    if (!await showConfirm('¿Eliminar ítem?')) return;
    try { await del(`/productos/${id}`); showSuccess('Eliminado'); esServicio ? cargarServicios() : cargarInventario(); } 
    catch (error) { showError('Error al eliminar.'); }
}

async function cargarServicios() {
    dom.tbodyServicios.innerHTML = '<tr><td colspan="4" class="text-center">Cargando...</td></tr>';
    try {
        const servicios = await get('/productos?tipo=SERVICIO');
        dom.tbodyServicios.innerHTML = servicios.map(s => `
            <tr>
                <td><strong>${s.nombre}</strong></td><td>${s.categoria_hija_nombre || s.categoria_padre_nombre || '-'}</td>
                <td>$${s.precio_venta}</td><td><button class="btn-delete" data-id="${s.id}"><i class="fa-solid fa-trash"></i></button></td>
            </tr>`).join('');
    } catch (error) { dom.tbodyServicios.innerHTML = '<tr><td colspan="4">Error.</td></tr>'; }
}

async function handleCrearServicio(e) {
    e.preventDefault();
    const data = {
        tipo: 'SERVICIO', nombre: document.getElementById('serv-nombre').value,
        categoria_padre_id: dom.selServPadre.value, categoria_hija_id: dom.selServHija.value,
        precio_venta: document.getElementById('serv-precio').value, stock: 0
    };
    try { await post('/productos', data); showSuccess('Servicio creado'); dom.formServicio.reset(); cargarServicios(); } 
    catch (error) { showError(error.message); }
}

async function cargarProveedores() {
    try {
        const proveedores = await get('/proveedores');
        if (dom.listaProveedores) dom.listaProveedores.innerHTML = proveedores.map(p => `<li class="list-item"><span><i class="fa-solid fa-truck"></i> ${p.nombre}</span><button class="btn-delete" data-id="${p.id}"><i class="fa-solid fa-trash"></i></button></li>`).join('');
        if (dom.selProveedor) { dom.selProveedor.innerHTML = '<option value="">-- Seleccionar --</option>'; proveedores.forEach(p => dom.selProveedor.add(new Option(p.nombre, p.id))); }
    } catch (error) { console.error(error); }
}

async function handleCrearProveedor(e) {
    e.preventDefault();
    const data = { nombre: document.getElementById('prov-nombre').value, rut: document.getElementById('prov-rut').value, telefono: document.getElementById('prov-telefono').value, email: document.getElementById('prov-email').value };
    try { await post('/proveedores', data); showSuccess('Proveedor creado'); dom.formProveedor.reset(); cargarProveedores(); } 
    catch (error) { showError(error.message); }
}

async function eliminarProveedor(id) {
    if (!await showConfirm('¿Borrar Proveedor?')) return;
    try { await del(`/proveedores/${id}`); cargarProveedores(); showSuccess('Eliminado'); } 
    catch (error) { showError('Error al borrar.'); }
}

async function cargarCategoriasPadres(selectElement) {
    if (!selectElement) return;
    try { const padres = await get('/categorias/padres'); selectElement.innerHTML = '<option value="">Categoría Principal</option>'; padres.forEach(p => selectElement.add(new Option(p.nombre, p.id))); } catch (e) {}
}

async function cargarCategoriasHijas(padreId, selectElement) {
    if (!selectElement) return;
    selectElement.innerHTML = '<option value="">Subcategoría</option>';
    if (!padreId) return;
    try { const hijos = await get(`/categorias/hijos/${padreId}`); hijos.forEach(h => selectElement.add(new Option(h.nombre, h.id))); } catch (e) {}
}