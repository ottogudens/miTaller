import { initRouter, navigate } from './modules/router.js';
import { showError } from './modules/ui.js';
import * as MiPerfilController from './controllers/mi-perfil.js';

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('gudexToken');
    const userStr = localStorage.getItem('gudexUser');

    if (!token || !userStr) {
        window.location.href = 'login.html';
        return;
    }

    const user = JSON.parse(userStr);
    const welcomeMsg = document.getElementById('bienvenida-usuario');
    if (welcomeMsg) welcomeMsg.innerHTML = `Hola, <strong>${user.nombre}</strong>`;

    iniciarReloj();
    initRouter();

    document.getElementById('logout-button')?.addEventListener('click', () => {
        localStorage.clear();
        window.location.href = 'login.html';
    });

    document.addEventListener('routeChanged', async (e) => {
        const view = e.detail.view;
        try {
            if (['dashboard', 'vehiculos', 'agendar'].includes(view)) {
                await MiPerfilController.init(view);
            }
        } catch (err) { console.error(err); }
    });

    navigate('dashboard');
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