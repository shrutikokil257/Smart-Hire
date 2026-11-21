// Smart Hire Application - Full Open Signup & JSON State Storage

let workers = [];
let clients = JSON.parse(localStorage.getItem('sh_clients')) || [];
let currentUser = JSON.parse(localStorage.getItem('sh_currentUser')) || null;

const DEFAULT_BLANK_AVATAR = "https://via.placeholder.com/150";

let sectionHistory = ['landingSection'];
let isNavigatingBack = false;

// Automatically load initial workers from workers.json on startup and merge with saved workers
window.addEventListener('DOMContentLoaded', () => {
  injectBottomBar();
  injectWorkerProfileControls();

  const savedWorkers = JSON.parse(localStorage.getItem('sh_workers'));

  if (savedWorkers) {
    workers = savedWorkers;
    bootApplication();
  } else {
    fetch('workers.json')
      .then(response => response.json())
      .then(data => {
        workers = Array.isArray(data) ? data : [];
        localStorage.setItem('sh_workers', JSON.stringify(workers));
        bootApplication();
      })
      .catch(err => {
        console.error('Error loading workers.json:', err);
        bootApplication();
      });
  }
});

function bootApplication() {
  if (currentUser) {
    if (currentUser.role === 'client') {
      showSection('clientDashboard');
      renderClientAcceptanceBanner();
      renderWorkers();
    } else {
      showSection('workerDashboard');
      renderWorkerProfile();
    }
  } else {
    showSection('landingSection');
  }
}

function saveState() {
  localStorage.setItem('sh_workers', JSON.stringify(workers));
  localStorage.setItem('sh_clients', JSON.stringify(clients));
  localStorage.setItem('sh_currentUser', JSON.stringify(currentUser));
}

// ==========================================
// VALIDATION HELPERS
// ==========================================
function getTodayDateString() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function isPastDate(dateStr) {
  if (!dateStr) return true;
  return dateStr < getTodayDateString();
}

function normalizeTenDigitContact(rawValue) {
  const digits = String(rawValue || '').replace(/\D/g, '');
  if (digits.length !== 10) {
    alert('Invalid contact number: it must be exactly 10 digits (not less or more than 10 digits).');
    return null;
  }
  return digits;
}

// ==========================================
// NAVIGATION & BOTTOM CONTROLS
// ==========================================
function showSection(sectionId) {
  const sections = ['landingSection', 'clientAuthSection', 'workerAuthSection', 'clientDashboard', 'workerDashboard'];
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });

  const target = document.getElementById(sectionId);
  if (target) target.classList.remove('hidden');

  if (!isNavigatingBack) {
    const topSection = sectionHistory[sectionHistory.length - 1];
    if (topSection !== sectionId) {
      sectionHistory.push(sectionId);
    }
  }
  isNavigatingBack = false;

  const navInfo = document.getElementById('userNavInfo');
  if (currentUser) {
    navInfo.classList.remove('hidden');
    document.getElementById('userNameDisplay').innerText = currentUser.name;
    document.getElementById('userBadge').innerText = currentUser.role.toUpperCase();
  } else {
    navInfo.classList.add('hidden');
  }

  if (sectionId === 'clientDashboard' && currentUser && currentUser.role === 'client') {
    renderClientAcceptanceBanner();
  }
}

function goBack() {
  if (sectionHistory.length > 1) {
    sectionHistory.pop();
    const prevSection = sectionHistory[sectionHistory.length - 1] || 'landingSection';
    isNavigatingBack = true;
    showSection(prevSection);
    if (prevSection === 'clientDashboard' && currentUser?.role === 'client') {
      renderClientAcceptanceBanner();
      renderWorkers();
    } else if (prevSection === 'workerDashboard' && currentUser?.role === 'worker') {
      renderWorkerProfile();
    }
  } else {
    showSection('landingSection');
  }
}

