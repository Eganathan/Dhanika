document.addEventListener('DOMContentLoaded', () => {
    const transactionForm = document.getElementById('transaction-form');
    const transactionList = document.getElementById('transaction-list');
    const budgetChart = document.getElementById('budget-chart').getContext('2d');
    const cancelEditBtn = document.getElementById('cancel-edit');
    const downloadBtn = document.getElementById('download-btn');

    let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    let chart;
    let editingTransactionId = null;

    function renderTransactions() {
        transactionList.innerHTML = '';
        transactions.forEach(transaction => {
            const item = document.createElement('li');
            item.classList.add('list-group-item');
            item.dataset.id = transaction.id;

            item.innerHTML = `
                <div class="d-flex w-100 justify-content-between">
                    <div>
                        <h5 class="mb-1">${transaction.description}</h5>
                        <div>${(transaction.tags || []).map(tag => `<span class="badge bg-secondary me-1">${tag}</span>`).join('')}</div>
                    </div>
                    <div class="text-end">
                        <p class="amount ${transaction.type} mb-1">${transaction.type === 'income' ? '+' : '-'}${Math.abs(transaction.amount).toFixed(2)}</p>
                        <div class="transaction-actions">
                            <button class="btn btn-sm btn-outline-primary edit-btn"><i class="bi bi-pencil"></i></button>
                            <button class="btn btn-sm btn-outline-danger delete-btn"><i class="bi bi-trash"></i></button>
                        </div>
                    </div>
                </div>
            `;
            transactionList.appendChild(item);
        });
        updateChart();
        updateLocalStorage();
    }

    function updateChart() {
        const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
        const expense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);

        if (chart) {
            chart.destroy();
        }

        chart = new Chart(budgetChart, {
            type: 'doughnut',
            data: {
                labels: ['Income', 'Expense'],
                datasets: [{
                    data: [income, expense],
                    backgroundColor: ['#28a745', '#dc3545'],
                    borderColor: '#fff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                }
            }
        });
    }

    function updateLocalStorage() {
        localStorage.setItem('transactions', JSON.stringify(transactions));
    }

    transactionForm.addEventListener('submit', e => {
        e.preventDefault();
        const description = document.getElementById('description').value;
        const amount = parseFloat(document.getElementById('amount').value);
        const type = document.querySelector('input[name="type"]:checked').value;
        const tags = document.getElementById('tags').value.split(',').map(tag => tag.trim()).filter(tag => tag);

        if (description.trim() === '' || isNaN(amount)) {
            return;
        }

        if (editingTransactionId) {
            const transaction = transactions.find(t => t.id === editingTransactionId);
            transaction.description = description;
            transaction.amount = amount;
            transaction.type = type;
            transaction.tags = tags;
            editingTransactionId = null;
            cancelEditBtn.style.display = 'none';
        } else {
            const transaction = {
                id: Date.now(),
                description,
                amount,
                type,
                tags
            };
            transactions.push(transaction);
        }

        renderTransactions();
        transactionForm.reset();
        document.getElementById('income').checked = true;
    });

    transactionList.addEventListener('click', e => {
        const listItem = e.target.closest('li');
        if (!listItem) return;
        const id = parseInt(listItem.dataset.id);

        if (e.target.classList.contains('edit-btn') || e.target.closest('.edit-btn')) {
            const transaction = transactions.find(t => t.id === id);
            document.getElementById('transaction-id').value = transaction.id;
            document.getElementById('description').value = transaction.description;
            document.getElementById('amount').value = transaction.amount;
            document.querySelector(`input[name="type"][value="${transaction.type}"]`).checked = true;
            document.getElementById('tags').value = (transaction.tags || []).join(', ');
            editingTransactionId = id;
            cancelEditBtn.style.display = 'block';
        } else if (e.target.classList.contains('delete-btn') || e.target.closest('.delete-btn')) {
            transactions = transactions.filter(t => t.id !== id);
            renderTransactions();
        }
    });

    cancelEditBtn.addEventListener('click', () => {
        editingTransactionId = null;
        transactionForm.reset();
        document.getElementById('income').checked = true;
        cancelEditBtn.style.display = 'none';
    });

    downloadBtn.addEventListener('click', () => {
        const incomes = transactions.filter(t => t.type === 'income');
        const expenses = transactions.filter(t => t.type === 'expense');
        const totalIncome = incomes.reduce((acc, t) => acc + t.amount, 0);
        const totalExpense = expenses.reduce((acc, t) => acc + t.amount, 0);
        const balance = totalIncome - totalExpense;

        let report = `
            <style>
                body { font-family: sans-serif; margin: 2rem; }
                h1, h2 { color: #333; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                .total { font-weight: bold; }
            </style>
            <h1>Budget Summary</h1>
            <h2>Incomes</h2>
            <table>
                <thead><tr><th>Description</th><th>Amount</th></tr></thead>
                <tbody>
                    ${incomes.map(t => `<tr><td>${t.description}</td><td>${t.amount.toFixed(2)}</td></tr>`).join('')}
                    <tr class="total"><td>Total</td><td>${totalIncome.toFixed(2)}</td></tr>
                </tbody>
            </table>
            <h2>Expenses</h2>
            <table>
                <thead><tr><th>Description</th><th>Amount</th></tr></thead>
                <tbody>
                    ${expenses.map(t => `<tr><td>${t.description}</td><td>${t.amount.toFixed(2)}</td></tr>`).join('')}
                    <tr class="total"><td>Total</td><td>${totalExpense.toFixed(2)}</td></tr>
                </tbody>
            </table>
            <h2>Summary</h2>
            <table>
                <tbody>
                    <tr><td>Total Income</td><td>${totalIncome.toFixed(2)}</td></tr>
                    <tr><td>Total Expense</td><td>${totalExpense.toFixed(2)}</td></tr>
                    <tr class="total"><td>Balance</td><td>${balance.toFixed(2)}</td></tr>
                </tbody>
            </table>
        `;

        html2pdf().from(report).save('budget-summary.pdf');
    });

    renderTransactions();
});