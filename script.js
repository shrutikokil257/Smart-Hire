// Smart Hire Application - Full Open Signup & JSON State Storage

let workers = [];
let clients = JSON.parse(localStorage.getItem('sh_clients')) || [];
let currentUser = JSON.parse(localStorage.getItem('sh_currentUser')) || null;

const DEFAULT_BLANK_AVATAR = "https://via.placeholder.com/150";

// Automatically load initial workers from workers.json on startup and merge with saved workers
window.addEventListener('DOMContentLoaded', () => {
  const savedWorkers = JSON.parse(localStorage.getItem('sh_workers'));
  
  if (savedWorkers) {
    workers = savedWorkers;
    bootApplication();
  } else {
    fetch('workers.json')
      .then(response => response.json())
      .then(data => {
        workers = data;
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
    showSection(currentUser.role === 'client' ? 'clientDashboard' : 'workerDashboard');
    if (currentUser.role === 'client') renderWorkers();
    else renderWorkerProfile();
  } else {
    showSection('landingSection');
  }
}

function saveState() {
  localStorage.setItem('sh_workers', JSON.stringify(workers));
  localStorage.setItem('sh_clients', JSON.stringify(clients));
  localStorage.setItem('sh_currentUser', JSON.stringify(currentUser));
}

function showSection(sectionId) {
  const sections = ['landingSection', 'clientAuthSection', 'workerAuthSection', 'clientDashboard', 'workerDashboard'];
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });

  const target = document.getElementById(sectionId);
  if (target) target.classList.remove('hidden');

  const navInfo = document.getElementById('userNavInfo');
  if (currentUser) {
    navInfo.classList.remove('hidden');
    document.getElementById('userNameDisplay').innerText = currentUser.name;
    document.getElementById('userBadge').innerText = currentUser.role.toUpperCase();
  } else {
    navInfo.classList.add('hidden');
  }
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
  const newClient = {
    id: 'c_' + Date.now(),
    role: 'client',
    name: document.getElementById('cRegName').value,
    email: document.getElementById('cRegEmail').value,
    contact: document.getElementById('cRegContact').value,
    location: document.getElementById('cRegLocation').value,
    pincode: document.getElementById('cRegPincode').value,
    pass: document.getElementById('cRegPass').value
  };

  clients.push(newClient);
  currentUser = newClient;
  saveState();
  showSection('clientDashboard');
  renderWorkers();
}

function handleClientLogin(e) {
  e.preventDefault();
  const email = document.getElementById('cLogEmail').value;
  const pass = document.getElementById('cLogPass').value;

  const found = clients.find(c => c.email === email && c.pass === pass);
  if (found) {
    currentUser = found;
    saveState();
    showSection('clientDashboard');
    renderWorkers();
  } else {
    alert('Invalid Email or Password for Client account');
  }
}

// --- WORKER AUTHENTICATION (Open Signup Enabled) ---
function handleWorkerSignup(e) {
  e.preventDefault();
  const newWorker = {
    id: 'w_' + Date.now(),
    role: 'worker',
    name: document.getElementById('wRegName').value,
    email: document.getElementById('wRegEmail').value,
    contact: document.getElementById('wRegContact').value,
    category: document.getElementById('wRegCategory').value,
    experience: document.getElementById('wRegExp').value,
    salary: document.getElementById('wRegSalary').value,
    location: document.getElementById('wRegLocation').value,
    pincode: document.getElementById('wRegPincode').value,
    pass: document.getElementById('wRegPass').value,
    available: true,
    avatar: DEFAULT_BLANK_AVATAR,
    requests: []
  };

  // Automatically add new worker to the workers JSON list
  workers.push(newWorker);
  currentUser = newWorker;
  saveState();
  showSection('workerDashboard');
  renderWorkerProfile();
}

function handleWorkerLogin(e) {
  e.preventDefault();
  const email = document.getElementById('wLogEmail').value;
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
  saveState();
  alert("Account deleted successfully.");
  showSection('landingSection');
}

// --- CLIENT DASHBOARD & FILTERING ---
function renderWorkers() {
  const container = document.getElementById('workersGrid');
  const query = document.getElementById('searchInput').value.toLowerCase();
  const category = document.getElementById('categoryFilter').value;

  const filtered = workers.filter(w => {
    const matchesQuery = w.location.toLowerCase().includes(query) || w.pincode.includes(query) || w.name.toLowerCase().includes(query);
    const matchesCategory = category === 'ALL' || w.category === category;
    return matchesQuery && matchesCategory;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div class="col-span-full text-center py-12 text-gray-500 font-medium">No workers found matching your criteria.</div>`;
    return;
  }

  container.innerHTML = filtered.map(w => `
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
      <div class="p-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
        <span class="text-xs font-semibold flex items-center ${w.available ? 'text-emerald-600' : 'text-red-500'}">
          <span class="w-2 h-2 rounded-full ${w.available ? 'bg-emerald-500' : 'bg-red-500'} mr-1.5"></span>
          ${w.available ? 'Available' : 'Busy'}
        </span>
        <button onclick="openHireModal('${w.id}')" ${!w.available ? 'disabled' : ''} class="px-4 py-2 text-xs font-bold rounded-xl text-white ${w.available ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-300 cursor-not-allowed'} transition">
          Hire Now
        </button>
      </div>
    </div>
  `).join('');
}

function openHireModal(workerId) {
  document.getElementById('targetWorkerId').value = workerId;
  document.getElementById('hireModal').classList.remove('hidden');
}

function submitHireRequest(e) {
  e.preventDefault();
  const targetId = document.getElementById('targetWorkerId').value;
  const details = document.getElementById('hireDetails').value;
  const date = document.getElementById('hireDate').value;

  const workerIndex = workers.findIndex(w => w.id === targetId);
  if (workerIndex !== -1) {
    const newReq = {
      id: 'req_' + Date.now(),
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

    alert('Work request sent successfully!');
    closeModal('hireModal');
    document.getElementById('hireDetails').value = '';
    document.getElementById('hireDate').value = '';
  }
}

// --- WORKER DASHBOARD LOGIC ---
function renderWorkerProfile() {
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
    workers[workerIndex].requests[reqIndex].status = status;
    currentUser = workers[workerIndex];
    saveState();
    renderWorkerProfile();
  }
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.add('hidden');
}