function injectBottomBar() {
  if (document.getElementById('shBottomBar')) return;
  const bar = document.createElement('div');
  bar.id = 'shBottomBar';
  bar.className = 'w-full bg-white border-t border-gray-200 mt-auto py-4 px-4 sm:px-6 lg:px-8';
  bar.innerHTML = `
    <div class="max-w-7xl mx-auto flex items-center justify-between">
      <button type="button" onclick="goBack()" class="inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold bg-gray-100 hover:bg-gray-200 text-gray-800 transition">
        <i class="fa-solid fa-arrow-left mr-2"></i> Back
      </button>
      <button type="button" onclick="logout()" class="inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold bg-red-50 hover:bg-red-100 text-red-600 transition">
        <i class="fa-solid fa-right-from-bracket mr-2"></i> Logout
      </button>
    </div>
  `;
  document.body.appendChild(bar);
}

function openAuth(role, type) {
  if (role === 'client') {
    showSection('clientAuthSection');
    toggleAuthForm('client', type);
  } else {
    showSection('workerAuthSection');
    toggleAuthForm('worker', type);
  }
}

function toggleAuthForm(role, type) {
  if (role === 'client') {
    document.getElementById('clientLoginBox').classList.toggle('hidden', type !== 'login');
    document.getElementById('clientSignupBox').classList.toggle('hidden', type !== 'signup');
  } else {
    document.getElementById('workerLoginBox').classList.toggle('hidden', type !== 'login');
    document.getElementById('workerSignupBox').classList.toggle('hidden', type !== 'signup');
  }
}

// --- CLIENT AUTHENTICATION ---
function handleClientSignup(e) {
  e.preventDefault();
  const validContact = normalizeTenDigitContact(document.getElementById('cRegContact').value);
  if (!validContact) return;

  const newClient = {
    id: 'c_' + Date.now(),
    role: 'client',
    name: document.getElementById('cRegName').value.trim(),
    email: document.getElementById('cRegEmail').value.trim(),
    contact: validContact,
    location: document.getElementById('cRegLocation').value.trim(),
    pincode: document.getElementById('cRegPincode').value.trim(),
    pass: document.getElementById('cRegPass').value
  };

  clients.push(newClient);
  currentUser = newClient;
  saveState();
  showSection('clientDashboard');
  renderClientAcceptanceBanner();
  renderWorkers();
}

function handleClientLogin(e) {
  e.preventDefault();
  const email = document.getElementById('cLogEmail').value.trim();
  const pass = document.getElementById('cLogPass').value;

  const found = clients.find(c => c.email === email && c.pass === pass);
  if (found) {
    currentUser = found;
    saveState();
    showSection('clientDashboard');
    renderClientAcceptanceBanner();
    renderWorkers();
  } else {
    alert('Invalid Email or Password for Client account');
  }
}

// --- WORKER AUTHENTICATION (Open Signup Enabled) ---
function handleWorkerSignup(e) {
  e.preventDefault();
  const validContact = normalizeTenDigitContact(document.getElementById('wRegContact').value);
  if (!validContact) return;

  const newWorker = {
    id: 'w_' + Date.now(),
    role: 'worker',
    name: document.getElementById('wRegName').value.trim(),
    email: document.getElementById('wRegEmail').value.trim(),
    contact: validContact,
    category: document.getElementById('wRegCategory').value,
    experience: document.getElementById('wRegExp').value,
    salary: document.getElementById('wRegSalary').value,
    location: document.getElementById('wRegLocation').value.trim(),
    pincode: document.getElementById('wRegPincode').value.trim(),
    pass: document.getElementById('wRegPass').value,
    available: true,
    avatar: DEFAULT_BLANK_AVATAR,
    requests: []
  };

  workers.push(newWorker);
  currentUser = newWorker;
  saveState();
  showSection('workerDashboard');
  renderWorkerProfile();
}

function handleWorkerLogin(e) {
  e.preventDefault();
  const email = document.getElementById('wLogEmail').value.trim();
  const pass = document.getElementById('wLogPass').value;

  const found = workers.find(w => w.email === email && (w.pass === pass || !w.pass));
  if (found) {
    currentUser = found;
    saveState();
    showSection('workerDashboard');
    renderWorkerProfile();
  } else {
    alert('Invalid Email or Password for Worker account');
  }
}

function logout() {
  currentUser = null;
  sectionHistory = ['landingSection'];
  saveState();
  showSection('landingSection');
}

