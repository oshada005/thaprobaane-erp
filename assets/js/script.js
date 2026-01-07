/**
 * Thaprobaane ERP - Cloud Version (Firebase)
 * Final Build for Oshada - Payment Toggle Fixed
 */

let jobs = [];
let pieChart, barChart;
let editId = null;

// 1. Dashboard එකේ දත්ත සහ Table එක Update කිරීම
function updateDashboard(data) {
    let totalIncome = 0, paidIncome = 0, totalExpense = 0;
    let singer = 0, bank = 0, privateVal = 0;

    const tableBody = document.getElementById('jobTableBody');
    if (!tableBody) return;
    tableBody.innerHTML = '';

    // Firebase දත්ත Array එකකට හරවමු
    jobs = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];

    jobs.slice().reverse().forEach((job) => {
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

        let sourceColor = job.source === 'Singer' ? 'bg-red-600' : (job.source === 'Banks' ? 'bg-blue-600' : 'bg-emerald-600');

        // Status Badge එක සහ Button එක මෙතනින් හදන්නේ
        const statusBadge = job.status === 'Paid' ? 
            `<span class="px-3 py-1 rounded-full text-[9px] font-bold bg-green-500/20 text-green-400 border border-green-500/20"><i class="fa-solid fa-check-double mr-1"></i> PAID</span>` : 
            `<button onclick="markAsPaid('${job.id}')" class="px-3 py-1 rounded-full text-[9px] font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/20 hover:bg-green-500 hover:text-white transition-all shadow-lg"><i class="fa-solid fa-clock mr-1"></i> PENDING</button>`;

        tableBody.innerHTML += `
            <tr class="hover:bg-white/5 transition border-b border-white/5 text-sm text-gray-300">
                <td class="p-4 text-gray-500">${job.date}</td>
                <td class="p-4"><span class="px-2 py-1 rounded text-[10px] ${sourceColor} text-white font-bold uppercase">${job.source}</span></td>
                <td class="p-4">${job.description}</td>
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
    document.getElementById('netProfit').innerText = `Rs. ${netProfit.toLocaleString()}`;
    document.getElementById('jobCount').innerText = jobs.length;

    if(pieChart) { pieChart.data.datasets[0].data = [singer, bank, privateVal]; pieChart.update(); }
    if(barChart) { barChart.data.datasets[0].data[1] = netProfit; barChart.update(); }
}

// 2. දත්ත පද්ධතිය ආරම්භයේදී දත්ත කියවීම
document.addEventListener('DOMContentLoaded', () => {
    setupCharts();
    if (window.dbFunctions) {
        window.dbFunctions.onValue(window.dbRef, (snapshot) => {
            updateDashboard(snapshot.val());
        });
    }
});

// 3. Payment එක "Paid" ලෙස Update කරන Function එක (මෙන්න මේක තමයි අලුතින් හැදුවේ)
window.markAsPaid = (id) => {
    if (!window.dbFunctions) return;
    const { update, ref, db } = window.dbFunctions;
    
    Swal.fire({
        title: 'Payment එක ලැබුනා ද?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#10b981',
        cancelButtonColor: '#334155',
        confirmButtonText: 'ඔව්, ලැබුනා!',
        background: '#1e293b',
        color: '#fff'
    }).then((result) => {
        if (result.isConfirmed) {
            update(ref(db, 'jobs/' + id), { status: 'Paid' });
            Swal.fire({ title: 'Updated!', icon: 'success', timer: 1500, showConfirmButton: false });
        }
    });
};

// 4. දත්ත සේව් කිරීම
document.getElementById('jobForm').onsubmit = (e) => {
    e.preventDefault();
    if (!window.dbFunctions) return;
    const { push, update, ref, db } = window.dbFunctions;

    const entry = {
        date: document.getElementById('dateInput').value,
        source: document.getElementById('jobSource').value,
        type: document.getElementById('entryType').value,
        status: document.getElementById('paymentStatus').value,
        price: document.getElementById('jobPrice').value,
        description: document.getElementById('jobDesc').value
    };

    if (editId) {
        update(ref(db, 'jobs/' + editId), entry);
        editId = null;
        document.getElementById('formTitle').innerHTML = 'Quick Entry';
    } else {
        push(window.dbRef, entry);
    }
    e.target.reset();
};

// 5. Delete Logic
window.deleteJob = (id) => {
    if (!window.dbFunctions) return;
    const { remove, ref, db } = window.dbFunctions;
    Swal.fire({ title: 'මකන්නද?', icon: 'warning', showCancelButton: true }).then((result) => {
        if (result.isConfirmed) remove(ref(db, 'jobs/' + id));
    });
};

// 6. Edit Logic
window.editJob = (id) => {
    const job = jobs.find(j => j.id === id);
    document.getElementById('dateInput').value = job.date;
    document.getElementById('jobSource').value = job.source;
    document.getElementById('entryType').value = job.type;
    document.getElementById('paymentStatus').value = job.status;
    document.getElementById('jobPrice').value = job.price;
    document.getElementById('jobDesc').value = job.description;
    editId = id;
    document.getElementById('formTitle').innerText = 'Edit Transaction';
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Charts Setup
function setupCharts() {
    const pieCtx = document.getElementById('incomeSourcesChart');
    const barCtx = document.getElementById('incomeExpensesChart');
    if (!pieCtx || !barCtx) return;

    pieChart = new Chart(pieCtx, { type: 'doughnut', data: { labels: ['Singer', 'Banks', 'Private'], datasets: [{ data: [0, 0, 0], backgroundColor: ['#ef4444', '#3b82f6', '#10b981'], borderWidth: 0 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8' } } } } });
    barChart = new Chart(barCtx, { type: 'bar', data: { labels: ['Target', 'Profit'], datasets: [{ label: 'LKR', data: [200000, 0], backgroundColor: ['#334155', '#10b981'], borderRadius: 5 }] }, options: { responsive: true, maintainAspectRatio: false, scales: { y: { grid: { color: '#1e293b' }, ticks: { color: '#94a3b8' } }, x: { ticks: { color: '#94a3b8' } } } } });
}

// 7. Excel Export (මෙතනින් තමයි Excel එක හදන්නේ)
document.getElementById('exportBtnSidebar').onclick = function() {
    if (jobs.length === 0) {
        Swal.fire('Data Empty', 'Download කිරීමට දත්ත නැත!', 'warning');
        return;
    }
    const excelData = jobs.map(j => ({ "Date": j.date, "source": j.source, "Type": j.type, "Description": j.description, "Amount": parseFloat(j.price), "Status": j.status }));
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");
    XLSX.writeFile(workbook, "Thaprobaane_Report.xlsx");
};