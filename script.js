// Smart Hire Application - Clean Storage, Validations, Dashboards & Google Sheets Sync

const RESET_FLAG_KEY = 'sh_reset_done_v1';
const DEFAULT_BLANK_AVATAR = 'https://via.placeholder.com/150';
const GOOGLE_SHEET_API_URL =
  'https://script.google.com/macros/s/AKfycbzMx4W4kUV1zkn6Be-cKF39hf-iku1ncTZWlE5OrwNo32fuVPk6EbHGqejr6LaIjgs9/exec'

let workers = [];
let clients = [];
let currentUser = null;
let sectionHistory = ['landingSection'];
let isNavigatingBack = false;

function clearOldStorageOnce() {
  if (!localStorage.getItem(RESET_FLAG_KEY)) {
    localStorage.removeItem('sh_workers');
    localStorage.removeItem('sh_clients');
    localStorage.removeItem('sh_currentUser');
    localStorage.removeItem('smarthire_clients_v1');
    localStorage.removeItem('smarthire_workers_v1');
    localStorage.removeItem('smarthire_requests_v1');
    localStorage.removeItem('smarthire_session_v1');
    localStorage.setItem(RESET_FLAG_KEY, 'true');
  }
}

// ==========================================
// GOOGLE SHEETS SYNC HELPERS
// ==========================================
async function syncToGoogleSheet(payload) {
  if (!GOOGLE_SHEET_API_URL) return;
  try {
    await fetch(GOOGLE_SHEET_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.warn('Google Sheet sync failed, saved locally:', err);
  }
}

async function loadFromGoogleSheet() {
  if (!GOOGLE_SHEET_API_URL) return false;
  try {
    const res = await fetch(GOOGLE_SHEET_API_URL);
    const json = await res.json();
    if (json.status === 'ok' && json.data) {
      if (Array.isArray(json.data.clients) && json.data.clients.length > 0) {
        clients = json.data.clients;
      }
      const reqs = Array.isArray(json.data.requests) ? json.data.requests : [];
      if (Array.isArray(json.data.workers) && json.data.workers.length > 0) {
        workers = json.data.workers.map(w => ({
          ...w,
          available: w.available === true || String(w.available).toLowerCase() === 'true',
          requests: reqs.filter(r => String(r.workerId) === String(w.id))
        }));
        saveState();
        return true;
      }
    }
  } catch (err) {
    console.warn('Could not load from Google Sheets, using local storage:', err);
  }
  return false;
}

window.addEventListener('DOMContentLoaded', async () => {
  clearOldStorageOnce();

  clients = JSON.parse(localStorage.getItem('sh_clients')) || [];
  currentUser = JSON.parse(localStorage.getItem('sh_currentUser')) || null;
  const savedWorkers = JSON.parse(localStorage.getItem('sh_workers'));

  if (savedWorkers) {
    workers = savedWorkers;
  } else {
    try {
      const res = await fetch('workers.json');
      if (res.ok) {
        const data = await res.json();
        workers = Array.isArray(data) ? data : [];
        localStorage.setItem('sh_workers', JSON.stringify(workers));
      }
    } catch (_) {
      workers = [];
    }
  }

  // Pull latest data from Google Sheet if available
  await loadFromGoogleSheet();

  // Keep currentUser in sync with latest loaded record
  if (currentUser && currentUser.role === 'worker') {
    const freshWorker = workers.find(w => String(w.id) === String(currentUser.id));
    if (freshWorker) currentUser = freshWorker;
  } else if (currentUser && currentUser.role === 'client') {
    const freshClient = clients.find(c => String(c.id) === String(currentUser.id));
    if (freshClient) currentUser = freshClient;
  }
  saveState();

  bootApplication();
});

function bootApplication() {
  if (currentUser && currentUser.role === 'client') {
    showSection('clientDashboard');
    renderClientAcceptanceBanner();
    renderWorkers();
  } else if (currentUser && currentUser.role === 'worker') {
    showSection('workerDashboard');
    renderWorkerProfile();
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
// VALIDATIONS: DATE & 10-DIGIT NUMBER
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

function validateTenDigitContact(rawContact) {
  const digits = String(rawContact || '').trim();
  if (!/^\d{10}$/.test(digits)) {
    alert('Contact number must be exactly 10 digits (no less and no more than 10 digits).');
    return null;
  }
  return digits;
}

// ==========================================
// NAVIGATION
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
    renderWorkers();
  } else if (sectionId === 'workerDashboard' && currentUser && currentUser.role === 'worker') {
    renderWorkerProfile();
  }
}

function goBack() {
  if (sectionHistory.length > 1) {
    sectionHistory.pop();
    const prev = sectionHistory[sectionHistory.length - 1] || 'landingSection';
    isNavigatingBack = true;
    showSection(prev);
  } else {
    showSection('landingSection');
  }
}

function openAuth(role, type) {
  if (role === 'client') {
    toggleAuthForm('client', type);
    showSection('clientAuthSection');
  } else {
    toggleAuthForm('worker', type);
    showSection('workerAuthSection');
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

function logout() {
  currentUser = null;
  sectionHistory = ['landingSection'];
  saveState();
  showSection('landingSection');
}

// ==========================================
// CLIENT AUTH & DASHBOARD
// ==========================================
function handleClientSignup(e) {
  e.preventDefault();
  const validContact = validateTenDigitContact(document.getElementById('cRegContact').value);
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
  syncToGoogleSheet({ action: 'saveClient', client: newClient });
  showSection('clientDashboard');
}

function handleClientLogin(e) {
  e.preventDefault();
  const email = document.getElementById('cLogEmail').value.trim();
  const pass = document.getElementById('cLogPass').value;

  const found = clients.find(c => c.email === email && String(c.pass) === String(pass));
  if (!found) {
    alert('Invalid Email or Password for Client account.');
    return;
  }

  currentUser = found;
  saveState();
  showSection('clientDashboard');
}

function renderClientAcceptanceBanner() {
  const banner = document.getElementById('clientAcceptanceBanner');
  if (!banner) return;

  if (!currentUser || currentUser.role !== 'client') {
    banner.innerHTML = '';
    return;
  }

  const acceptedList = [];
  workers.forEach(w => {
    (w.requests || []).forEach(req => {
      const matchesClient =
        (req.clientId && String(req.clientId) === String(currentUser.id)) ||
        (!req.clientId && req.clientName === currentUser.name && String(req.clientContact) === String(currentUser.contact));

      if (matchesClient && req.status === 'Accepted') {
        acceptedList.push({
          workerName: w.name,
          workerContact: w.contact,
          date: req.date,
          details: req.details
        });
      }
    });
  });

  if (acceptedList.length === 0) {
    banner.innerHTML = '';
    return;
  }

  banner.innerHTML = acceptedList
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

function renderWorkers() {
  const container = document.getElementById('workersGrid');
  if (!container) return;

  const query = (document.getElementById('searchInput')?.value || '').toLowerCase().trim();
  const category = document.getElementById('categoryFilter')?.value || 'ALL';

  const filtered = workers.filter(w => {
    const matchesQuery =
      !query ||
      String(w.location || '').toLowerCase().includes(query) ||
      String(w.pincode || '').toLowerCase().includes(query) ||
      String(w.name || '').toLowerCase().includes(query);
    const matchesCategory = category === 'ALL' || w.category === category;
    return matchesQuery && matchesCategory;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div class="col-span-full text-center py-12 text-gray-500 font-medium">No workers found matching your criteria.</div>`;
    return;
  }

  container.innerHTML = filtered
    .map(w => {
      const existingReq = currentUser && currentUser.role === 'client'
        ? (w.requests || []).find(r =>
            (r.clientId && String(r.clientId) === String(currentUser.id)) ||
            (!r.clientId && r.clientName === currentUser.name && String(r.clientContact) === String(currentUser.contact))
          )
        : null;

      let actionArea = `
        <button onclick="openHireModal('${w.id}')" ${!w.available ? 'disabled' : ''} class="px-4 py-2 text-xs font-bold rounded-xl text-white ${w.available ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-300 cursor-not-allowed'} transition">
          Hire Now
        </button>
      `;

      if (existingReq && existingReq.status === 'Accepted') {
        actionArea = `
          <span class="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
            Mr. ${w.name} accepted (${w.contact})
          </span>
        `;
      } else if (existingReq && existingReq.status === 'Pending') {
        actionArea = `
          <span class="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
            Pending
          </span>
        `;
      }

      return `
        <div class="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between">
          <div class="p-6">
            <div class="flex items-center space-x-4">
              <img src="${w.avatar || DEFAULT_BLANK_AVATAR}" alt="${w.name}" class="w-16 h-16 rounded-full object-cover border-2 border-gray-100 bg-gray-100" />
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
            ${actionArea}
          </div>
        </div>
      `;
    })
    .join('');
}

function openHireModal(workerId) {
  if (!currentUser || currentUser.role !== 'client') {
    alert('Please log in as a client first.');
    openAuth('client', 'login');
    return;
  }
  document.getElementById('targetWorkerId').value = workerId;
  const dateInput = document.getElementById('hireDate');
  dateInput.min = getTodayDateString();
  dateInput.value = getTodayDateString();
  document.getElementById('hireModal').classList.remove('hidden');
}

function submitHireRequest(e) {
  e.preventDefault();
  const targetId = document.getElementById('targetWorkerId').value;
  const details = document.getElementById('hireDetails').value.trim();
  const date = document.getElementById('hireDate').value;

  if (isPastDate(date)) {
    alert('Past date is not allowed! Please select today or a future date.');
    return;
  }

  const workerIndex = workers.findIndex(w => String(w.id) === String(targetId));
  if (workerIndex !== -1) {
    const newReq = {
      id: 'req_' + Date.now(),
      clientId: currentUser.id,
      clientName: currentUser.name,
      clientContact: currentUser.contact,
      clientLocation: currentUser.location,
      details,
      date,
      status: 'Pending'
    };

    if (!workers[workerIndex].requests) workers[workerIndex].requests = [];
    workers[workerIndex].requests.push(newReq);
    saveState();
    syncToGoogleSheet({
      action: 'saveRequest',
      request: { ...newReq, workerId: workers[workerIndex].id }
    });

    alert('Work request sent successfully!');
    closeModal('hireModal');
    document.getElementById('hireDetails').value = '';
    document.getElementById('hireDate').value = '';
    renderWorkers();
  }
}

// ==========================================
// WORKER AUTH, PROFILE, PHOTO & REQUESTS
// ==========================================
function handleWorkerSignup(e) {
  e.preventDefault();
  const validContact = validateTenDigitContact(document.getElementById('wRegContact').value);
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
  syncToGoogleSheet({ action: 'saveWorker', worker: newWorker });
  showSection('workerDashboard');
}

function handleWorkerLogin(e) {
  e.preventDefault();
  const email = document.getElementById('wLogEmail').value.trim();
  const pass = document.getElementById('wLogPass').value;

  const found = workers.find(w => w.email === email && (String(w.pass) === String(pass) || !w.pass));
  if (!found) {
    alert('Invalid Email or Password for Worker account.');
    return;
  }

  currentUser = found;
  saveState();
  showSection('workerDashboard');
}

function renderWorkerProfile() {
  const currentWorker = workers.find(w => String(w.id) === String(currentUser.id)) || currentUser;

  document.getElementById('workerProfileName').innerText = currentWorker.name;
  document.getElementById('workerProfileCategory').innerText = currentWorker.category;
  document.getElementById('workerProfileExp').innerText = currentWorker.experience;
  document.getElementById('workerProfileSalary').innerText = currentWorker.salary;
  document.getElementById('workerProfileLoc').innerText = currentWorker.location;
  document.getElementById('workerProfilePin').innerText = currentWorker.pincode;
  document.getElementById('workerProfileContact').innerText = currentWorker.contact || '';
  document.getElementById('workerAvatar').src = currentWorker.avatar || DEFAULT_BLANK_AVATAR;

  const toggle = document.getElementById('availabilityToggle');
  const badge = document.getElementById('availabilityBadge');

  toggle.checked = currentWorker.available !== false;
  badge.innerText = toggle.checked ? 'Available For Work' : 'Currently Unavailable';
  badge.className = `text-sm font-bold ${toggle.checked ? 'text-emerald-600' : 'text-red-500'}`;

  renderRequests(currentWorker);
}

function toggleAvailability() {
  const workerIndex = workers.findIndex(w => String(w.id) === String(currentUser.id));
  if (workerIndex !== -1) {
    workers[workerIndex].available = !workers[workerIndex].available;
    currentUser = workers[workerIndex];
    saveState();
    syncToGoogleSheet({ action: 'saveWorker', worker: currentUser });
    renderWorkerProfile();
  }
}

function handleImageUpload(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (evt) {
    const workerIndex = workers.findIndex(w => String(w.id) === String(currentUser.id));
    if (workerIndex !== -1) {
      workers[workerIndex].avatar = evt.target.result;
      currentUser = workers[workerIndex];
      saveState();
      renderWorkerProfile();
    }
  };
  reader.readAsDataURL(file);
}

function removeProfilePicture() {
  const workerIndex = workers.findIndex(w => String(w.id) === String(currentUser.id));
  if (workerIndex !== -1) {
    workers[workerIndex].avatar = DEFAULT_BLANK_AVATAR;
    currentUser = workers[workerIndex];
    saveState();
    renderWorkerProfile();
    alert('Profile picture removed!');
  }
}

function openEditProfileModal() {
  const currentWorker = workers.find(w => String(w.id) === String(currentUser.id)) || currentUser;
  if (!currentWorker) return;

  document.getElementById('editName').value = currentWorker.name || '';
  document.getElementById('editContact').value = currentWorker.contact || '';
  document.getElementById('editCategory').value = currentWorker.category || 'Electrician';
  document.getElementById('editExp').value = currentWorker.experience ?? 0;
  document.getElementById('editSalary').value = currentWorker.salary ?? 0;
  document.getElementById('editLocation').value = currentWorker.location || '';
  document.getElementById('editPincode').value = currentWorker.pincode || '';

  document.getElementById('editProfileModal').classList.remove('hidden');
}

function saveWorkerProfile(e) {
  e.preventDefault();
  const validContact = validateTenDigitContact(document.getElementById('editContact').value);
  if (!validContact) return;

  const workerIndex = workers.findIndex(w => String(w.id) === String(currentUser.id));
  if (workerIndex === -1) return;

  workers[workerIndex].name = document.getElementById('editName').value.trim();
  workers[workerIndex].contact = validContact;
  workers[workerIndex].category = document.getElementById('editCategory').value;
  workers[workerIndex].experience = document.getElementById('editExp').value;
  workers[workerIndex].salary = document.getElementById('editSalary').value;
  workers[workerIndex].location = document.getElementById('editLocation').value.trim();
  workers[workerIndex].pincode = document.getElementById('editPincode').value.trim();

  currentUser = workers[workerIndex];
  saveState();
  syncToGoogleSheet({ action: 'saveWorker', worker: currentUser });
  document.getElementById('userNameDisplay').innerText = currentUser.name;
  renderWorkerProfile();
  closeModal('editProfileModal');
  alert('Profile updated successfully!');
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

  list.innerHTML = reqs
    .map((r, index) => `
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
    `)
    .join('');
}

function updateRequestStatus(reqIndex, status) {
  const workerIndex = workers.findIndex(w => String(w.id) === String(currentUser.id));
  if (workerIndex === -1) return;

  const worker = workers[workerIndex];
  if (!worker.requests || !worker.requests[reqIndex]) return;

  worker.requests[reqIndex].status = status;
  worker.requests[reqIndex].workerName = worker.name;
  worker.requests[reqIndex].workerContact = worker.contact;

  currentUser = worker;
  saveState();
  syncToGoogleSheet({
    action: 'saveRequest',
    request: { ...worker.requests[reqIndex], workerId: worker.id }
  });
  renderWorkerProfile();

  if (status === 'Accepted') {
    alert(`Mr. ${worker.name} accepted your request — you can contact them at ${worker.contact}.`);
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('hidden');
}
