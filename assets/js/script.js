class BudgetTracker {
    constructor() {
        this.initializeElements();
        this.initializeState();
        this.loadConfiguration();
        this.bindEvents();
        this.initialize();
    }

    initializeElements() {
        this.elements = {
            transactionForm: document.getElementById('transaction-form'),
            transactionList: document.getElementById('transaction-list'),
            budgetChartCanvas: document.getElementById('budget-chart'),
            cancelEditBtn: document.getElementById('cancel-edit'),
            downloadBtn: document.getElementById('download-btn'),
            exportBtnHeader: document.getElementById('export-btn-header'),
            importFileHeader: document.getElementById('import-file-header'),
            tooltipToggle: document.getElementById('tooltip-toggle'),
            currencySelector: document.getElementById('currency-selector'),
            currentCurrencySpan: document.getElementById('current-currency'),
            totalIncomeEl: document.getElementById('total-income'),
            totalExpensesEl: document.getElementById('total-expenses'),
            balanceEl: document.getElementById('balance'),
            filterButtons: document.querySelectorAll('input[name="filter"]'),
            chartTypeButtons: document.querySelectorAll('input[name="chart-type"]'),
            emptyChartMessage: document.getElementById('empty-chart-message'),
            emptyTransactionMessage: document.getElementById('empty-transaction-message'),
            snackbar: document.getElementById('snackbar')
        };
        
        this.budgetChart = this.elements.budgetChartCanvas?.getContext('2d');
    }

    initializeState() {
        this.state = {
            transactions: JSON.parse(localStorage.getItem('transactions')) || [],
            chart: null,
            editingTransactionId: null,
            transactionTypes: null,
            currentFilter: 'all',
            currentCategoryFilter: 'all',
            currentChartType: 'overview',
            tooltipConfig: {},
            tooltipsEnabled: localStorage.getItem('tooltipsEnabled') !== 'false',
            activeTooltipInstances: [],
            currentActiveTooltip: null,
            currentCurrency: localStorage.getItem('selectedCurrency') || 'INR',
            currentCurrencySymbol: localStorage.getItem('selectedCurrencySymbol') || '₹'
        };
    }

    async loadConfiguration() {
        this.currencyConfig = {
            'INR': { symbol: '₹', name: 'Indian Rupee', decimals: 2, locale: 'en-IN' },
            'USD': { symbol: '$', name: 'US Dollar', decimals: 2, locale: 'en-US' },
            'EUR': { symbol: '€', name: 'Euro', decimals: 2, locale: 'de-DE' },
            'GBP': { symbol: '£', name: 'British Pound', decimals: 2, locale: 'en-GB' },
            'JPY': { symbol: '¥', name: 'Japanese Yen', decimals: 0, locale: 'ja-JP' },
            'SAR': { symbol: 'ر.س', name: 'Saudi Riyal', decimals: 2, locale: 'ar-SA' },
            'AED': { symbol: 'د.إ', name: 'UAE Dirham', decimals: 2, locale: 'ar-AE' },
            'CHF': { symbol: 'Fr', name: 'Swiss Franc', decimals: 2, locale: 'de-CH' },
            'CNY': { symbol: '¥', name: 'Chinese Yuan', decimals: 2, locale: 'zh-CN' },
            'CAD': { symbol: 'C$', name: 'Canadian Dollar', decimals: 2, locale: 'en-CA' },
            'AUD': { symbol: 'A$', name: 'Australian Dollar', decimals: 2, locale: 'en-AU' }
        };

        await Promise.all([
            this.loadTransactionTypes(),
            this.loadTooltipConfig()
        ]);
    }

    bindEvents() {
        this.elements.transactionForm?.addEventListener('submit', (e) => this.handleTransactionSubmit(e));
        this.elements.cancelEditBtn?.addEventListener('click', () => this.cancelEdit());
        this.elements.downloadBtn?.addEventListener('click', () => this.downloadSummary());
        this.elements.exportBtnHeader?.addEventListener('click', () => this.exportData());
        this.elements.importFileHeader?.addEventListener('change', (e) => this.importData(e));
        this.elements.tooltipToggle?.addEventListener('click', () => this.toggleTooltips());
        
        this.elements.filterButtons?.forEach(button => {
            button.addEventListener('change', (e) => this.filterTransactions(e.target.value));
        });
        
        this.elements.chartTypeButtons?.forEach(button => {
            button.addEventListener('change', (e) => this.changeChartType(e.target.value));
        });

        document.querySelectorAll('.dropdown-item[data-currency]')?.forEach(item => {
            item.addEventListener('click', (e) => this.changeCurrency(e));
        });
    }

    async initialize() {
        await this.loadConfiguration();
        this.initializeCurrency();
        this.setupTypeChangeListeners();
        this.renderTransactions();
        this.updateChart();
        this.updateSummary();
        this.setupTooltips();
    }

    showSnackbar(message, type = 'success') {
        if (!this.elements.snackbar) return;
        
        this.elements.snackbar.textContent = message;
        this.elements.snackbar.className = `snackbar ${type}`;
        this.elements.snackbar.classList.add('show');
        
        setTimeout(() => {
            this.elements.snackbar.classList.remove('show');
        }, 3000);
    }

    async loadTransactionTypes() {
        try {
            this.showLoading(true);
            const response = await fetch('assets/json/transaction-types.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.state.transactionTypes = await response.json();
            this.populateCategories('income');
        } catch (error) {
            console.error('Failed to load transaction types:', error);
            this.loadFallbackCategories();
        } finally {
            this.showLoading(false);
        }
    }

    async loadTooltipConfig() {
        try {
            const response = await fetch('assets/json/tooltips.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.state.tooltipConfig = await response.json();
        } catch (error) {
            console.error('Failed to load tooltip config:', error);
            this.state.tooltipConfig = {};
        }
    }

    loadFallbackCategories() {
        this.state.transactionTypes = {
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
        this.populateCategories('income');
    }

    populateCategories(type) {
        const categorySelect = document.getElementById('category');
        if (!categorySelect) return;
        
        categorySelect.innerHTML = '<option value="">Select Category</option>';
        
        if (this.state.transactionTypes?.[type]) {
            this.state.transactionTypes[type].types.forEach(category => {
                const option = document.createElement('option');
                option.value = category.value;
                option.textContent = category.label;
                categorySelect.appendChild(option);
            });
        }
    }

    setupTypeChangeListeners() {
        const typeRadios = document.querySelectorAll('input[name="type"]');
        typeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.populateCategories(e.target.value);
            });
        });
    }

    getCategoryEmoji(categoryValue) {
        if (!this.state.transactionTypes) return '📦';
        
        for (const typeKey of ['income', 'expense']) {
            const category = this.state.transactionTypes[typeKey]?.types?.find(
                type => type.value === categoryValue
            );
            if (category) {
                return category.emoji;
            }
        }
        return '📦';
    }

    formatCurrency(amount) {
        const config = this.currencyConfig[this.state.currentCurrency];
        const absAmount = Math.abs(amount);
        
        try {
            const formatter = new Intl.NumberFormat(config.locale, {
                minimumFractionDigits: config.decimals,
                maximumFractionDigits: config.decimals
            });
            
            const formattedNumber = formatter.format(absAmount);
            return `${this.state.currentCurrencySymbol}${formattedNumber}`;
        } catch (error) {
            const formattedAmount = absAmount.toFixed(config.decimals);
            if (this.state.currentCurrency === 'INR') {
                return `${this.state.currentCurrencySymbol}${this.formatIndianNumber(formattedAmount)}`;
            } else {
                return `${this.state.currentCurrencySymbol}${formattedAmount.replace(/\\B(?=(\\d{3})+(?!\\d))/g, ',')}`;
            }
        }
    }

    formatIndianNumber(num) {
        const parts = num.split('.');
        const integerPart = parts[0];
        const decimalPart = parts[1] ? '.' + parts[1] : '';
        
        let formatted = integerPart;
        if (integerPart.length > 3) {
            const lastThree = integerPart.slice(-3);
            const remaining = integerPart.slice(0, -3);
            formatted = remaining.replace(/\\B(?=(\\d{2})+(?!\\d))/g, ',') + ',' + lastThree;
        }
        
        return formatted + decimalPart;
    }

    initializeCurrency() {
        if (this.elements.currentCurrencySpan) {
            this.elements.currentCurrencySpan.textContent = `${this.state.currentCurrencySymbol} ${this.state.currentCurrency}`;
        }
        this.updateSummary();
    }

    changeCurrency(e) {
        e.preventDefault();
        const currency = e.target.dataset.currency;
        const symbol = e.target.dataset.symbol;
        
        this.state.currentCurrency = currency;
        this.state.currentCurrencySymbol = symbol;
        
        localStorage.setItem('selectedCurrency', currency);
        localStorage.setItem('selectedCurrencySymbol', symbol);
        
        this.initializeCurrency();
        this.renderTransactions();
        this.showSnackbar(`Currency changed to ${currency}`, 'success');
    }

    handleTransactionSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const transaction = {
            id: this.state.editingTransactionId || Date.now().toString(),
            type: formData.get('type'),
            description: formData.get('description')?.trim(),
            amount: parseFloat(formData.get('amount')),
            category: formData.get('category'),
            tags: formData.get('tags')?.trim(),
            date: new Date().toISOString()
        };

        if (!this.validateTransaction(transaction)) return;

        if (this.state.editingTransactionId) {
            this.updateTransaction(transaction);
        } else {
            this.addTransaction(transaction);
        }

        this.resetForm();
        this.saveTransactions();
        this.renderTransactions();
        this.updateChart();
        this.updateSummary();
    }

    validateTransaction(transaction) {
        if (!transaction.description) {
            this.showSnackbar('Please enter a description', 'error');
            return false;
        }
        if (!transaction.amount || isNaN(transaction.amount) || transaction.amount <= 0) {
            this.showSnackbar('Please enter a valid amount', 'error');
            return false;
        }
        if (!transaction.category) {
            this.showSnackbar('Please select a category', 'error');
            return false;
        }
        return true;
    }

    addTransaction(transaction) {
        this.state.transactions.push(transaction);
        this.showSnackbar('Transaction added successfully', 'success');
    }

    updateTransaction(transaction) {
        const index = this.state.transactions.findIndex(t => t.id === transaction.id);
        if (index !== -1) {
            this.state.transactions[index] = transaction;
            this.showSnackbar('Transaction updated successfully', 'success');
        }
    }

    deleteTransaction(id) {
        this.state.transactions = this.state.transactions.filter(t => t.id !== id);
        this.saveTransactions();
        this.renderTransactions();
        this.updateChart();
        this.updateSummary();
        this.showSnackbar('Transaction deleted successfully', 'success');
    }

    editTransaction(id) {
        const transaction = this.state.transactions.find(t => t.id === id);
        if (!transaction) return;

        this.state.editingTransactionId = id;
        
        const form = this.elements.transactionForm;
        form.querySelector(`input[name="type"][value="${transaction.type}"]`).checked = true;
        form.querySelector('#description').value = transaction.description;
        form.querySelector('#amount').value = transaction.amount;
        form.querySelector('#tags').value = transaction.tags || '';
        
        this.populateCategories(transaction.type);
        setTimeout(() => {
            form.querySelector('#category').value = transaction.category;
        }, 100);

        this.elements.cancelEditBtn.style.display = 'block';
        form.querySelector('button[type="submit"]').textContent = 'Update Transaction';
        
        form.scrollIntoView({ behavior: 'smooth' });
    }

    cancelEdit() {
        this.state.editingTransactionId = null;
        this.resetForm();
    }

    resetForm() {
        this.elements.transactionForm.reset();
        this.elements.cancelEditBtn.style.display = 'none';
        this.elements.transactionForm.querySelector('button[type="submit"]').textContent = 'Save Transaction';
        this.elements.transactionForm.querySelector('input[name="type"][value="income"]').checked = true;
        this.populateCategories('income');
    }

    renderTransactions() {
        if (!this.elements.transactionList) return;
        
        const filteredTransactions = this.getFilteredTransactions();
        
        if (filteredTransactions.length === 0) {
            this.elements.emptyTransactionMessage.style.display = 'block';
            this.elements.transactionList.innerHTML = '';
            return;
        }

        this.elements.emptyTransactionMessage.style.display = 'none';
        this.elements.transactionList.innerHTML = filteredTransactions
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .map(transaction => this.createTransactionElement(transaction))
            .join('');
    }

    createTransactionElement(transaction) {
        const emoji = this.getCategoryEmoji(transaction.category);
        const formattedAmount = this.formatCurrency(transaction.amount);
        const formattedDate = new Date(transaction.date).toLocaleDateString();
        const tags = transaction.tags ? transaction.tags.split(',').map(tag => 
            `<span class="badge bg-secondary">${tag.trim()}</span>`
        ).join(' ') : '';

        return `
            <li class="list-group-item d-flex justify-content-between align-items-start">
                <div class="ms-2 me-auto">
                    <div class="d-flex align-items-center mb-1">
                        <span class="me-2">${emoji}</span>
                        <div class="fw-bold">${transaction.description}</div>
                    </div>
                    <div class="d-flex align-items-center gap-2 text-muted small">
                        <span>${formattedDate}</span>
                        ${tags}
                    </div>
                </div>
                <div class="d-flex align-items-center gap-2">
                    <span class="amount ${transaction.type} fw-bold">
                        ${transaction.type === 'expense' ? '-' : '+'}${formattedAmount}
                    </span>
                    <div class="transaction-actions" style="opacity: 0; transition: opacity 0.2s ease;">
                        <button class="btn btn-sm btn-outline-primary edit-btn me-1" 
                                onclick="budgetTracker.editTransaction('${transaction.id}')">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger delete-btn" 
                                onclick="budgetTracker.deleteTransaction('${transaction.id}')">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            </li>
        `;
    }

    getFilteredTransactions() {
        return this.state.transactions.filter(transaction => {
            const typeMatch = this.state.currentFilter === 'all' || transaction.type === this.state.currentFilter;
            const categoryMatch = this.state.currentCategoryFilter === 'all' || transaction.category === this.state.currentCategoryFilter;
            return typeMatch && categoryMatch;
        });
    }

    filterTransactions(filter) {
        this.state.currentFilter = filter;
        this.renderTransactions();
    }

    changeChartType(type) {
        this.state.currentChartType = type;
        this.updateChart();
    }

    updateChart() {
        if (!this.budgetChart) return;
        
        const income = this.state.transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
            
        const expenses = this.state.transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        if (income === 0 && expenses === 0) {
            this.elements.emptyChartMessage.style.display = 'block';
            this.elements.budgetChartCanvas.style.display = 'none';
            return;
        }

        this.elements.emptyChartMessage.style.display = 'none';
        this.elements.budgetChartCanvas.style.display = 'block';

        if (this.state.chart) {
            this.state.chart.destroy();
        }

        const chartData = this.state.currentChartType === 'overview' 
            ? this.getOverviewChartData(income, expenses)
            : this.getCategoryChartData();

        this.state.chart = new Chart(this.budgetChart, chartData);
    }

    getOverviewChartData(income, expenses) {
        return {
            type: 'doughnut',
            data: {
                labels: ['Income', 'Expenses'],
                datasets: [{
                    data: [income, expenses],
                    backgroundColor: ['#10b981', '#ef4444'],
                    borderColor: ['#059669', '#dc2626'],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#f1f5f9' }
                    }
                }
            }
        };
    }

    getCategoryChartData() {
        const categoryTotals = {};
        this.state.transactions
            .filter(t => t.type === 'expense')
            .forEach(t => {
                categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
            });

        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
        
        return {
            type: 'pie',
            data: {
                labels: Object.keys(categoryTotals),
                datasets: [{
                    data: Object.values(categoryTotals),
                    backgroundColor: colors.slice(0, Object.keys(categoryTotals).length),
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#f1f5f9' }
                    }
                }
            }
        };
    }

    updateSummary() {
        const income = this.state.transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
            
        const expenses = this.state.transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
            
        const balance = income - expenses;

        if (this.elements.totalIncomeEl) {
            this.elements.totalIncomeEl.textContent = this.formatCurrency(income);
        }
        if (this.elements.totalExpensesEl) {
            this.elements.totalExpensesEl.textContent = this.formatCurrency(expenses);
        }
        if (this.elements.balanceEl) {
            this.elements.balanceEl.textContent = this.formatCurrency(balance);
            this.elements.balanceEl.className = balance >= 0 ? 'fw-bold text-success' : 'fw-bold text-danger';
        }
    }

    saveTransactions() {
        localStorage.setItem('transactions', JSON.stringify(this.state.transactions));
    }

    exportData() {
        const data = {
            transactions: this.state.transactions,
            currency: this.state.currentCurrency,
            currencySymbol: this.state.currentCurrencySymbol,
            exportDate: new Date().toISOString()
        };

        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `budget-backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        this.showSnackbar('Data exported successfully', 'success');
    }

    importData(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                
                if (data.transactions && Array.isArray(data.transactions)) {
                    this.state.transactions = data.transactions;
                    
                    if (data.currency) {
                        this.state.currentCurrency = data.currency;
                        localStorage.setItem('selectedCurrency', data.currency);
                    }
                    
                    if (data.currencySymbol) {
                        this.state.currentCurrencySymbol = data.currencySymbol;
                        localStorage.setItem('selectedCurrencySymbol', data.currencySymbol);
                    }
                    
                    this.saveTransactions();
                    this.initializeCurrency();
                    this.renderTransactions();
                    this.updateChart();
                    this.updateSummary();
                    
                    this.showSnackbar('Data imported successfully', 'success');
                } else {
                    this.showSnackbar('Invalid file format', 'error');
                }
            } catch (error) {
                this.showSnackbar('Error reading file', 'error');
            }
        };
        
        reader.onerror = () => {
            this.showSnackbar('Error reading file', 'error');
        };
        
        reader.readAsText(file);
        e.target.value = '';
    }

    downloadSummary() {
        const income = this.state.transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
            
        const expenses = this.state.transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
            
        const balance = income - expenses;

        const summaryHtml = `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h1>Budget Summary</h1>
                <div style="margin: 20px 0;">
                    <h3>Total Income: ${this.formatCurrency(income)}</h3>
                    <h3>Total Expenses: ${this.formatCurrency(expenses)}</h3>
                    <h3 style="color: ${balance >= 0 ? 'green' : 'red'}">Balance: ${this.formatCurrency(balance)}</h3>
                </div>
                <p>Generated on: ${new Date().toLocaleDateString()}</p>
            </div>
        `;

        const opt = {
            margin: 1,
            filename: `budget-summary-${new Date().toISOString().split('T')[0]}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        html2pdf().from(summaryHtml).set(opt).save();
        this.showSnackbar('Summary downloaded successfully', 'success');
    }

    toggleTooltips() {
        this.state.tooltipsEnabled = !this.state.tooltipsEnabled;
        localStorage.setItem('tooltipsEnabled', this.state.tooltipsEnabled);
        
        if (this.state.tooltipsEnabled) {
            this.setupTooltips();
            this.showSnackbar('Tooltips enabled', 'success');
        } else {
            this.clearTooltips();
            this.showSnackbar('Tooltips disabled', 'success');
        }
    }

    setupTooltips() {
        if (!this.state.tooltipsEnabled || !this.state.tooltipConfig) return;
        
        this.clearTooltips();
        
        Object.values(this.state.tooltipConfig).forEach(section => {
            Object.entries(section).forEach(([selector, config]) => {
                const elements = document.querySelectorAll(selector);
                elements.forEach(element => {
                    this.createTooltip(element, config.title, config.placement);
                });
            });
        });
    }

    createTooltip(element, title, placement = 'top') {
        if (!element || !title) return;
        
        let tooltip;
        
        const showTooltip = (e) => {
            tooltip = document.createElement('div');
            tooltip.className = 'custom-tooltip';
            tooltip.textContent = title;
            tooltip.style.cssText = `
                position: absolute;
                background: var(--card-bg);
                color: var(--text-color);
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 12px;
                border: 1px solid var(--border-color);
                box-shadow: var(--shadow-lg);
                z-index: 1000;
                max-width: 200px;
                word-wrap: break-word;
                opacity: 0;
                transition: opacity 0.2s;
            `;
            
            document.body.appendChild(tooltip);
            
            const rect = element.getBoundingClientRect();
            const tooltipRect = tooltip.getBoundingClientRect();
            
            let left = rect.left + rect.width / 2 - tooltipRect.width / 2;
            let top = placement === 'top' ? rect.top - tooltipRect.height - 8 : rect.bottom + 8;
            
            left = Math.max(8, Math.min(left, window.innerWidth - tooltipRect.width - 8));
            
            tooltip.style.left = left + 'px';
            tooltip.style.top = top + 'px';
            
            setTimeout(() => tooltip.style.opacity = '1', 10);
        };
        
        const hideTooltip = () => {
            if (tooltip) {
                tooltip.style.opacity = '0';
                setTimeout(() => {
                    if (tooltip && tooltip.parentNode) {
                        tooltip.parentNode.removeChild(tooltip);
                    }
                }, 200);
                tooltip = null;
            }
        };
        
        element.addEventListener('mouseenter', showTooltip);
        element.addEventListener('mouseleave', hideTooltip);
        
        this.state.activeTooltipInstances.push({ element, showTooltip, hideTooltip });
    }

    clearTooltips() {
        this.state.activeTooltipInstances.forEach(({ element, showTooltip, hideTooltip }) => {
            element.removeEventListener('mouseenter', showTooltip);
            element.removeEventListener('mouseleave', hideTooltip);
        });
        this.state.activeTooltipInstances = [];
        
        document.querySelectorAll('.custom-tooltip').forEach(tooltip => {
            tooltip.remove();
        });
    }

    showLoading(show) {
        if (show) {
            document.body.classList.add('loading');
        } else {
            document.body.classList.remove('loading');
        }
    }
}

// Initialize the application
let budgetTracker;
document.addEventListener('DOMContentLoaded', () => {
    budgetTracker = new BudgetTracker();
});

// Add hover effects for transaction actions
document.addEventListener('DOMContentLoaded', () => {
    const style = document.createElement('style');
    style.textContent = `
        .list-group-item .transaction-actions {
            opacity: 0;
            transition: opacity 0.2s ease;
        }
        
        .list-group-item:hover .transaction-actions {
            opacity: 1;
        }
    `;
    document.head.appendChild(style);
});