document.addEventListener('DOMContentLoaded', () => {
    const transactionForm = document.getElementById('transaction-form');
    const transactionList = document.getElementById('transaction-list');
    const budgetChart = document.getElementById('budget-chart').getContext('2d');

    let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    let chart;

    function addTransactionToDOM(transaction) {
        const item = document.createElement('li');
        item.classList.add('list-group-item');
        item.innerHTML = `
            <span>${transaction.description}</span>
            <span class="amount ${transaction.type}">${transaction.type === 'income' ? '+' : '-'}${Math.abs(transaction.amount)}</span>
        `;
        transactionList.appendChild(item);
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
                    backgroundColor: ['#4caf50', '#f44336']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true
            }
        });
    }

    transactionForm.addEventListener('submit', e => {
        e.preventDefault();
        const description = document.getElementById('description').value;
        const amount = parseFloat(document.getElementById('amount').value);
        const type = document.getElementById('type').value;

        if (description.trim() === '' || isNaN(amount)) {
            return;
        }

        const transaction = {
            id: Date.now(),
            description,
            amount,
            type
        };

        transactions.push(transaction);
        addTransactionToDOM(transaction);
        updateChart();
        localStorage.setItem('transactions', JSON.stringify(transactions));
        transactionForm.reset();
    });

    function init() {
        transactions.forEach(addTransactionToDOM);
        updateChart();
    }

    init();
});
