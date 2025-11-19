// --- Configuración ---
const API_URL = '/api'; // Ruta relativa

// --- Variables Globales de Sesión ---
let usuarioLogueado = null;
let tokenGuardado = null;
let vehiculoActivo = null; 
let listaDeVehiculos = []; 
let datosUltimoMantenimiento = {}; // Para guardar la sugerencia

// --- Elementos de Navegación ---
const sidebarLinks = document.querySelectorAll('.sidebar-nav a');
const contentViews = document.querySelectorAll('.content-view');


/**
 * -----------------------------------------------------------------
 * INICIO: Verificación de Seguridad
 * -----------------------------------------------------------------
 */
function verificarAutenticacion() {
    const token = localStorage.getItem('gudexToken');
    const usuarioJSON = localStorage.getItem('gudexUser');

    if (!token || !usuarioJSON) {
        console.log('No hay sesión, redirigiendo a login...');
        window.location.href = 'login.html';
        return false;
    }

    const usuario = JSON.parse(usuarioJSON);

    if (usuario.role === 'admin') {
        console.log('Es admin, redirigiendo a panel de admin...');
        window.location.href = 'admin.html';
        return false;
    }

    // ASIGNACIÓN DE VARIABLES GLOBALES
    usuarioLogueado = usuario;
    tokenGuardado = token;
    return true;
}

/**
 * Evento que se dispara cuando todo el HTML ha cargado.
 */
document.addEventListener('DOMContentLoaded', () => {
    if (verificarAutenticacion()) {
        
        // --- Configurar Navegación del Sidebar ---
        sidebarLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const viewId = link.dataset.view; // ej: "dashboard"
                showView(viewId);
            });
        });

        // Carga de datos inicial
        cargarDatosPaginaCliente();
        cargarEstadoCitas();
        
        // ESTA ES LA FUNCIÓN QUE DABA ERROR (Ahora está definida abajo)
        configurarInputFecha(); 
        
        // Listeners
        const formAgendar = document.getElementById('form-agendar');
        if(formAgendar) formAgendar.addEventListener('submit', handleAgendarCita);

        const btnLogout = document.getElementById('logout-button');
        if(btnLogout) btnLogout.addEventListener('click', handleCerrarSesion);

        const selectorVehiculo = document.getElementById('selector-vehiculo');
        if(selectorVehiculo) {
            selectorVehiculo.addEventListener('change', (e) => {
                const vehiculoId = e.target.value;
                if (vehiculoId) {
                    const vehiculoSeleccionado = listaDeVehiculos.find(v => v.id == vehiculoId);
                    handleSeleccionarVehiculo(vehiculoSeleccionado);
                }
            });
        }
        
        const btnSugerencia = document.getElementById('btn-agendar-sugerencia');
        if(btnSugerencia) btnSugerencia.addEventListener('click', handleAgendarSugerencia);
    }
});

// =================================================================
// FUNCIÓN DE NAVEGACIÓN
// =================================================================
function showView(viewId) {
    contentViews.forEach(view => {
        view.classList.remove('active');
    });
    sidebarLinks.forEach(link => {
        link.classList.remove('active');
    });

    const viewToShow = document.getElementById(`view-${viewId}`);
    if (viewToShow) {
        viewToShow.classList.add('active');
    }
    const linkToActivate = document.querySelector(`.sidebar-nav a[data-view="${viewId}"]`);
    if (linkToActivate) {
        linkToActivate.classList.add('active');
    }
}

/**
 * --- CORRECCIÓN: Definición de la función faltante ---
 * Configura el input de fecha para que no permita fechas pasadas
 */
function configurarInputFecha() {
    const inputFecha = document.getElementById('fecha-cita-dia');
    if (inputFecha) {
        const now = new Date();
        // Ajuste zona horaria local
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        const nowString = now.toISOString().slice(0, 10); // YYYY-MM-DD
        inputFecha.min = nowString;
    }
}

/**
 * Valida solo el día (fin de semana o pasado)
 */
function validarHorarioCliente(fechaDiaString) {
    if (!fechaDiaString) { return 'Error: Debes seleccionar una fecha.'; }
    const fecha = new Date(fechaDiaString + 'T00:00:00Z');
    const diaSemana = fecha.getUTCDay();
    if (diaSemana === 0 || diaSemana === 6) { return 'Error: No se puede reservar en fin de semana (sábado o domingo).'; }
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaInput = new Date(fechaDiaString + 'T00:00:00'); 
    if (fechaInput < hoy) { return 'Error: No se puede reservar en una fecha pasada.'; }
    return null; // Sin error
}

/**
 * Carga los datos del saludo y el selector de vehículos
 */
