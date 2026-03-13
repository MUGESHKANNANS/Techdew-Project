// Main application script

let appointments = [];
let currentFilter = "all";
let currentSort = { field: null, order: "asc" };
let nextTokenNumber = 1001;
let editingId = null;

const CONFIG = {
    STORAGE_KEY: "hospitalAppointments",
    TOKEN_KEY: "nextTokenNumber",
    MIN_GAP_MINUTES: 10,
    DEFAULT_STATUS: "Upcoming"
};

// Initialize app
function initApp() {
    loadData();
    bindEvents();
    renderAppointments();
    updateDashboard();
}

//  Local Storage 
function loadData() {

    const storedAppointments = localStorage.getItem(CONFIG.STORAGE_KEY);
    const storedToken = localStorage.getItem(CONFIG.TOKEN_KEY);

    if (storedAppointments) {
        appointments = JSON.parse(storedAppointments);
    } else {
        seedInitialData();
    }
    if (storedToken) {
        nextTokenNumber = parseInt(storedToken);
    }
}

function saveData() {
    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(appointments));
    localStorage.setItem(CONFIG.TOKEN_KEY, nextTokenNumber.toString());
}

// initial demo records
function seedInitialData() {

    appointments = [
        { id: "1", tokenId: "TK-1001", name: "Akash", age: 45, gender: "Male", phone: "9876543210", doctor: "Dr. Arul Selvan", date: "2026-03-13", time: "09:00", status: "Upcoming" },
        { id: "2", tokenId: "TK-1002", name: "Ganesh", age: 32, gender: "Female", phone: "8765432109", doctor: "Dr. Meenakshi Sundaram", date: "2026-03-13", time: "10:30", status: "Waiting" },
        { id: "3", tokenId: "TK-1003", name: "Mugesh", age: 20, gender: "Male", phone: "7654321098", doctor: "Dr. Karthik Raja", date: "2026-03-12", time: "14:00", status: "Completed" },
        { id: "4", tokenId: "TK-1004", name: "Suresh", age: 24, gender: "Female", phone: "6543210987", doctor: "Dr. Saravanan Kumar", date: "2026-03-14", time: "11:00", status: "Upcoming" },
        { id: "5", tokenId: "TK-1005", name: "Rahan", age: 41, gender: "Male", phone: "5432109876", doctor: "Dr. Anitha Lakshmi", date: "2026-03-11", time: "16:30", status: "Completed" },
        { id: "6", tokenId: "TK-1006", name: "Harish", age: 36, gender: "Female", phone: "4321098765", doctor: "Dr. James Wilson", date: "2026-03-15", time: "09:30", status: "Upcoming" }
    ];
    nextTokenNumber = 1007;
    saveData();
}

//  Event Handling 

function bindEvents() {

    document.getElementById("addAppointmentBtn")
        .addEventListener("click", () => openAppointmentModal());

    document.getElementById("closeModal")
        .addEventListener("click", closeAppointmentModal);

    document.getElementById("cancelBtn")
        .addEventListener("click", closeAppointmentModal);

    document.getElementById("appointmentModal")
        .addEventListener("click", function (e) {
            if (e.target.id === "appointmentModal") {
                closeAppointmentModal();
            }
        });

    document.getElementById("appointmentForm")
        .addEventListener("submit", handleFormSubmit);

    document.getElementById("patientPhone")
        .addEventListener("input", validatePhoneNumber);

    document.getElementById("searchInput")
        .addEventListener("input", renderAppointments);

    // conflict validation
    ["appointmentDate", "appointmentTime", "doctorName"].forEach(id => {
        document.getElementById(id).addEventListener("change", checkConflicts);
    });

    // tab filters
    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.addEventListener("click", function (e) {
            document.querySelectorAll(".tab-btn")
                .forEach(b => b.classList.remove("active"));
            e.currentTarget.classList.add("active");
            currentFilter = e.currentTarget.dataset.filter;
            renderAppointments();
        });
    });

    // table sorting
    document.querySelectorAll("th.sortable").forEach(th => {
        th.addEventListener("click", () => {
            const field = th.dataset.sort;
            handleSort(field, th);
        });
    });
}

