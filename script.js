// Smart Hire Application - Dynamic Signups & JSON Dataset Integration

let workers = [];
let clients = JSON.parse(localStorage.getItem('sh_clients')) || [];
let currentUser = JSON.parse(localStorage.getItem('sh_currentUser')) || null;

const DEFAULT_BLANK_AVATAR = "https://via.placeholder.com/150";

// Automatically load initial workers from workers.json and merge with any newly signed-up workers
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

// --- CLIENT AUTHENTICATION (Signup & Login) ---
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

// --- WORKER AUTHENTICATION (Signup & Login) ---
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

// --- ACCOUNT
