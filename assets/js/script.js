/**
 * Thaprobaane ERP - Script Logic
 * Syncs Firebase data with Table & Charts
 */

let jobs = [];
let pieChart, barChart;
let currentPage = 1;
const rowsPerPage = 15;

// 1. Setup Charts
function setupCharts() {
    const pieCtx = document.getElementById('incomeSourcesChart');
    const barCtx = document.getElementById('incomeExpensesChart');
    
    if (pieCtx) {
        pieChart = new Chart(pieCtx, {
            type: 'doughnut',
            data: {
                labels: ['Singer', 'Banks', 'Private'],
                datasets: [{
                    data: [0, 0, 0],
                    backgroundColor: ['#ef4444', '#3b82f6', '#10b981'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 10 } } } }
            }
        });
    }

    if (barCtx) {
        barChart = new Chart(barCtx, {
            type: 'bar',
            data: {
                labels: ['Total Income', 'Total Expenses'],
                datasets: [{
                    label: 'LKR',
                    data: [0, 0],
                    backgroundColor: ['#3b82f6', '#ef4444'],
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { grid: { color: '#ffffff05' }, ticks: { color: '#64748b', font: { size: 10 } } },
                    x: { ticks: { color: '#64748b', font: { size: 10 } } }
                }
            }
        });
    }
}

// 2. Update Everything
function updateDashboard(data) {
    const tableBody = document.getElementById('jobTableBody');
    if (!tableBody) return;
    tableBody.innerHTML = '';

    jobs = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
    
    let totalIncome = 0, totalExpense = 0, paidIncome = 0;
    let singer = 0, bank = 0, privateVal = 0;

    jobs.forEach((job) => {
        const price = parseFloat(job.price) || 0;
        if (job.type === 'Income') {
            totalIncome += price;
            if (job.status === 'Paid') paidIncome += price;
            if (job.source === 'Singer') singer += price;
            else if (job.source === 'Banks') bank += price;
            else privateVal += price;
        } else {
            totalExpense += price;
        }
    });

    // Pagination
    const reversedJobs = [...jobs].reverse();
    const totalPages = Math.ceil(reversedJobs.length / rowsPerPage) || 1;
    const paginatedJobs = reversedJobs.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

    paginatedJobs.forEach((job) => {
        const price = parseFloat(job.price) || 0;
        let sourceColor = job.source === 'Singer' ? 'bg-red-600' : (job.source === 'Banks' ? 'bg-blue-600' : 'bg-emerald-600');
        const statusBadge = job.status === 'Paid' ? 
            `<span class="px-3 py-1 rounded-full text-[9px] font-bold bg-green-500/20 text-green-400 border border-green-500/20">PAID</span>` : 
            `<button onclick="markAsPaid('${job.id}')" class="px-3 py-1 rounded-full text-[9px] font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/20 hover:bg-green-500 hover:text-white transition">PENDING</button>`;

        tableBody.innerHTML += `
            <tr class="hover:bg-white/5 border-b border-white/5 transition">
                <td class="p-4 text-xs">${job.date}</td>
                <td class="p-4"><span class="px-2 py-1 rounded text-[9px] ${sourceColor} text-white font-black">${job.source}</span></td>
                <td class="p-4 text-xs text-gray-400">${job.description}</td>
                <td class="p-4 font-bold text-right ${job.type === 'Income' ? 'text-green-400' : 'text-red-400'}">Rs. ${price.toLocaleString()}</td>
                <td class="p-4 text-center">${statusBadge}</td>
                <td class="p-4 text-center">
                    <button onclick="prepareEditModal('${job.id}')" class="text-blue-400 mr-2"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button onclick="deleteJob('${job.id}')" class="text-red-500"><i class="fa-solid fa-trash-can"></i></button>
                </td>
            </tr>`;
    });

    // Cards Update
    document.getElementById('totalIncome').innerText = `Rs. ${totalIncome.toLocaleString()}`;
    document.getElementById('totalExpenses').innerText = `Rs. ${totalExpense.toLocaleString()}`;
    document.getElementById('netProfit').innerText = `Rs. ${(paidIncome - totalExpense).toLocaleString()}`;
    document.getElementById('jobCount').innerText = jobs.length;

    // Charts Update
    if (pieChart) { pieChart.data.datasets[0].data = [singer, bank, privateVal]; pieChart.update(); }
    if (barChart) { barChart.data.datasets[0].data = [totalIncome, totalExpense]; barChart.update(); }

    document.getElementById('pageInfo').innerText = `Page ${currentPage} of ${totalPages}`;
    document.getElementById('prevPage').disabled = (currentPage === 1);
    document.getElementById('nextPage').disabled = (currentPage === totalPages);
}