// --- ACCOUNT DELETION ---
function deleteCurrentAccount() {
  if (!currentUser) return;
  if (!confirm("Are you sure you want to permanently delete your account?")) return;

  if (currentUser.role === 'client') {
    clients = clients.filter(c => c.id !== currentUser.id);
  } else {
    workers = workers.filter(w => w.id !== currentUser.id);
  }

  currentUser = null;
  sectionHistory = ['landingSection'];
  saveState();
  alert("Account deleted successfully.");
  showSection('landingSection');
}

// --- CLIENT ACCEPTANCE BANNER ---
function renderClientAcceptanceBanner() {
  const dashboard = document.getElementById('clientDashboard');
  if (!dashboard) return;

  let banner = document.getElementById('clientAcceptanceBanner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'clientAcceptanceBanner';
    banner.className = 'space-y-2 mb-4';
    dashboard.prepend(banner);
  }

  if (!currentUser || currentUser.role !== 'client') {
    banner.innerHTML = '';
    return;
  }

  const acceptedMatches = [];
  workers.forEach(w => {
    (w.requests || []).forEach(req => {
      const isSameClient =
        (req.clientId && req.clientId === currentUser.id) ||
        (!req.clientId && req.clientName === currentUser.name && req.clientContact === currentUser.contact);

      if (isSameClient && req.status === 'Accepted') {
        const workerContact = w.contact || req.workerContact || 'Not provided';
        acceptedMatches.push({
          workerName: w.name,
          workerContact,
          date: req.date,
          details: req.details
        });
      }
    });
  });

  if (acceptedMatches.length === 0) {
    banner.innerHTML = '';
    return;
  }

  banner.innerHTML = acceptedMatches
    .map(item => `
      <div class="bg-emerald-50 border border-emerald-200 text-emerald-900 px-5 py-4 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <p class="font-bold text-sm">
            <i class="fa-solid fa-circle-check text-emerald-600 mr-2"></i>
            Mr. ${item.workerName} accepted your request — you can contact them at <span class="underline font-extrabold">${item.workerContact}</span>.
          </p>
          <p class="text-xs text-emerald-700 mt-0.5">Date: ${item.date} • Work: ${item.details}</p>
        </div>
        <a href="tel:${item.workerContact}" class="inline-flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition shrink-0">
          <i class="fa-solid fa-phone mr-1.5"></i> Call ${item.workerContact}
        </a>
      </div>
    `)
    .join('');
}