async function cargarDatosPaginaCliente() {
    if (!usuarioLogueado) return;
    document.getElementById('bienvenida-usuario').textContent = `Bienvenido, ${usuarioLogueado.nombre}`;
    try {
        const respuesta = await fetch(`${API_URL}/clientes/${usuarioLogueado.id}/vehiculos`, { 
            headers: { 'Authorization': `Bearer ${tokenGuardado}` },
            cache: 'no-store' 
        });
        if (!respuesta.ok) throw new Error('Error al buscar vehículos');
        const vehiculos = await respuesta.json();
        listaDeVehiculos = vehiculos; 
        if (vehiculos.length > 0) {
            poblarSelectorVehiculos(vehiculos);
            handleSeleccionarVehiculo(vehiculos[0]); // Selecciona el primero por defecto
        } else {
            const selector = document.getElementById('selector-vehiculo');
            selector.innerHTML = '<option value="">No tienes vehículos registrados</option>';
            document.getElementById('vehiculo-nombre').textContent = '';
            document.getElementById('historial-tbody').innerHTML = '<tr><td colspan="4" style="text-align: center;">Pide al administrador registrar tu vehículo.</td></tr>';
            document.getElementById('proxima-sugerencia-texto').innerHTML = 'No hay datos de vehículo.';
        }
    } catch (error) { console.error('Error cargando datos de página:', error); }
}

/**
 * Rellena el menú desplegable con los vehículos
 */
function poblarSelectorVehiculos(vehiculos) {
    const selector = document.getElementById('selector-vehiculo');
    selector.innerHTML = ''; 
    vehiculos.forEach(v => {
        const opcion = document.createElement('option');
        opcion.value = v.id;
        opcion.textContent = `${v.marca} ${v.modelo} (${v.patente})`;
        selector.appendChild(opcion);
    });
}

/**
 * Se activa al seleccionar un vehículo.
 */
function handleSeleccionarVehiculo(vehiculo) {
    if (!vehiculo) return;
    vehiculoActivo = vehiculo;
    document.getElementById('selector-vehiculo').value = vehiculo.id; 
    mostrarDatosVehiculo(vehiculo);
    cargarHistorialYSugerencias(vehiculo.id); 
}

/**
 * Actualiza el HTML con los datos del vehículo
 */
function mostrarDatosVehiculo(vehiculo) {
    document.getElementById('vehiculo-nombre').textContent = `${vehiculo.marca} ${vehiculo.modelo}`;
    const detallesLista = document.getElementById('vehiculo-detalles');
    detallesLista.innerHTML = `
        <li><strong>Patente:</strong> ${vehiculo.patente}</li>
        <li><strong>Año:</strong> ${vehiculo.anio}</li>
    `;
}

/**
 * Carga el historial (con repuestos) Y la última sugerencia (con KM)
 */
async function cargarHistorialYSugerencias(vehiculoId) {
    const tablaBody = document.getElementById('historial-tbody');
    const sugerenciaTexto = document.getElementById('proxima-sugerencia-texto');
    const btnAgendarSugerencia = document.getElementById('btn-agendar-sugerencia');
    datosUltimoMantenimiento = {}; 

    try {
        const respuesta = await fetch(`${API_URL}/vehiculos/${vehiculoId}/mantenimientos`, {
            headers: { 'Authorization': `Bearer ${tokenGuardado}` },
            cache: 'no-store'
        });
        if (!respuesta.ok) throw new Error('Error al cargar historial');
        
        const historial = await respuesta.json(); 
        
        // --- 1. Poblar la TABLA DE HISTORIAL ---
        tablaBody.innerHTML = ''; 
        if (historial.length === 0) {
            tablaBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Este vehículo no tiene mantenimientos registrados.</td></tr>';
        } else {
            historial.forEach(mantenimiento => {
                const fila = document.createElement('tr');
                fila.innerHTML = `
                    <td>${mantenimiento.fecha}</td>
                    <td>${mantenimiento.trabajos_realizados}</td> 
                    <td>${mantenimiento.repuestos_usados || 'N/A'}</td>
                    <td>${mantenimiento.kilometraje ? mantenimiento.kilometraje + ' km' : 'N/A'}</td>
                `;
                tablaBody.appendChild(fila);
            });
        }

        // --- 2. Poblar la TARJETA DE SUGERENCIAS Y BOTÓN ---
        const ultimoRegistro = historial[0];
        let sugerenciaHTML = '';
        let textoParaFormulario = '';
        let agendar = false;

        if (ultimoRegistro) {
            datosUltimoMantenimiento = {
                trabajos: ultimoRegistro.trabajos_realizados,
                km: ultimoRegistro.proximo_km_sugerido,
                sugerencia: ultimoRegistro.proxima_sugerencia
            };
            
            const proximoKm = datosUltimoMantenimiento.km;
            const proximaSugerencia = datosUltimoMantenimiento.sugerencia;

            if (proximoKm) {
                const textoKm = `Próxima mantención a los ${proximoKm} km (basado en ${datosUltimoMantenimiento.trabajos || 'último servicio'}).`;
                sugerenciaHTML += `<strong>Servicio Programado:</strong> ${textoKm}`;
                textoParaFormulario = textoKm;
                agendar = true;
            }
            if (proximaSugerencia) {
                if (proximoKm) { sugerenciaHTML += '<br>'; textoParaFormulario += ' - '; }
                sugerenciaHTML += `<strong>Consejo del Mecánico:</strong> ${proximaSugerencia}`;
                textoParaFormulario += proximaSugerencia;
                agendar = true;
            }
        }

        if (!agendar) {
            sugerenciaTexto.innerHTML = 'No hay sugerencias recientes registradas.';
            btnAgendarSugerencia.style.display = 'none';
        } else {
            sugerenciaTexto.innerHTML = sugerenciaHTML;
            btnAgendarSugerencia.style.display = 'block';
            btnAgendarSugerencia.dataset.servicio = textoParaFormulario; 
        }

    } catch (error) {
        console.error('Error cargando historial y sugerencias:', error);
        tablaBody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: red;">Error al cargar historial.</td></tr>';
        sugerenciaTexto.textContent = 'Error al cargar sugerencias.';
        if(btnAgendarSugerencia) btnAgendarSugerencia.style.display = 'none';
    }
}

