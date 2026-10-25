// Kunci Supabase
const SUPABASE_URL = 'https://kdjxzydrqtlbsdlngsyd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Fm7laS5eWq4YN-m9LhhBTA_oMhEzawe';

// Inisialisasi
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let isAppReady = false;
let isAdmin = false;
let editingTaskId = null;
let originalFileData = null;
let globalTasks = [];

// DOM Elements
const form = document.getElementById('upload-form');
const btnSubmit = document.getElementById('btn-submit');
const btnText = document.getElementById('btn-text');
const btnSpinner = document.getElementById('btn-spinner');
const btnCancelEdit = document.getElementById('btn-cancel-edit');
const formTitle = document.getElementById('form-title');
const editFileNote = document.getElementById('edit-file-note');

const taskListEl = document.getElementById('task-list');
const loadingEl = document.getElementById('loading-indicator');
const emptyStateEl = document.getElementById('empty-state');
const taskCountEl = document.getElementById('task-count');
const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');
const roleBadge = document.getElementById('role-badge');

const btnAdminToggle = document.getElementById('btn-admin-toggle');
const pinModal = document.getElementById('pin-modal');
const pinBackdrop = document.getElementById('pin-backdrop');
const inputPin = document.getElementById('input-pin');
const btnPinSubmit = document.getElementById('btn-pin-submit');
const btnPinCancel = document.getElementById('btn-pin-cancel');