// Global modal function
window.prepareEditModal = (id) => {
    const job = jobs.find(j => j.id === id);
    if (!job) return;
    document.getElementById('editJobId').value = id;
    document.getElementById('txDate').value = job.date;
    document.getElementById('txSource').value = job.source;
    document.getElementById('txDesc').value = job.description;
    document.getElementById('txAmount').value = job.price;
    document.getElementById('txStatus').value = job.status;

    const modal = document.getElementById('transactionModal');
    const box = document.getElementById('modalBox');
    modal.classList.remove('hidden'); modal.classList.add('flex');
    setTimeout(() => box.classList.replace('scale-95', 'scale-100'), 10);
};

document.getElementById('updateTxForm').onsubmit = function(e) {
    e.preventDefault();
    const { update, ref, db } = window.dbFunctions;
    const jobId = document.getElementById('editJobId').value;
    const updated = {
        date: document.getElementById('txDate').value,
        source: document.getElementById('txSource').value,
        description: document.getElementById('txDesc').value,
        price: document.getElementById('txAmount').value,
        status: document.getElementById('txStatus').value,
        type: jobs.find(j => j.id === jobId).type
    };
    update(ref(db, 'jobs/' + jobId), updated).then(() => {
        showToast('Updated!', 'success');
        window.closeTxModal();
    });
};

document.getElementById('jobForm').onsubmit = (e) => {
    e.preventDefault();
    const { push } = window.dbFunctions;
    const entry = {
        date: document.getElementById('dateInput').value,
        source: document.getElementById('jobSource').value,
        type: document.getElementById('entryType').value,
        status: document.getElementById('paymentStatus').value,
        price: document.getElementById('jobPrice').value,
        description: document.getElementById('jobDesc').value
    };
    push(window.dbRef, entry);
    showToast('Transaction Added!', 'success');
    e.target.reset();
};

document.addEventListener('DOMContentLoaded', () => {
    setupCharts();
    if (window.dbFunctions) {
        window.dbFunctions.onValue(window.dbRef, (snapshot) => { updateDashboard(snapshot.val()); });
    }
});

// Helpers
function showToast(title, icon) { Swal.fire({ toast: true, position: 'top-end', icon: icon, title: title, showConfirmButton: false, timer: 3000, background: '#1e293b', color: '#fff' }); }
window.deleteJob = (id) => {
    const { remove, ref, db } = window.dbFunctions;
    Swal.fire({ title: 'Delete?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444' }).then((res) => { if (res.isConfirmed) remove(ref(db, 'jobs/' + id)); });
};
window.markAsPaid = (id) => {
    const { update, ref, db } = window.dbFunctions;
    update(ref(db, 'jobs/' + id), { status: 'Paid' });
    showToast('Paid!', 'success');
};
document.getElementById('prevPage').onclick = () => { if (currentPage > 1) { currentPage--; updateDashboardFromData(); } };
document.getElementById('nextPage').onclick = () => { if (currentPage < Math.ceil(jobs.length / rowsPerPage)) { currentPage++; updateDashboardFromData(); } };
function updateDashboardFromData() {
    const rawData = jobs.reduce((obj, item) => { const {id, ...rest} = item; obj[id] = rest; return obj; }, {});
    updateDashboard(rawData);
}

document.getElementById('exportBtnSidebar').onclick = function() {
    const excelData = jobs.map(j => ({ "Date": j.date, "Source": j.source, "Type": j.type, "Description": j.description, "Amount": j.price, "Status": j.status }));
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transactions");
    XLSX.writeFile(wb, "Thaprobaane_Report.xlsx");
};