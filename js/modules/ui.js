export const showSuccess = (title, text = '') => {
    Swal.fire({ icon: 'success', title, text, timer: 2000, showConfirmButton: false });
};
export const showError = (text, title = 'Error') => {
    Swal.fire({ icon: 'error', title, text });
};
export const showConfirm = async (title, text, confirmText = 'Sí') => {
    const res = await Swal.fire({
        title, text, icon: 'warning', showCancelButton: true,
        confirmButtonColor: '#CC0000', cancelButtonColor: '#2c3e50',
        confirmButtonText: confirmText, cancelButtonText: 'Cancelar'
    });
    return res.isConfirmed;
};
export const showLoading = (msg = 'Cargando...') => {
    Swal.fire({ title: msg, allowOutsideClick: false, didOpen: () => Swal.showLoading() });
};
export const closeLoading = () => Swal.close();