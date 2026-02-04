import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, onValue, remove, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyAgI86HrgB1AidP6Pbm6buMOTFKzNzrREM",
    authDomain: "thaprobaane-erp.firebaseapp.com",
    projectId: "thaprobaane-erp",
    storageBucket: "thaprobaane-erp.firebasestorage.app",
    messagingSenderId: "543906827250",
    appId: "1:543906827250:web:ebaeff4bd03d1323f9f96b",
    databaseURL: "https://thaprobaane-erp-default-rtdb.firebaseio.com",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const empRef = ref(db, "employees");
const jobRef = ref(db, "jobs");

let employees = [];

// 1. සේවකයෝ ලෝඩ් කිරීම (Real-time Sync)
// මේක නිසා Delete කරපු ගමන් Table එකෙන් ඌව අයින් වෙනවා
onValue(empRef, (snapshot) => {
    const data = snapshot.val();
    const tableBody = document.getElementById('employeeTableBody');
    const selectEmp = document.getElementById('selectEmployee');
    
    tableBody.innerHTML = '';
    selectEmp.innerHTML = '<option value="">-- Choose Employee --</option>';
    employees = [];

    if (data) {
        Object.keys(data).forEach(key => {
            const emp = { id: key, ...data[key] };
            employees.push(emp);
            
            tableBody.innerHTML += `
                <tr class="hover:bg-white/5 transition border-b border-white/5">
                    <td class="p-4 text-white font-semibold">${emp.name}</td>
                    <td class="p-4 text-sm text-gray-500">+${emp.phone}</td>
                    <td class="p-4 text-sm">${emp.position}</td>
                    <td class="p-4 text-green-400 font-bold">Rs. ${parseFloat(emp.salary).toLocaleString()}</td>
                    <td class="p-4 text-center space-x-3">
                        <button onclick="editEmployee('${emp.id}')" class="text-blue-400 hover:text-blue-200 transition"><i class="fa-solid fa-pen-to-square"></i></button>
                        <button onclick="deleteEmployee('${emp.id}')" class="text-red-500 hover:text-red-300 transition"><i class="fa-solid fa-trash-can"></i></button>
                    </td>
                </tr>`;
            selectEmp.innerHTML += `<option value="${emp.id}">${emp.name}</option>`;
        });
    }
});

// 2. Register Employee
document.getElementById('employeeForm').onsubmit = (e) => {
    e.preventDefault();
    const phoneInput = document.getElementById('empPhone').value;
    const newEmp = {
        name: document.getElementById('empName').value,
        phone: "94" + phoneInput,
        position: document.getElementById('empPosition').value,
        salary: document.getElementById('empSalary').value
    };
    push(empRef, newEmp).then(() => {
        Swal.fire({ title: 'Registered!', text: 'සේවකයා එක් කරන ලදී.', icon: 'success', background: '#1e293b', color: '#fff' });
        e.target.reset();
    });
};

// 3. Pay Salary Logic
const updateNetSalary = () => {
    const empId = document.getElementById('selectEmployee').value;
    const emp = employees.find(e => e.id === empId);
    const basic = parseFloat(emp?.salary || 0);
    const ded = parseFloat(document.getElementById('deductions').value) || 0;
    const all = parseFloat(document.getElementById('allowances').value) || 0;
    const net = basic - ded + all;
    document.getElementById('netSalaryDisplay').innerText = `Rs. ${net.toLocaleString()}`;
    return { net, basic, ded, all };
};
document.getElementById('salaryForm').oninput = updateNetSalary;

document.getElementById('salaryForm').onsubmit = (e) => {
    e.preventDefault();
    const empId = document.getElementById('selectEmployee').value;
    const emp = employees.find(e => e.id === empId);
    const month = document.getElementById('salaryMonth').value;
    const { net, basic, ded, all } = updateNetSalary();

    if (!empId) return Swal.fire('Error', 'සේවකයෙකු තෝරන්න!', 'error');

    const salaryExpense = {
        date: new Date().toISOString().split('T')[0],
        source: "N/A", type: "Expense", status: "Paid", price: net,
        description: `Salary Payment: ${emp.name} (${month})`
    };

    push(jobRef, salaryExpense).then(() => {
        const msg = `*THAPROBAANE INTERNATIONAL - PAYSLIP*%0A------------------------------------%0A*Name:* ${emp.name}%0A*Month:* ${month}%0A*Basic Salary:* Rs. ${basic.toLocaleString()}%0A*Allowances:* Rs. ${all.toLocaleString()}%0A*Deductions:* Rs. ${ded.toLocaleString()}%0A------------------------------------%0A*NET PAYABLE:* Rs. ${net.toLocaleString()}%0A------------------------------------%0A_Generated via Thaprobaane ERP_`;
        const waLink = `https://wa.me/${emp.phone}?text=${msg}`;
        Swal.fire({ title: 'Paid!', text: 'පඩිය ගෙවන ලදී.', icon: 'success', showCancelButton: true, confirmButtonText: 'SEND RECEIPT', confirmButtonColor: '#25D366', background: '#1e293b', color: '#fff' }).then((res) => { if (res.isConfirmed) window.open(waLink, '_blank'); });
        e.target.reset();
        document.getElementById('netSalaryDisplay').innerText = `Rs. 0.00`;
    });
};

// 4. Edit Logic
window.editEmployee = (id) => {
    const emp = employees.find(e => e.id === id);
    if (!emp) return;
    const displayPhone = emp.phone.startsWith("94") ? emp.phone.substring(2) : emp.phone;
    document.getElementById('editEmpId').value = id;
    document.getElementById('modalEmpName').value = emp.name;
    document.getElementById('modalEmpPhone').value = displayPhone;
    document.getElementById('modalEmpPosition').value = emp.position;
    document.getElementById('modalEmpSalary').value = emp.salary;
    document.getElementById('editEmpModal').classList.remove('hidden');
};

window.closeEditEmpModal = () => document.getElementById('editEmpModal').classList.add('hidden');

document.getElementById('editEmpForm').onsubmit = (e) => {
    e.preventDefault();
    const id = document.getElementById('editEmpId').value;
    const phoneInput = document.getElementById('modalEmpPhone').value;
    const updatedData = {
        name: document.getElementById('modalEmpName').value,
        phone: "94" + phoneInput,
        position: document.getElementById('modalEmpPosition').value,
        salary: document.getElementById('modalEmpSalary').value
    };
    update(ref(db, `employees/${id}`), updatedData).then(() => {
        closeEditEmpModal();
        Swal.fire({ title: 'Updated!', icon: 'success', background: '#1e293b', color: '#fff' });
    });
};

// 5. Delete Logic (Real-time table refresh fixed)
window.deleteEmployee = (id) => {
    Swal.fire({
        title: 'Delete Employee?',
        text: "මෙම සේවකයා ඩේටාබේස් එකෙන්ම අයින් වෙනවා!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        background: '#1e293b',
        color: '#fff'
    }).then((result) => {
        if (result.isConfirmed) {
            remove(ref(db, `employees/${id}`))
                .then(() => {
                    Swal.fire({ title: 'Deleted!', icon: 'success', background: '#1e293b', color: '#fff' });
                });
        }
    });
};