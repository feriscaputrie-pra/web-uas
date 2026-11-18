/**
 * Kindergarten Admin Dashboard - Core Application Logic
 * Menangani semua modul: Overview, Profil, Berita, Galeri, Guru, PPDB, Section Builder, Inbox, & Backup
 */

// State saat ini
const AdminState = {
  currentTab: 'overview',
  activeEditingId: null,
  activeItemType: null
};

// Inisialisasi Aplikasi Admin
document.addEventListener('DOMContentLoaded', () => {
  // Pastikan DB siap
  if (window.KindergartenDB) {
    KindergartenDB.init();
  }

  // Set default view dari URL hash jika ada
  const hash = window.location.hash.replace('#', '');
  const validTabs = ['overview', 'profile', 'articles', 'gallery', 'teachers', 'ppdb', 'sections', 'inbox', 'settings'];
  if (validTabs.includes(hash)) {
    switchTab(hash);
  } else {
    switchTab('overview');
  }

  // Setup Global Events & Listeners
  setupNavigationEvents();
  setupImageUploadHelpers();
  updateHeaderInfo();

  // Listen to external db updates
  window.addEventListener('kindergarten_db_updated', () => {
    refreshCurrentView();
  });
});

// Update Header Info
function updateHeaderInfo() {
  const profile = KindergartenDB.getProfile();
  const schoolNameEls = document.querySelectorAll('.admin-school-name');
  schoolNameEls.forEach(el => el.textContent = profile.name || 'TK Bintang Ceria');

  // Update badge inbox
  const stats = KindergartenDB.getStats();
  const inboxBadges = document.querySelectorAll('.inbox-unread-count');
  inboxBadges.forEach(el => {
    el.textContent = stats.unreadInbox;
    if (stats.unreadInbox > 0) {
      el.classList.remove('hidden');
    } else {
      el.classList.add('hidden');
    }
  });

  const ppdbBadges = document.querySelectorAll('.ppdb-pending-count');
  ppdbBadges.forEach(el => {
    el.textContent = stats.pendingStudents;
    if (stats.pendingStudents > 0) {
      el.classList.remove('hidden');
    } else {
      el.classList.add('hidden');
    }
  });
}

// Navigasi Antar Tab
function switchTab(tabId) {
  AdminState.currentTab = tabId;
  window.location.hash = tabId;

  // Update active state di sidebar
  document.querySelectorAll('.nav-tab-btn').forEach(btn => {
    if (btn.getAttribute('data-tab') === tabId) {
      btn.classList.add('bg-amber-500', 'text-white', 'shadow-md', 'shadow-amber-500/20');
      btn.classList.remove('text-slate-600', 'hover:bg-amber-50', 'hover:text-amber-700');
    } else {
      btn.classList.remove('bg-amber-500', 'text-white', 'shadow-md', 'shadow-amber-500/20');
      btn.classList.add('text-slate-600', 'hover:bg-amber-50', 'hover:text-amber-700');
    }
  });

  // Hide all sections, show active
  document.querySelectorAll('.admin-tab-content').forEach(section => {
    section.classList.add('hidden');
  });

  const activeContent = document.getElementById(`tab-${tabId}`);
  if (activeContent) {
    activeContent.classList.remove('hidden');
  }

  // Update breadcrumb
  const breadcrumbEl = document.getElementById('admin-breadcrumb-title');
  if (breadcrumbEl) {
    const titles = {
      overview: 'Ringkasan Dashboard',
      profile: 'Manajemen Profil Sekolah & Sambutan',
      articles: 'Manajemen Berita & Pengumuman',
      gallery: 'Manajemen Galeri & Kegiatan',
      teachers: 'Manajemen Guru & Tenaga Pendidik',
      ppdb: 'Data PPDB Online & Verifikasi',
      sections: 'Dynamic Section / Widget Builder',
      inbox: 'Kotak Pesan Masuk (Inbox)',
      settings: 'Pusat Cadangan & Pengaturan Database'
    };
    breadcrumbEl.textContent = titles[tabId] || 'Dashboard';
  }

  // Tutup sidebar mobile bila terbuka
  const sidebar = document.getElementById('admin-sidebar');
  if (sidebar && !sidebar.classList.contains('-translate-x-full')) {
    if (window.innerWidth < 1024) {
      toggleSidebar();
    }
  }

  // Refresh isi tab
  renderTabContent(tabId);
}

// Render data untuk tab aktif
function renderTabContent(tabId) {
  updateHeaderInfo();
  switch (tabId) {
    case 'overview':
      renderOverviewTab();
      break;
    case 'profile':
      renderProfileTab();
      break;
    case 'articles':
      renderArticlesTab();
      break;
    case 'gallery':
      renderGalleryTab();
      break;
    case 'teachers':
      renderTeachersTab();
      break;
    case 'ppdb':
      renderPPDBTab();
      break;
    case 'sections':
      renderSectionsTab();
      break;
    case 'inbox':
      renderInboxTab();
      break;
    case 'settings':
      renderSettingsTab();
      break;
  }
}

function refreshCurrentView() {
  renderTabContent(AdminState.currentTab);
}

// Setup Event Navigasi
function setupNavigationEvents() {
  document.querySelectorAll('.nav-tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const tab = btn.getAttribute('data-tab');
      if (tab) switchTab(tab);
    });
  });

  // Mobile menu toggle
  const toggleBtn = document.getElementById('mobile-sidebar-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', toggleSidebar);
  }

  const backdrop = document.getElementById('sidebar-backdrop');
  if (backdrop) {
    backdrop.addEventListener('click', toggleSidebar);
  }
}

function toggleSidebar() {
  const sidebar = document.getElementById('admin-sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  if (sidebar && backdrop) {
    sidebar.classList.toggle('-translate-x-full');
    backdrop.classList.toggle('hidden');
  }
}

