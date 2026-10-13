// LocalStorage initialization with sample mock data if empty
if (!localStorage.getItem('workers')) {
    const sampleWorkers = [
        { id: '1', name: 'Ramesh Kumar', email: 'ramesh@gmail.com', password: '123', category: 'Plumber', pincode: '444001', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' },
        { id: '2', name: 'Suresh Patil', email: 'suresh@gmail.com', password: '123', category: 'Electrician', pincode: '444002', photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150' }
    ];
    localStorage.setItem('workers', JSON.stringify(sampleWorkers));
}
if (!localStorage.getItem('requests')) {
    localStorage.setItem('requests', JSON.stringify([]));
}

let currentActiveWorkerId = localStorage.getItem('currentActiveWorkerId') || null;
let selectedWorkerForRequest = null;

// View Switcher helper
function showHome() {
    document.getElementById('view-home').classList.remove('hidden');
    document.getElementById('view-client').classList.add('hidden');
    document.getElementById('view-worker').classList.add('hidden');
}

function switchRole(role) {
    document.getElementById('view-home').classList.add('hidden');
    if (role === 'client') {
        document.getElementById('view-client').classList.remove('hidden');
        document.getElementById('view-worker').classList.add('hidden');
        searchWorkers(); // load initial workers
    } else {
        document.getElementById('view-client').classList.add('hidden');
        document.getElementById('view-worker').classList.remove('hidden');
        checkWorkerAuthState();
    }
}

// --- WORKER AUTH & DASHBOARD LOGIC ---
function toggleWorkerTab(tab) {
    if (tab === 'login') {
        document.getElementById('worker-login-form').classList.remove('hidden');
        document.getElementById('worker-signup-form').classList.add('hidden');
        document.getElementById('tab-login-btn').className = "flex-1 pb-2 font-bold text-emerald-600 border-b-2 border-emerald-600";
        document.getElementById('tab-signup-btn').className = "flex-1 pb-2 font-semibold text-slate-400";
    } else {
        document.getElementById('worker-login-form').classList.add('hidden');
        document.getElementById('worker-signup-form').classList.remove('hidden');
        document.getElementById('tab-signup-btn').className = "flex-1 pb-2 font-bold text-emerald-600 border-b-2 border-emerald-600";
        document.getElementById('tab-login-btn').className = "flex-1 pb-2 font-semibold text-slate-400";
    }
}

function handleWorkerSignup() {
    const name = document.getElementById('w-name').value;
    const email = document.getElementById('w-email').value;
    const password = document.getElementById('w-password').value;
    const category = document.getElementById('w-category').value;
    const pincode = document.getElementById('w-pincode').value;
    const photo = document.getElementById('w-photo').value || 'https://placehold.co/150';

    if (!name || !email || !password || !pincode) {
        alert('Please fill all required fields!');
        return;
    }

    let workers = JSON.parse(localStorage.getItem('workers'));
    if (workers.some(w => w.email === email)) {
        alert('Email already registered!');
        return;
    }

    const newWorker = { id: Date.now().toString(), name, email, password, category, pincode, photo };
    workers.push(newWorker);
    localStorage.setItem('workers', JSON.stringify(workers));

    currentActiveWorkerId = newWorker.id;
    localStorage.setItem('currentActiveWorkerId', currentActiveWorkerId);
    alert('Registration Successful!');
    checkWorkerAuthState();
}

function handleWorkerLogin() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    let workers = JSON.parse(localStorage.getItem('workers'));
    const worker = workers.find(w => w.email === email && w.password === password);

    if (worker) {
        currentActiveWorkerId = worker.id;
        localStorage.setItem('currentActiveWorkerId', currentActiveWorkerId);
        checkWorkerAuthState();
    } else {
        alert('Invalid email or password!');
    }
}

function logoutWorker() {
    currentActiveWorkerId = null;
    localStorage.removeItem('currentActiveWorkerId');
    checkWorkerAuthState();
}

function checkWorkerAuthState() {
    if (currentActiveWorkerId) {
        document.getElementById('worker-auth-container').classList.add('hidden');
        document.getElementById('worker-dashboard').classList.remove('hidden');
        loadWorkerDashboard();
    } else {
        document.getElementById('worker-auth-container').classList.remove('hidden');
        document.getElementById('worker-dashboard').classList.add('hidden');
        toggleWorkerTab('login');
    }
}

function loadWorkerDashboard() {
    let workers = JSON.parse(localStorage.getItem('workers'));
    const worker = workers.find(w => w.id === currentActiveWorkerId);
    if (!worker) return;

    document.getElementById('dash-name').innerText = worker.name;
    document.getElementById('dash-category').innerText = worker.category;
    document.getElementById('dash-pincode').innerText = worker.pincode;
    document.getElementById('dash-photo').src = worker.photo;

    // Fill edit form
    document.getElementById('edit-w-name').value = worker.name;
    document.getElementById('edit-w-category').value = worker.category;
    document.getElementById('edit-w-pincode').value = worker.pincode;
    document.getElementById('edit-w-photo').value = worker.photo;

    loadWorkerRequests();
}

function saveProfileChanges() {
    let workers = JSON.parse(localStorage.getItem('workers'));
    let index = workers.findIndex(w => w.id === currentActiveWorkerId);
    if (index !== -1) {
        workers[index].name = document.getElementById('edit-w-name').value;
        workers[index].category = document.getElementById('edit-w-category').value;
        workers[index].pincode = document.getElementById('edit-w-pincode').value;
        workers[index].photo = document.getElementById('edit-w-photo').value;

        localStorage.setItem('workers', JSON.stringify(workers));
        alert('Profile updated successfully!');
        loadWorkerDashboard();
    }
}

function loadWorkerRequests() {
    let requests = JSON.parse(localStorage.getItem('requests')) || [];
    const myRequests = requests.filter(r => r.workerId === currentActiveWorkerId);
    const container = document.getElementById('worker-requests-list');

    if (myRequests.length === 0) {
        container.innerHTML = '<p class="text-slate-500 text-sm">No work requests received yet.</p>';
        return;
    }

    container.innerHTML = myRequests.map(r => `
        <div class="bg-white p-4 rounded-xl shadow border flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h4 class="font-bold text-slate-800">${r.clientName} (<span class="text-indigo-600">${r.clientPhone}</span>)</h4>
                <p class="text-sm text-slate-600 mt-1"><strong>Requirement:</strong> ${r.requirements}</p>
                <p class="text-xs text-slate-400 mt-1">Location: ${r.clientLocation}</p>
            </div>
            <span class="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">${r.status}</span>
        </div>
    `).join('');
}

// --- CLIENT SEARCH & REQUEST LOGIC ---
function searchWorkers() {
    const categoryFilter = document.getElementById('search-category').value.toLowerCase();
    const pincodeFilter = document.getElementById('search-pincode').value.trim();

    let workers = JSON.parse(localStorage.getItem('workers')) || [];
    let filtered = workers.filter(w => {
        let matchCat = categoryFilter ? w.category.toLowerCase() === categoryFilter : true;
        let matchPin = pincodeFilter ? w.pincode.includes(pincodeFilter) : true;
        return matchCat && matchPin;
    });

    const grid = document.getElementById('workers-results-grid');
    if (filtered.length === 0) {
        grid.innerHTML = '<p class="text-slate-500 col-span-3">No workers found matching your filters.</p>';
        return;
    }

    grid.innerHTML = filtered.map(w => `
        <div class="bg-white p-5 rounded-xl shadow border flex flex-col items-center text-center">
            <img src="${w.photo}" alt="${w.name}" class="w-20 h-20 rounded-full object-cover mb-3 border">
            <h4 class="font-bold text-lg text-slate-800">${w.name}</h4>
            <span class="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full font-medium my-1">${w.category}</span>
            <p class="text-sm text-slate-500 mb-4">Pincode: ${w.pincode}</p>
            <button onclick="openRequestModal('${w.id}', '${w.name}')" class="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">Send Work Request</button>
        </div>
    `).join('');
}

function openRequestModal(workerId, workerName) {
    const clientName = document.getElementById('client-name').value;
    const clientPhone = document.getElementById('client-phone').value;
    if (!clientName || !clientPhone) {
        alert('Please enter your Name and Phone Number in the Client Setup section above first!');
        return;
    }
    selectedWorkerForRequest = workerId;
    document.getElementById('modal-worker-name').innerText = workerName;
    document.getElementById('request-modal').classList.remove('hidden');
}

function closeRequestModal() {
    document.getElementById('request-modal').classList.add('hidden');
    document.getElementById('modal-requirements').value = '';
}

function submitWorkRequest() {
    const requirements = document.getElementById('modal-requirements').value;
    if (!requirements) {
        alert('Please write your requirements.');
        return;
    }

    const clientName = document.getElementById('client-name').value;
    const clientPhone = document.getElementById('client-phone').value;
    const clientLocation = document.getElementById('client-location').value;

    let requests = JSON.parse(localStorage.getItem('requests')) || [];
    const newReq = {
        id: Date.now().toString(),
        workerId: selectedWorkerForRequest,
        clientName,
        clientPhone,
        clientLocation,
        requirements,
        status: 'Pending'
    };

    requests.push(newReq);
    localStorage.setItem('requests', JSON.stringify(requests));

    alert('Work request sent successfully to the worker!');
    closeRequestModal();
}
