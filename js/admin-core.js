import { initRouter, navigate } from './modules/router.js';
import { showSuccess } from './modules/ui.js';

// Controladores
import * as DashboardController from './controllers/dashboard.js';
import * as ClientesController from './controllers/clientes.js';
import * as InventarioController from './controllers/inventario.js';
import * as RecepcionController from './controllers/recepcion.js';
import * as ConfigController from './controllers/config.js';
import * as StatsController from './controllers/stats.js';

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('gudexToken');
    const userStr = localStorage.getItem('gudexUser');
    
    if (!token || !userStr) {
        window.location.href = 'login.html';
        return;
    }
    
    const user = JSON.parse(userStr);
    if(user.role !== 'admin') {
        window.location.href = 'index.html';
        return;
    }

    iniciarReloj();
    initRouter();

    document.getElementById('logout-button')?.addEventListener('click', () => {
        localStorage.clear();
        window.location.href = 'login.html';
    });

    document.addEventListener('routeChanged', async (e) => {
        const view = e.detail.view;
        try {
            switch(view) {
                case 'citas': await DashboardController.init(); break;
                case 'clientes': await ClientesController.init(); break;
                case 'inventario': await InventarioController.init(); break;
                case 'servicios': await InventarioController.initServicios(); break;
                case 'buscador': await RecepcionController.init(); break;
                case 'config-vehiculos': 
                case 'sistema': await ConfigController.init(); break;
                case 'estadisticas': await StatsController.init(); break;
            }
        } catch (err) { console.error('Error controlador:', err); }
    });

    document.addEventListener('navegar-a-mantencion', async (e) => {
        const data = e.detail; 
        navigate('clientes');
        await ClientesController.init();
        await ClientesController.prepararMantencionExterna(data);
    });

    document.addEventListener('navegar-a-cliente', async (e) => {
        const id = e.detail.id;
        navigate('clientes');
        await ClientesController.init();
        await ClientesController.abrirPerfilCliente(id);
    });

    navigate('citas');
});

function iniciarReloj() {
    const div = document.getElementById('reloj-sistema');
    if (!div) return;
    const update = () => {
        const now = new Date();
        div.innerHTML = `<div>${now.toLocaleDateString('es-CL')}</div><strong>${now.toLocaleTimeString('es-CL')}</strong>`;
    };
    update();
    setInterval(update, 1000);
}