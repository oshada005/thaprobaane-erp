/**
 * Thaprobaane ERP - Cloud Version (Firebase)
 * Final Build: Pagination + Popup Modal Editing
 */

let jobs = [];
let pieChart, barChart;
let currentPage = 1;
const rowsPerPage = 15;

// 1. Dashboard සහ Table එක Update කිරීම
function updateDashboard(data) {
    const tableBody = document.getElementById('jobTableBody');
    if (!tableBody) return;
    tableBody.innerHTML = '';

    // Firebase දත්ත Array එකකට හරවමු
    jobs = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
    
    let totalIncome = 0, paidIncome = 0, totalExpense = 0;
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

    // Pagination Logic
    const reversedJobs = [...jobs].reverse();
    const totalPages = Math.ceil(reversedJobs.length / rowsPerPage) || 1;
    const startIndex = (currentPage - 1) * rowsPerPage;
    const paginatedJobs = reversedJobs.slice(startIndex, startIndex + rowsPerPage);

    paginatedJobs.forEach((job) => {
        const price = parseFloat(job.price) || 0;
        let sourceColor = job.source === 'Singer' ? 'bg-red-600' : (job.source === 'Banks' ? 'bg-blue-600' : 'bg-emerald-600');

        const statusBadge = job.status === 'Paid' ? 
            `<span class="px-3 py-1 rounded-full text-[9px] font-bold bg-green-500/20 text-green-400 border border-green-500/20"><i class="fa-solid fa-check-double mr-1"></i> PAID</span>` : 
            `<button onclick="markAsPaid('${job.id}')" class="px-3 py-1 rounded-full text-[9px] font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/20 hover:bg-green-500 hover:text-white transition-all shadow-lg"><i class="fa-solid fa-clock mr-1"></i> PENDING</button>`;

        // මෙතනදී තමයි Popup එකට Data යවන්නේ
        tableBody.innerHTML += `
            <tr class="hover:bg-white/5 transition border-b border-white/5 text-sm text-gray-300">
                <td class="p-4 text-gray-500">${job.date}</td>
                <td class="p-4"><span class="px-2 py-1 rounded text-[10px] ${sourceColor} text-white font-bold uppercase">${job.source}</span></td>
                <td class="p-4">${job.description}</td>
                <td class="p-4 font-bold text-right ${job.type === 'Income' ? 'text-green-400' : 'text-red-400'}">Rs. ${price.toLocaleString()}</td>
                <td class="p-4 text-center">${statusBadge}</td>
                <td class="p-4 text-center space-x-3">
                    <button onclick="prepareEditModal('${job.id}')" class="text-blue-400 hover:text-blue-200 text-lg transition"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button onclick="deleteJob('${job.id}')" class="text-red-500 hover:text-red-300 text-lg transition"><i class="fa-solid fa-trash-can"></i></button>
                </td>
            </tr>`;
    });

    // Stats & UI Update
    document.getElementById('pageInfo').innerText = `Page ${currentPage} of ${totalPages}`;
    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = currentPage === totalPages;
    
    let netProfit = paidIncome - totalExpense;
    document.getElementById('totalIncome').innerText = `Rs. ${totalIncome.toLocaleString()}`;
    document.getElementById('totalExpenses').innerText = `Rs. ${totalExpense.toLocaleString()}`;
    document.getElementById('netProfit').innerText = `Rs. ${netProfit.toLocaleString()}`;
    document.getElementById('jobCount').innerText = jobs.length;

    if(pieChart) { pieChart.data.datasets[0].data = [singer, bank, privateVal]; pieChart.update(); }
    if(barChart) { barChart.data.datasets[0].data[1] = netProfit; barChart.update(); }
}

// 2. Popup Modal Editing Logic
window.prepareEditModal = (id) => {
    const job = jobs.find(j => j.id === id);
    if (!job) return;

    // Form එකට Data පිරවීම
    document.getElementById('editJobId').value = id;
    document.getElementById('txDate').value = job.date;
    document.getElementById('txSource').value = job.source;
    document.getElementById('txDesc').value = job.description;
    document.getElementById('txAmount').value = job.price;
    document.getElementById('txStatus').value = job.status;

    // Modal එක පෙන්වීම
    const modal = document.getElementById('transactionModal');
    const box = document.getElementById('modalBox');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    setTimeout(() => box.classList.replace('scale-95', 'scale-100'), 10);
};

