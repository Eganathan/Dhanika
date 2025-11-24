// Simple Budget Tracker - Current Month Only
class BudgetTracker {
    constructor() {
        this.transactions = this.loadTransactions();
        this.currentFilter = 'all';
        this.currentView = 'chart';
        this.categoryChart = null;
        this.defaultCategories = {
            income: [
                { value: 'salary', label: '💼 Salary' },
                { value: 'freelance', label: '💻 Freelance' },
                { value: 'business', label: '🏢 Business' },
                { value: 'investment', label: '📈 Investment' },
                { value: 'other_income', label: '💰 Other' }
            ],
            expense: [
                { value: 'food', label: '🍽️ Food' },
                { value: 'transport', label: '🚗 Transport' },
                { value: 'shopping', label: '🛍️ Shopping' },
                { value: 'entertainment', label: '🎬 Entertainment' },
                { value: 'bills', label: '⚡ Bills' },
                { value: 'housing', label: '🏠 Housing' },
                { value: 'parents', label: '👨‍👩‍👦 Parents' },
                { value: 'medical', label: '🏥 Medical' },
                { value: 'emi', label: '💳 EMI' },
                { value: 'debt', label: '💸 Debt' },
                { value: 'other_expense', label: '📝 Others' }
            ]
        };

        this.customCategories = this.loadCustomCategories();
        this.categories = this.mergeCategories();

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.populateCategories();
        this.setTodayDate();
        this.render();
    }

    setupEventListeners() {
        // Form submission
        document.getElementById('transaction-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTransaction();
        });

        // Type change - update categories
        document.querySelectorAll('input[name="type"]').forEach(radio => {
            radio.addEventListener('change', () => this.populateCategories());
        });

        // Handle category selection (including custom category)
        document.getElementById('category').addEventListener('change', (e) => {
            if (e.target.value === '__add_custom__') {
                const type = document.querySelector('input[name="type"]:checked').value;
                this.showAddCategoryDialog(type);
                e.target.value = '';
            }
        });

