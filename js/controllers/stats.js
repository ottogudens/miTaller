import { get } from '../modules/api.js';

export async function init() {
    console.log('📊 Estadísticas...');
    renderChart('chart-marcas-top', '/stats/marcas-top', 'marca');
    renderChart('chart-modelos-top', '/stats/modelos-top', 'modelo');
}

async function renderChart(elementId, endpoint, keyLabel) {
    const container = document.getElementById(elementId);
    if(!container) return;
    container.innerHTML = 'Cargando...';
    try {
        const data = await get(endpoint);
        if(data.length === 0) { container.innerHTML = 'Sin datos.'; return; }
        const max = Math.max(...data.map(d => d.total_mantenciones));
        const colors = ['#CC0000', '#2c3e50', '#f39c12', '#27ae60', '#8e44ad'];
        container.innerHTML = data.map((item, i) => {
            const label = keyLabel === 'modelo' ? `${item.marca} ${item.modelo}` : item[keyLabel];
            const width = (item.total_mantenciones / max) * 100;
            return `<div class="chart-bar"><div class="chart-label">${label}</div><div class="chart-track"><div class="chart-bar-inner" style="width:${width}%; background:${colors[i%5]}">${item.total_mantenciones}</div></div></div>`;
        }).join('');
    } catch (e) { container.innerHTML = 'Error.'; }
}