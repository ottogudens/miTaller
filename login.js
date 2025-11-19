const API_URL = '/api'; // Ruta relativa para producción

const loginForm = document.getElementById('login-form');

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const respuesta = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await respuesta.json();

            // --- CORRECCIÓN DEL ERROR ---
            // 1. Verificamos si la respuesta NO fue exitosa (ej: 400 o 500)
            if (!respuesta.ok) {
                // Lanzamos un error con el mensaje del servidor para ir al bloque catch
                throw new Error(data.error || 'Error al iniciar sesión');
            }

            // 2. Verificamos que 'user' realmente exista antes de leer 'role'
            if (!data.user || !data.token) {
                throw new Error('Respuesta del servidor inválida.');
            }
            // -----------------------------

            // 3. Si todo está bien, guardamos y redirigimos
            localStorage.setItem('gudexToken', data.token);
            localStorage.setItem('gudexUser', JSON.stringify(data.user));

            alert(`Bienvenido, ${data.user.nombre}`);

            if (data.user.role === 'admin') {
                window.location.href = 'admin.html';
            } else {
                window.location.href = 'index.html';
            }

        } catch (error) {
            console.error('Error de login:', error);
            alert(error.message); // Muestra "Credenciales inválidas" o el error real
        }
    });
}