        // View toggle buttons
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentView = e.target.dataset.view;
                this.toggleCategoryView();
            });
        });

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilter = e.target.dataset.filter;
                this.renderTransactions();
            });
        });

        // Clear all data
        document.getElementById('clear-all').addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
                this.transactions = [];
                this.saveTransactions();
                this.render();
                this.showToast('All data cleared', 'success');
            }
        });
    }

    populateCategories() {
        const type = document.querySelector('input[name="type"]:checked').value;
        const select = document.getElementById('category');

        select.innerHTML = '<option value="">Select Category</option>';

        this.categories[type].forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.value;
            option.textContent = cat.label;
            select.appendChild(option);
        });

        // Add separator and custom category option
        if (this.categories[type].length > 0) {
            const separator = document.createElement('option');
            separator.disabled = true;
            separator.textContent = '──────────────';
            select.appendChild(separator);
        }

        const addCustom = document.createElement('option');
        addCustom.value = '__add_custom__';
        addCustom.textContent = '➕ Add Custom Category';
        select.appendChild(addCustom);
    }

    setTodayDate() {
        document.getElementById('date').valueAsDate = new Date();
    }

    addTransaction() {
        const formData = new FormData(document.getElementById('transaction-form'));
        const type = formData.get('type');
        const amount = parseFloat(formData.get('amount'));
        const description = formData.get('description');
        const category = formData.get('category');
        const date = formData.get('date');

        // Validation
        if (!amount || !category || !date) {
            this.showToast('Please fill all required fields', 'error');
            return;
        }

        // Create transaction
        const transaction = {
            id: Date.now().toString(),
            type,
            amount,
            description: description || this.getCategoryLabel(type, category),
            category,
            date,
            createdAt: new Date().toISOString()
        };

        // Add to transactions
        this.transactions.unshift(transaction);
        this.saveTransactions();
        this.render();

        // Reset form but preserve the type selection
        const currentType = type;
        document.getElementById('transaction-form').reset();
        this.setTodayDate();
        document.querySelector(`input[name="type"][value="${currentType}"]`).checked = true;
        this.populateCategories();

        this.showToast('Transaction added!', 'success');
    }

    editTransaction(id) {
        const transaction = this.transactions.find(t => t.id === id);
        if (!transaction) return;

        // Populate form
        document.querySelector(`input[name="type"][value="${transaction.type}"]`).checked = true;
        this.populateCategories();

        setTimeout(() => {
            document.getElementById('amount').value = transaction.amount;
            document.getElementById('description').value = transaction.description;
            document.getElementById('category').value = transaction.category;
            document.getElementById('date').value = transaction.date;
        }, 50);

        // Delete the transaction (we'll re-add it on submit)
        this.deleteTransaction(id, true);

        // Scroll to form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    deleteTransaction(id, silent = false) {
        this.transactions = this.transactions.filter(t => t.id !== id);
        this.saveTransactions();
        this.render();

        if (!silent) {
            this.showToast('Transaction deleted', 'success');
        }
    }

    getCurrentMonthTransactions() {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        return this.transactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
        });
    }

    render() {
        this.updateSummary();
        this.renderCategories();
        this.renderCategoryChart();
        this.renderTransactions();
        this.renderCustomCategories();
    }

    toggleCategoryView() {
        const chartContainer = document.getElementById('category-chart-container');
        const listContainer = document.getElementById('category-breakdown');

        if (this.currentView === 'chart') {
            chartContainer.style.display = 'block';
            listContainer.style.display = 'none';
        } else {
            chartContainer.style.display = 'none';
            listContainer.style.display = 'flex';
        }
    }

    updateSummary() {
        const monthTransactions = this.getCurrentMonthTransactions();

        const income = monthTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const expenses = monthTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        const balance = income - expenses;

        document.getElementById('total-income').textContent = this.formatCurrency(income);
        document.getElementById('total-expenses').textContent = this.formatCurrency(expenses);
        document.getElementById('balance').textContent = this.formatCurrency(balance);
    }

    renderCategories() {
        const monthTransactions = this.getCurrentMonthTransactions();
        const container = document.getElementById('category-breakdown');

        if (monthTransactions.length === 0) {
            container.innerHTML = '<p class="empty-message">No transactions yet</p>';
            return;
        }

        // Group by category
        const categoryTotals = {};
        monthTransactions.forEach(t => {
            const key = `${t.type}-${t.category}`;
            if (!categoryTotals[key]) {
                categoryTotals[key] = {
                    type: t.type,
                    category: t.category,
                    amount: 0
                };
            }
            categoryTotals[key].amount += t.amount;
        });

        // Sort by amount (descending)
        const sorted = Object.values(categoryTotals).sort((a, b) => b.amount - a.amount);

        container.innerHTML = sorted.map(cat => `
            <div class="category-item ${cat.type}-category">
                <span class="category-name">
                    ${this.getCategoryLabel(cat.type, cat.category)}
                </span>
                <span class="category-amount">
                    ${this.formatCurrency(cat.amount)}
                </span>
            </div>
        `).join('');
    }

    renderCategoryChart() {
        const monthTransactions = this.getCurrentMonthTransactions();
        const canvas = document.getElementById('category-chart');
        const container = document.getElementById('category-chart-container');

        if (monthTransactions.length === 0) {
            container.innerHTML = '<p class="empty-message">No transactions yet</p>';
            if (this.categoryChart) {
                this.categoryChart.destroy();
                this.categoryChart = null;
            }
            return;
        }

        // Ensure canvas is present
        if (!canvas) {
            container.innerHTML = '<canvas id="category-chart"></canvas>';
        }

        // Group by category
        const categoryTotals = {};
        monthTransactions.forEach(t => {
            const key = `${t.type}-${t.category}`;
            if (!categoryTotals[key]) {
                categoryTotals[key] = {
                    type: t.type,
                    category: t.category,
                    amount: 0
                };
            }
            categoryTotals[key].amount += t.amount;
        });

        // Sort by amount (descending)
        const sorted = Object.values(categoryTotals).sort((a, b) => b.amount - a.amount);

        // Prepare chart data
        const labels = sorted.map(cat => this.getCategoryLabel(cat.type, cat.category));
        const data = sorted.map(cat => cat.amount);
        const backgroundColors = sorted.map(cat => {
            if (cat.type === 'income') {
                return this.generateColorShades('#22c55e', sorted.filter(c => c.type === 'income').indexOf(cat), sorted.filter(c => c.type === 'income').length);
            } else {
                return this.generateColorShades('#ef4444', sorted.filter(c => c.type === 'expense').indexOf(cat), sorted.filter(c => c.type === 'expense').length);
            }
        });

        // Destroy previous chart if exists
        if (this.categoryChart) {
            this.categoryChart.destroy();
        }

        // Create new chart
        const ctx = document.getElementById('category-chart').getContext('2d');
        this.categoryChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: backgroundColors,
                    borderColor: 'rgba(15, 23, 42, 0.8)',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#f1f5f9',
                            padding: 15,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const label = context.label || '';
                                const value = this.formatCurrency(context.parsed);
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    generateColorShades(baseColor, index, total) {
        // Generate different shades of the base color
        const colors = {
            '#22c55e': [
                '#22c55e',
                '#16a34a',
                '#15803d',
                '#14532d',
                '#4ade80',
                '#86efac'
            ],
            '#ef4444': [
                '#ef4444',
                '#dc2626',
                '#b91c1c',
                '#991b1b',
                '#f87171',
                '#fca5a5'
            ]
        };

        const colorArray = colors[baseColor] || [baseColor];
        return colorArray[index % colorArray.length];
    }

    renderTransactions() {
        const monthTransactions = this.getCurrentMonthTransactions();
        const container = document.getElementById('transaction-list');

        // Apply filter
        let filtered = monthTransactions;
        if (this.currentFilter !== 'all') {
            filtered = monthTransactions.filter(t => t.type === this.currentFilter);
        }

        // Sort by date (newest first)
        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

        if (filtered.length === 0) {
            const message = this.currentFilter === 'all'
                ? 'No transactions yet. Add your first transaction above!'
                : `No ${this.currentFilter} transactions this month`;
            container.innerHTML = `<p class="empty-message">${message}</p>`;
            return;
        }

        container.innerHTML = filtered.map(t => `
            <div class="transaction-item ${t.type}-transaction">
                <div class="transaction-info">
                    <div class="transaction-main">
                        <i class="bi ${t.type === 'income' ? 'bi-arrow-up-circle' : 'bi-arrow-down-circle'} transaction-icon"></i>
                        <span class="transaction-description">${t.description}</span>
                    </div>
                    <div class="transaction-details">
                        ${this.formatDate(t.date)} • ${this.getCategoryLabel(t.type, t.category)}
                    </div>
                </div>
                <div class="transaction-actions">
                    <span class="transaction-amount">${this.formatCurrency(t.amount)}</span>
                    <button class="btn-icon btn-edit" onclick="budgetTracker.editTransaction('${t.id}')" title="Edit">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn-icon btn-delete" onclick="budgetTracker.deleteTransaction('${t.id}')" title="Delete">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    getCategoryLabel(type, category) {
        const cat = this.categories[type].find(c => c.value === category);
        return cat ? cat.label : category;
    }

    formatCurrency(amount) {
        return '₹' + amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    formatDate(dateStr) {
        const date = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        }
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast show ${type}`;

        setTimeout(() => {
            toast.className = 'toast';
        }, 3000);
    }

    loadTransactions() {
        const data = localStorage.getItem('budget-transactions');
        return data ? JSON.parse(data) : [];
    }

    saveTransactions() {
        localStorage.setItem('budget-transactions', JSON.stringify(this.transactions));
    }

    loadCustomCategories() {
        const data = localStorage.getItem('budget-custom-categories');
        return data ? JSON.parse(data) : { income: [], expense: [] };
    }

    saveCustomCategories() {
        localStorage.setItem('budget-custom-categories', JSON.stringify(this.customCategories));
    }

    mergeCategories() {
        return {
            income: [...this.defaultCategories.income, ...this.customCategories.income],
            expense: [...this.defaultCategories.expense, ...this.customCategories.expense]
        };
    }

    addCustomCategory(type, label) {
        const value = label.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const emoji = type === 'income' ? '💵' : '💸';

        const newCategory = {
            value: `custom_${value}_${Date.now()}`,
            label: `${emoji} ${label}`,
            custom: true
        };

        this.customCategories[type].push(newCategory);
        this.saveCustomCategories();
        this.categories = this.mergeCategories();
        this.populateCategories();
        this.render();
        this.showToast(`Category "${label}" added!`, 'success');
    }

    deleteCustomCategory(type, value) {
        this.customCategories[type] = this.customCategories[type].filter(c => c.value !== value);
        this.saveCustomCategories();
        this.categories = this.mergeCategories();
        this.populateCategories();
        this.render();
        this.showToast('Category deleted', 'success');
    }

    showAddCategoryDialog(type) {
        const categoryName = prompt(`Enter new ${type} category name:`);
        if (categoryName && categoryName.trim()) {
            const trimmedName = categoryName.trim();
            // Check if category already exists
            const exists = this.categories[type].some(
                c => c.label.toLowerCase().includes(trimmedName.toLowerCase())
            );
            if (exists) {
                this.showToast('Category already exists', 'error');
                return;
            }
            this.addCustomCategory(type, trimmedName);
        }
    }

    renderCustomCategories() {
        const container = document.getElementById('custom-categories-list');
        const section = document.getElementById('manage-categories-section');

        const allCustomCategories = [
            ...this.customCategories.income.map(c => ({ ...c, type: 'income' })),
            ...this.customCategories.expense.map(c => ({ ...c, type: 'expense' }))
        ];

        if (allCustomCategories.length === 0) {
            section.style.display = 'none';
            return;
        }

        section.style.display = 'block';

        container.innerHTML = allCustomCategories.map(cat => `
            <div class="custom-category-item">
                <div class="custom-category-info">
                    <span class="custom-category-label">${cat.label}</span>
                    <span class="custom-category-type ${cat.type}">${cat.type}</span>
                </div>
                <button class="btn-delete-category" onclick="budgetTracker.deleteCustomCategory('${cat.type}', '${cat.value}')">
                    <i class="bi bi-trash"></i> Delete
                </button>
            </div>
        `).join('');
    }
}

// Initialize on page load
window.budgetTracker = new BudgetTracker();
