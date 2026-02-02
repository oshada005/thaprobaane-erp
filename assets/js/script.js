/**
 * Thaprobaane ERP - Monthly Isolated script
 */

let jobs = [];
let pieChart, barChart;
let currentPage = 1;
const rowsPerPage = 15;
let currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');

function updateDashboard(data) {
    let totalIncome = 0, totalExpense = 0, totalPending = 0, paidIncome = 0;
    let singer = 0, bank = 0, privateVal = 0;

    const tableBody = document.getElementById('jobTableBody');
    if (!tableBody) return;
    tableBody.innerHTML = '';

    jobs = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];

    let filteredJobs = jobs;
    if (currentMonth !== 'all') {
        filteredJobs = jobs.filter(job => {
            const dateParts = job.date.split('-');
            return dateParts[1] === currentMonth;
        });
    }

    filteredJobs.forEach((job) => {
        const price = parseFloat(job.price) || 0;
        if (job.type === 'Income') {
            totalIncome += price;
            if (job.status === 'Paid') paidIncome += price;
            else totalPending += price;
            
            if (job.source === 'Singer') singer += price;
            else if (job.source === 'Banks') bank += price;
            else privateVal += price;
        } else {
            totalExpense += price;
        }
    });

    const reversedJobs = [...filteredJobs].reverse();
    const totalPages = Math.ceil(reversedJobs.length / rowsPerPage) || 1;
    if (currentPage > totalPages) currentPage = totalPages;
    const startIndex = (currentPage - 1) * rowsPerPage;
    const paginatedJobs = reversedJobs.slice(startIndex, startIndex + rowsPerPage);

    paginatedJobs.forEach((job) => {
        const price = parseFloat(job.price) || 0;
        let sourceColor = job.source === 'Singer' ? 'bg-red-600' : (job.source === 'Banks' ? 'bg-blue-600' : (job.source === 'N/A' ? 'bg-gray-600' : 'bg-emerald-600'));
        const statusBadge = job.status === 'Paid' ? 
            `<span class="px-3 py-1 rounded-full text-[9px] font-bold bg-green-500/20 text-green-400 border border-green-500/20"><i class="fa-solid fa-check-double mr-1"></i> PAID</span>` : 
            `<button onclick="markAsPaid('${job.id}')" class="px-3 py-1 rounded-full text-[9px] font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/20 hover:bg-green-500 hover:text-white transition-all shadow-lg"><i class="fa-solid fa-clock mr-1"></i> PENDING</button>`;

        tableBody.innerHTML += `
            <tr class="hover:bg-white/5 transition border-b border-white/5 text-sm">
                <td class="p-4 text-gray-500">${job.date}</td>
                <td class="p-4"><span class="px-2 py-1 rounded text-[10px] ${sourceColor} text-white font-bold uppercase">${job.source}</span></td>
                <td class="p-4 text-gray-300">${job.description}</td>
                <td class="p-4 font-bold text-right ${job.type === 'Income' ? 'text-green-400' : 'text-red-400'}">Rs. ${price.toLocaleString()}</td>
                <td class="p-4 text-center">${statusBadge}</td>
                <td class="p-4 text-center space-x-3">
                    <button onclick="editJob('${job.id}')" class="text-blue-400 hover:text-blue-200"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button onclick="deleteJob('${job.id}')" class="text-red-500 hover:text-red-300"><i class="fa-solid fa-trash-can"></i></button>
                </td>
            </tr>`;
    });

    let netProfit = paidIncome - totalExpense;
    document.getElementById('totalIncome').innerText = `Rs. ${totalIncome.toLocaleString()}`;
    document.getElementById('totalExpenses').innerText = `Rs. ${totalExpense.toLocaleString()}`;
    document.getElementById('totalPending').innerText = `Rs. ${totalPending.toLocaleString()}`;
    document.getElementById('netProfit').innerText = `Rs. ${netProfit.toLocaleString()}`;
    document.getElementById('jobCount').innerText = filteredJobs.length;

    document.getElementById('pageInfo').innerText = `Page ${currentPage} of ${totalPages}`;
    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = (currentPage === totalPages || filteredJobs.length === 0);

    if(pieChart) { pieChart.data.datasets[0].data = [singer, bank, privateVal]; pieChart.update(); }
    if(barChart) { barChart.data.datasets[0].data = [200000, netProfit, totalPending]; barChart.update(); }
}

// Transaction Type Change Logic (Disable Partner for Expense)
document.addEventListener('DOMContentLoaded', () => {
    const entryType = document.getElementById('entryType');
    const jobSource = document.getElementById('jobSource');

    if (entryType && jobSource) {
        entryType.addEventListener('change', () => {
            if (entryType.value === 'Expense') {
                jobSource.value = 'N/A';
                jobSource.disabled = true;
                jobSource.classList.add('opacity-50', 'cursor-not-allowed');
            } else {
                jobSource.disabled = false;
                jobSource.value = 'Private';
                jobSource.classList.remove('opacity-50', 'cursor-not-allowed');
            }
        });
    }
});

document.getElementById('monthFilter').onchange = (e) => {
    currentMonth = e.target.value;
    currentPage = 1;
    updateDashboardFromData();
};