// Modal එකෙන් Data Update කිරීම (Firebase)
document.getElementById('updateTxForm').onsubmit = function(e) {
    e.preventDefault();
    if (!window.dbFunctions) return;
    const { update, ref, db } = window.dbFunctions;

    const jobId = document.getElementById('editJobId').value;
    const updatedData = {
        date: document.getElementById('txDate').value,
        source: document.getElementById('txSource').value,
        description: document.getElementById('txDesc').value,
        price: document.getElementById('txAmount').value,
        status: document.getElementById('txStatus').value
    };

    update(ref(db, 'jobs/' + jobId), updatedData)
        .then(() => {
            showToast('Record Updated Successfully!', 'success');
            window.closeTxModal();
        })
        .catch(err => showToast('Update Failed!', 'error'));
};

// 3. මුලින්ම Form එකෙන් දත්ත ඇතුළත් කිරීම (Quick Entry)
document.getElementById('jobForm').onsubmit = (e) => {
    e.preventDefault();
    if (!window.dbFunctions) return;
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

// --- Helper Functions (Pagination, Charts, Toast) ---

document.getElementById('prevPage').onclick = () => { if (currentPage > 1) { currentPage--; refreshUI(); } };
document.getElementById('nextPage').onclick = () => { const totalPages = Math.ceil(jobs.length / rowsPerPage); if (currentPage < totalPages) { currentPage++; refreshUI(); } };

function refreshUI() {
    const rawData = jobs.reduce((obj, item) => {
        const {id, ...rest} = item;
        obj[id] = rest;
        return obj;
    }, {});
    updateDashboard(rawData);
}

document.addEventListener('DOMContentLoaded', () => {
    setupCharts();
    if (window.dbFunctions) {
        window.dbFunctions.onValue(window.dbRef, (snapshot) => {
            updateDashboard(snapshot.val());
        });
    }
});

function showToast(title, icon) {
    Swal.fire({
        toast: true, position: 'top-end', icon: icon, title: title,
        showConfirmButton: false, timer: 3000, timerProgressBar: true,
        background: '#1e293b', color: '#fff'
    });
}

window.deleteJob = (id) => {
    const { remove, ref, db } = window.dbFunctions;
    Swal.fire({ title: 'Delete this?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Yes, Delete!' })
    .then((result) => { if (result.isConfirmed) remove(ref(db, 'jobs/' + id)); });
};

window.markAsPaid = (id) => {
    const { update, ref, db } = window.dbFunctions;
    update(ref(db, 'jobs/' + id), { status: 'Paid' });
    showToast('Status: PAID', 'success');
};

function setupCharts() {
    const pieCtx = document.getElementById('incomeSourcesChart');
    const barCtx = document.getElementById('incomeExpensesChart');
    if (!pieCtx || !barCtx) return;
    pieChart = new Chart(pieCtx, { type: 'doughnut', data: { labels: ['Singer', 'Banks', 'Private'], datasets: [{ data: [0, 0, 0], backgroundColor: ['#ef4444', '#3b82f6', '#10b981'], borderWidth: 0 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8' } } } } });
    barChart = new Chart(barCtx, { type: 'bar', data: { labels: ['Target', 'Profit'], datasets: [{ label: 'LKR', data: [200000, 0], backgroundColor: ['#334155', '#10b981'], borderRadius: 5 }] }, options: { responsive: true, maintainAspectRatio: false } });
}

document.getElementById('exportBtnSidebar').onclick = function() {
    const excelData = jobs.map(j => ({ "Date": j.date, "Source": j.source, "Type": j.type, "Description": j.description, "Amount": parseFloat(j.price), "Status": j.status }));
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");
    XLSX.writeFile(workbook, "Thaprobaane_Report.xlsx");
};