//  Rendering 

function renderAppointments() {

    const tbody = document.getElementById("appointmentsBody");
    const emptyState = document.getElementById("emptyState");
    const searchQuery = document.getElementById("searchInput")
        .value.toLowerCase();

    let list = getFilteredList(searchQuery);

    if (currentSort.field) {
        list = getSortedList(list);
    }
    tbody.innerHTML = "";

    if (list.length === 0) {

        emptyState.style.display = "block";
        tbody.closest("table").style.display = "none";
        return;
    }

    emptyState.style.display = "none";
    tbody.closest("table").style.display = "table";
    list.forEach(apt => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td><span class="token-id">${apt.tokenId}</span></td>
            <td>${apt.name}</td>
            <td>${apt.age}</td>
            <td>${apt.gender || "N/A"}</td>
            <td>${apt.phone}</td>
            <td>${apt.doctor}</td>
            <td>${formatAppDate(apt.date)}</td>
            <td>${formatAppTime(apt.time)}</td>
            <td><span class="status-badge status-${apt.status.toLowerCase()}">${apt.status}</span></td>
            <td>
                <div class="action-btns">
                    <button class="action-btn edit" onclick="editAppointment('${apt.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" onclick="deleteAppointment('${apt.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

//  Dashboard 

function updateDashboard() {

    const stats = appointments.reduce((acc, apt) => {
        if (isToday(apt.date)) acc.today++;
        if (apt.status === "Upcoming") acc.upcoming++;
        if (apt.status === "Completed") acc.completed++;
        return acc;
    }, { today: 0, upcoming: 0, completed: 0 });

    document.getElementById("statTotal").textContent = appointments.length;
    document.getElementById("statToday").textContent = stats.today;
    document.getElementById("statUpcoming").textContent = stats.upcoming;
    document.getElementById("statCompleted").textContent = stats.completed;

}



//  Filter + Sort 

function getFilteredList(query) {

    return appointments.filter(apt => {
        const matchesTab =
            currentFilter === "all" ||
            (currentFilter === "today" && isToday(apt.date)) ||
            apt.status.toLowerCase() === currentFilter;
        const matchesSearch =
            !query ||
            apt.name.toLowerCase().includes(query) ||
            apt.doctor.toLowerCase().includes(query) ||
            apt.tokenId.toLowerCase().includes(query);
        return matchesTab && matchesSearch;
    });

}



function getSortedList(list) {

    return [...list].sort((a, b) => {
        let aVal, bVal;
        if (currentSort.field === "date") {
            aVal = new Date(`${a.date}T${a.time}`);
            bVal = new Date(`${b.date}T${b.time}`);
        } else if (typeof a[currentSort.field] === "string") {
            aVal = a[currentSort.field].toLowerCase();
            bVal = b[currentSort.field].toLowerCase();
        } else {
            aVal = a[currentSort.field];
            bVal = b[currentSort.field];
        }
        if (aVal < bVal) return currentSort.order === "asc" ? -1 : 1;
        if (aVal > bVal) return currentSort.order === "asc" ? 1 : -1;

        return 0;
    });
}

function handleSort(field, th) {

    if (currentSort.field === field) {
        currentSort.order = currentSort.order === "asc" ? "desc" : "asc";
    } else {
        currentSort.field = field;
        currentSort.order = "asc";
    }
    document.querySelectorAll("th.sortable")
        .forEach(el => el.classList.remove("sort-asc", "sort-desc"));
    th.classList.add(
        currentSort.order === "asc" ? "sort-asc" : "sort-desc"
    );
    renderAppointments();
}

//  Form Handling 

function handleFormSubmit(e) {

    e.preventDefault();
    if (!validatePhoneNumber() || !checkConflicts()) return;

    const formData = {
        name: document.getElementById("patientName").value.trim(),
        age: parseInt(document.getElementById("patientAge").value),
        gender: document.getElementById("patientGender").value,
        phone: document.getElementById("patientPhone").value.trim(),
        doctor: document.getElementById("doctorName").value,
        date: document.getElementById("appointmentDate").value,
        time: document.getElementById("appointmentTime").value,
        status: document.getElementById("appointmentStatus").value
    };

    if (editingId) {
        const index = appointments.findIndex(a => a.id === editingId);
        if (index !== -1) {
            appointments[index] = { ...appointments[index], ...formData };
        }
    } else {
        appointments.push({
            ...formData,
            id: Date.now().toString(),
            tokenId: `TK-${nextTokenNumber++}`
        });
    }
    saveData();
    renderAppointments();
    updateDashboard();
    closeAppointmentModal();
}

//  Validation 

function validatePhoneNumber() {

    const input = document.getElementById("patientPhone");
    const error = document.getElementById("phoneError");
    const valid = /^\d{10}$/.test(input.value);
    error.style.display = input.value && !valid ? "block" : "none";
    return valid;
}

function checkConflicts() {

    const doctor = document.getElementById("doctorName").value;
    const date = document.getElementById("appointmentDate").value;
    const time = document.getElementById("appointmentTime").value;
    const error = document.getElementById("conflictError");
    if (!doctor || !date || !time) {

        error.style.display = "none";
        return true;
    }
    const newTime = timeToMinutes(time);
    const conflict = appointments.some(apt =>
        apt.doctor === doctor &&
        apt.date === date &&
        apt.id !== editingId &&
        Math.abs(newTime - timeToMinutes(apt.time)) < CONFIG.MIN_GAP_MINUTES
    );
    error.style.display = conflict ? "block" : "none";
    return !conflict;
}

//  Modal 

function openAppointmentModal(appointment = null) {

    editingId = appointment ? appointment.id : null;
    const modal = document.getElementById("appointmentModal");
    const title = document.getElementById("modalTitle");
    document.getElementById("appointmentForm").reset();
    document.getElementById("phoneError").style.display = "none";
    document.getElementById("conflictError").style.display = "none";


    if (appointment) {
        title.textContent = "Edit Appointment";
        document.getElementById("patientName").value = appointment.name;
        document.getElementById("patientAge").value = appointment.age;
        document.getElementById("patientGender").value = appointment.gender || "";
        document.getElementById("patientPhone").value = appointment.phone;
        document.getElementById("doctorName").value = appointment.doctor;
        document.getElementById("appointmentDate").value = appointment.date;
        document.getElementById("appointmentTime").value = appointment.time;
        document.getElementById("appointmentStatus").value = appointment.status;
    } else {
        title.textContent = "New Appointment";

        document.getElementById("appointmentStatus").value =
            CONFIG.DEFAULT_STATUS;
    }
    modal.classList.add("active");
}

function closeAppointmentModal() {
    document.getElementById("appointmentModal").classList.remove("active");
    editingId = null;
}

//  Actions 

function editAppointment(id) {

    const apt = appointments.find(a => a.id === id);
    if (apt) {
        openAppointmentModal(apt);
    }
}

function deleteAppointment(id) {

    if (!confirm("Permanently delete this appointment?")) return;
    appointments = appointments.filter(a => a.id !== id);
    saveData();
    renderAppointments();
    updateDashboard();
}

//  Helpers 

function isToday(date) {
    return new Date(date).toDateString() === new Date().toDateString();
}

function formatAppDate(date) {
    return new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric"
    });
}

function formatAppTime(time) {

    const [h, m] = time.split(":");
    const hour = parseInt(h);
    return `${hour % 12 || 12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
}

function timeToMinutes(time) {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
}
// start the application
document.addEventListener("DOMContentLoaded", initApp);
