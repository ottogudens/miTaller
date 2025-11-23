const API_URL = '/api'; // Cambiar si no usas Nginx

async function request(endpoint, method = 'GET', body = null) {
    const token = localStorage.getItem('gudexToken');
    if (!token) {
        window.location.href = 'login.html';
        return null;
    }

    const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
    const config = { method, headers };
    if (body) config.body = JSON.stringify(body);

    try {
        const res = await fetch(`${API_URL}${endpoint}`, config);
        if (res.status === 401) {
            localStorage.clear();
            window.location.href = 'login.html';
            return null;
        }
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
        return data;
    } catch (err) {
        console.error(`[API] ${endpoint}`, err);
        throw err;
    }
}

export const get = (url) => request(url, 'GET');
export const post = (url, data) => request(url, 'POST', data);
export const put = (url, data) => request(url, 'PUT', data);
export const del = (url) => request(url, 'DELETE');