// Toast Notification System
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  const colors = {
    success: 'bg-emerald-600 text-white',
    error: 'bg-rose-600 text-white',
    info: 'bg-sky-600 text-white',
    warning: 'bg-amber-600 text-white'
  };

  const icons = {
    success: 'fa-circle-check',
    error: 'fa-circle-xmark',
    info: 'fa-circle-info',
    warning: 'fa-triangle-exclamation'
  };

  toast.className = `flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl ${colors[type] || colors.success} text-sm font-semibold transform transition duration-300 translate-y-4 opacity-0 z-50`;
  toast.innerHTML = `
    <i class="fa-solid ${icons[type] || icons.success} text-lg"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  // Animate in
  setTimeout(() => {
    toast.classList.remove('translate-y-4', 'opacity-0');
  }, 10);

  // Auto remove
  setTimeout(() => {
    toast.classList.add('translate-y-4', 'opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Helper: Setup Image File / URL previews
function setupImageUploadHelpers() {
  // Generic handler for file inputs with class 'img-file-input'
  document.addEventListener('change', (e) => {
    if (e.target && e.target.classList.contains('img-file-input')) {
      const file = e.target.files[0];
      const previewId = e.target.getAttribute('data-preview-id');
      const hiddenInputId = e.target.getAttribute('data-hidden-input-id');

      if (file) {
        // Max 2MB check to keep localStorage healthy
        if (file.size > 2 * 1024 * 1024) {
          showToast('Ukuran berkas maksimal 2MB untuk kenyamanan penyimpanan lokal.', 'warning');
          return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
          const base64Url = event.target.result;
          if (previewId) {
            const previewEl = document.getElementById(previewId);
            if (previewEl) previewEl.src = base64Url;
          }
          if (hiddenInputId) {
            const hiddenEl = document.getElementById(hiddenInputId);
            if (hiddenEl) hiddenEl.value = base64Url;
          }
        };
        reader.readAsDataURL(file);
      }
    }
  });

  // Handler for direct image URL input changes
  document.addEventListener('input', (e) => {
    if (e.target && e.target.classList.contains('img-url-input')) {
      const previewId = e.target.getAttribute('data-preview-id');
      const hiddenInputId = e.target.getAttribute('data-hidden-input-id');
      const url = e.target.value.trim();

      if (previewId && url) {
        const previewEl = document.getElementById(previewId);
        if (previewEl) previewEl.src = url;
      }
      if (hiddenInputId) {
        const hiddenEl = document.getElementById(hiddenInputId);
        if (hiddenEl) hiddenEl.value = url;
      }
    }
  });
}

// =========================================================================
// 1. DASHBOARD OVERVIEW TAB
// =========================================================================
function renderOverviewTab() {
  const stats = KindergartenDB.getStats();
  const ppdbList = KindergartenDB.getPPDB();
  const articles = KindergartenDB.getArticles();
  const profile = KindergartenDB.getProfile();

  // Populate Stat Numbers
  document.getElementById('overview-total-students').textContent = stats.totalStudents;
  document.getElementById('overview-pending-students').textContent = `${stats.pendingStudents} Menunggu`;
  document.getElementById('overview-total-gallery').textContent = stats.totalGallery;
  document.getElementById('overview-total-articles').textContent = stats.totalArticles;
  document.getElementById('overview-total-inbox').textContent = stats.totalInbox;
  document.getElementById('overview-unread-inbox').textContent = `${stats.unreadInbox} Baru`;

  // Quick Welcome Banner
  const welcomeEl = document.getElementById('overview-welcome-name');
  if (welcomeEl) welcomeEl.textContent = profile.name;

  // Recent PPDB Table (top 4)
  const recentPPDBBody = document.getElementById('overview-recent-ppdb-body');
  if (recentPPDBBody) {
    if (!ppdbList.length) {
      recentPPDBBody.innerHTML = `<tr><td colspan="5" class="py-6 text-center text-slate-400 text-sm">Belum ada data calon siswa terdaftar.</td></tr>`;
    } else {
      recentPPDBBody.innerHTML = ppdbList.slice(0, 4).map(item => `
        <tr class="border-b border-slate-100 hover:bg-slate-50 transition">
          <td class="py-3 px-4 font-semibold text-slate-800 text-sm">
            ${item.childName}
            <span class="block text-xs font-normal text-slate-400">${item.id}</span>
          </td>
          <td class="py-3 px-4 text-xs font-medium text-slate-600">${item.programClass}</td>
          <td class="py-3 px-4 text-xs text-slate-600">${item.parentName} (${item.parentPhone})</td>
          <td class="py-3 px-4">
            ${getPPDBStatusBadge(item.status)}
          </td>
          <td class="py-3 px-4 text-right">
            <button onclick="openPPDBDetailModal('${item.id}')" class="px-3 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg text-xs font-bold transition">
              Detail
            </button>
          </td>
        </tr>
      `).join('');
    }
  }

  // Recent News (top 3)
  const recentArticlesContainer = document.getElementById('overview-recent-articles');
  if (recentArticlesContainer) {
    if (!articles.length) {
      recentArticlesContainer.innerHTML = `<p class="text-slate-400 text-xs py-4 text-center">Belum ada berita dibuat.</p>`;
    } else {
      recentArticlesContainer.innerHTML = articles.slice(0, 3).map(art => `
        <div class="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 transition">
          <img src="${art.thumbnail || 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=200&q=80'}" class="w-12 h-12 rounded-xl object-cover">
          <div class="flex-1 min-w-0">
            <h5 class="text-xs font-bold text-slate-800 truncate">${art.title}</h5>
            <p class="text-[11px] text-slate-400">${art.category} • ${art.date}</p>
          </div>
          <button onclick="editArticle('${art.id}')" class="text-xs text-amber-600 hover:underline font-bold shrink-0">Edit</button>
        </div>
      `).join('');
    }
  }
}

// =========================================================================
// 2. MANAJEMEN PROFIL SEKOLAH TAB
// =========================================================================
function renderProfileTab() {
  const profile = KindergartenDB.getProfile();

  // Populate Identitas Umum
  setInputValue('profile-name', profile.name);
  setInputValue('profile-tagline', profile.tagline);
  setInputValue('profile-subtagline', profile.subtagline);
  setInputValue('profile-npsn', profile.npsn);
  setInputValue('profile-accreditation', profile.accreditation);
  setInputValue('profile-foundedYear', profile.foundedYear);

  // Sambutan Kepala Sekolah
  setInputValue('profile-principalName', profile.principalName);
  setInputValue('profile-principalTitle', profile.principalTitle);
  setInputValue('profile-principalSpeech', profile.principalSpeech);
  setInputValue('profile-principalPhoto-url', profile.principalPhoto);
  setInputValue('profile-principalPhoto-hidden', profile.principalPhoto);
  const speechPreview = document.getElementById('profile-principalPhoto-preview');
  if (speechPreview && profile.principalPhoto) {
    speechPreview.src = profile.principalPhoto;
  }

  // Visi, Misi, Sejarah
  setInputValue('profile-vision', profile.vision);
  setInputValue('profile-history', profile.history);
  renderMissionsList(profile.missions || []);

  // Kontak & Alamat
  setInputValue('profile-phone', profile.phone);
  setInputValue('profile-whatsapp', profile.whatsapp);
  setInputValue('profile-email', profile.email);
  setInputValue('profile-address', profile.address);
  setInputValue('profile-operatingHours', profile.operatingHours);
  setInputValue('profile-mapsEmbedUrl', profile.mapsEmbedUrl);

  // Sosmed
  setInputValue('profile-instagram', profile.socials?.instagram || '');
  setInputValue('profile-facebook', profile.socials?.facebook || '');
  setInputValue('profile-youtube', profile.socials?.youtube || '');
}

function renderMissionsList(missions) {
  const container = document.getElementById('profile-missions-container');
  if (!container) return;

  container.innerHTML = missions.map((m, idx) => `
    <div class="flex items-center gap-2 mission-item-row">
      <span class="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 text-xs font-bold flex items-center justify-center shrink-0">
        ${idx + 1}
      </span>
      <input type="text" value="${m.replace(/"/g, '&quot;')}" class="mission-input-field flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none" placeholder="Tulis butir misi sekolah...">
      <button type="button" onclick="removeMissionRow(this)" class="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 flex items-center justify-center transition shrink-0" title="Hapus Butir Misi">
        <i class="fa-solid fa-trash-can text-sm"></i>
      </button>
    </div>
  `).join('');
}

function addMissionRow() {
  const container = document.getElementById('profile-missions-container');
  if (!container) return;
  const count = container.querySelectorAll('.mission-item-row').length + 1;

  const div = document.createElement('div');
  div.className = 'flex items-center gap-2 mission-item-row';
  div.innerHTML = `
    <span class="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 text-xs font-bold flex items-center justify-center shrink-0">
      ${count}
    </span>
    <input type="text" value="" class="mission-input-field flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none" placeholder="Tulis butir misi sekolah baru...">
    <button type="button" onclick="removeMissionRow(this)" class="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 flex items-center justify-center transition shrink-0">
      <i class="fa-solid fa-trash-can text-sm"></i>
    </button>
  `;
  container.appendChild(div);
}

function removeMissionRow(button) {
  const row = button.closest('.mission-item-row');
  if (row) {
    row.remove();
    // Re-index numbers
    document.querySelectorAll('#profile-missions-container .mission-item-row').forEach((r, idx) => {
      const numSpan = r.querySelector('span');
      if (numSpan) numSpan.textContent = idx + 1;
    });
  }
}

// Simpan Semua Perubahan Profil Sekolah
function handleSaveSchoolProfile(e) {
  if (e) e.preventDefault();

  // Kumpulkan missions
  const missionInputs = document.querySelectorAll('.mission-input-field');
  const missions = Array.from(missionInputs)
    .map(input => input.value.trim())
    .filter(val => val.length > 0);

  const updatedProfile = {
    name: getInputValue('profile-name'),
    tagline: getInputValue('profile-tagline'),
    subtagline: getInputValue('profile-subtagline'),
    npsn: getInputValue('profile-npsn'),
    accreditation: getInputValue('profile-accreditation'),
    foundedYear: getInputValue('profile-foundedYear'),

    principalName: getInputValue('profile-principalName'),
    principalTitle: getInputValue('profile-principalTitle'),
    principalSpeech: getInputValue('profile-principalSpeech'),
    principalPhoto: getInputValue('profile-principalPhoto-hidden') || getInputValue('profile-principalPhoto-url'),

    vision: getInputValue('profile-vision'),
    missions: missions,
    history: getInputValue('profile-history'),

    phone: getInputValue('profile-phone'),
    whatsapp: getInputValue('profile-whatsapp'),
    email: getInputValue('profile-email'),
    address: getInputValue('profile-address'),
    operatingHours: getInputValue('profile-operatingHours'),
    mapsEmbedUrl: getInputValue('profile-mapsEmbedUrl'),

    socials: {
      instagram: getInputValue('profile-instagram'),
      facebook: getInputValue('profile-facebook'),
      youtube: getInputValue('profile-youtube')
    }
  };

  KindergartenDB.updateProfile(updatedProfile);
  showToast('Profil sekolah dan sambutan berhasil diperbarui!', 'success');
  updateHeaderInfo();
}

// =========================================================================
// 3. MANAJEMEN BERITA & PENGUMUMAN (CRUD)
// =========================================================================
function renderArticlesTab() {
  const articles = KindergartenDB.getArticles();
  const search = (document.getElementById('article-search-input')?.value || '').toLowerCase();
  const categoryFilter = document.getElementById('article-filter-category')?.value || 'all';
  const statusFilter = document.getElementById('article-filter-status')?.value || 'all';

  const filtered = articles.filter(art => {
    const matchesSearch = !search || 
      art.title.toLowerCase().includes(search) || 
      (art.excerpt || '').toLowerCase().includes(search) ||
      (art.author || '').toLowerCase().includes(search);
    const matchesCat = categoryFilter === 'all' || art.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || art.status === statusFilter;
    return matchesSearch && matchesCat && matchesStatus;
  });

  const tbody = document.getElementById('articles-table-body');
  if (!tbody) return;

  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="py-12 text-center text-slate-400 text-sm">Tidak ada artikel atau pengumuman yang cocok dengan pencarian.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(item => `
    <tr class="border-b border-slate-100 hover:bg-slate-50 transition">
      <td class="py-3 px-4">
        <div class="w-16 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
          <img src="${item.thumbnail || 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=200&q=80'}" class="w-full h-full object-cover">
        </div>
      </td>
      <td class="py-3 px-4">
        <h4 class="font-bold text-slate-800 text-sm line-clamp-1">${item.title}</h4>
        <p class="text-xs text-slate-400 line-clamp-1 mt-0.5">${item.excerpt || item.content.substring(0, 60)}</p>
      </td>
      <td class="py-3 px-4">
        <span class="px-2.5 py-1 rounded-full text-xs font-bold ${getCategoryBadgeColor(item.category)}">
          ${item.category}
        </span>
      </td>
      <td class="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">
        ${item.date}<br><span class="text-slate-400 font-normal">Oleh ${item.author || 'Admin'}</span>
      </td>
      <td class="py-3 px-4">
        <span class="px-2.5 py-1 rounded-full text-xs font-bold ${item.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}">
          ${item.status === 'published' ? 'Published' : 'Draft'}
        </span>
      </td>
      <td class="py-3 px-4 text-right whitespace-nowrap">
        <div class="flex items-center justify-end gap-1.5">
          <button onclick="editArticle('${item.id}')" class="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 flex items-center justify-center transition" title="Edit Berita">
            <i class="fa-solid fa-pen-to-square text-xs"></i>
          </button>
          <button onclick="confirmDeleteArticle('${item.id}', '${item.title.replace(/'/g, "\\'")}')" class="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 flex items-center justify-center transition" title="Hapus Berita">
            <i class="fa-solid fa-trash-can text-xs"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function openArticleModal(articleId = null) {
  const modal = document.getElementById('article-modal');
  const titleEl = document.getElementById('article-modal-header-title');
  const form = document.getElementById('article-form');
  if (!modal || !form) return;

  form.reset();

  if (articleId) {
    const art = KindergartenDB.getArticleById(articleId);
    if (art) {
      titleEl.textContent = 'Edit Berita / Pengumuman';
      setInputValue('article-id', art.id);
      setInputValue('article-title', art.title);
      setInputValue('article-category', art.category);
      setInputValue('article-date', art.date);
      setInputValue('article-author', art.author || 'Admin TK');
      setInputValue('article-status', art.status || 'published');
      setInputValue('article-thumbnail-url', art.thumbnail || '');
      setInputValue('article-thumbnail-hidden', art.thumbnail || '');
      setInputValue('article-excerpt', art.excerpt || '');
      setInputValue('article-content', art.content || '');

      const preview = document.getElementById('article-thumbnail-preview');
      if (preview) preview.src = art.thumbnail || 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=400&q=80';
    }
  } else {
    titleEl.textContent = 'Tambah Berita / Pengumuman Baru';
    setInputValue('article-id', '');
    setInputValue('article-date', new Date().toISOString().split('T')[0]);
    setInputValue('article-author', 'Admin TK Bintang Ceria');
    setInputValue('article-thumbnail-hidden', 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80');
    setInputValue('article-thumbnail-url', 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80');
    
    const preview = document.getElementById('article-thumbnail-preview');
    if (preview) preview.src = 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80';
  }

  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closeArticleModal() {
  const modal = document.getElementById('article-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

function handleSaveArticle(e) {
  e.preventDefault();
  const id = getInputValue('article-id');
  const articleData = {
    id: id || undefined,
    title: getInputValue('article-title'),
    category: getInputValue('article-category'),
    date: getInputValue('article-date'),
    author: getInputValue('article-author'),
    status: getInputValue('article-status'),
    thumbnail: getInputValue('article-thumbnail-hidden') || getInputValue('article-thumbnail-url'),
    excerpt: getInputValue('article-excerpt'),
    content: getInputValue('article-content')
  };

  KindergartenDB.saveArticle(articleData);
  closeArticleModal();
  showToast(id ? 'Berita berhasil diperbarui!' : 'Berita baru berhasil ditambahkan!', 'success');
  renderArticlesTab();
}

function editArticle(id) {
  openArticleModal(id);
}

function confirmDeleteArticle(id, title) {
  if (confirm(`Apakah Anda yakin ingin menghapus berita:\n"${title}"?`)) {
    KindergartenDB.deleteArticle(id);
    showToast('Berita berhasil dihapus.', 'info');
    renderArticlesTab();
  }
}

// =========================================================================
// 4. MANAJEMEN GALERI & KEGIATAN (CRUD)
// =========================================================================
function renderGalleryTab() {
  const gallery = KindergartenDB.getGallery();
  const search = (document.getElementById('gallery-search-input')?.value || '').toLowerCase();
  const catFilter = document.getElementById('gallery-filter-category')?.value || 'all';

  const filtered = gallery.filter(item => {
    const matchesSearch = !search || 
      item.title.toLowerCase().includes(search) || 
      (item.description || '').toLowerCase().includes(search);
    const matchesCat = catFilter === 'all' || item.category === catFilter;
    return matchesSearch && matchesCat;
  });

  const grid = document.getElementById('gallery-cards-grid');
  if (!grid) return;

  if (!filtered.length) {
    grid.innerHTML = `<div class="col-span-full py-12 text-center text-slate-400 text-sm">Belum ada foto kegiatan di album ini.</div>`;
    return;
  }

  grid.innerHTML = filtered.map(item => `
    <div class="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col group">
      <div class="h-48 overflow-hidden relative bg-slate-100">
        <img src="${item.imageUrl}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300">
        <span class="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold bg-white/90 backdrop-blur-md text-slate-800 shadow-sm">
          ${item.category}
        </span>
      </div>
      <div class="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div class="text-[11px] text-slate-400 mb-1 flex items-center gap-1.5">
            <i class="fa-regular fa-calendar"></i>
            <span>${item.date}</span>
          </div>
          <h4 class="font-heading font-bold text-slate-800 text-base line-clamp-1 mb-1">${item.title}</h4>
          <p class="text-xs text-slate-500 line-clamp-2 leading-relaxed">${item.description || '-'}</p>
        </div>
        <div class="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
          <button onclick="previewGalleryImage('${item.imageUrl}', '${item.title.replace(/'/g, "\\'")}')" class="text-xs text-slate-500 hover:text-amber-600 font-bold flex items-center gap-1">
            <i class="fa-solid fa-expand text-[10px]"></i> Zoom
          </button>
          <div class="flex items-center gap-1.5">
            <button onclick="editGallery('${item.id}')" class="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 flex items-center justify-center transition" title="Edit">
              <i class="fa-solid fa-pen-to-square text-xs"></i>
            </button>
            <button onclick="confirmDeleteGallery('${item.id}', '${item.title.replace(/'/g, "\\'")}')" class="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 flex items-center justify-center transition" title="Hapus">
              <i class="fa-solid fa-trash-can text-xs"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

function openGalleryModal(galleryId = null) {
  const modal = document.getElementById('gallery-modal');
  const titleEl = document.getElementById('gallery-modal-header-title');
  const form = document.getElementById('gallery-form');
  if (!modal || !form) return;

  form.reset();

  if (galleryId) {
    const item = KindergartenDB.getGalleryById(galleryId);
    if (item) {
      titleEl.textContent = 'Edit Foto / Dokumentasi';
      setInputValue('gallery-id', item.id);
      setInputValue('gallery-title', item.title);
      setInputValue('gallery-category', item.category);
      setInputValue('gallery-date', item.date);
      setInputValue('gallery-image-url', item.imageUrl);
      setInputValue('gallery-image-hidden', item.imageUrl);
      setInputValue('gallery-desc', item.description || '');

      const preview = document.getElementById('gallery-image-preview');
      if (preview) preview.src = item.imageUrl;
    }
  } else {
    titleEl.textContent = 'Unggah Foto Dokumentasi Baru';
    setInputValue('gallery-id', '');
    setInputValue('gallery-date', new Date().toISOString().split('T')[0]);
    setInputValue('gallery-image-hidden', 'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?auto=format&fit=crop&w=800&q=80');
    setInputValue('gallery-image-url', 'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?auto=format&fit=crop&w=800&q=80');
    
    const preview = document.getElementById('gallery-image-preview');
    if (preview) preview.src = 'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?auto=format&fit=crop&w=800&q=80';
  }

  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closeGalleryModal() {
  const modal = document.getElementById('gallery-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

function handleSaveGallery(e) {
  e.preventDefault();
  const id = getInputValue('gallery-id');
  const data = {
    id: id || undefined,
    title: getInputValue('gallery-title'),
    category: getInputValue('gallery-category'),
    date: getInputValue('gallery-date'),
    imageUrl: getInputValue('gallery-image-hidden') || getInputValue('gallery-image-url'),
    description: getInputValue('gallery-desc')
  };

  KindergartenDB.saveGallery(data);
  closeGalleryModal();
  showToast(id ? 'Foto galeri berhasil diperbarui!' : 'Foto baru berhasil ditambahkan!', 'success');
  renderGalleryTab();
}

function editGallery(id) {
  openGalleryModal(id);
}

function confirmDeleteGallery(id, title) {
  if (confirm(`Apakah Anda yakin ingin menghapus foto kegiatan:\n"${title}"?`)) {
    KindergartenDB.deleteGallery(id);
    showToast('Foto kegiatan berhasil dihapus.', 'info');
    renderGalleryTab();
  }
}

function previewGalleryImage(url, title) {
  const modal = document.getElementById('image-lightbox-modal');
  const img = document.getElementById('lightbox-img');
  const t = document.getElementById('lightbox-title');
  if (modal && img) {
    img.src = url;
    if (t) t.textContent = title;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }
}

function closeLightbox() {
  const modal = document.getElementById('image-lightbox-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

// =========================================================================
// 5. MANAJEMEN GURU & STAFF (CRUD)
// =========================================================================
function renderTeachersTab() {
  const teachers = KindergartenDB.getTeachers();
  const search = (document.getElementById('teacher-search-input')?.value || '').toLowerCase();

  const filtered = teachers.filter(tch => {
    return !search || 
      tch.name.toLowerCase().includes(search) || 
      tch.role.toLowerCase().includes(search) ||
      (tch.education || '').toLowerCase().includes(search);
  });

  const grid = document.getElementById('teachers-cards-grid');
  if (!grid) return;

  if (!filtered.length) {
    grid.innerHTML = `<div class="col-span-full py-12 text-center text-slate-400 text-sm">Belum ada profil guru atau staff.</div>`;
    return;
  }

  grid.innerHTML = filtered.map(tch => `
    <div class="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition text-center flex flex-col justify-between">
      <div>
        <div class="relative w-28 h-28 mx-auto rounded-full overflow-hidden border-4 border-amber-300 shadow-md mb-4 bg-slate-100">
          <img src="${tch.photoUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80'}" class="w-full h-full object-cover">
          <span class="absolute bottom-1 right-1 w-4 h-4 rounded-full ${tch.status === 'Aktif' ? 'bg-emerald-500' : 'bg-slate-400'} border-2 border-white"></span>
        </div>
        <h4 class="font-heading font-bold text-slate-800 text-lg mb-1">${tch.name}</h4>
        <p class="text-xs font-bold text-amber-600 uppercase tracking-wide mb-2">${tch.role}</p>
        <p class="text-xs text-slate-500 mb-3 bg-slate-50 py-1 px-3 rounded-full inline-block">
          🎓 ${tch.education || '-'}
        </p>
        <p class="text-xs text-slate-600 italic bg-amber-50/40 p-3 rounded-2xl border border-amber-100/40 line-clamp-2">
          "${tch.quote || 'Mendidik tunas bangsa dengan penuh kasih.'}"
        </p>
      </div>

      <div class="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between">
        <span class="text-xs font-semibold ${tch.status === 'Aktif' ? 'text-emerald-600' : 'text-slate-400'}">
          ● ${tch.status || 'Aktif'}
        </span>
        <div class="flex items-center gap-1.5">
          <button onclick="editTeacher('${tch.id}')" class="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 flex items-center justify-center transition" title="Edit Profil">
            <i class="fa-solid fa-pen-to-square text-xs"></i>
          </button>
          <button onclick="confirmDeleteTeacher('${tch.id}', '${tch.name.replace(/'/g, "\\'")}')" class="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 flex items-center justify-center transition" title="Hapus Profil">
            <i class="fa-solid fa-trash-can text-xs"></i>
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

function openTeacherModal(teacherId = null) {
  const modal = document.getElementById('teacher-modal');
  const titleEl = document.getElementById('teacher-modal-header-title');
  const form = document.getElementById('teacher-form');
  if (!modal || !form) return;

  form.reset();

  if (teacherId) {
    const tch = KindergartenDB.getTeacherById(teacherId);
    if (tch) {
      titleEl.textContent = 'Edit Profil Pendidik / Staff';
      setInputValue('teacher-id', tch.id);
      setInputValue('teacher-name', tch.name);
      setInputValue('teacher-role', tch.role);
      setInputValue('teacher-education', tch.education || '');
      setInputValue('teacher-experience', tch.experience || '');
      setInputValue('teacher-phone', tch.phone || '');
      setInputValue('teacher-status', tch.status || 'Aktif');
      setInputValue('teacher-quote', tch.quote || '');
      setInputValue('teacher-photo-url', tch.photoUrl || '');
      setInputValue('teacher-photo-hidden', tch.photoUrl || '');

      const preview = document.getElementById('teacher-photo-preview');
      if (preview) preview.src = tch.photoUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80';
    }
  } else {
    titleEl.textContent = 'Tambah Guru / Staff Baru';
    setInputValue('teacher-id', '');
    setInputValue('teacher-status', 'Aktif');
    setInputValue('teacher-photo-hidden', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80');
    setInputValue('teacher-photo-url', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80');
    
    const preview = document.getElementById('teacher-photo-preview');
    if (preview) preview.src = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80';
  }

  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closeTeacherModal() {
  const modal = document.getElementById('teacher-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

function handleSaveTeacher(e) {
  e.preventDefault();
  const id = getInputValue('teacher-id');
  const teacherData = {
    id: id || undefined,
    name: getInputValue('teacher-name'),
    role: getInputValue('teacher-role'),
    education: getInputValue('teacher-education'),
    experience: getInputValue('teacher-experience'),
    phone: getInputValue('teacher-phone'),
    status: getInputValue('teacher-status'),
    quote: getInputValue('teacher-quote'),
    photoUrl: getInputValue('teacher-photo-hidden') || getInputValue('teacher-photo-url')
  };

  KindergartenDB.saveTeacher(teacherData);
  closeTeacherModal();
  showToast(id ? 'Profil guru berhasil diperbarui!' : 'Guru baru berhasil ditambahkan!', 'success');
  renderTeachersTab();
}

function editTeacher(id) {
  openTeacherModal(id);
}

function confirmDeleteTeacher(id, name) {
  if (confirm(`Apakah Anda yakin ingin menghapus data guru:\n"${name}"?`)) {
    KindergartenDB.deleteTeacher(id);
    showToast('Data guru berhasil dihapus.', 'info');
    renderTeachersTab();
  }
}

// =========================================================================
// 6. DATA PPDB ONLINE (TABEL, VERIFIKASI, EKSPOR CSV)
// =========================================================================
function renderPPDBTab() {
  const ppdbList = KindergartenDB.getPPDB();
  const search = (document.getElementById('ppdb-search-input')?.value || '').toLowerCase();
  const statusFilter = document.getElementById('ppdb-filter-status')?.value || 'all';
  const programFilter = document.getElementById('ppdb-filter-program')?.value || 'all';

  const filtered = ppdbList.filter(item => {
    const matchesSearch = !search ||
      item.childName.toLowerCase().includes(search) ||
      item.id.toLowerCase().includes(search) ||
      item.parentName.toLowerCase().includes(search) ||
      (item.parentPhone || '').includes(search);
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesProg = programFilter === 'all' || item.programClass === programFilter;
    return matchesSearch && matchesStatus && matchesProg;
  });

  // Update total counts
  const countEl = document.getElementById('ppdb-filtered-count');
  if (countEl) countEl.textContent = `${filtered.length} dari ${ppdbList.length} Calon Siswa`;

  const tbody = document.getElementById('ppdb-table-body');
  if (!tbody) return;

  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="py-12 text-center text-slate-400 text-sm">Tidak ada pendaftar yang cocok dengan filter atau kata kunci.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(item => `
    <tr class="border-b border-slate-100 hover:bg-slate-50 transition">
      <td class="py-3 px-4 font-mono text-xs font-bold text-amber-700 whitespace-nowrap">
        ${item.id}
      </td>
      <td class="py-3 px-4">
        <h5 class="font-bold text-slate-800 text-sm">${item.childName}</h5>
        <p class="text-xs text-slate-400">Panggilan: ${item.nickname || '-'} (${item.gender})</p>
      </td>
      <td class="py-3 px-4">
        <span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 whitespace-nowrap">
          ${item.programClass}
        </span>
      </td>
      <td class="py-3 px-4 text-xs text-slate-600">
        <p class="font-semibold text-slate-800">${item.parentName}</p>
        <a href="https://wa.me/${(item.parentPhone || '').replace(/[^0-9]/g, '')}" target="_blank" class="text-emerald-600 hover:underline flex items-center gap-1 font-mono mt-0.5">
          <i class="fa-brands fa-whatsapp"></i> ${item.parentPhone}
        </a>
      </td>
      <td class="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">
        ${item.registerDate}
      </td>
      <td class="py-3 px-4">
        ${getPPDBStatusBadge(item.status)}
      </td>
      <td class="py-3 px-4 text-right whitespace-nowrap">
        <div class="flex items-center justify-end gap-1.5">
          <button onclick="openPPDBDetailModal('${item.id}')" class="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition flex items-center gap-1">
            <i class="fa-solid fa-clipboard-check"></i> Verifikasi
          </button>
          <button onclick="confirmDeletePPDB('${item.id}', '${item.childName.replace(/'/g, "\\'")}')" class="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 flex items-center justify-center transition" title="Hapus Data">
            <i class="fa-solid fa-trash-can text-xs"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function getPPDBStatusBadge(status) {
  switch (status) {
    case 'Diterima':
      return `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800"><i class="fa-solid fa-circle-check text-[10px]"></i> Diterima</span>`;
    case 'Cadangan':
      return `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800"><i class="fa-solid fa-clock text-[10px]"></i> Cadangan</span>`;
    case 'Ditolak':
      return `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800"><i class="fa-solid fa-circle-xmark text-[10px]"></i> Ditolak</span>`;
    default:
      return `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 animate-pulse"><i class="fa-solid fa-spinner text-[10px]"></i> Menunggu</span>`;
  }
}

// Modal Detail PPDB & Verifikasi Status
function openPPDBDetailModal(id) {
  const item = KindergartenDB.getPPDBById(id);
  if (!item) return;

  const modal = document.getElementById('ppdb-detail-modal');
  if (!modal) return;

  document.getElementById('ppdb-detail-regid').textContent = item.id;
  document.getElementById('ppdb-detail-childname').textContent = item.childName;
  document.getElementById('ppdb-detail-nickname').textContent = item.nickname || '-';
  document.getElementById('ppdb-detail-gender').textContent = item.gender;
  document.getElementById('ppdb-detail-ttl').textContent = `${item.birthPlace || '-'}, ${item.birthDate || '-'}`;
  document.getElementById('ppdb-detail-program').textContent = item.programClass;
  document.getElementById('ppdb-detail-parentname').textContent = item.parentName;
  document.getElementById('ppdb-detail-parentjob').textContent = item.parentJob || '-';
  document.getElementById('ppdb-detail-phone').textContent = item.parentPhone;
  document.getElementById('ppdb-detail-address').textContent = item.address;
  document.getElementById('ppdb-detail-regdate').textContent = item.registerDate;

  // WhatsApp quick button
  const waBtn = document.getElementById('ppdb-detail-wa-btn');
  if (waBtn) {
    const cleanPhone = (item.parentPhone || '').replace(/[^0-9]/g, '');
    waBtn.href = `https://wa.me/${cleanPhone.startsWith('0') ? '62' + cleanPhone.substring(1) : cleanPhone}?text=Halo%20Bapak%2FIbu%20${encodeURIComponent(item.parentName)},%20kami%20dari%20Panitia%20PPDB%20TK%20Bintang%20Ceria%20ingin%20mengonfirmasi%20pendaftaran%20Ananda%20${encodeURIComponent(item.childName)}`;
  }

  // Set form controls
  setInputValue('ppdb-verify-id', item.id);
  setInputValue('ppdb-verify-status', item.status);
  setInputValue('ppdb-verify-notes', item.notes || '');

  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closePPDBDetailModal() {
  const modal = document.getElementById('ppdb-detail-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

function handleSavePPDBStatus(e) {
  e.preventDefault();
  const id = getInputValue('ppdb-verify-id');
  const status = getInputValue('ppdb-verify-status');
  const notes = getInputValue('ppdb-verify-notes');

  KindergartenDB.updatePPDBStatus(id, status, notes);
  closePPDBDetailModal();
  showToast(`Status pendaftaran ${id} berhasil diubah menjadi "${status}"!`, 'success');
  renderPPDBTab();
  updateHeaderInfo();
}

function confirmDeletePPDB(id, childName) {
  if (confirm(`Apakah Anda yakin ingin menghapus data calon siswa:\n"${childName}" (${id})?`)) {
    KindergartenDB.deletePPDB(id);
    showToast('Data pendaftaran berhasil dihapus.', 'info');
    renderPPDBTab();
    updateHeaderInfo();
  }
}

// Download PPDB data to Excel/CSV
function exportPPDBData() {
  const csvData = KindergartenDB.exportPPDBToCSV();
  if (!csvData) {
    showToast('Belum ada data pendaftar untuk diekspor.', 'warning');
    return;
  }

  const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `DATA_PPDB_TK_BINTANG_CERIA_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast('Data PPDB berhasil diekspor ke format CSV / Excel!', 'success');
}

// Print PPDB Table or Slip
function printPPDBData() {
  window.print();
}

// =========================================================================
// 7. DYNAMIC SECTION / WIDGET BUILDER
// =========================================================================
function renderSectionsTab() {
  const sections = KindergartenDB.getSections();
  const container = document.getElementById('sections-builder-list');
  if (!container) return;

  container.innerHTML = sections.map((sec, idx) => `
    <div class="flex items-center justify-between p-4 bg-white rounded-2xl border ${sec.enabled ? 'border-slate-200' : 'border-dashed border-slate-300 opacity-60'} transition shadow-sm">
      <div class="flex items-center gap-4">
        <!-- Reorder buttons -->
        <div class="flex flex-col gap-1 text-slate-400">
          <button onclick="handleReorderSection('${sec.id}', 'up')" ${idx === 0 ? 'disabled class="opacity-20 cursor-not-allowed"' : 'class="hover:text-amber-600"'} title="Pindah ke Atas">
            <i class="fa-solid fa-chevron-up text-xs"></i>
          </button>
          <button onclick="handleReorderSection('${sec.id}', 'down')" ${idx === sections.length - 1 ? 'disabled class="opacity-20 cursor-not-allowed"' : 'class="hover:text-amber-600"'} title="Pindah ke Bawah">
            <i class="fa-solid fa-chevron-down text-xs"></i>
          </button>
        </div>

        <span class="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">
          ${sec.order}
        </span>

        <div>
          <h4 class="font-heading font-bold text-slate-800 text-sm flex items-center gap-2">
            <span>${sec.name}</span>
            ${!sec.canToggle ? '<span class="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-500 font-normal">Wajib Aktif</span>' : ''}
          </h4>
          <p class="text-xs text-slate-500">${sec.description || 'Section Halaman Utama'}</p>
        </div>
      </div>

      <div class="flex items-center gap-4">
        <span class="text-xs font-semibold ${sec.enabled ? 'text-emerald-600' : 'text-slate-400'}">
          ${sec.enabled ? 'Ditampilkan' : 'Disembunyikan'}
        </span>

        <!-- Toggle Switch -->
        <label class="relative inline-flex items-center ${sec.canToggle ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}">
          <input type="checkbox" ${sec.enabled ? 'checked' : ''} ${!sec.canToggle ? 'disabled' : ''} onchange="handleToggleSection('${sec.id}', this.checked)" class="sr-only peer">
          <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
        </label>
      </div>
    </div>
  `).join('');
}

function handleToggleSection(sectionId, enabled) {
  KindergartenDB.toggleSection(sectionId, enabled);
  showToast(`Section berhasil di-${enabled ? 'aktifkan' : 'nonaktifkan'} di halaman utama!`, 'info');
  renderSectionsTab();
}

function handleReorderSection(sectionId, direction) {
  KindergartenDB.reorderSection(sectionId, direction);
  renderSectionsTab();
}

// =========================================================================
// 8. INBOX / PESAN MASUK DARI WEBSITE
// =========================================================================
function renderInboxTab() {
  const inbox = KindergartenDB.getInbox();
  const container = document.getElementById('inbox-messages-list');
  if (!container) return;

  if (!inbox.length) {
    container.innerHTML = `<div class="p-12 text-center text-slate-400 text-sm">Kotak masuk masih kosong. Belum ada pesan dari pengunjung website.</div>`;
    return;
  }

  container.innerHTML = inbox.map(msg => `
    <div class="p-5 rounded-2xl border ${msg.isRead ? 'bg-white border-slate-200' : 'bg-amber-50/50 border-amber-200 shadow-sm'} transition space-y-3">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl ${msg.isRead ? 'bg-slate-100 text-slate-600' : 'bg-amber-500 text-white'} flex items-center justify-center font-bold text-sm">
            <i class="fa-solid fa-envelope"></i>
          </div>
          <div>
            <h4 class="font-bold text-slate-800 text-sm flex items-center gap-2">
              <span>${msg.name}</span>
              ${!msg.isRead ? '<span class="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">Baru</span>' : ''}
            </h4>
            <p class="text-xs text-slate-500">
              <i class="fa-brands fa-whatsapp text-emerald-600"></i> ${msg.phone} • <i class="fa-regular fa-envelope"></i> ${msg.email}
            </p>
          </div>
        </div>

        <div class="text-xs text-slate-400 flex items-center gap-2">
          <span>${msg.date}</span>
        </div>
      </div>

      <div class="bg-white/80 p-3.5 rounded-xl border border-slate-100">
        <p class="text-xs font-bold text-slate-700 mb-1">Subjek: ${msg.subject}</p>
        <p class="text-sm text-slate-600 leading-relaxed">${msg.message.replace(/\n/g, '<br>')}</p>
      </div>

      <div class="flex items-center justify-between pt-1">
        <div class="flex items-center gap-2">
          <a href="https://wa.me/${(msg.phone || '').replace(/[^0-9]/g, '')}?text=Halo%20Bapak%2FIbu%20${encodeURIComponent(msg.name)},%20merespon%20pesan%20Anda%20ke%20TK%20Bintang%20Ceria%20mengenai%20'${encodeURIComponent(msg.subject)}':" target="_blank" class="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition flex items-center gap-1.5">
            <i class="fa-brands fa-whatsapp"></i> Balas WhatsApp
          </a>
          <button onclick="handleToggleInboxRead('${msg.id}', ${!msg.isRead})" class="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition">
            ${msg.isRead ? 'Tandai Belum Dibaca' : 'Tandai Sudah Dibaca'}
          </button>
        </div>

        <button onclick="handleDeleteInbox('${msg.id}')" class="text-rose-500 hover:text-rose-700 text-xs font-bold">
          <i class="fa-solid fa-trash-can"></i> Hapus
        </button>
      </div>
    </div>
  `).join('');
}

function handleToggleInboxRead(id, status) {
  KindergartenDB.markInboxRead(id, status);
  renderInboxTab();
  updateHeaderInfo();
}

function handleDeleteInbox(id) {
  if (confirm('Hapus pesan ini dari kontak masuk?')) {
    KindergartenDB.deleteMessage(id);
    showToast('Pesan dihapus.', 'info');
    renderInboxTab();
    updateHeaderInfo();
  }
}

// =========================================================================
// 9. PUSAT CADANGAN & PENGATURAN DATABASE (BACKUP / RESTORE)
// =========================================================================
function renderSettingsTab() {
  const stats = KindergartenDB.getStats();
  document.getElementById('settings-stat-summary').textContent = `
    ${stats.totalStudents} Siswa Terdaftar, ${stats.totalArticles} Berita, ${stats.totalGallery} Foto Galeri, ${stats.totalTeachers} Guru, ${stats.totalInbox} Pesan.
  `;
}

// Download JSON Backup
function handleDownloadBackupJSON() {
  const jsonStr = KindergartenDB.exportJSON();
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `BACKUP_CMS_TK_BINTANG_CERIA_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast('Cadangan data (JSON) berhasil diunduh ke komputer Anda!', 'success');
}

// Restore JSON Backup
function handleRestoreBackupJSON(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const content = e.target.result;
    const res = KindergartenDB.importJSON(content);
    if (res.success) {
      showToast('Data website berhasil dipulihkan dari berkas cadangan!', 'success');
      refreshCurrentView();
    } else {
      showToast('Gagal memulihkan cadangan: ' + res.error, 'error');
    }
  };
  reader.readAsText(file);
}

// Reset Database to Seed Data
function handleResetDatabase() {
  const code = prompt('PERINGATAN: Seluruh data perubahan yang belum dicadangkan akan dikembalikan ke data bawaan awal.\n\nKetik kata "RESET" untuk mengonfirmasi:');
  if (code === 'RESET') {
    KindergartenDB.resetToDefaults();
    showToast('Database berhasil direset ke data bawaan awal!', 'info');
    refreshCurrentView();
  }
}

// Helper Get & Set Form Values
function getInputValue(id) {
  const el = document.getElementById(id);
  return el ? el.value : '';
}

function setInputValue(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val !== undefined && val !== null ? val : '';
}

function getCategoryBadgeColor(category) {
  switch (category) {
    case 'Pengumuman': return 'bg-amber-100 text-amber-800';
    case 'Kegiatan': return 'bg-sky-100 text-sky-800';
    case 'Prestasi': return 'bg-emerald-100 text-emerald-800';
    case 'Info Libur': return 'bg-rose-100 text-rose-800';
    default: return 'bg-purple-100 text-purple-800';
  }
}