// Fitur Notifikasi
function showToast(message, isError = false) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast-anim bg-black text-white px-5 py-3 rounded-full shadow-lg text-sm font-medium flex items-center gap-2`;
    toast.innerHTML = `
        ${isError ? '<svg class="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>' : '<svg class="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>'}
        ${message}
    `;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function escapeHtml(unsafe) {
    return (unsafe || '').toString().replace(/[&<"'>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]));
}

function formatDate(dateString) {
    if (!dateString) return 'Baru saja';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// Tampilkan Data
function renderTasks() {
    loadingEl.classList.add('hidden');
    taskCountEl.textContent = globalTasks.length;

    if (globalTasks.length === 0) {
        emptyStateEl.classList.remove('hidden');
        taskListEl.classList.add('hidden');
        return;
    }

    emptyStateEl.classList.add('hidden');
    taskListEl.classList.remove('hidden');
    taskListEl.innerHTML = '';

    globalTasks.forEach(task => {
        const card = document.createElement('div');
        card.className = 'border border-gray-200 p-6 rounded-2xl bg-white flex flex-col hover:border-gray-300 transition-colors shadow-sm relative group';
        
        const initials = (task.name || '?').substring(0,2).toUpperCase();
        const createdStr = formatDate(task.created_at);
        
        const fileHtml = task.file_url 
            ? `<a href="${task.file_url}" target="_blank" class="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 mt-4 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 transition transform active:scale-95 duration-200"><svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg> Download File</a>`
            : `<div class="text-xs text-gray-400 mt-4 italic">Tidak ada lampiran</div>`;

        const tipe = task.type || 'tugas';
        const badgeColor = tipe === 'materi' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-blue-100 text-blue-700 border-blue-200';
        const badgeText = tipe === 'materi' ? 'MATERI' : 'TUGAS';
        const badgeHtml = `<span class="text-[10px] font-bold px-2 py-0.5 rounded border ${badgeColor} uppercase tracking-wider">${badgeText}</span>`;

        const adminButtons = isAdmin ? `
            <div class="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onclick="window.editTask('${task.id}')" class="p-1.5 bg-gray-100 text-gray-600 rounded-md hover:bg-blue-100 hover:text-blue-600 transition transform active:scale-90 duration-200" title="Edit">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                </button>
                <button onclick="window.deleteTask('${task.id}')" class="p-1.5 bg-gray-100 text-gray-600 rounded-md hover:bg-red-100 hover:text-red-600 transition transform active:scale-90 duration-200" title="Hapus">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
            </div>
        ` : '';

        card.innerHTML = `
            ${adminButtons}
            <div class="flex items-center gap-3 mb-4">
                <div class="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-sm font-semibold text-gray-700 shrink-0">
                    ${initials}
                </div>
                <div class="pr-12">
                    <h4 class="text-sm font-semibold text-gray-900 leading-tight flex items-center gap-2">
                        ${escapeHtml(task.name)} 
                        ${badgeHtml}
                    </h4>
                    <p class="text-xs text-gray-500 mt-0.5">NIP/NIM: ${escapeHtml(task.nim)} • ${createdStr}</p>
                </div>
            </div>
            <div class="flex-grow">
                <h3 class="text-base font-semibold text-gray-900 mb-1.5 line-clamp-2">${escapeHtml(task.title)}</h3>
                <p class="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed line-clamp-3">${escapeHtml(task.description)}</p>
            </div>
            <div class="mt-auto">
                ${fileHtml}
            </div>
        `;
        taskListEl.appendChild(card);
    });
}

// Ambil Data dari Database
async function fetchTasks() {
    const { data, error } = await supabaseClient
        .from('submissions')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Gagal ambil data:", error);
    } else {
        globalTasks = data || [];
        renderTasks();
    }
}

function resetForm() {
    form.reset();
    document.getElementById('input-tipe').value = 'tugas';
    editingTaskId = null;
    originalFileData = null;
    formTitle.textContent = 'Upload Dokumen Baru';
    btnText.textContent = 'Submit Data';
    btnCancelEdit.classList.add('hidden');
    editFileNote.classList.add('hidden');
}

btnCancelEdit.addEventListener('click', resetForm);

// Fitur Edit
window.editTask = (id) => {
    if (!isAdmin) return;
    const task = globalTasks.find(t => t.id == id);
    if (!task) return;

    editingTaskId = task.id;
    originalFileData = { url: task.file_url };
    
    document.getElementById('input-tipe').value = task.type || 'tugas';
    document.getElementById('input-nama').value = task.name || '';
    document.getElementById('input-nim').value = task.nim || '';
    document.getElementById('input-judul').value = task.title || '';
    document.getElementById('input-isi').value = task.description || '';
    document.getElementById('input-file').value = '';
    
    formTitle.textContent = 'Edit Dokumen';
    btnText.textContent = 'Update Data';
    btnCancelEdit.classList.remove('hidden');
    editFileNote.classList.remove('hidden');
    
    document.getElementById('form-container').scrollIntoView({ behavior: 'smooth', block: 'center' });
};

// Fitur Hapus
window.deleteTask = async (id) => {
    if (!isAdmin) return;
    if(!confirm("Yakin ingin menghapus dokumen ini?")) return;

    try {
        const { error } = await supabaseClient.from('submissions').delete().eq('id', id);
        if (error) throw error;
        
        showToast('Data berhasil dihapus');
        if (editingTaskId == id) resetForm();
        fetchTasks();
    } catch (error) {
        showToast('Gagal menghapus data', true);
    }
};

// Tombol Login
function closePinModal() {
    pinModal.classList.add('hidden');
    inputPin.value = '';
}

btnAdminToggle.addEventListener('click', () => {
    if (isAdmin) {
        isAdmin = false;
        roleBadge.classList.replace('bg-red-50', 'bg-blue-50');
        roleBadge.classList.replace('text-red-600', 'text-blue-600');
        roleBadge.classList.replace('border-red-100', 'border-blue-100');
        roleBadge.textContent = 'USER';
        btnAdminToggle.textContent = 'Login Admin';
        resetForm();
        renderTasks();
        showToast('Keluar dari mode Admin');
    } else {
        pinModal.classList.remove('hidden');
        setTimeout(() => inputPin.focus(), 100);
    }
});

btnPinCancel.addEventListener('click', closePinModal);
pinBackdrop.addEventListener('click', closePinModal);

btnPinSubmit.addEventListener('click', () => {
    if (inputPin.value === '111213') { 
        isAdmin = true;
        roleBadge.classList.replace('bg-blue-50', 'bg-red-50');
        roleBadge.classList.replace('text-blue-600', 'text-red-600');
        roleBadge.classList.replace('border-blue-100', 'border-red-100');
        roleBadge.textContent = 'Mode Admin';
        btnAdminToggle.textContent = 'Logout Admin';
        closePinModal();
        renderTasks();
        showToast('Berhasil login sebagai Admin');
    } else {
        showToast('PIN salah!', true);
        inputPin.value = '';
    }
});

// Jalankan Web Saat Pertama Dibuka
async function initApp() {
    try {
        const { error } = await supabaseClient.from('submissions').select('id').limit(1);
        if (error) throw error;

        statusDot.classList.replace('bg-yellow-400', 'bg-green-500');
        statusText.textContent = 'System Online';
        btnSubmit.disabled = false;
        isAppReady = true;

        fetchTasks();

    } catch (error) {
        statusDot.classList.replace('bg-yellow-400', 'bg-red-500');
        statusText.textContent = 'System Offline';
        loadingEl.innerHTML = '<p class="text-red-500 text-sm">Gagal terhubung ke database. Periksa koneksi internet.</p>';
    }
}

// Form Submit
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!isAppReady) return;

    const type = document.getElementById('input-tipe').value;
    const name = document.getElementById('input-nama').value.trim();
    const nim = document.getElementById('input-nim').value.trim();
    const title = document.getElementById('input-judul').value.trim();
    const description = document.getElementById('input-isi').value.trim();
    const fileInput = document.getElementById('input-file');
    const file = fileInput.files[0];

    try {
        btnSubmit.disabled = true;
        btnText.textContent = 'Memproses...';
        btnSpinner.classList.remove('hidden');

        let file_url = originalFileData ? originalFileData.url : null;

        if (file) {
            const file_path = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
            const { error: uploadError } = await supabaseClient.storage.from('documents').upload(file_path, file);
            if (uploadError) throw uploadError;

            const { data: urlData } = supabaseClient.storage.from('documents').getPublicUrl(file_path);
            file_url = urlData.publicUrl;
        }

        if (editingTaskId) {
            const updateData = { type, name, nim, title, description };
            if (file) updateData.file_url = file_url;

            const { error: dbError } = await supabaseClient.from('submissions').update(updateData).eq('id', editingTaskId);
            if (dbError) throw dbError;
            showToast('Data berhasil diperbarui!');
            
        } else {
            const { error: dbError } = await supabaseClient.from('submissions').insert([{ type, name, nim, title, description, file_url }]);
            if (dbError) throw dbError;
            showToast('Data berhasil dikirim!');
        }

        resetForm();
        fetchTasks();

    } catch (error) {
        showToast(error.message || 'Gagal memproses data.', true);
    } finally {
        btnSubmit.disabled = false;
        btnText.textContent = editingTaskId ? 'Update Data' : 'Submit Data';
        btnSpinner.classList.add('hidden');
    }
});

initApp();