/**
 * Acción: Rellena el formulario al hacer clic en 'Agendar Servicio'
 */
function handleAgendarSugerencia(e) {
    e.preventDefault();
    const servicioSugerido = e.target.dataset.servicio;
    
    // Navegar a la vista 'agendar'
    showView('agendar');
    
    const inputServicio = document.getElementById('servicio-cita');
    if (servicioSugerido) {
        inputServicio.value = servicioSugerido;
    }
    inputServicio.focus(); 
}

/**
 * Maneja el envío del formulario para agendar citas
 */
async function handleAgendarCita(evento) {
    evento.preventDefault(); 
    if (!vehiculoActivo) { alert('Error: No hay un vehículo seleccionado para agendar la cita.'); return; }
    const fechaDia = document.getElementById('fecha-cita-dia').value;
    const fechaHora = document.getElementById('fecha-cita-hora').value;
    if (!fechaHora) { alert('Error: Debes seleccionar una hora.'); return; }
    const errorMsg = validarHorarioCliente(fechaDia);
    if (errorMsg) { alert(errorMsg); return; }
    
    const fechaISOCompleta = `${fechaDia}T${fechaHora}:00`;
    const servicio = document.getElementById('servicio-cita').value;
    const datosCita = {
        fecha_cita: fechaISOCompleta,
        servicio_solicitado: servicio,
        cliente_id: usuarioLogueado.id,
        vehiculo_id: vehiculoActivo.id
    };

    try {
        const respuesta = await fetch(`${API_URL}/citas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenGuardado}` },
            body: JSON.stringify(datosCita) 
        });
        const resultado = await respuesta.json();
        if (!respuesta.ok) { throw new Error(resultado.error || 'Error del servidor'); }
        
        alert(`¡Cita agendada con éxito! Queda pendiente de confirmación.`);
        document.getElementById('form-agendar').reset();
        
        // Recargar dashboard y volver a la vista principal
        cargarEstadoCitas(); 
        showView('dashboard');

    } catch (error) {
        console.error('Error al agendar la cita:', error);
        alert(`Error al agendar la cita: ${error.message}`);
    }
}

/**
 * Carga y renderiza el historial de citas del cliente.
 */
async function cargarEstadoCitas() {
    if (!usuarioLogueado) return;
    try {
        const respuesta = await fetch(`${API_URL}/clientes/${usuarioLogueado.id}/citas`, { 
            headers: { 'Authorization': `Bearer ${tokenGuardado}` },
            cache: 'no-store'
        });
        if (!respuesta.ok) throw new Error('Error al cargar el estado de las citas');
        
        const citas = await respuesta.json();
        const listaUL = document.getElementById('lista-estado-citas');
        listaUL.innerHTML = '';
        
        if (citas.length === 0) { 
            listaUL.innerHTML = '<li>Aún no tienes citas registradas.</li>'; 
            return; 
        }
        
        citas.forEach(cita => {
            const li = document.createElement('li');
            li.className = 'cita-cliente-item';
            const fecha = new Date(cita.fecha_cita).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' });
            let estadoClase = '';

            switch (cita.estado) {
                case 'Pendiente': estadoClase = 'status-pendiente'; break;
                case 'Confirmada': estadoClase = 'status-confirmada'; break;
                case 'Terminada': estadoClase = 'status-terminada'; break;
                case 'Rechazada': estadoClase = 'status-rechazada'; break;
                default: estadoClase = 'status-pendiente';
            }
            
            li.innerHTML = `
                <div class="cita-cliente-info">
                    <p><strong>${fecha}</strong></p>
                    <p>${cita.servicio_solicitado}</p>
                    <p><em>${cita.vehiculo_patente}</em></p>
                </div>
                <div class="cita-cliente-estado ${estadoClase}">
                    ${cita.estado}
                </div>
            `;
            listaUL.appendChild(li);
        });
    } catch (error) {
        console.error('Error cargando estado de citas:', error);
        document.getElementById('lista-estado-citas').innerHTML = '<li>Error al cargar citas.</li>';
    }
}

/**
 * Acción: Cierra la sesión del cliente
 */
function handleCerrarSesion() {
    localStorage.removeItem('gudexToken');
    localStorage.removeItem('gudexUser');
    window.location.href = 'login.html';
}