// --- CLIENT DASHBOARD & FILTERING ---
function renderWorkers() {
  const container = document.getElementById('workersGrid');
  const query = document.getElementById('searchInput').value.toLowerCase();
  const category = document.getElementById('categoryFilter').value;

  const filtered = workers.filter(w => {
    const matchesQuery =
      w.location.toLowerCase().includes(query) ||
      String(w.pincode).toLowerCase().includes(query) ||
      w.name.toLowerCase().includes(query);
    const matchesCategory = category === 'ALL' || w.category === category;
    return matchesQuery && matchesCategory;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div class="col-span-full text-center py-12 text-gray-500 font-medium">No workers found matching your criteria.</div>`;
    return;
  }

  container.innerHTML = filtered.map(w => {
    const existingReq = currentUser && currentUser.role === 'client'
      ? (w.requests || []).find(r =>
          (r.clientId && r.clientId === currentUser.id) ||
          (!r.clientId && r.clientName === currentUser.name && r.clientContact === currentUser.contact)
        )
      : null;

    let statusFooter = `
      <button onclick="openHireModal('${w.id}')" ${!w.available ? 'disabled' : ''} class="px-4 py-2 text-xs font-bold rounded-xl text-white ${w.available ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-300 cursor-not-allowed'} transition">
        Hire Now
      </button>
    `;

    if (existingReq && existingReq.status === 'Accepted') {
      statusFooter = `
        <span class="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
          Mr. ${w.name} accepted (${w.contact})
        </span>
      `;
    } else if (existingReq && existingReq.status === 'Pending') {
      statusFooter = `
        <span class="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
          Pending
        </span>
      `;
    }

    return `
      <div class="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between">
        <div class="p-6">
          <div class="flex items-center space-x-4">
            <img src="${w.avatar || DEFAULT_BLANK_AVATAR}" class="w-16 h-16 rounded-full object-cover border-2 border-gray-100 bg-gray-100" />
            <div>
              <span class="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">${w.category}</span>
              <h3 class="font-bold text-gray-900 text-lg mt-1">${w.name}</h3>
              <p class="text-xs text-gray-500"><i class="fa-solid fa-location-dot"></i> ${w.location} (${w.pincode})</p>
            </div>
          </div>
          <div class="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-2 text-center text-xs">
            <div class="bg-gray-50 p-2 rounded-lg">
              <span class="text-gray-400 block">Experience</span>
              <span class="font-bold text-gray-800">${w.experience} Yrs</span>
            </div>
            <div class="bg-gray-50 p-2 rounded-lg">
              <span class="text-gray-400 block">Daily Rate</span>
              <span class="font-bold text-emerald-600">₹${w.salary}</span>
            </div>
          </div>
        </div>
        <div class="p-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center gap-2">
          <span class="text-xs font-semibold flex items-center ${w.available ? 'text-emerald-600' : 'text-red-500'}">
            <span class="w-2 h-2 rounded-full ${w.available ? 'bg-emerald-500' : 'bg-red-500'} mr-1.5"></span>
            ${w.available ? 'Available' : 'Busy'}
          </span>
          ${statusFooter}
        </div>
      </div>
    `;
  }).join('');
}

function openHireModal(workerId) {
  document.getElementById('targetWorkerId').value = workerId;
  const dateInput = document.getElementById('hireDate');
  if (dateInput) {
    dateInput.min = getTodayDateString();
  }
  document.getElementById('hireModal').classList.remove('hidden');
}

function submitHireRequest(e) {
  e.preventDefault();
  const targetId = document.getElementById('targetWorkerId').value;
  const details = document.getElementById('hireDetails').value.trim();
  const date = document.getElementById('hireDate').value;

  if (isPastDate(date)) {
    alert('Cannot proceed: selected date is a past date. Please choose today or a future date.');
    return;
  }

  const workerIndex = workers.findIndex(w => w.id === targetId);
  if (workerIndex !== -1) {
    const newReq = {
      id: 'req_' + Date.now(),
      clientId: currentUser ? currentUser.id : null,
      clientName: currentUser ? currentUser.name : 'Client',
      clientContact: currentUser ? currentUser.contact : '',
      clientLocation: currentUser ? currentUser.location : '',
      details,
      date,
      status: 'Pending'
    };

    if (!workers[workerIndex].requests) workers[workerIndex].requests = [];
    workers[workerIndex].requests.push(newReq);
    saveState();

    alert('Work request sent successfully!');
    closeModal('hireModal');
    document.getElementById('hireDetails').value = '';
    document.getElementById('hireDate').value = '';
    renderWorkers();
  }
}

// --- WORKER DASHBOARD LOGIC ---
function injectWorkerProfileControls() {
  const avatarImg = document.getElementById('workerAvatar');
  if (avatarImg && !document.getElementById('shRemovePhotoBtn')) {
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.id = 'shRemovePhotoBtn';
    removeBtn.onclick = removeProfilePicture;
    removeBtn.className = 'mt-2 inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-600 transition';
    removeBtn.innerHTML = `<i class="fa-solid fa-trash mr-1"></i> Remove Photo`;

    const avatarWrapper = avatarImg.closest('.relative') || avatarImg.parentElement;
    if (avatarWrapper && avatarWrapper.parentElement) {
      const container = document.createElement('div');
      container.className = 'flex flex-col items-center';
      avatarWrapper.parentElement.insertBefore(container, avatarWrapper);
      container.appendChild(avatarWrapper);
      container.appendChild(removeBtn);
    }
  }

  const nameEl = document.getElementById('workerProfileName');
  if (nameEl && !document.getElementById('shEditProfileBtn')) {
    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.id = 'shEditProfileBtn';
    editBtn.onclick = openEditProfileModal;
    editBtn.className = 'ml-3 inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition';
    editBtn.innerHTML = `<i class="fa-solid fa-pen mr-1"></i> Edit Profile`;
    nameEl.insertAdjacentElement('afterend', editBtn);
  }
}

function openEditProfileModal() {
  const currentWorker = workers.find(w => w.id === currentUser.id) || currentUser;
  if (!currentWorker) return;

  let modal = document.getElementById('shEditProfileModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'shEditProfileModal';
    modal.className = 'hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
      <div class="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
        <div class="flex justify-between items-center">
          <h3 class="text-lg font-bold text-gray-900">Edit Worker Profile</h3>
          <button type="button" onclick="closeModal('shEditProfileModal')" class="text-gray-400 hover:text-gray-600"><i class="fa-solid fa-xmark text-xl"></i></button>
        </div>
        <form onsubmit="saveWorkerProfile(event)" class="space-y-3">
          <div>
            <label class="block text-xs font-bold text-gray-700 uppercase">Full Name</label>
            <input type="text" id="shEditName" required class="w-full mt-1 px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-700 uppercase">Contact Number (10 digits)</label>
            <input type="tel" id="shEditContact" maxlength="10" required class="w-full mt-1 px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-700 uppercase">Category / Skill</label>
            <select id="shEditCategory" required class="w-full mt-1 px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="Electrician">Electrician</option>
              <option value="Plumber">Plumber</option>
              <option value="Carpenter">Carpenter</option>
              <option value="Painter">Painter</option>
              <option value="Mason / Construction">Mason / Construction</option>
              <option value="General Helper">General Helper</option>
            </select>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase">Experience (Yrs)</label>
              <input type="number" id="shEditExp" min="0" required class="w-full mt-1 px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase">Per Day Rate (₹)</label>
              <input type="number" id="shEditSalary" min="1" required class="w-full mt-1 px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-700 uppercase">Location / Area</label>
            <input type="text" id="shEditLocation" required class="w-full mt-1 px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-700 uppercase">Pincode</label>
            <input type="text" id="shEditPincode" required class="w-full mt-1 px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <button type="submit" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl transition">Save Changes</button>
        </form>
      </div>
    `;
    document.body.appendChild(modal);
  }

  document.getElementById('shEditName').value = currentWorker.name || '';
  document.getElementById('shEditContact').value = currentWorker.contact || '';
  document.getElementById('shEditCategory').value = currentWorker.category || 'Electrician';
  document.getElementById('shEditExp').value = currentWorker.experience ?? 0;
  document.getElementById('shEditSalary').value = currentWorker.salary ?? 0;
  document.getElementById('shEditLocation').value = currentWorker.location || '';
  document.getElementById('shEditPincode').value = currentWorker.pincode || '';

  modal.classList.remove('hidden');
}

function saveWorkerProfile(e) {
  e.preventDefault();
  const validContact = normalizeTenDigitContact(document.getElementById('shEditContact').value);
  if (!validContact) return;

  const workerIndex = workers.findIndex(w => w.id === currentUser.id);
  if (workerIndex === -1) return;

  workers[workerIndex].name = document.getElementById('shEditName').value.trim();
  workers[workerIndex].contact = validContact;
  workers[workerIndex].category = document.getElementById('shEditCategory').value;
  workers[workerIndex].experience = document.getElementById('shEditExp').value;
  workers[workerIndex].salary = document.getElementById('shEditSalary').value;
  workers[workerIndex].location = document.getElementById('shEditLocation').value.trim();
  workers[workerIndex].pincode = document.getElementById('shEditPincode').value.trim();

  currentUser = workers[workerIndex];
  saveState();
  document.getElementById('userNameDisplay').innerText = currentUser.name;
  renderWorkerProfile();
  closeModal('shEditProfileModal');
  alert('Profile updated successfully!');
}

function renderWorkerProfile() {
  injectWorkerProfileControls();
  const currentWorker = workers.find(w => w.id === currentUser.id) || currentUser;

  document.getElementById('workerProfileName').innerText = currentWorker.name;
  document.getElementById('workerProfileCategory').innerText = currentWorker.category;
  document.getElementById('workerProfileExp').innerText = currentWorker.experience;
  document.getElementById('workerProfileSalary').innerText = currentWorker.salary;
  document.getElementById('workerProfileLoc').innerText = currentWorker.location;
  document.getElementById('workerProfilePin').innerText = currentWorker.pincode;
  document.getElementById('workerAvatar').src = currentWorker.avatar || DEFAULT_BLANK_AVATAR;

  const toggle = document.getElementById('availabilityToggle');
  const badge = document.getElementById('availabilityBadge');

  toggle.checked = currentWorker.available !== false;
  badge.innerText = toggle.checked ? 'Available For Work' : 'Currently Unavailable';
  badge.className = `text-sm font-bold ${toggle.checked ? 'text-emerald-600' : 'text-red-500'}`;

  renderRequests(currentWorker);
}

function toggleAvailability() {
  const workerIndex = workers.findIndex(w => w.id === currentUser.id);
  if (workerIndex !== -1) {
    workers[workerIndex].available = !workers[workerIndex].available;
    currentUser = workers[workerIndex];
    saveState();
    renderWorkerProfile();
  }
}

function handleImageUpload(e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(evt) {
      const workerIndex = workers.findIndex(w => w.id === currentUser.id);
      if (workerIndex !== -1) {
        workers[workerIndex].avatar = evt.target.result;
        currentUser = workers[workerIndex];
        saveState();
        renderWorkerProfile();
      }
    };
    reader.readAsDataURL(file);
  }
}