function updateDashboardFromData() {
    const rawData = jobs.reduce((obj, item) => {
        const {id, ...rest} = item;
        obj[id] = rest;
        return obj;
    }, {});
    updateDashboard(rawData);
}

document.getElementById('prevPage').onclick = () => { if (currentPage > 1) { currentPage--; updateDashboardFromData(); } };
document.getElementById('nextPage').onclick = () => {
    let currentFilterSet = currentMonth === 'all' ? jobs : jobs.filter(j => j.date.split('-')[1] === currentMonth);
    const totalPages = Math.ceil(currentFilterSet.length / rowsPerPage);
    if (currentPage < totalPages) { currentPage++; updateDashboardFromData(); }
};

window.editJob = (id) => {
    const job = jobs.find(j => j.id === id);
    if (!job) return;
    document.getElementById('editJobId').value = id;
    document.getElementById('modalDate').value = job.date;
    document.getElementById('modalSource').value = job.source;
    document.getElementById('modalType').value = job.type;
    document.getElementById('modalStatus').value = job.status;
    document.getElementById('modalPrice').value = job.price;
    document.getElementById('modalDesc').value = job.description;
    document.getElementById('editModal').classList.remove('hidden');
};

window.closeEditModal = () => { document.getElementById('editModal').classList.add('hidden'); };

document.getElementById('editForm').onsubmit = (e) => {
    e.preventDefault();
    const { update, ref, db } = window.dbFunctions;
    const id = document.getElementById('editJobId').value;
    const entry = {
        date: document.getElementById('modalDate').value,
        source: document.getElementById('modalSource').value,
        type: document.getElementById('modalType').value,
        status: document.getElementById('modalStatus').value,
        price: document.getElementById('modalPrice').value,
        description: document.getElementById('modalDesc').value
    };
    update(ref(db, 'jobs/' + id), entry).then(() => {
        closeEditModal();
        showToast('Updated!', 'success');
    });
};

window.markAsPaid = (id) => {
    const { update, ref, db } = window.dbFunctions;
    Swal.fire({ title: 'Receive Payment?', icon: 'question', showCancelButton: true, confirmButtonColor: '#10b981', background: '#1e293b', color: '#fff' }).then((result) => {
        if (result.isConfirmed) {
            update(ref(db, 'jobs/' + id), { status: 'Paid' });
            showToast('PAID', 'success');
        }
    });
};

document.getElementById('jobForm').onsubmit = (e) => {
    e.preventDefault();
    const { push } = window.dbFunctions;
    const jobSource = document.getElementById('jobSource');
    const entry = {
        date: document.getElementById('dateInput').value,
        source: jobSource.value,
        type: document.getElementById('entryType').value,
        status: document.getElementById('paymentStatus').value,
        price: document.getElementById('jobPrice').value,
        description: document.getElementById('jobDesc').value
    };
    push(window.dbRef, entry);
    showToast('Success!', 'success');
    e.target.reset();
    document.getElementById('dateInput').valueAsDate = new Date();
    // Reset partner field state
    jobSource.disabled = false;
    jobSource.classList.remove('opacity-50', 'cursor-not-allowed');
};

window.deleteJob = (id) => {
    const { remove, ref, db } = window.dbFunctions;
    Swal.fire({ title: 'Delete?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444' }).then((result) => {
        if (result.isConfirmed) {
            remove(ref(db, 'jobs/' + id));
            showToast('Deleted!', 'info');
        }
    });
};

document.addEventListener('DOMContentLoaded', () => {
    setupCharts();
    if (window.dbFunctions) {
        window.dbFunctions.onValue(window.dbRef, (snapshot) => {
            updateDashboard(snapshot.val());
        });
    }
});

function setupCharts() {
    const pieCtx = document.getElementById('incomeSourcesChart');
    const barCtx = document.getElementById('incomeExpensesChart');
    if (!pieCtx || !barCtx) return;
    pieChart = new Chart(pieCtx, { type: 'doughnut', data: { labels: ['Singer', 'Banks', 'Private'], datasets: [{ data: [0, 0, 0], backgroundColor: ['#ef4444', '#3b82f6', '#10b981'], borderWidth: 0 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8' } } } } });
    barChart = new Chart(barCtx, { type: 'bar', data: { labels: ['Target', 'Profit', 'Pending'], datasets: [{ label: 'LKR', data: [200000, 0, 0], backgroundColor: ['#334155', '#10b981', '#facc15'], borderRadius: 5 }] }, options: { responsive: true, maintainAspectRatio: false, scales: { y: { grid: { color: '#1e293b' }, ticks: { color: '#94a3b8' } }, x: { ticks: { color: '#94a3b8' } } } } });
}

function showToast(title, icon) {
    Swal.fire({ toast: true, position: 'top-end', icon: icon, title: title, showConfirmButton: false, timer: 3000, background: '#1e293b', color: '#fff' });
}

document.getElementById('exportBtnSidebar').onclick = function() {
    const excelData = jobs.filter(j => currentMonth === 'all' || j.date.split('-')[1] === currentMonth).map(j => ({ "Date": j.date, "Source": j.source, "Type": j.type, "Description": j.description, "Amount": parseFloat(j.price), "Status": j.status }));
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
    XLSX.writeFile(workbook, `Thaprobaane_Report_${currentMonth}.xlsx`);
};