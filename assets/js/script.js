
class BudgetTracker {
    constructor() {
        console.log('Initializing BudgetTracker...');
        this.setupContinuousAnimation();
        this.detectPage();
        this.initializeChoiceDialog();
        this.initializeElements();
        this.initializeState();
        this.bindEvents();
        this.setupStorageListener();
        this.initializeMobileMenu();
        this.setupDebugShortcuts();
        this.initialize();
    }

    initializeChoiceDialog() {
        // Check if user has already made a choice
        const userChoice = localStorage.getItem('dhanika-user-choice');
        
        if (!userChoice) {
            // Show the choice modal
            this.showChoiceModal();
        } else if (userChoice === 'dhanika-plus') {
            // If user previously chose Dhanika+, redirect immediately
            this.redirectToDhanikaPlus();
            return;
        }
        // If userChoice === 'local', continue with normal initialization
    }

    showChoiceModal() {
        const modal = document.getElementById('choice-modal');
        const continueLocalBtn = document.getElementById('continue-local');
        const goToDhanikaPlusBtn = document.getElementById('go-to-dhanika-plus');
        const localOption = document.getElementById('local-option');
        const cloudOption = document.getElementById('cloud-option');

        if (!modal) return;

        // Add click handlers for option cards
        localOption?.addEventListener('click', () => {
            this.selectOption('local');
        });

        cloudOption?.addEventListener('click', () => {
            this.selectOption('cloud');
        });

        // Add click handlers for buttons
        continueLocalBtn?.addEventListener('click', () => {
            this.chooseLocal();
        });

        goToDhanikaPlusBtn?.addEventListener('click', () => {
            this.chooseDhanikaPlus();
        });

        // Prevent clicks on the modal content from closing the modal
        modal.querySelector('.modal-content')?.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // Show the modal
        modal.classList.add('show');
    }

    selectOption(type) {
        const localOption = document.getElementById('local-option');
        const cloudOption = document.getElementById('cloud-option');

        // Remove previous selections
        localOption?.classList.remove('selected');
        cloudOption?.classList.remove('selected');

        // Add selection to chosen option
        if (type === 'local') {
            localOption?.classList.add('selected');
        } else {
            cloudOption?.classList.add('selected');
        }
    }

    chooseLocal() {
        // Save choice to localStorage
        localStorage.setItem('dhanika-user-choice', 'local');
        
        // Hide the modal
        this.hideChoiceModal();
        
        // Show a welcome message
        setTimeout(() => {
            this.showSnackbar('Welcome to Dhanika Local! Your data stays private on your device.', 'success');
        }, 500);
    }

    chooseDhanikaPlus() {
        // Save choice to localStorage
        localStorage.setItem('dhanika-user-choice', 'dhanika-plus');
        
        // Redirect immediately
        this.redirectToDhanikaPlus();
    }

    redirectToDhanikaPlus() {
        window.location.href = 'https://dhanikaplus.eknath.dev';
    }

    hideChoiceModal() {
        const modal = document.getElementById('choice-modal');
        if (modal) {
            modal.classList.add('closing');
            setTimeout(() => {
                modal.classList.remove('show', 'closing');
            }, 300);
        }
    }

    showSnackbar(message, type = 'info', duration = 5000) {
        const snackbar = document.getElementById('snackbar');
        if (!snackbar) return;

        // Clear any existing timeout
        if (this.snackbarTimeout) {
            clearTimeout(this.snackbarTimeout);
        }

        // Set message and type
        snackbar.innerHTML = `
            <span>${message}</span>
            <button class="snackbar-close" onclick="this.parentElement.classList.remove('show')">&times;</button>
        `;
        
        // Remove existing type classes
        snackbar.className = 'snackbar';
        
        // Add new type class
        if (type) {
            snackbar.classList.add(type);
        }
        
        // Show snackbar
        snackbar.classList.add('show');
        
        // Auto hide after duration
        this.snackbarTimeout = setTimeout(() => {
            snackbar.classList.remove('show');
        }, duration);
    }

    // Method to reset user choice (useful for testing or if user wants to switch)
    resetUserChoice() {
        localStorage.removeItem('dhanika-user-choice');
        console.log('User choice reset. Reload the page to see the choice dialog again.');
        this.showSnackbar('Choice reset successfully. Reload the page to choose again.', 'info');
    }