function removeProfilePicture() {
  const workerIndex = workers.findIndex(w => w.id === currentUser.id);
  if (workerIndex !== -1) {
    workers[workerIndex].avatar = DEFAULT_BLANK_AVATAR;
    currentUser = workers[workerIndex];
    saveState();
    renderWorkerProfile();
    alert('Profile picture removed!');
  }
}

function renderRequests(worker) {
  const list = document.getElementById('requestsList');
  const badge = document.getElementById('requestCountBadge');
  const reqs = worker.requests || [];

  badge.innerText = `${reqs.length} Request(s)`;

  if (reqs.length === 0) {
    list.innerHTML = `<p class="text-center text-gray-500 py-8 text-sm">No incoming job requests yet.</p>`;
    return;
  }

  list.innerHTML = reqs.map((r, index) => `
    <div class="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col md:flex-row justify-between md:items-center gap-4">
      <div>
        <div class="flex items-center space-x-2">
          <span class="font-bold text-gray-900">${r.clientName}</span>
          <span class="text-xs px-2 py-0.5 rounded-full ${r.status === 'Accepted' ? 'bg-emerald-100 text-emerald-800' : r.status === 'Declined' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'} font-semibold">${r.status}</span>
        </div>
        <p class="text-xs text-gray-600 mt-1"><i class="fa-solid fa-phone mr-1"></i> ${r.clientContact} | <i class="fa-solid fa-location-dot mr-1"></i> ${r.clientLocation}</p>
        <p class="text-sm font-medium text-gray-800 mt-2 bg-white p-2 rounded border border-gray-200">"${r.details}"</p>
        <p class="text-xs text-gray-400 mt-1">Requested Date: <span class="font-semibold text-gray-700">${r.date}</span></p>
      </div>
      ${r.status === 'Pending' ? `
        <div class="flex space-x-2">
          <button onclick="updateRequestStatus(${index}, 'Accepted')" class="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-lg hover:bg-emerald-700 transition">Accept</button>
          <button onclick="updateRequestStatus(${index}, 'Declined')" class="px-4 py-2 bg-red-600 text-white font-bold text-xs rounded-lg hover:bg-red-700 transition">Decline</button>
        </div>
      ` : ''}
    </div>
  `).join('');
}

function updateRequestStatus(reqIndex, status) {
  const workerIndex = workers.findIndex(w => w.id === currentUser.id);
  if (workerIndex !== -1) {
    const worker = workers[workerIndex];
    if (!worker.requests || !worker.requests[reqIndex]) return;

    worker.requests[reqIndex].status = status;
    worker.requests[reqIndex].workerName = worker.name;
    worker.requests[reqIndex].workerContact = worker.contact;

    currentUser = worker;
    saveState();
    renderWorkerProfile();

    if (status === 'Accepted') {
      alert(`Mr. ${worker.name} accepted your request — you can contact them at ${worker.contact}.`);
    }
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('hidden');
}
