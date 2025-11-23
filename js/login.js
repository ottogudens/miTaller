const API_URL = '/api';

const loginForm = document.getElementById('login-form');

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const respuesta = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await respuesta.json();

            if (!respuesta.ok) throw new Error(data.error || 'Error al iniciar sesión');
            if (!data.user || !data.token) throw new Error('Respuesta del servidor inválida.');

            localStorage.setItem('gudexToken', data.token);
            localStorage.setItem('gudexUser', JSON.stringify(data.user));

            if (data.user.role === 'admin') window.location.href = 'admin.html';
            else window.location.href = 'index.html';

        } catch (error) {
            alert(error.message);
        }
    });
}