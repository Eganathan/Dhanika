document.addEventListener('DOMContentLoaded', () => {
    const transactionForm = document.getElementById('transaction-form');
    const transactionList = document.getElementById('transaction-list');
    const budgetChart = document.getElementById('budget-chart').getContext('2d');
    const cancelEditBtn = document.getElementById('cancel-edit');
    const downloadBtn = document.getElementById('download-btn');
    const totalIncomeEl = document.getElementById('total-income');
    const totalExpensesEl = document.getElementById('total-expenses');
    const balanceEl = document.getElementById('balance');
    const filterButtons = document.querySelectorAll('input[name="filter"]');
    const chartTypeButtons = document.querySelectorAll('input[name="chart-type"]');

    let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    let chart;
    let editingTransactionId = null;
    let transactionTypes = null;

    // Snackbar function
    function showSnackbar(message, type = 'success') {
        const snackbar = document.getElementById('snackbar');
        snackbar.textContent = message;
        snackbar.className = `snackbar ${type}`;
        snackbar.classList.add('show');
        
        setTimeout(() => {
            snackbar.classList.remove('show');
        }, 3000);
    }

    // Load transaction types from JSON
    async function loadTransactionTypes() {
        try {
            const response = await fetch('./transaction-types.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            transactionTypes = await response.json();
            console.log('Transaction types loaded successfully:', transactionTypes);
            populateCategories('income'); // Default to income
            setupTypeChangeListeners();
        } catch (error) {
            console.error('Failed to load transaction types:', error);
            // Fallback to hardcoded categories
            loadFallbackCategories();
        }
    }

    // Fallback categories if JSON fails to load
    function loadFallbackCategories() {
        transactionTypes = {
            "income": {
                "types": [
                    { "value": "salary", "label": "💼 Salary", "emoji": "💼" },
                    { "value": "freelance", "label": "💻 Freelance", "emoji": "💻" },
                    { "value": "other_income", "label": "💰 Other Income", "emoji": "💰" }
                ]
            },
            "expense": {
                "types": [
                    { "value": "food", "label": "🍽️ Food & Dining", "emoji": "🍽️" },
                    { "value": "transportation", "label": "🚗 Transportation", "emoji": "🚗" },
                    { "value": "shopping", "label": "🛍️ Shopping", "emoji": "🛍️" },
                    { "value": "other_expense", "label": "📝 Other Expense", "emoji": "📝" }
                ]
            }
        };
        populateCategories('income');
        setupTypeChangeListeners();
    }

    // Populate category dropdown based on selected type
    function populateCategories(type) {
        const categorySelect = document.getElementById('category');
        categorySelect.innerHTML = '<option value="">Select Category</option>';
        
        if (transactionTypes && transactionTypes[type]) {
            transactionTypes[type].types.forEach(category => {
                const option = document.createElement('option');
                option.value = category.value;
                option.textContent = category.label;
                categorySelect.appendChild(option);
            });
        }
    }

    // Setup listeners for income/expense toggle
    function setupTypeChangeListeners() {
        const typeRadios = document.querySelectorAll('input[name="type"]');
        typeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                populateCategories(e.target.value);
            });
        });
    }

    // Get emoji for a category dynamically
    function getCategoryEmoji(categoryValue) {
        if (!transactionTypes) return '📦';
        
        // Search in both income and expense types
        for (const typeKey of ['income', 'expense']) {
            const category = transactionTypes[typeKey].types.find(type => type.value === categoryValue);
            if (category) {
                return category.emoji;
            }
        }
        return '📦'; // Default emoji if not found
    }

    let currentFilter = 'all';
    let currentCategoryFilter = 'all';
    let currentChartType = 'overview';

    // Render category filter tags
    function renderCategoryFilters() {
        const categoryFiltersContainer = document.getElementById('category-filters');
        if (!categoryFiltersContainer) return;
        
        categoryFiltersContainer.innerHTML = '';
        
        // Add "All" button
        const allButton = document.createElement('button');
        allButton.className = `btn btn-sm ${currentCategoryFilter === 'all' ? 'btn-primary' : 'btn-outline-primary'}`;
        allButton.textContent = 'All';
        allButton.onclick = () => {
            currentCategoryFilter = 'all';
            renderTransactions();
            renderCategoryFilters();
        };
        categoryFiltersContainer.appendChild(allButton);
        
        // Get unique categories from transactions based on current filter
        let filteredTransactions = transactions;
        if (currentFilter !== 'all') {
            filteredTransactions = transactions.filter(t => t.type === currentFilter);
        }
        
        const categories = [...new Set(filteredTransactions.map(t => t.category).filter(c => c))];
        
        categories.forEach(category => {
            const button = document.createElement('button');
            const emoji = getCategoryEmoji(category);
            const isActive = currentCategoryFilter === category;
            
            // Determine transaction type for this category to set color
            const categoryTransaction = transactions.find(t => t.category === category);
            const transactionType = categoryTransaction ? categoryTransaction.type : 'expense';
            
            // Set button style based on transaction type and active state
            let buttonClass;
            if (isActive) {
                buttonClass = transactionType === 'income' ? 'btn-success' : 'btn-danger';
            } else {
                buttonClass = transactionType === 'income' ? 'btn-outline-success' : 'btn-outline-danger';
            }
            
            button.className = `btn btn-sm ${buttonClass}`;
            button.innerHTML = `${emoji} ${category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ')}`;
            button.onclick = () => {
                currentCategoryFilter = category;
                renderTransactions();
                renderCategoryFilters();
            };
            categoryFiltersContainer.appendChild(button);
        });
    }

    function renderTransactions() {
        transactionList.innerHTML = '';
        
        const filteredTransactions = transactions.filter(transaction => {
            // Filter by type (income/expense/all)
            if (currentFilter !== 'all' && transaction.type !== currentFilter) {
                return false;
            }
            // Filter by category
            if (currentCategoryFilter !== 'all' && transaction.category !== currentCategoryFilter) {
                return false;
            }
            return true;
        });
        
        // Render category filter tags
        renderCategoryFilters();
        
        filteredTransactions.forEach(transaction => {
            const item = document.createElement('li');
            item.classList.add('list-group-item', `${transaction.type}-transaction`);
            item.dataset.id = transaction.id;
            
            const categoryIcon = getCategoryEmoji(transaction.category);
            const tagsHtml = (transaction.tags || []).filter(tag => tag.trim()).map(tag => `<span class="badge bg-secondary me-1">${tag}</span>`).join('');

            item.innerHTML = `
                <div class="d-flex w-100 justify-content-between align-items-center">
                    <div class="flex-grow-1">
                        <div class="d-flex align-items-center mb-1">
                            <span class="me-2" style="font-size: 1.2em;">${categoryIcon}</span>
                            <h5 class="mb-0">${transaction.description}</h5>
                        </div>
                        <div class="d-flex align-items-center">
                            ${transaction.category ? `<span class="badge bg-light text-dark me-2">${transaction.category}</span>` : ''}
                            ${tagsHtml}
                        </div>
                    </div>
                    <div class="text-end d-flex flex-column align-items-end">
                        <p class="amount ${transaction.type} mb-1 fs-5">${transaction.type === 'income' ? '+$' : '-$'}${Math.abs(transaction.amount).toFixed(2)}</p>
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
        updateStats();
        updateLocalStorage();
    }

    function updateChart() {
        if (chart) {
            chart.destroy();
        }
        
        if (currentChartType === 'overview') {
            const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
            const expense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
            
            chart = new Chart(budgetChart, {
                type: 'doughnut',
                data: {
                    labels: ['Income', 'Expense'],
                    datasets: [{
                        data: [income, expense],
                        backgroundColor: ['#28a745', '#dc3545'],
                        borderColor: '#fff',
                        borderWidth: 3
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 20,
                                usePointStyle: true
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return context.label + ': $' + context.parsed.toFixed(2);
                                }
                            }
                        }
                    }
                }
            });
        } else {
            const expensesByCategory = {};
            transactions.filter(t => t.type === 'expense').forEach(t => {
                const category = t.category || 'other';
                expensesByCategory[category] = (expensesByCategory[category] || 0) + t.amount;
            });
            
            const categories = Object.keys(expensesByCategory);
            const amounts = Object.values(expensesByCategory);
            const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0'];
            
            chart = new Chart(budgetChart, {
                type: 'doughnut',
                data: {
                    labels: categories.map(cat => {
                        const emoji = getCategoryEmoji(cat);
                        return `${emoji} ${cat.charAt(0).toUpperCase() + cat.slice(1)}`;
                    }),
                    datasets: [{
                        data: amounts,
                        backgroundColor: colors.slice(0, categories.length),
                        borderColor: '#fff',
                        borderWidth: 3
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 15,
                                usePointStyle: true,
                                font: {
                                    size: 12
                                }
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const total = amounts.reduce((a, b) => a + b, 0);
                                    const percentage = ((context.parsed / total) * 100).toFixed(1);
                                    return context.label + ': $' + context.parsed.toFixed(2) + ' (' + percentage + '%)';
                                }
                            }
                        }
                    }
                }
            });
        }
    }
    
    function updateStats() {
        const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
        const expenses = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
        const balance = income - expenses;
        
        totalIncomeEl.textContent = '$' + income.toFixed(2);
        totalExpensesEl.textContent = '$' + expenses.toFixed(2);
        balanceEl.textContent = '$' + balance.toFixed(2);
        balanceEl.className = 'fw-bold ' + (balance >= 0 ? 'text-success' : 'text-danger');
    }

    function updateLocalStorage() {
        localStorage.setItem('transactions', JSON.stringify(transactions));
    }

    transactionForm.addEventListener('submit', e => {
        e.preventDefault();
        const description = document.getElementById('description').value;
        const amount = parseFloat(document.getElementById('amount').value);
        const type = document.querySelector('input[name="type"]:checked').value;
        const category = document.getElementById('category').value;
        const tags = document.getElementById('tags').value.split(',').map(tag => tag.trim()).filter(tag => tag);

        if (description.trim() === '' || isNaN(amount) || !category) {
            document.getElementById('category').classList.add('is-invalid');
            return;
        }
        document.getElementById('category').classList.remove('is-invalid');

        if (editingTransactionId) {
            const transaction = transactions.find(t => t.id === editingTransactionId);
            transaction.description = description;
            transaction.amount = amount;
            transaction.type = type;
            transaction.category = category;
            transaction.tags = tags;
            editingTransactionId = null;
            cancelEditBtn.style.display = 'none';
            showSnackbar('Transaction updated successfully');
        } else {
            const transaction = {
                id: Date.now(),
                description,
                amount,
                type,
                category,
                tags,
                date: new Date().toISOString().split('T')[0]
            };
            transactions.push(transaction);
            showSnackbar('Transaction created successfully');
        }

        renderTransactions();
        transactionForm.reset();
        document.getElementById('income').checked = true;
        document.getElementById('category').value = '';
        document.getElementById('category').classList.remove('is-invalid');
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
            document.getElementById('category').value = transaction.category || '';
            document.getElementById('tags').value = (transaction.tags || []).join(', ');
            editingTransactionId = id;
            cancelEditBtn.style.display = 'block';
            
            // Scroll to form and focus on description field
            document.getElementById('transaction-form').scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
            setTimeout(() => {
                document.getElementById('description').focus();
            }, 300);
        } else if (e.target.classList.contains('delete-btn') || e.target.closest('.delete-btn')) {
            const transaction = transactions.find(t => t.id === id);
            if (confirm(`Are you sure you want to delete "${transaction.description}"?`)) {
                transactions = transactions.filter(t => t.id !== id);
                renderTransactions();
                showSnackbar('Transaction deleted successfully', 'error');
            }
        }
    });

    cancelEditBtn.addEventListener('click', () => {
        editingTransactionId = null;
        transactionForm.reset();
        document.getElementById('income').checked = true;
        document.getElementById('category').classList.remove('is-invalid');
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
    
    
    filterButtons.forEach(button => {
        button.addEventListener('change', () => {
            if (button.checked) {
                currentFilter = button.value;
                currentCategoryFilter = 'all'; // Reset category filter when type filter changes
                renderTransactions();
            }
        });
    });
    
    chartTypeButtons.forEach(button => {
        button.addEventListener('change', () => {
            if (button.checked) {
                currentChartType = button.value;
                updateChart();
            }
        });
    });

    renderTransactions();
    updateStats();
    loadTransactionTypes();
});