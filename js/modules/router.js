export function initRouter() {
    const links = document.querySelectorAll('.sidebar-nav a[data-view]');
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navigate(link.dataset.view);
        });
    });
    document.querySelectorAll('.nav-toggle').forEach(t => {
        t.addEventListener('click', (e) => {
            e.preventDefault();
            t.parentElement.classList.toggle('open');
        });
    });
}

export function navigate(viewId) {
    document.querySelectorAll('.content-view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.sidebar-nav a').forEach(l => l.classList.remove('active'));

    const viewEl = document.getElementById(`view-${viewId}`);
    if (viewEl) viewEl.classList.add('active');

    const linkEl = document.querySelector(`.sidebar-nav a[data-view="${viewId}"]`);
    if (linkEl) {
        linkEl.classList.add('active');
        const group = linkEl.closest('.nav-group');
        if (group) group.classList.add('open');
    }

    document.dispatchEvent(new CustomEvent('routeChanged', { detail: { view: viewId } }));
}