    // Add keyboard shortcut to reset choice (Ctrl+Shift+R)
    setupDebugShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'R') {
                e.preventDefault();
                this.resetUserChoice();
            }
        });
    }


    setupContinuousAnimation() {
        try {
            // Get or create animation start time for continuous flow across pages
            const animationKey = 'dhanika-animation-start';
            let animationStartTime = localStorage.getItem(animationKey);
            
            if (!animationStartTime) {
                animationStartTime = Date.now();
                localStorage.setItem(animationKey, animationStartTime);
            } else {
                animationStartTime = parseInt(animationStartTime);
            }
            
            // Calculate elapsed time and animation delay
            const elapsed = Date.now() - animationStartTime;
            const animationDuration = 20000; // 20 seconds in milliseconds
            const currentPhase = elapsed % animationDuration;
            const delay = -currentPhase; // Negative delay to start from current position
            
            // Apply the calculated delay to maintain continuous animation
            requestAnimationFrame(() => {
                const animatedBrand = document.querySelector('.animated-brand');
                const animatedGlow = document.querySelector('.animated-brand::after');
                
                if (animatedBrand) {
                    animatedBrand.style.animationDelay = `${delay}ms`;
                }
                
                // Apply to pseudo-element through CSS custom property
                document.documentElement.style.setProperty('--animation-delay', `${delay}ms`);
            });
            
            console.log('Continuous animation setup:', {
                startTime: new Date(animationStartTime).toLocaleTimeString(),
                elapsed: elapsed,
                currentPhase: currentPhase,
                delay: delay
            });
        } catch (error) {
            console.error('Error setting up continuous animation:', error);
        }
    }

    detectPage() {
        try {
            this.isTransactionsPage = window.location.pathname.includes('/transactions/');
            console.log('Page detection:', {
                pathname: window.location.pathname,
                isTransactionsPage: this.isTransactionsPage,
                pageType: this.isTransactionsPage ? 'Transactions' : 'Dashboard'
            });
        } catch (error) {
            console.error('Error in detectPage:', error);
            this.isTransactionsPage = false;
        }
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
            categorySubtypeButtons: document.querySelectorAll('input[name="category-subtype"]'),
            categorySubtypeSelector: document.getElementById('category-subtype-selector'),
            emptyChartMessage: document.getElementById('empty-chart-message'),
            emptyTransactionMessage: document.getElementById('empty-transaction-message'),
            snackbar: document.getElementById('snackbar'),
            searchInput: document.getElementById('transaction-search'),
            freshStartBtn: document.getElementById('fresh-start-btn'),
            tagsInput: document.getElementById('tags'),
            tagsSuggestions: document.getElementById('tags-suggestions'),
            tagsChips: document.getElementById('tags-chips'),
            clearTagsBtn: document.getElementById('clear-tags-btn'),
            monthlyTransactionList: document.getElementById('monthly-transaction-list'),
            monthlyFilterButtons: document.querySelectorAll('input[name="monthly-filter"]'),
            monthlySearchInput: document.getElementById('monthly-transaction-search'),
            emptyMonthlyMessage: document.getElementById('empty-monthly-message'),
            monthlyCategoryFilters: document.getElementById('monthly-category-filters'),
            timeFilter: document.getElementById('time-filter'),
            transactionCount: document.getElementById('transaction-count'),
            sortFilter: document.getElementById('sort-filter'),
            clearSearch: document.getElementById('clear-search'),
            selectAll: document.getElementById('select-all'),
            bulkActions: document.getElementById('bulk-actions'),
            selectedCount: document.getElementById('selected-count'),
            bulkDelete: document.getElementById('bulk-delete'),
            clearSelection: document.getElementById('clear-selection'),
            showingInfo: document.getElementById('showing-info'),
            listHeader: document.getElementById('list-header')
        };
        
        this.budgetChart = this.elements.budgetChartCanvas?.getContext('2d');
    }

    setupStorageListener() {
        // Listen for storage changes from other tabs/pages
        window.addEventListener('storage', (e) => {
            if (e.key === 'transactions') {
                console.log('Transactions updated in another tab, refreshing...');
                try {
                    // Update local state with new data
                    this.state.transactions = e.newValue ? JSON.parse(e.newValue) : [];
                    
                    // Refresh all displays
                    this.renderTransactions();
                    if (!this.isTransactionsPage) {
                        this.renderMonthlyTransactions();
                        this.updateChart();
                    }
                    this.updateSummary();
                    this.setupCategoryFilters();
                    
                    if (this.isTransactionsPage) {
                        this.updateTransactionCount();
                        this.showListHeader();
                    }
                    
                    this.showSnackbar('Data updated from another tab', 'info');
                } catch (error) {
                    console.error('Error handling storage update:', error);
                }
            }
        });
    }

    async initializeState() {
        // Load from localStorage or use defaults
        const transactions = JSON.parse(localStorage.getItem('transactions')) || this.createSampleTransactions();
        const tooltipsEnabled = localStorage.getItem('tooltipsEnabled') !== 'false';
        const selectedCurrency = localStorage.getItem('selectedCurrency') || 'INR';
        const selectedCurrencySymbol = localStorage.getItem('selectedCurrencySymbol') || '₹';
        
        this.state = {
            transactions,
            chart: null,
            editingTransactionId: null,
            transactionTypes: null,
            currentFilter: 'all',
            currentCategoryFilter: 'all',
            currentSearchTerm: '',
            currentMonthlyFilter: 'all',
            currentMonthlyCategoryFilter: 'all',
            currentMonthlySearchTerm: '',
            currentChartType: 'overview',
            currentCategorySubtype: 'expense',
            tooltipConfig: {},
            tooltipsEnabled,
            activeTooltipInstances: [],
            currentActiveTooltip: null,
            currentCurrency: selectedCurrency,
            currentCurrencySymbol: selectedCurrencySymbol,
            currentTimeFilter: this.isTransactionsPage ? 'all' : 'this-month',
            currentSortFilter: 'date-desc'
        };

        // Initialize edit modal tags array
        this.editModalTags = [];
    }

    createSampleTransactions() {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        const sampleTransactions = [
            // Income examples
            {
                id: String(new Date(currentYear, currentMonth, 1, 9, 0).getTime()),
                type: 'income',
                description: 'Monthly Salary',
                amount: 75000,
                category: 'salary',
                tags: 'regular, monthly',
                date: new Date(currentYear, currentMonth, 1, 9, 0).toISOString()
            },
            // ... (rest of the sample transactions)
        ];
        
        return sampleTransactions;
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
        this.elements.freshStartBtn?.addEventListener('click', () => this.handleFreshStart());
        this.elements.downloadBtn?.addEventListener('click', () => this.downloadSummary());
        this.elements.exportBtnHeader?.addEventListener('click', () => this.showExportModal());
        this.elements.importFileHeader?.addEventListener('change', (e) => this.handleFileSelect(e));
        this.elements.tooltipToggle?.addEventListener('click', () => this.toggleTooltips());
        
        // AI Prompt Generator
        const generatePromptBtn = document.getElementById('generate-prompt-btn');
        generatePromptBtn?.addEventListener('click', () => this.generateAdvicePrompt());

        const copyPromptBtn = document.getElementById('copy-prompt-btn');
        copyPromptBtn?.addEventListener('click', () => this.copyAdvicePrompt());

        // Help section toggle
        const helpToggle = document.getElementById('toggle-help-section');
        helpToggle?.addEventListener('click', () => this.toggleHelpSection());

        // Edit modal event listeners
        const saveEditBtn = document.getElementById('save-edit-transaction');
        saveEditBtn?.addEventListener('click', () => this.saveEditTransaction());

        const editTypeRadios = document.querySelectorAll('input[name="edit-type"]');
        editTypeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.populateEditCategories(e.target.value);
                }
            });
        });

        const editTagsInput = document.getElementById('edit-tags');
        editTagsInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.target.value.trim()) {
                e.preventDefault();
                this.addEditModalTag(e.target.value.trim());
            }
        });

        const editClearTagsBtn = document.getElementById('edit-clear-tags-btn');
        editClearTagsBtn?.addEventListener('click', () => this.clearEditModalTags());

        const editClearDateBtn = document.getElementById('edit-clear-date-btn');
        editClearDateBtn?.addEventListener('click', () => {
            document.getElementById('edit-date').value = new Date().toISOString().split('T')[0];
        });
        
        // Search input event binding with debugging
        if (this.elements.searchInput) {
            console.log('Search input found, binding events');
            this.elements.searchInput.addEventListener('input', (e) => this.handleSearchInput(e));
            this.elements.searchInput.addEventListener('keyup', (e) => this.handleSearchInput(e));
        } else {
            console.warn('Search input not found in DOM');
        }

        // Tags autocomplete event binding
        if (this.elements.tagsInput) {
            this.elements.tagsInput.addEventListener('input', (e) => this.handleTagsInput(e));
            this.elements.tagsInput.addEventListener('focus', (e) => this.showTagChipsAndSuggestions(e));
            this.elements.tagsInput.addEventListener('keydown', (e) => this.handleTagsKeydown(e));
            document.addEventListener('click', (e) => this.handleDocumentClick(e));
            
            // Initialize chips on page load
            this.updateTagChips();
            this.updateClearButton();
        }

        // Clear tags button event binding
        if (this.elements.clearTagsBtn) {
            this.elements.clearTagsBtn.addEventListener('click', () => this.clearAllTags());
        }

        // Date input change event binding
        const dateInput = document.getElementById('date');
        if (dateInput) {
            dateInput.addEventListener('change', () => this.updateDateTags());
            dateInput.addEventListener('input', () => this.updateDateTags());
        }

        // Clear date button event binding
        const clearDateBtn = document.getElementById('clear-date-btn');
        if (clearDateBtn) {
            clearDateBtn.addEventListener('click', () => this.clearDateToToday());
        }
        
        this.elements.filterButtons?.forEach(button => {
            button.addEventListener('change', (e) => this.filterTransactions(e.target.value));
        });
        
        // Monthly filter event binding
        this.elements.monthlyFilterButtons?.forEach(button => {
            button.addEventListener('change', (e) => this.filterMonthlyTransactions(e.target.value));
        });
        
        // Monthly search input event binding
        if (this.elements.monthlySearchInput) {
            this.elements.monthlySearchInput.addEventListener('input', (e) => this.handleMonthlySearchInput(e));
            this.elements.monthlySearchInput.addEventListener('keyup', (e) => this.handleMonthlySearchInput(e));
        }
        
        this.elements.chartTypeButtons?.forEach(button => {
            button.addEventListener('change', (e) => this.changeChartType(e.target.value));
        });
        
        this.elements.categorySubtypeButtons?.forEach(button => {
            button.addEventListener('change', (e) => this.changeCategorySubtype(e.target.value));
        });

        // Time filter dropdown event binding
        if (this.elements.timeFilter) {
            this.elements.timeFilter.addEventListener('change', (e) => this.handleTimeFilterChange(e.target.value));
        }

        // Sort filter dropdown event binding
        if (this.elements.sortFilter) {
            this.elements.sortFilter.addEventListener('change', (e) => this.handleSortFilterChange(e.target.value));
        }

        // Clear search button
        if (this.elements.clearSearch) {
            this.elements.clearSearch.addEventListener('click', () => this.clearSearch());
        }

        // Select all checkbox
        if (this.elements.selectAll) {
            this.elements.selectAll.addEventListener('change', (e) => this.handleSelectAll(e.target.checked));
        }

        // Bulk operations
        if (this.elements.bulkDelete) {
            this.elements.bulkDelete.addEventListener('click', () => this.handleBulkDelete());
        }

        if (this.elements.clearSelection) {
            this.elements.clearSelection.addEventListener('click', () => this.clearSelection());
        }

        document.querySelectorAll('.dropdown-item[data-currency]')?.forEach(item => {
            item.addEventListener('click', (e) => this.changeCurrency(e));
        });

        // Transaction type change event
        document.querySelectorAll('input[name="type"]')?.forEach(radio => {
            radio.addEventListener('change', () => this.populateCategories());
        });

        // Export/Import modal event listeners
        this.bindModalEvents();
    }

    saveTransactions() {
        localStorage.setItem('transactions', JSON.stringify(this.state.transactions));
    }

    // Essential missing methods for static site functionality
    async initialize() {
        await this.loadConfiguration();
        this.populateCategories();
        this.showEmptyStates();
        this.updateSummary();
        this.renderTransactions();
        this.renderMonthlyTransactions();
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

    async loadTransactionTypes() {
        try {
            const response = await fetch('assets/json/transaction-types.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.state.transactionTypes = await response.json();
            console.log('Transaction types loaded successfully');
        } catch (error) {
            console.log('Loading transaction types from fallback data (normal for file:// protocol)');
            // Fallback to basic types with proper structure
            this.state.transactionTypes = {
                income: {
                    label: "Income",
                    types: [
                        { value: "salary", label: "💼 Salary", emoji: "💼" },
                        { value: "freelance", label: "💻 Freelance", emoji: "💻" },
                        { value: "business", label: "🏢 Business", emoji: "🏢" },
                        { value: "investment", label: "📈 Investment", emoji: "📈" },
                        { value: "gift", label: "🎁 Gift/Bonus", emoji: "🎁" },
                        { value: "other_income", label: "💰 Other Income", emoji: "💰" }
                    ]
                },
                expense: {
                    label: "Expense",
                    types: [
                        { value: "food", label: "🍽️ Food & Dining", emoji: "🍽️" },
                        { value: "transportation", label: "🚗 Transportation", emoji: "🚗" },
                        { value: "shopping", label: "🛍️ Shopping", emoji: "🛍️" },
                        { value: "entertainment", label: "🎬 Entertainment", emoji: "🎬" },
                        { value: "utilities", label: "⚡ Utilities", emoji: "⚡" },
                        { value: "healthcare", label: "🏥 Healthcare", emoji: "🏥" },
                        { value: "other_expense", label: "📝 Other Expense", emoji: "📝" }
                    ]
                }
            };
        }
    }

    async loadTooltipConfig() {
        try {
            const response = await fetch('assets/json/tooltips.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.state.tooltipConfig = await response.json();
            console.log('Tooltip config loaded successfully');
        } catch (error) {
            console.log('Loading empty tooltip config (normal for file:// protocol)');
            this.state.tooltipConfig = {};
        }
    }

    populateCategories() {
        const categorySelect = document.getElementById('category');
        if (!categorySelect || !this.state.transactionTypes) return;

        // Clear existing options
        categorySelect.innerHTML = '<option value="">Select Category</option>';

        // Get current transaction type
        const currentType = document.querySelector('input[name="type"]:checked')?.value || 'income';
        
        // Populate categories based on current type
        if (this.state.transactionTypes[currentType] && this.state.transactionTypes[currentType].types) {
            this.state.transactionTypes[currentType].types.forEach(type => {
                const option = document.createElement('option');
                option.value = type.value;
                option.textContent = type.label;
                categorySelect.appendChild(option);
            });
        }

        console.log(`Categories populated for ${currentType}`);
    }

    showEmptyStates() {
        // Show empty chart message
        const emptyChartMessage = document.getElementById('empty-chart-message');
        const budgetOverviewContent = document.getElementById('budget-overview-content');
        if (emptyChartMessage && budgetOverviewContent) {
            emptyChartMessage.style.display = 'block';
            budgetOverviewContent.style.display = 'none';
        }

        // Show empty transaction message
        const emptyTransactionMessage = document.getElementById('empty-transaction-message');
        const transactionList = document.getElementById('transaction-list');
        if (emptyTransactionMessage && transactionList) {
            emptyTransactionMessage.style.display = 'block';
            transactionList.style.display = 'none';
        }

        // Show empty monthly message
        const emptyMonthlyMessage = document.getElementById('empty-monthly-message');
        const monthlyTransactionList = document.getElementById('monthly-transaction-list');
        if (emptyMonthlyMessage && monthlyTransactionList) {
            emptyMonthlyMessage.style.display = 'block';
            monthlyTransactionList.style.display = 'none';
        }

        console.log('Empty states displayed');
    }

    initializeMobileMenu() {
        // Mobile menu functionality - placeholder for now
        console.log('Mobile menu initialized');
    }

    bindModalEvents() {
        // Modal event binding - placeholder for now
        console.log('Modal events bound');
    }

    updateTagChips() {
        // Update tag chips display - placeholder for now
        console.log('Tag chips updated');
    }

    updateClearButton() {
        // Update clear button visibility - placeholder for now
        console.log('Clear button updated');
    }

    renderTransactions() {
        // Render transactions list - placeholder for now
        console.log('Transactions rendered');
    }

    renderMonthlyTransactions() {
        // Render monthly transactions - placeholder for now
        console.log('Monthly transactions rendered');
    }

    updateChart() {
        // Update chart display - placeholder for now
        console.log('Chart updated');
    }

    updateSummary() {
        const totalIncomeEl = document.getElementById('total-income');
        const totalExpensesEl = document.getElementById('total-expenses');
        const balanceEl = document.getElementById('balance');

        if (!totalIncomeEl || !totalExpensesEl || !balanceEl) return;

        // Calculate totals from transactions
        let totalIncome = 0;
        let totalExpenses = 0;

        if (this.state.transactions && this.state.transactions.length > 0) {
            this.state.transactions.forEach(transaction => {
                if (transaction.type === 'income') {
                    totalIncome += parseFloat(transaction.amount) || 0;
                } else if (transaction.type === 'expense') {
                    totalExpenses += parseFloat(transaction.amount) || 0;
                }
            });
        }

        const balance = totalIncome - totalExpenses;
        const currencySymbol = this.state.currentCurrencySymbol || '₹';

        // Update the display
        totalIncomeEl.textContent = `${currencySymbol}${totalIncome.toFixed(2)}`;
        totalExpensesEl.textContent = `${currencySymbol}${totalExpenses.toFixed(2)}`;
        balanceEl.textContent = `${currencySymbol}${balance.toFixed(2)}`;
        
        // Add color coding for balance
        balanceEl.className = balance >= 0 ? 'fw-bold text-success' : 'fw-bold text-danger';

        console.log('Summary updated:', { totalIncome, totalExpenses, balance });
    }

    setupCategoryFilters() {
        // Setup category filters - placeholder for now
        console.log('Category filters setup');
    }

    updateTransactionCount() {
        // Update transaction count - placeholder for now
        console.log('Transaction count updated');
    }

    showListHeader() {
        // Show list header - placeholder for now
        console.log('List header shown');
    }

    // Placeholder event handlers to prevent errors
    handleTransactionSubmit(e) {
        e.preventDefault();
        console.log('Transaction submit handled');
    }

    cancelEdit() {
        console.log('Edit cancelled');
    }

    handleFreshStart() {
        console.log('Fresh start handled');
    }

    downloadSummary() {
        console.log('Summary download initiated');
    }

    showExportModal() {
        console.log('Export modal shown');
    }

    handleFileSelect(e) {
        console.log('File select handled');
    }

    toggleTooltips() {
        console.log('Tooltips toggled');
    }

    generateAdvicePrompt() {
        console.log('Advice prompt generated');
    }

    copyAdvicePrompt() {
        console.log('Advice prompt copied');
    }

    toggleHelpSection() {
        console.log('Help section toggled');
    }

    saveEditTransaction() {
        console.log('Edit transaction saved');
    }

    populateEditCategories(type) {
        console.log('Edit categories populated for:', type);
    }

    addEditModalTag(tag) {
        console.log('Edit modal tag added:', tag);
    }

    clearEditModalTags() {
        console.log('Edit modal tags cleared');
    }

    handleSearchInput(e) {
        console.log('Search input handled');
    }

    handleTagsInput(e) {
        console.log('Tags input handled');
    }

    showTagChipsAndSuggestions(e) {
        console.log('Tag chips and suggestions shown');
    }

    handleTagsKeydown(e) {
        console.log('Tags keydown handled');
    }

    handleDocumentClick(e) {
        console.log('Document click handled');
    }

    clearAllTags() {
        console.log('All tags cleared');
    }

    updateDateTags() {
        console.log('Date tags updated');
    }

    clearDateToToday() {
        console.log('Date cleared to today');
    }

    filterTransactions(filter) {
        console.log('Transactions filtered:', filter);
    }

    filterMonthlyTransactions(filter) {
        console.log('Monthly transactions filtered:', filter);
    }

    handleMonthlySearchInput(e) {
        console.log('Monthly search input handled');
    }

    changeChartType(type) {
        console.log('Chart type changed:', type);
    }

    changeCategorySubtype(subtype) {
        console.log('Category subtype changed:', subtype);
    }

    handleTimeFilterChange(filter) {
        console.log('Time filter changed:', filter);
    }

    handleSortFilterChange(filter) {
        console.log('Sort filter changed:', filter);
    }

    clearSearch() {
        console.log('Search cleared');
    }

    handleSelectAll(checked) {
        console.log('Select all handled:', checked);
    }

    handleBulkDelete() {
        console.log('Bulk delete handled');
    }

    clearSelection() {
        console.log('Selection cleared');
    }

    changeCurrency(e) {
        console.log('Currency changed');
    }
}

window.addEventListener('load', () => {
    window.budgetTracker = new BudgetTracker();
});
