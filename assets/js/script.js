class BudgetTracker {
    constructor() {
        console.log('Initializing BudgetTracker...');
        this.initializeElements();
        this.initializeState();
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
            snackbar: document.getElementById('snackbar'),
            searchInput: document.getElementById('transaction-search')
        };
        
        this.budgetChart = this.elements.budgetChartCanvas?.getContext('2d');
    }

    initializeState() {
        let transactions = [];
        let tooltipsEnabled = true;
        let selectedCurrency = 'INR';
        let selectedCurrencySymbol = '₹';
        
        try {
            const storedTransactions = localStorage.getItem('transactions');
            transactions = storedTransactions ? JSON.parse(storedTransactions) : [];
        } catch (error) {
            console.error('Failed to load transactions from localStorage:', error);
            // Don't show snackbar here as elements aren't initialized yet
        }
        
        try {
            tooltipsEnabled = localStorage.getItem('tooltipsEnabled') !== 'false';
            selectedCurrency = localStorage.getItem('selectedCurrency') || 'INR';
            selectedCurrencySymbol = localStorage.getItem('selectedCurrencySymbol') || '₹';
        } catch (error) {
            console.error('Failed to load settings from localStorage:', error);
        }
        
        this.state = {
            transactions,
            chart: null,
            editingTransactionId: null,
            transactionTypes: null,
            currentFilter: 'all',
            currentCategoryFilter: 'all',
            currentSearchTerm: '',
            currentChartType: 'overview',
            tooltipConfig: {},
            tooltipsEnabled,
            activeTooltipInstances: [],
            currentActiveTooltip: null,
            currentCurrency: selectedCurrency,
            currentCurrencySymbol: selectedCurrencySymbol
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

        await this.loadTransactionTypes();
        await this.loadTooltipConfig();
    }

    bindEvents() {
        this.elements.transactionForm?.addEventListener('submit', (e) => this.handleTransactionSubmit(e));
        this.elements.cancelEditBtn?.addEventListener('click', () => this.cancelEdit());
        this.elements.downloadBtn?.addEventListener('click', () => this.downloadSummary());
        this.elements.exportBtnHeader?.addEventListener('click', () => this.exportData());
        this.elements.importFileHeader?.addEventListener('change', (e) => this.importData(e));
        this.elements.tooltipToggle?.addEventListener('click', () => this.toggleTooltips());
        
        // Search input event binding with debugging
        if (this.elements.searchInput) {
            console.log('Search input found, binding events');
            this.elements.searchInput.addEventListener('input', (e) => this.handleSearchInput(e));
            this.elements.searchInput.addEventListener('keyup', (e) => this.handleSearchInput(e));
        } else {
            console.warn('Search input not found in DOM');
        }
        
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
        try {
            this.showLoading(true);
            await this.loadConfiguration();
            this.initializeCurrency();
            this.setupTypeChangeListeners();
            this.renderTransactions();
            this.updateChart();
            this.updateSummary();
            this.setupTooltips();
            this.setupCategoryFilters();
            this.setupKeyboardShortcuts();
            console.log('BudgetTracker initialized successfully');
        } catch (error) {
            console.error('Failed to initialize BudgetTracker:', error);
            this.showCriticalError('Failed to initialize application. Please refresh the page.');
        } finally {
            this.showLoading(false);
        }
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
            // Check if we're running from file:// protocol
            if (window.location.protocol === 'file:') {
                console.log('File protocol detected, using fallback categories');
                this.loadFallbackCategories();
                return;
            }
            
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
            // Check if we're running from file:// protocol
            if (window.location.protocol === 'file:') {
                console.log('File protocol detected, using fallback tooltips');
                this.loadFallbackTooltips();
                return;
            }
            
            const response = await fetch('assets/json/tooltips.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.state.tooltipConfig = await response.json();
        } catch (error) {
            console.error('Failed to load tooltip config:', error);
            this.loadFallbackTooltips();
        }
    }

    loadFallbackTooltips() {
        this.state.tooltipConfig = {
            "header": {
                "#export-btn-header": {
                    "placement": "bottom",
                    "title": "Create a backup of your transactions as JSON file"
                },
                "label[for=\"import-file-header\"]": {
                    "placement": "bottom", 
                    "title": "Import transactions from a backup JSON file"
                }
            },
            "transactionForm": {
                "label[for=\"income\"]": {
                    "placement": "top",
                    "title": "Money coming in - salary, freelance, investments, etc."
                },
                "label[for=\"expense\"]": {
                    "placement": "top",
                    "title": "Money going out - food, rent, shopping, bills, etc."
                },
                "#description": {
                    "placement": "top",
                    "title": "Brief description of the transaction"
                },
                "#amount": {
                    "placement": "top", 
                    "title": "Enter the amount in your selected currency"
                },
                "#category": {
                    "placement": "top",
                    "title": "Choose a category to organize your transactions"
                },
                "#tags": {
                    "placement": "top",
                    "title": "Add tags separated by commas for better organization"
                }
            },
            "dynamicElements": {
                ".edit-btn": {
                    "placement": "top",
                    "title": "Edit this transaction"
                },
                ".delete-btn": {
                    "placement": "top", 
                    "title": "Delete this transaction permanently"
                }
            }
        };
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
                return `${this.state.currentCurrencySymbol}${formattedAmount.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
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
            formatted = remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree;
        }
        
        return formatted + decimalPart;
    }

    initializeCurrency() {
        if (this.elements.currentCurrencySpan) {
            this.elements.currentCurrencySpan.textContent = `${this.state.currentCurrencySymbol} ${this.state.currentCurrency}`;
        }
        
        // Update amount input placeholder with currency symbol
        const amountInput = document.getElementById('amount');
        if (amountInput) {
            amountInput.placeholder = `Amount (e.g., ${this.state.currentCurrencySymbol}1,500.75)`;
        }
        
        this.updateSummary();
    }

    changeCurrency(e) {
        e.preventDefault();
        const currency = e.target.dataset.currency;
        const symbol = e.target.dataset.symbol;
        
        this.state.currentCurrency = currency;
        this.state.currentCurrencySymbol = symbol;
        
        try {
            localStorage.setItem('selectedCurrency', currency);
            localStorage.setItem('selectedCurrencySymbol', symbol);
        } catch (error) {
            console.error('Failed to save currency settings:', error);
            this.showSnackbar('Currency changed but failed to save setting', 'warning');
        }
        
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
        try {
            console.log('Adding transaction:', transaction);
            this.state.transactions.push(transaction);
            console.log('Total transactions:', this.state.transactions.length);
            this.setupCategoryFilters(); // Refresh category filters
            this.showSnackbar('Transaction added successfully', 'success');
        } catch (error) {
            console.error('Error adding transaction:', error);
            this.showSnackbar('Failed to add transaction. Please try again.', 'error');
        }
    }

    updateTransaction(transaction) {
        try {
            const index = this.state.transactions.findIndex(t => t.id === transaction.id);
            if (index !== -1) {
                this.state.transactions[index] = transaction;
                this.setupCategoryFilters(); // Refresh category filters
                this.showSnackbar('Transaction updated successfully', 'success');
            } else {
                throw new Error('Transaction not found');
            }
        } catch (error) {
            console.error('Error updating transaction:', error);
            this.showSnackbar('Failed to update transaction. Please try again.', 'error');
        }
    }

    deleteTransaction(id) {
        try {
            console.log('Attempting to delete transaction with ID:', id);
            console.log('Current transactions:', this.state.transactions.length);
            console.log('Transaction to delete:', this.state.transactions.find(t => t.id == id || t.id === id));
            
            const originalLength = this.state.transactions.length;
            
            // Handle both string and number IDs
            this.state.transactions = this.state.transactions.filter(t => {
                const match = t.id != id && t.id !== id; // Use != for loose comparison
                if (!match) {
                    console.log('Removing transaction:', t);
                }
                return match;
            });
            
            console.log('Transactions after deletion:', this.state.transactions.length);
            
            if (this.state.transactions.length === originalLength) {
                console.error('Transaction not found for deletion. ID:', id);
                console.error('Available transaction IDs:', this.state.transactions.map(t => ({id: t.id, type: typeof t.id})));
                throw new Error(`Transaction with ID ${id} not found`);
            }
            
            this.saveTransactions();
            this.renderTransactions();
            this.updateChart();
            this.updateSummary();
            this.setupCategoryFilters(); // Refresh category filters
            this.showSnackbar('Transaction deleted successfully', 'success');
            console.log('Transaction deleted successfully');
        } catch (error) {
            console.error('Error deleting transaction:', error);
            this.showSnackbar('Failed to delete transaction. Please try again.', 'error');
        }
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
        // Use requestAnimationFrame for better timing
        requestAnimationFrame(() => {
            const categorySelect = form.querySelector('#category');
            if (categorySelect) {
                categorySelect.value = transaction.category;
            }
        });

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
        try {
            console.log('Rendering transactions...');
            if (!this.elements.transactionList) {
                console.error('Transaction list element not found');
                this.showSnackbar('UI error: Transaction list not found', 'error');
                return;
            }
            
            const filteredTransactions = this.getFilteredTransactions();
            console.log('Filtered transactions:', filteredTransactions.length);
            
            if (filteredTransactions.length === 0) {
                this.showEmptyTransactionState();
                return;
            }

            this.elements.emptyTransactionMessage.style.display = 'none';
            const transactionElements = filteredTransactions
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .map(transaction => {
                    try {
                        return this.createTransactionElement(transaction);
                    } catch (error) {
                        console.error('Error creating transaction element:', error, transaction);
                        return this.createErrorTransactionElement(transaction.id);
                    }
                });
            
            this.elements.transactionList.innerHTML = transactionElements.join('');
            console.log('Rendered', transactionElements.length, 'transactions');
            
            // Add event delegation for transaction buttons
            this.setupTransactionEventDelegation();
            
            // Setup tooltips for transaction elements
            if (this.state.tooltipsEnabled) {
                this.setupDynamicTooltips();
            }
        } catch (error) {
            console.error('Error rendering transactions:', error);
            this.showSnackbar('Failed to display transactions', 'error');
        }
    }

    showEmptyTransactionState() {
        this.elements.transactionList.innerHTML = '';
        
        const isEmpty = this.state.transactions.length === 0;
        const hasNoFilterResults = this.state.transactions.length > 0 && this.getFilteredTransactions().length === 0;
        
        let emptyMessage = {
            icon: 'bi-card-list',
            title: 'No Transactions',
            subtitle: 'Your transactions will appear here.'
        };
        
        if (hasNoFilterResults) {
            const filterType = this.state.currentFilter;
            const categoryFilter = this.state.currentCategoryFilter;
            
            emptyMessage = {
                icon: 'bi-funnel',
                title: 'No Matching Transactions',
                subtitle: `No transactions found for current filters.${filterType !== 'all' ? ` Try changing the type filter.` : ''}${categoryFilter !== 'all' ? ` Try changing the category filter.` : ''}`
            };
        } else if (isEmpty) {
            emptyMessage = {
                icon: 'bi-plus-circle',
                title: 'Start Your Budget Journey',
                subtitle: 'Add your first transaction using the form above to begin tracking your finances.'
            };
        }
        
        this.elements.emptyTransactionMessage.innerHTML = `
            <i class="${emptyMessage.icon}" aria-hidden="true"></i>
            <p>${emptyMessage.title}</p>
            <small class="text-muted">${emptyMessage.subtitle}</small>
            ${isEmpty ? '<button class="btn btn-primary mt-3" onclick="document.getElementById(\'description\').focus()">Add First Transaction</button>' : ''}
        `;
        this.elements.emptyTransactionMessage.style.display = 'block';
    }

    createErrorTransactionElement(id) {
        return `
            <li class="list-group-item" style="border-left: 3px solid var(--danger-color);">
                <div class="d-flex align-items-center justify-content-between">
                    <div class="transaction-left d-flex align-items-center">
                        <span class="transaction-emoji me-2">⚠️</span>
                        <div class="transaction-details">
                            <div class="transaction-description text-danger">Error loading transaction</div>
                            <div class="transaction-meta text-muted small">Transaction ID: ${id}</div>
                        </div>
                    </div>
                    <div class="transaction-right">
                        <button class="btn btn-sm btn-outline-danger" 
                                data-action="delete" data-id="${id}">
                            <i class="bi bi-trash"></i> Remove
                        </button>
                    </div>
                </div>
            </li>
        `;
    }

    setupDynamicTooltips() {
        if (!this.state.tooltipConfig || !this.state.tooltipConfig.dynamicElements) return;
        
        const dynamicConfig = this.state.tooltipConfig.dynamicElements;
        Object.entries(dynamicConfig).forEach(([selector, config]) => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                this.createTooltip(element, config.title, config.placement);
            });
        });
    }

    createTransactionElement(transaction) {
        // Debug transaction ID
        console.log('Creating element for transaction:', transaction.id, 'Type:', typeof transaction.id);
        
        const emoji = this.getCategoryEmoji(transaction.category);
        const formattedAmount = this.formatCurrency(transaction.amount);
        const formattedDate = new Date(transaction.date).toLocaleDateString();
        const tags = (transaction.tags && typeof transaction.tags === 'string') ? 
            transaction.tags.split(',').map(tag => 
                `<span class="badge bg-secondary">${tag.trim()}</span>`
            ).join(' ') : '';

        // Ensure ID is properly escaped for HTML attributes
        const safeId = String(transaction.id).replace(/['"]/g, '');

        return `
            <li class="list-group-item ${transaction.type}-item" data-transaction-id="${safeId}">
                <div class="d-flex align-items-center justify-content-between">
                    <div class="transaction-left d-flex align-items-center flex-grow-1">
                        <span class="transaction-emoji me-2">${emoji}</span>
                        <div class="transaction-details flex-grow-1">
                            <div class="transaction-description fw-bold">${transaction.description}</div>
                            <div class="transaction-meta text-muted small">
                                <span class="transaction-date">${formattedDate}</span>
                                ${tags ? `<span class="transaction-tags ms-2">${tags}</span>` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="transaction-right d-flex align-items-center gap-2">
                        <span class="amount ${transaction.type} fw-bold">
                            ${transaction.type === 'expense' ? '-' : '+'}${formattedAmount}
                        </span>
                        <div class="transaction-actions">
                            <button class="btn btn-sm btn-outline-primary edit-btn" 
                                    data-action="edit" data-id="${safeId}" title="Edit transaction">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger delete-btn" 
                                    data-action="delete" data-id="${safeId}" title="Delete transaction">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </li>
        `;
    }

    getFilteredTransactions() {
        const filtered = this.state.transactions.filter(transaction => {
            const typeMatch = this.state.currentFilter === 'all' || transaction.type === this.state.currentFilter;
            const categoryMatch = this.state.currentCategoryFilter === 'all' || transaction.category === this.state.currentCategoryFilter;
            
            let searchMatch = true;
            if (this.state.currentSearchTerm) {
                const searchTerm = this.state.currentSearchTerm.toLowerCase();
                const description = (transaction.description || '').toLowerCase();
                const tags = (transaction.tags || '').toLowerCase();
                const category = (transaction.category || '').toLowerCase();
                
                searchMatch = description.includes(searchTerm) || 
                             tags.includes(searchTerm) || 
                             category.includes(searchTerm);
                
                if (this.state.currentSearchTerm) {
                    console.log(`Search matching for "${searchTerm}":`, {
                        transaction: transaction.description,
                        description: description.includes(searchTerm),
                        tags: tags.includes(searchTerm),
                        category: category.includes(searchTerm),
                        match: searchMatch
                    });
                }
            }
            
            return typeMatch && categoryMatch && searchMatch;
        });
        
        if (this.state.currentSearchTerm) {
            console.log(`Filtered ${filtered.length} transactions from ${this.state.transactions.length} total`);
        }
        
        return filtered;
    }

    handleSearchInput(e) {
        const searchTerm = e.target.value.trim();
        console.log('Search input:', searchTerm);
        this.state.currentSearchTerm = searchTerm;
        
        // Debounce search to avoid excessive filtering
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            console.log('Executing search for:', searchTerm);
            this.renderTransactions();
            
            if (searchTerm) {
                const count = this.getFilteredTransactions().length;
                console.log('Search results:', count);
                this.showSnackbar(`Found ${count} transaction${count !== 1 ? 's' : ''} matching "${searchTerm}"`, 'info');
            }
        }, 300);
    }

    filterTransactions(filter) {
        console.log('Filtering transactions by:', filter);
        this.state.currentFilter = filter;
        this.renderTransactions();
        this.updateFilterUI();
        
        // Show filter feedback
        const filterLabels = {
            'all': 'All Transactions',
            'income': 'Income Only',
            'expense': 'Expenses Only'
        };
        this.showSnackbar(`Showing: ${filterLabels[filter]}`, 'info');
    }

    updateFilterUI() {
        // Update active filter button
        this.elements.filterButtons.forEach(button => {
            const label = button.nextElementSibling;
            if (button.value === this.state.currentFilter) {
                label.classList.add('active');
            } else {
                label.classList.remove('active');
            }
        });
    }

    changeChartType(type) {
        this.state.currentChartType = type;
        this.updateChart();
    }

    updateChart() {
        if (!this.budgetChart) return;
        
        // Check if Chart.js is loaded
        if (typeof Chart === 'undefined') {
            console.error('Chart.js is not loaded');
            this.showSnackbar('Chart library failed to load', 'error');
            return;
        }
        
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

        try {
            this.state.chart = new Chart(this.budgetChart, chartData);
        } catch (error) {
            console.error('Failed to create chart:', error);
            this.showSnackbar('Failed to load chart', 'error');
        }
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
        try {
            localStorage.setItem('transactions', JSON.stringify(this.state.transactions));
        } catch (error) {
            console.error('Failed to save transactions to localStorage:', error);
            this.showSnackbar('Failed to save data locally', 'error');
        }
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

    async downloadSummary() {
        try {
            this.showLoading(true);
            
            const income = this.state.transactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0);
                
            const expenses = this.state.transactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0);
                
            const balance = income - expenses;
            
            // Create a temporary container for the PDF content
            const container = document.createElement('div');
            container.style.width = '8.5in';
            container.style.minHeight = '11in';
            container.style.margin = '0';
            container.style.padding = '0.75in';
            container.style.backgroundColor = 'white';
            container.style.fontFamily = 'Arial, sans-serif';
            container.style.fontSize = '12px';
            container.style.lineHeight = '1.4';
            container.style.color = '#333';
            
            // Generate the content
            container.innerHTML = this.generatePDFContent(income, expenses, balance);
            
            // Temporarily add to document
            document.body.appendChild(container);
            
            const opt = {
                margin: 0,
                filename: `Spendora-Budget-Report-${new Date().toISOString().split('T')[0]}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { 
                    scale: 1.5,
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: '#ffffff',
                    width: container.offsetWidth,
                    height: container.offsetHeight
                },
                jsPDF: { 
                    unit: 'in', 
                    format: 'letter', 
                    orientation: 'portrait'
                }
            };

            await html2pdf().from(container).set(opt).save();
            
            // Remove temporary container
            document.body.removeChild(container);
            
            this.showSnackbar('Budget report downloaded successfully!', 'success');
        } catch (error) {
            console.error('Error generating PDF report:', error);
            this.showSnackbar('Failed to generate report. Please try again.', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    generatePDFContent(income, expenses, balance) {
        const currentDate = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        // Get transactions
        const incomeTransactions = this.state.transactions
            .filter(t => t.type === 'income')
            .sort((a, b) => new Date(b.date) - new Date(a.date));
            
        const expenseTransactions = this.state.transactions
            .filter(t => t.type === 'expense')
            .sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Generate advice
        const expensesByCategory = {};
        this.state.transactions.forEach(t => {
            if (t.type === 'expense') {
                expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
            }
        });
        const advice = this.generateFinancialAdvice(income, expenses, balance, expensesByCategory);
        
        // Create charts
        const pieChartSVG = this.generatePieChartSVG(income, expenses);
        const barChartSVG = this.generateBarChartSVG(expensesByCategory);
        
        return `
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 20px; padding: 15px 0; border-bottom: 2px solid #3b82f6;">
                <h1 style="font-size: 28px; color: #3b82f6; margin: 0 0 8px 0; font-weight: bold;">📊 Spendora</h1>
                <p style="font-size: 14px; color: #666; margin: 4px 0;"><strong>Personal Budget Report</strong> | spendora.eknath.dev | ${currentDate}</p>
            </div>
            
            <!-- Top Section: Summary + Charts -->
            <div style="display: flex; gap: 20px; margin-bottom: 20px;">
                <!-- Financial Summary -->
                <div style="flex: 1; background: #f8f9fa; padding: 15px; border-radius: 8px; border: 1px solid #dee2e6;">
                    <h3 style="text-align: center; margin: 0 0 15px 0; color: #333; font-size: 14px;">Financial Summary</h3>
                    <div style="text-align: center;">
                        <div style="margin-bottom: 8px;">
                            <span style="font-size: 18px; font-weight: bold; color: #28a745; font-family: 'Courier New', monospace;">${this.formatCurrency(income)}</span>
                            <div style="font-size: 10px; color: #666;">Total Income</div>
                        </div>
                        <div style="margin-bottom: 8px;">
                            <span style="font-size: 18px; font-weight: bold; color: #dc3545; font-family: 'Courier New', monospace;">${this.formatCurrency(expenses)}</span>
                            <div style="font-size: 10px; color: #666;">Total Expenses</div>
                        </div>
                        <div style="padding: 10px; margin-top: 10px; border-radius: 5px; ${balance >= 0 ? 'background: #d4edda; color: #155724;' : 'background: #f8d7da; color: #721c24;'}">
                            <div style="font-size: 16px; font-weight: bold; font-family: 'Courier New', monospace;">${balance >= 0 ? '✅' : '⚠️'} ${this.formatCurrency(balance)}</div>
                            <div style="font-size: 9px; margin-top: 3px;">Net Balance</div>
                        </div>
                    </div>
                </div>
                
                <!-- Charts -->
                <div style="flex: 1; display: flex; gap: 15px;">
                    <div style="flex: 1; text-align: center; background: white; padding: 10px; border: 1px solid #dee2e6; border-radius: 8px;">
                        <h4 style="margin: 0 0 8px 0; font-size: 11px; color: #333;">Income vs Expenses</h4>
                        ${pieChartSVG}
                    </div>
                    ${Object.keys(expensesByCategory).length > 0 ? `
                    <div style="flex: 1; text-align: center; background: white; padding: 10px; border: 1px solid #dee2e6; border-radius: 8px;">
                        <h4 style="margin: 0 0 8px 0; font-size: 11px; color: #333;">Top Expenses</h4>
                        ${barChartSVG}
                    </div>
                    ` : ''}
                </div>
            </div>
            
            <!-- Transaction Tables Side by Side -->
            <div style="display: flex; gap: 15px; margin-bottom: 15px;">
                <!-- Income Transactions -->
                <div style="flex: 1;">
                    <div style="background: #28a745; color: white; padding: 8px 12px; font-weight: bold; font-size: 12px; border-radius: 5px 5px 0 0;">
                        💰 Income (${incomeTransactions.length})
                    </div>
                    <div style="max-height: 200px; overflow-y: auto; border: 1px solid #dee2e6; border-top: none;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 9px;">
                            <thead style="position: sticky; top: 0; background: #f8f9fa;">
                                <tr>
                                    <th style="padding: 6px; text-align: left; border-bottom: 1px solid #dee2e6;">Description</th>
                                    <th style="padding: 6px; text-align: center; border-bottom: 1px solid #dee2e6;">Date</th>
                                    <th style="padding: 6px; text-align: right; border-bottom: 1px solid #dee2e6;">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${incomeTransactions.length > 0 ? incomeTransactions.map(t => `
                                    <tr>
                                        <td style="padding: 4px 6px; border-bottom: 1px solid #f0f0f0;">${this.getCategoryEmoji(t.category)} ${t.description}</td>
                                        <td style="padding: 4px 6px; text-align: center; border-bottom: 1px solid #f0f0f0; color: #666; font-size: 8px;">${new Date(t.date).toLocaleDateString()}</td>
                                        <td style="padding: 4px 6px; text-align: right; border-bottom: 1px solid #f0f0f0; font-family: 'Courier New', monospace; color: #28a745; font-weight: bold;">${this.formatCurrency(t.amount)}</td>
                                    </tr>
                                `).join('') : '<tr><td colspan="3" style="padding: 15px; text-align: center; color: #666;">No income transactions</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                    <div style="background: #e9ecef; padding: 6px 12px; font-weight: bold; font-size: 10px; border: 1px solid #dee2e6; border-top: none;">
                        Total: <span style="font-family: 'Courier New', monospace; color: #28a745;">${this.formatCurrency(income)}</span>
                    </div>
                </div>
                
                <!-- Expense Transactions -->
                <div style="flex: 1;">
                    <div style="background: #dc3545; color: white; padding: 8px 12px; font-weight: bold; font-size: 12px; border-radius: 5px 5px 0 0;">
                        💸 Expenses (${expenseTransactions.length})
                    </div>
                    <div style="max-height: 200px; overflow-y: auto; border: 1px solid #dee2e6; border-top: none;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 9px;">
                            <thead style="position: sticky; top: 0; background: #f8f9fa;">
                                <tr>
                                    <th style="padding: 6px; text-align: left; border-bottom: 1px solid #dee2e6;">Description</th>
                                    <th style="padding: 6px; text-align: center; border-bottom: 1px solid #dee2e6;">Date</th>
                                    <th style="padding: 6px; text-align: right; border-bottom: 1px solid #dee2e6;">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${expenseTransactions.length > 0 ? expenseTransactions.map(t => `
                                    <tr>
                                        <td style="padding: 4px 6px; border-bottom: 1px solid #f0f0f0;">${this.getCategoryEmoji(t.category)} ${t.description}</td>
                                        <td style="padding: 4px 6px; text-align: center; border-bottom: 1px solid #f0f0f0; color: #666; font-size: 8px;">${new Date(t.date).toLocaleDateString()}</td>
                                        <td style="padding: 4px 6px; text-align: right; border-bottom: 1px solid #f0f0f0; font-family: 'Courier New', monospace; color: #dc3545; font-weight: bold;">${this.formatCurrency(t.amount)}</td>
                                    </tr>
                                `).join('') : '<tr><td colspan="3" style="padding: 15px; text-align: center; color: #666;">No expense transactions</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                    <div style="background: #e9ecef; padding: 6px 12px; font-weight: bold; font-size: 10px; border: 1px solid #dee2e6; border-top: none;">
                        Total: <span style="font-family: 'Courier New', monospace; color: #dc3545;">${this.formatCurrency(expenses)}</span>
                    </div>
                </div>
            </div>
            
            <!-- Financial Advice -->
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px;">
                <h3 style="color: #856404; margin: 0 0 10px 0; font-size: 14px;">💡 Financial Insights & Recommendations</h3>
                <ul style="margin: 0; padding-left: 18px; font-size: 10px; line-height: 1.4; columns: 2; column-gap: 20px;">
                    ${advice.map(tip => `<li style="margin-bottom: 6px; break-inside: avoid;">${tip}</li>`).join('')}
                </ul>
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; margin-top: 15px; padding-top: 10px; border-top: 1px solid #dee2e6; color: #666; font-size: 9px;">
                <p style="margin: 2px 0;"><strong>Generated by Spendora - Personal Budget Tracker</strong> | Visit spendora.eknath.dev</p>
            </div>
        `;
    }

    generateFinancialAdvice(income, expenses, balance, expensesByCategory) {
        const advice = [];
        const savingsRate = income > 0 ? ((balance / income) * 100) : 0;
        
        // Balance-based advice
        if (balance > 0) {
            if (savingsRate >= 20) {
                advice.push("🎉 Excellent! You're saving " + savingsRate.toFixed(1) + "% of your income. Consider investing your surplus for long-term growth.");
            } else if (savingsRate >= 10) {
                advice.push("👍 Good job! You're saving " + savingsRate.toFixed(1) + "% of your income. Try to increase it to 20% for better financial security.");
            } else {
                advice.push("💡 You have a positive balance, but consider increasing your savings rate. Aim for at least 10-20% of your income.");
            }
        } else {
            advice.push("⚠️ You're spending more than you earn. Focus on reducing expenses or increasing income to achieve financial stability.");
            advice.push("🔍 Review your largest expense categories and look for areas to cut back.");
        }
        
        // Category-specific advice
        const sortedExpenses = Object.entries(expensesByCategory)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3);
            
        if (sortedExpenses.length > 0) {
            const topCategory = sortedExpenses[0];
            const topCategoryPercent = ((topCategory[1] / expenses) * 100).toFixed(1);
            advice.push(`📊 Your largest expense category is ${this.getCategoryLabel(topCategory[0])} (${topCategoryPercent}% of total expenses).`);
        }
        
        // Income advice
        if (income === 0) {
            advice.push("💼 No income recorded. Start by adding your income sources to get a complete financial picture.");
        }
        
        // General advice
        advice.push("📝 Track all transactions regularly to maintain accurate financial records.");
        advice.push("🎯 Set specific financial goals and review your progress monthly.");
        
        return advice.slice(0, 6); // Limit to 6 pieces of advice
    }

    generatePieChartSVG(income, expenses) {
        if (income === 0 && expenses === 0) return '<p style="color: #666;">No data available</p>';
        
        const total = income + expenses;
        const incomePercent = (income / total) * 100;
        const expensePercent = (expenses / total) * 100;
        
        // Calculate angles for pie chart
        const incomeAngle = (income / total) * 360;
        const expenseAngle = (expenses / total) * 360;
        
        const radius = 80;
        const centerX = 100;
        const centerY = 100;
        
        // Calculate path for income slice
        const incomeEndAngle = incomeAngle;
        const incomeEndX = centerX + radius * Math.cos((incomeEndAngle - 90) * Math.PI / 180);
        const incomeEndY = centerY + radius * Math.sin((incomeEndAngle - 90) * Math.PI / 180);
        
        const incomeArc = incomeAngle > 180 ? 1 : 0;
        const incomePath = `M ${centerX} ${centerY} L ${centerX} ${centerY - radius} A ${radius} ${radius} 0 ${incomeArc} 1 ${incomeEndX} ${incomeEndY} Z`;
        
        // Calculate path for expense slice  
        const expenseStartAngle = incomeAngle;
        const expenseStartX = centerX + radius * Math.cos((expenseStartAngle - 90) * Math.PI / 180);
        const expenseStartY = centerY + radius * Math.sin((expenseStartAngle - 90) * Math.PI / 180);
        
        const expenseArc = expenseAngle > 180 ? 1 : 0;
        const expensePath = `M ${centerX} ${centerY} L ${expenseStartX} ${expenseStartY} A ${radius} ${radius} 0 ${expenseArc} 1 ${centerX} ${centerY - radius} Z`;
        
        return `
            <svg width="200" height="200" viewBox="0 0 200 200">
                <path d="${incomePath}" fill="#28a745" stroke="white" stroke-width="2"/>
                <path d="${expensePath}" fill="#dc3545" stroke="white" stroke-width="2"/>
                <text x="100" y="190" text-anchor="middle" font-size="12" font-family="Arial">
                    <tspan fill="#28a745">■</tspan> Income ${incomePercent.toFixed(1)}% 
                    <tspan fill="#dc3545">■</tspan> Expenses ${expensePercent.toFixed(1)}%
                </text>
            </svg>
        `;
    }

    generateBarChartSVG(expensesByCategory) {
        const categories = Object.entries(expensesByCategory).sort(([,a], [,b]) => b - a).slice(0, 6);
        if (categories.length === 0) return '<p style="color: #666;">No expense data</p>';
        
        const maxAmount = Math.max(...categories.map(([,amount]) => amount));
        const chartWidth = 180;
        const chartHeight = 120;
        const barWidth = chartWidth / categories.length - 10;
        const maxBarHeight = 80;
        
        let bars = '';
        let labels = '';
        
        categories.forEach(([category, amount], index) => {
            const barHeight = (amount / maxAmount) * maxBarHeight;
            const x = 10 + index * (barWidth + 10);
            const y = chartHeight - barHeight - 20;
            
            const color = `hsl(${index * 60}, 70%, 50%)`;
            
            bars += `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="${color}" stroke="white" stroke-width="1"/>`;
            
            // Add amount label on top of bar
            bars += `<text x="${x + barWidth/2}" y="${y - 5}" text-anchor="middle" font-size="8" font-family="Arial">${this.formatCurrency(amount).replace(/[₹$€£¥]/g, '')}</text>`;
            
            // Add category label at bottom
            const categoryLabel = this.getCategoryLabel(category).substring(0, 6);
            labels += `<text x="${x + barWidth/2}" y="${chartHeight - 5}" text-anchor="middle" font-size="9" font-family="Arial">${categoryLabel}</text>`;
        });
        
        return `
            <svg width="200" height="140" viewBox="0 0 200 140">
                ${bars}
                ${labels}
            </svg>
        `;
    }

    async generateBudgetReportHTML(income, expenses, balance, incomeByCategory, expensesByCategory, advice) {
        const currentDate = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        // Get all individual transactions
        const incomeTransactions = this.state.transactions
            .filter(t => t.type === 'income')
            .sort((a, b) => new Date(b.date) - new Date(a.date));
            
        const expenseTransactions = this.state.transactions
            .filter(t => t.type === 'expense')
            .sort((a, b) => new Date(b.date) - new Date(a.date));
        
        const incomeList = incomeTransactions
            .map(transaction => `
                <tr>
                    <td style="padding: 6px 8px; border-bottom: 1px solid #f0f0f0; font-size: 13px;">
                        ${this.getCategoryEmoji(transaction.category)} ${transaction.description}
                    </td>
                    <td style="padding: 6px 8px; border-bottom: 1px solid #f0f0f0; text-align: center; font-size: 12px; color: #666;">
                        ${this.getCategoryLabel(transaction.category)}
                    </td>
                    <td style="padding: 6px 8px; border-bottom: 1px solid #f0f0f0; text-align: center; font-size: 12px; color: #666;">
                        ${new Date(transaction.date).toLocaleDateString()}
                    </td>
                    <td style="padding: 6px 8px; border-bottom: 1px solid #f0f0f0; text-align: right; font-family: 'Courier New', monospace; font-size: 13px; color: #059669; font-weight: 600;">
                        ${this.formatCurrency(transaction.amount)}
                    </td>
                </tr>
            `).join('');
            
        const expensesList = expenseTransactions
            .map(transaction => `
                <tr>
                    <td style="padding: 6px 8px; border-bottom: 1px solid #f0f0f0; font-size: 13px;">
                        ${this.getCategoryEmoji(transaction.category)} ${transaction.description}
                    </td>
                    <td style="padding: 6px 8px; border-bottom: 1px solid #f0f0f0; text-align: center; font-size: 12px; color: #666;">
                        ${this.getCategoryLabel(transaction.category)}
                    </td>
                    <td style="padding: 6px 8px; border-bottom: 1px solid #f0f0f0; text-align: center; font-size: 12px; color: #666;">
                        ${new Date(transaction.date).toLocaleDateString()}
                    </td>
                    <td style="padding: 6px 8px; border-bottom: 1px solid #f0f0f0; text-align: right; font-family: 'Courier New', monospace; font-size: 13px; color: #dc2626; font-weight: 600;">
                        ${this.formatCurrency(transaction.amount)}
                    </td>
                </tr>
            `).join('');
            
        const pieChartData = this.generatePieChartDataURL(income, expenses);
        const expenseChartData = this.generateExpenseChartDataURL(expensesByCategory);
        
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    @page {
                        size: A4;
                        margin: 0.75in;
                    }
                    body { 
                        font-family: Arial, sans-serif; 
                        line-height: 1.4; 
                        color: #333; 
                        margin: 0; 
                        padding: 0;
                        font-size: 12px;
                    }
                    .page {
                        width: 100%;
                        max-width: 8.5in;
                        margin: 0 auto;
                        page-break-after: always;
                    }
                    .page:last-child {
                        page-break-after: avoid;
                    }
                    .header { 
                        text-align: center; 
                        margin-bottom: 30px; 
                        padding: 20px 0;
                        border-bottom: 2px solid #3b82f6;
                    }
                    .header h1 { 
                        font-size: 28px; 
                        color: #3b82f6; 
                        margin: 0 0 10px 0; 
                        font-weight: bold;
                    }
                    .header p { 
                        color: #666; 
                        margin: 5px 0; 
                        font-size: 14px;
                    }
                    .summary-box {
                        background: #f8f9fa;
                        padding: 20px;
                        border-radius: 8px;
                        margin: 20px 0;
                        border: 1px solid #dee2e6;
                        text-align: center;
                    }
                    .summary-stats {
                        display: flex;
                        justify-content: space-around;
                        margin: 15px 0;
                    }
                    .stat-item {
                        text-align: center;
                    }
                    .stat-value {
                        font-size: 18px;
                        font-weight: bold;
                        font-family: 'Courier New', monospace;
                    }
                    .stat-income { color: #28a745; }
                    .stat-expense { color: #dc3545; }
                    .stat-balance { color: #007bff; }
                    .stat-label {
                        font-size: 11px;
                        color: #666;
                        margin-top: 5px;
                    }
                    .charts-container {
                        display: flex;
                        justify-content: space-between;
                        margin: 20px 0;
                        gap: 20px;
                    }
                    .chart-box {
                        flex: 1;
                        text-align: center;
                        background: white;
                        padding: 15px;
                        border: 1px solid #dee2e6;
                        border-radius: 8px;
                    }
                    .chart-title {
                        font-weight: bold;
                        margin-bottom: 10px;
                        color: #333;
                        font-size: 13px;
                    }
                    .transactions-section {
                        margin-top: 30px;
                    }
                    .section-title {
                        background: #3b82f6;
                        color: white;
                        padding: 10px 15px;
                        margin: 20px 0 10px 0;
                        font-weight: bold;
                        font-size: 14px;
                        border-radius: 5px;
                    }
                    table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        margin-bottom: 20px;
                        font-size: 11px;
                    }
                    th { 
                        background: #f8f9fa; 
                        color: #333; 
                        padding: 8px; 
                        text-align: left; 
                        font-weight: bold;
                        border: 1px solid #dee2e6;
                        font-size: 11px;
                    }
                    td {
                        border: 1px solid #dee2e6;
                    }
                    .total-row { 
                        background: #e9ecef; 
                        font-weight: bold; 
                    }
                    .balance-section { 
                        text-align: center; 
                        padding: 20px; 
                        margin: 30px 0;
                        border-radius: 8px;
                        font-size: 16px;
                        font-weight: bold;
                    }
                    .balance-positive { 
                        background: #d4edda; 
                        color: #155724; 
                        border: 2px solid #28a745;
                    }
                    .balance-negative { 
                        background: #f8d7da; 
                        color: #721c24; 
                        border: 2px solid #dc3545;
                    }
                    .advice-section { 
                        background: #fff3cd; 
                        border: 1px solid #ffeaa7; 
                        border-radius: 8px; 
                        padding: 15px;
                        margin: 20px 0;
                    }
                    .advice-title { 
                        color: #856404; 
                        margin: 0 0 10px 0;
                        font-weight: bold;
                        font-size: 14px;
                    }
                    .advice-list { 
                        margin: 0; 
                        padding-left: 20px;
                        font-size: 12px;
                    }
                    .advice-list li { 
                        margin-bottom: 5px;
                        line-height: 1.4;
                    }
                    .footer { 
                        text-align: center; 
                        margin-top: 30px; 
                        padding-top: 15px; 
                        border-top: 1px solid #dee2e6; 
                        color: #666; 
                        font-size: 10px;
                    }
                    .income-row { color: #28a745; }
                    .expense-row { color: #dc3545; }
                </style>
            </head>
            <body>
                <div class="page">
                    <!-- Title Page -->
                    <div class="header">
                        <h1>📊 Spendora</h1>
                        <p><strong>Personal Budget Report</strong></p>
                        <p>spendora.eknath.dev</p>
                        <p>Generated on ${currentDate}</p>
                    </div>
                    
                    <!-- Summary Statistics -->
                    <div class="summary-box">
                        <div class="summary-stats">
                            <div class="stat-item">
                                <div class="stat-value stat-income">${this.formatCurrency(income)}</div>
                                <div class="stat-label">Total Income</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-value stat-expense">${this.formatCurrency(expenses)}</div>
                                <div class="stat-label">Total Expenses</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-value stat-balance">${this.formatCurrency(balance)}</div>
                                <div class="stat-label">Net Balance</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Charts -->
                    <div class="charts-container">
                        <div class="chart-box">
                            <div class="chart-title">Income vs Expenses</div>
                            ${pieChartData ? `<img src="${pieChartData}" alt="Pie Chart" style="width: 200px; height: 200px;">` : '<p>No data available</p>'}
                        </div>
                        ${Object.keys(expensesByCategory).length > 0 ? `
                        <div class="chart-box">
                            <div class="chart-title">Expense Categories</div>
                            ${expenseChartData ? `<img src="${expenseChartData}" alt="Bar Chart" style="width: 200px; height: 150px;">` : '<p>No expense data</p>'}
                        </div>
                        ` : ''}
                    </div>
                    
                    <!-- Balance Status -->
                    <div class="balance-section ${balance >= 0 ? 'balance-positive' : 'balance-negative'}">
                        ${balance >= 0 ? '✅' : '⚠️'} Net Balance: ${this.formatCurrency(balance)}
                        <div style="font-size: 12px; margin-top: 8px; font-weight: normal;">
                            ${balance >= 0 ? 'Congratulations! You have a positive balance.' : 'Attention: Expenses exceed income.'}
                        </div>
                    </div>
                </div>
                
                <!-- Income Transactions Page -->
                ${incomeTransactions.length > 0 ? `
                <div class="page">
                    <div class="section-title">💰 All Income Transactions (${incomeTransactions.length} transactions)</div>
                    <table>
                        <thead>
                            <tr>
                                <th style="width: 35%;">Description</th>
                                <th style="width: 20%;">Category</th>
                                <th style="width: 15%;">Date</th>
                                <th style="width: 20%; text-align: right;">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${incomeList}
                            <tr class="total-row">
                                <td style="padding: 8px; font-weight: bold;" colspan="3">Total Income</td>
                                <td style="padding: 8px; text-align: right; font-family: 'Courier New', monospace; font-weight: bold; color: #28a745;">
                                    ${this.formatCurrency(income)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                ` : ''}
                
                <!-- Expense Transactions Page -->
                ${expenseTransactions.length > 0 ? `
                <div class="page">
                    <div class="section-title">💸 All Expense Transactions (${expenseTransactions.length} transactions)</div>
                    <table>
                        <thead>
                            <tr>
                                <th style="width: 35%;">Description</th>
                                <th style="width: 20%;">Category</th>
                                <th style="width: 15%;">Date</th>
                                <th style="width: 20%; text-align: right;">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${expensesList}
                            <tr class="total-row">
                                <td style="padding: 8px; font-weight: bold;" colspan="3">Total Expenses</td>
                                <td style="padding: 8px; text-align: right; font-family: 'Courier New', monospace; font-weight: bold; color: #dc3545;">
                                    ${this.formatCurrency(expenses)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                ` : ''}
                
                <!-- Advice Page -->
                <div class="page">
                    <div class="advice-section">
                        <h3 class="advice-title">💡 Financial Insights & Recommendations</h3>
                        <ul class="advice-list">
                            ${advice.map(tip => `<li>${tip}</li>`).join('')}
                        </ul>
                    </div>
                    
                    <div class="footer">
                        <p><strong>This report was generated by Spendora - Your Personal Budget Tracker</strong></p>
                        <p>Visit spendora.eknath.dev for more financial management tools</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    generatePieChartDataURL(income, expenses) {
        if (income === 0 && expenses === 0) return null;
        
        try {
            // Simple canvas-based pie chart
            const canvas = document.createElement('canvas');
            canvas.width = 300;
            canvas.height = 300;
            const ctx = canvas.getContext('2d');
            
            const total = income + expenses;
            const incomeAngle = (income / total) * 2 * Math.PI;
            
            const centerX = 150;
            const centerY = 150;
            const radius = 120;
            
            // Draw income slice
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, 0, incomeAngle);
            ctx.closePath();
            ctx.fillStyle = '#10b981';
            ctx.fill();
            
            // Draw expense slice
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, incomeAngle, 2 * Math.PI);
            ctx.closePath();
            ctx.fillStyle = '#ef4444';
            ctx.fill();
            
            // Add labels
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            
            if (income > 0) {
                const incomeX = centerX + Math.cos(incomeAngle / 2) * (radius / 2);
                const incomeY = centerY + Math.sin(incomeAngle / 2) * (radius / 2);
                ctx.fillText('Income', incomeX, incomeY);
            }
            
            if (expenses > 0) {
                const expenseAngle = incomeAngle + (2 * Math.PI - incomeAngle) / 2;
                const expenseX = centerX + Math.cos(expenseAngle) * (radius / 2);
                const expenseY = centerY + Math.sin(expenseAngle) * (radius / 2);
                ctx.fillText('Expenses', expenseX, expenseY);
            }
            
            return canvas.toDataURL();
        } catch (error) {
            console.error('Error generating pie chart:', error);
            return null;
        }
    }

    generateExpenseChartDataURL(expensesByCategory) {
        const categories = Object.entries(expensesByCategory);
        if (categories.length === 0) return null;
        
        try {
            const canvas = document.createElement('canvas');
            canvas.width = 300;
            canvas.height = 200;
            const ctx = canvas.getContext('2d');
            
            const maxAmount = Math.max(...categories.map(([,amount]) => amount));
            const barWidth = 280 / categories.length;
            const maxBarHeight = 140;
            
            categories.forEach(([category, amount], index) => {
                const barHeight = (amount / maxAmount) * maxBarHeight;
                const x = 10 + index * barWidth;
                const y = 160 - barHeight;
                
                // Draw bar
                ctx.fillStyle = `hsl(${index * 360 / categories.length}, 70%, 50%)`;
                ctx.fillRect(x, y, barWidth - 5, barHeight);
                
                // Add amount label
                ctx.fillStyle = '#1a1a1a';
                ctx.font = '10px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(
                    this.formatCurrency(amount).replace(/[₹$€£¥]/g, ''),
                    x + barWidth / 2,
                    y - 5
                );
                
                // Add category label
                ctx.save();
                ctx.translate(x + barWidth / 2, 180);
                ctx.rotate(-Math.PI / 4);
                ctx.fillText(this.getCategoryLabel(category).substring(0, 8), 0, 0);
                ctx.restore();
            });
            
            return canvas.toDataURL();
        } catch (error) {
            console.error('Error generating expense chart:', error);
            return null;
        }
    }

    toggleTooltips() {
        this.state.tooltipsEnabled = !this.state.tooltipsEnabled;
        
        try {
            localStorage.setItem('tooltipsEnabled', this.state.tooltipsEnabled);
        } catch (error) {
            console.error('Failed to save tooltip setting:', error);
        }
        
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

    setupTransactionEventDelegation() {
        // Remove existing delegation if any
        if (this.elements.transactionList && this.handleTransactionClick) {
            this.elements.transactionList.removeEventListener('click', this.handleTransactionClick);
        }
        
        // Add event delegation for transaction buttons
        this.handleTransactionClick = (e) => {
            // Check for direct button click or icon click inside button
            const button = e.target.closest('[data-action]') || e.target.closest('button[data-action]');
            if (!button) return;
            
            e.preventDefault();
            e.stopPropagation();
            
            const action = button.dataset.action;
            const id = button.dataset.id;
            
            console.log('Transaction action:', action, 'ID:', id, 'Type:', typeof id);
            console.log('Button element:', button);
            console.log('Button datasets:', button.dataset);
            console.log('Event target:', e.target);
            
            if (!id) {
                console.error('No ID found on button:', button);
                console.error('Button HTML:', button.outerHTML);
                this.showSnackbar('Error: Transaction ID not found', 'error');
                return;
            }
            
            if (action === 'edit') {
                this.editTransaction(id);
            } else if (action === 'delete') {
                this.showDeleteConfirmation(id);
            } else {
                console.error('Unknown action:', action);
            }
        };
        
        if (this.elements.transactionList) {
            this.elements.transactionList.addEventListener('click', this.handleTransactionClick);
            console.log('Event delegation setup for transaction list');
        } else {
            console.error('Transaction list element not found for event delegation');
        }
    }

    showDeleteConfirmation(id) {
        console.log('Showing delete confirmation for ID:', id, 'Type:', typeof id);
        
        // Handle both string and number IDs
        const transaction = this.state.transactions.find(t => t.id == id || t.id === id);
        if (!transaction) {
            console.error('Transaction not found for delete confirmation. ID:', id);
            console.error('Available transactions:', this.state.transactions.map(t => ({id: t.id, desc: t.description})));
            this.showSnackbar('Transaction not found. Please refresh the page.', 'error');
            return;
        }

        // Create modern confirmation dialog
        const modal = document.createElement('div');
        modal.className = 'delete-confirmation-modal';
        modal.innerHTML = `
            <div class="modal-backdrop">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="bi bi-exclamation-triangle text-warning me-2"></i>
                            Confirm Delete
                        </h5>
                    </div>
                    <div class="modal-body">
                        <p>Are you sure you want to delete this transaction?</p>
                        <div class="transaction-preview">
                            <strong>${transaction.description}</strong><br>
                            <span class="text-muted">
                                ${this.formatCurrency(transaction.amount)} • 
                                ${new Date(transaction.date).toLocaleDateString()}
                            </span>
                        </div>
                        <p class="text-warning small mt-2">
                            <i class="bi bi-info-circle me-1"></i>
                            This action cannot be undone.
                        </p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary cancel-btn">Cancel</button>
                        <button type="button" class="btn btn-danger confirm-btn">
                            <i class="bi bi-trash me-1"></i>Delete
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        
        // Add event listeners
        const cancelBtn = modal.querySelector('.cancel-btn');
        const confirmBtn = modal.querySelector('.confirm-btn');
        const backdrop = modal.querySelector('.modal-backdrop');

        const closeModal = () => {
            modal.classList.add('closing');
            setTimeout(() => {
                if (modal.parentNode) {
                    modal.parentNode.removeChild(modal);
                }
            }, 200);
        };

        cancelBtn.addEventListener('click', closeModal);
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) closeModal();
        });
        
        confirmBtn.addEventListener('click', () => {
            this.deleteTransaction(id);
            closeModal();
        });

        // Show modal with animation
        setTimeout(() => modal.classList.add('show'), 10);
        
        // Focus management
        confirmBtn.focus();
        
        // Keyboard handling
        const handleKeydown = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', handleKeydown);
            }
        };
        document.addEventListener('keydown', handleKeydown);
    }

    showLoading(show) {
        if (show) {
            document.body.classList.add('loading');
        } else {
            document.body.classList.remove('loading');
        }
    }

    showCriticalError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'critical-error';
        errorDiv.innerHTML = `
            <div class="critical-error-content">
                <i class="bi bi-exclamation-triangle-fill text-danger" style="font-size: 2rem;"></i>
                <h3>Application Error</h3>
                <p>${message}</p>
                <button onclick="location.reload()" class="btn btn-primary">Refresh Page</button>
            </div>
        `;
        errorDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            color: white;
            text-align: center;
        `;
        document.body.appendChild(errorDiv);
    }

    setupCategoryFilters() {
        const categoryFiltersContainer = document.getElementById('category-filters');
        if (!categoryFiltersContainer) return;

        // Get unique categories from transactions
        const categories = new Set();
        this.state.transactions.forEach(transaction => {
            if (transaction.category) {
                categories.add(transaction.category);
            }
        });

        // Create filter tags
        const filterHTML = [
            '<span class="category-filter-tag active" data-category="all">All Categories</span>',
            ...Array.from(categories).map(category => {
                const emoji = this.getCategoryEmoji(category);
                const label = this.getCategoryLabel(category);
                return `<span class="category-filter-tag" data-category="${category}">${emoji} ${label}</span>`;
            })
        ].join('');

        categoryFiltersContainer.innerHTML = filterHTML;

        // Add click handlers
        categoryFiltersContainer.addEventListener('click', (e) => {
            const tag = e.target.closest('.category-filter-tag');
            if (tag) {
                this.filterByCategory(tag.dataset.category);
            }
        });
    }

    filterByCategory(category) {
        this.state.currentCategoryFilter = category;
        this.renderTransactions();
        this.updateCategoryFilterUI();
        
        const filterLabel = category === 'all' ? 'All Categories' : this.getCategoryLabel(category);
        this.showSnackbar(`Category filter: ${filterLabel}`, 'info');
    }

    updateCategoryFilterUI() {
        const tags = document.querySelectorAll('.category-filter-tag');
        tags.forEach(tag => {
            if (tag.dataset.category === this.state.currentCategoryFilter) {
                tag.classList.add('active');
            } else {
                tag.classList.remove('active');
            }
        });
    }

    getCategoryLabel(category) {
        if (!this.state.transactionTypes) return category;
        
        const incomeType = this.state.transactionTypes.income.types.find(t => t.value === category);
        if (incomeType) return incomeType.label.replace(/^\p{Emoji}\s*/u, '');
        
        const expenseType = this.state.transactionTypes.expense.types.find(t => t.value === category);
        if (expenseType) return expenseType.label.replace(/^\p{Emoji}\s*/u, '');
        
        return category;
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Only handle shortcuts when not typing in input fields
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
                return;
            }
            
            // Ctrl/Cmd + key shortcuts
            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 'n': // New transaction
                        e.preventDefault();
                        this.elements.transactionForm.querySelector('#description').focus();
                        this.showSnackbar('Keyboard shortcut: New transaction', 'info');
                        break;
                    case 'e': // Export data
                        e.preventDefault();
                        this.exportData();
                        break;
                    case 's': // Focus search
                        e.preventDefault();
                        this.elements.searchInput?.focus();
                        this.showSnackbar('Keyboard shortcut: Search', 'info');
                        break;
                    case 'd': // Download summary
                        e.preventDefault();
                        this.downloadSummary();
                        break;
                }
            }
            
            // Single key shortcuts
            switch (e.key.toLowerCase()) {
                case 'i': // Toggle income filter
                    const incomeFilter = document.getElementById('income-filter');
                    if (incomeFilter) {
                        incomeFilter.checked = true;
                        this.filterTransactions('income');
                    }
                    break;
                case 'o': // Toggle expense filter
                    const expenseFilter = document.getElementById('expense-filter');
                    if (expenseFilter) {
                        expenseFilter.checked = true;
                        this.filterTransactions('expense');
                    }
                    break;
                case 'a': // Show all transactions
                    const allFilter = document.getElementById('all-transactions');
                    if (allFilter) {
                        allFilter.checked = true;
                        this.filterTransactions('all');
                    }
                    break;
                case 't': // Toggle tooltips
                    this.toggleTooltips();
                    break;
                case '?': // Show help
                    this.showKeyboardShortcutsHelp();
                    break;
                case 'escape': // Clear search and filters
                    if (this.elements.searchInput) {
                        this.elements.searchInput.value = '';
                        this.state.currentSearchTerm = '';
                    }
                    this.state.currentFilter = 'all';
                    this.state.currentCategoryFilter = 'all';
                    document.getElementById('all-transactions').checked = true;
                    this.renderTransactions();
                    this.updateFilterUI();
                    this.updateCategoryFilterUI();
                    this.showSnackbar('Cleared all filters and search', 'info');
                    break;
            }
        });
    }

    showKeyboardShortcutsHelp() {
        const modal = document.createElement('div');
        modal.className = 'keyboard-shortcuts-modal';
        modal.innerHTML = `
            <div class="modal-backdrop">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="bi bi-keyboard me-2"></i>
                            Keyboard Shortcuts
                        </h5>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-6">
                                <h6>General</h6>
                                <ul class="list-unstyled small">
                                    <li><kbd>Ctrl/Cmd + N</kbd> - New transaction</li>
                                    <li><kbd>Ctrl/Cmd + S</kbd> - Focus search</li>
                                    <li><kbd>Ctrl/Cmd + E</kbd> - Export data</li>
                                    <li><kbd>Ctrl/Cmd + D</kbd> - Download summary</li>
                                    <li><kbd>T</kbd> - Toggle tooltips</li>
                                    <li><kbd>Esc</kbd> - Clear filters</li>
                                </ul>
                            </div>
                            <div class="col-md-6">
                                <h6>Filters</h6>
                                <ul class="list-unstyled small">
                                    <li><kbd>A</kbd> - Show all transactions</li>
                                    <li><kbd>I</kbd> - Show income only</li>
                                    <li><kbd>O</kbd> - Show expenses only</li>
                                    <li><kbd>?</kbd> - Show this help</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary close-btn">Close</button>
                    </div>
                </div>
            </div>
        `;
        
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 9999;
            opacity: 0;
            transition: opacity 300ms ease;
        `;
        
        document.body.appendChild(modal);
        
        const closeModal = () => {
            modal.style.opacity = '0';
            setTimeout(() => {
                if (modal.parentNode) {
                    modal.parentNode.removeChild(modal);
                }
            }, 300);
        };
        
        modal.querySelector('.close-btn').addEventListener('click', closeModal);
        modal.querySelector('.modal-backdrop').addEventListener('click', (e) => {
            if (e.target === modal.querySelector('.modal-backdrop')) closeModal();
        });
        
        // Show modal
        setTimeout(() => modal.style.opacity = '1', 10);
        
        // Close on Escape
        const handleKeydown = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', handleKeydown);
            }
        };
        document.addEventListener('keydown', handleKeydown);
    }
}

// Initialize the application
let budgetTracker;
document.addEventListener('DOMContentLoaded', () => {
    budgetTracker = new BudgetTracker();
    
    // Add hover effects for transaction actions
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