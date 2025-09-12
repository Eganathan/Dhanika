
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
            viewAllToggle: document.getElementById('view-all-toggle'),
            allTransactionsSection: document.getElementById('all-transactions-section'),
            viewToggleText: document.getElementById('view-toggle-text'),
            allTimeFilter: document.getElementById('all-time-filter'),
            clearAllFilters: document.getElementById('clear-all-filters'),
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
        
        // View All Toggle
        this.elements.viewAllToggle?.addEventListener('click', () => this.toggleAllTransactionsView());
        
        // Clear all filters
        this.elements.clearAllFilters?.addEventListener('click', () => this.clearAllFilters());
        
        // All time filter
        this.elements.allTimeFilter?.addEventListener('change', (e) => this.handleAllTimeFilterChange(e.target.value));
        
        // Analytics dashboard
        const showAnalyticsBtn = document.getElementById('show-analytics');
        const hideAnalyticsBtn = document.getElementById('hide-analytics');
        
        showAnalyticsBtn?.addEventListener('click', () => this.showAnalyticsDashboard());
        hideAnalyticsBtn?.addEventListener('click', () => this.hideAnalyticsDashboard());

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
        const transactionList = document.getElementById('transaction-list');
        const emptyMessage = document.getElementById('empty-transaction-message');
        
        if (!transactionList) return;
        
        // Filter transactions
        let filteredTransactions = this.state.transactions.filter(transaction => {
            const matchesType = this.state.currentFilter === 'all' || transaction.type === this.state.currentFilter;
            const matchesSearch = !this.state.currentSearchTerm || 
                transaction.description.toLowerCase().includes(this.state.currentSearchTerm.toLowerCase()) ||
                transaction.tags.toLowerCase().includes(this.state.currentSearchTerm.toLowerCase());
            const matchesCategory = this.state.currentCategoryFilter === 'all' || transaction.category === this.state.currentCategoryFilter;
            
            return matchesType && matchesSearch && matchesCategory;
        });

        // Apply sorting
        this.applySorting(filteredTransactions);
        
        // For the main dashboard, show top 5 when not in "view all" mode
        const isViewingAll = this.elements.allTransactionsSection?.style.display !== 'none';
        if (!isViewingAll) {
            filteredTransactions = filteredTransactions.slice(0, 5);
        }

        if (filteredTransactions.length === 0) {
            transactionList.style.display = 'none';
            emptyMessage.style.display = 'block';
            return;
        }

        transactionList.style.display = 'block';
        emptyMessage.style.display = 'none';
        
        transactionList.innerHTML = filteredTransactions.map(transaction => {
            const date = new Date(transaction.date).toLocaleDateString();
            const amount = `${this.state.currentCurrencySymbol}${transaction.amount.toFixed(2)}`;
            const typeClass = transaction.type === 'income' ? 'text-success' : 'text-danger';
            const typeIcon = transaction.type === 'income' ? 'bi-arrow-up' : 'bi-arrow-down';
            
            return `
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    <div class="flex-grow-1">
                        <div class="d-flex align-items-center mb-1">
                            <i class="bi ${typeIcon} ${typeClass} me-2"></i>
                            <strong>${transaction.description}</strong>
                        </div>
                        <small class="text-muted">
                            ${date} • ${this.getCategoryLabel(transaction.category)}
                            ${transaction.tags ? ` • ${transaction.tags}` : ''}
                        </small>
                    </div>
                    <div class="d-flex align-items-center gap-2">
                        <span class="badge ${typeClass} fs-6">${amount}</span>
                        <button class="btn btn-sm btn-outline-primary" onclick="budgetTracker.editTransaction('${transaction.id}')">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="budgetTracker.deleteTransaction('${transaction.id}')">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </li>
            `;
        }).join('');
    }

    renderMonthlyTransactions() {
        const monthlyList = document.getElementById('monthly-transaction-list');
        const emptyMessage = document.getElementById('empty-monthly-message');
        
        if (!monthlyList) return;
        
        // Get current month transactions
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        let monthlyTransactions = this.state.transactions.filter(transaction => {
            const transactionDate = new Date(transaction.date);
            return transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear;
        });
        
        // Apply filters
        monthlyTransactions = monthlyTransactions.filter(transaction => {
            const matchesType = this.state.currentMonthlyFilter === 'all' || transaction.type === this.state.currentMonthlyFilter;
            const matchesSearch = !this.state.currentMonthlySearchTerm || 
                transaction.description.toLowerCase().includes(this.state.currentMonthlySearchTerm.toLowerCase()) ||
                transaction.tags.toLowerCase().includes(this.state.currentMonthlySearchTerm.toLowerCase());
            const matchesCategory = this.state.currentMonthlyCategoryFilter === 'all' || transaction.category === this.state.currentMonthlyCategoryFilter;
            
            return matchesType && matchesSearch && matchesCategory;
        });
        
        // Sort by date (newest first)
        monthlyTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        if (monthlyTransactions.length === 0) {
            monthlyList.style.display = 'none';
            emptyMessage.style.display = 'block';
            return;
        }
        
        monthlyList.style.display = 'block';
        emptyMessage.style.display = 'none';
        
        monthlyList.innerHTML = monthlyTransactions.map(transaction => {
            const date = new Date(transaction.date).toLocaleDateString();
            const amount = `${this.state.currentCurrencySymbol}${transaction.amount.toFixed(2)}`;
            const typeClass = transaction.type === 'income' ? 'text-success' : 'text-danger';
            const typeIcon = transaction.type === 'income' ? 'bi-arrow-up' : 'bi-arrow-down';
            
            return `
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    <div class="flex-grow-1">
                        <div class="d-flex align-items-center mb-1">
                            <i class="bi ${typeIcon} ${typeClass} me-2"></i>
                            <strong>${transaction.description}</strong>
                        </div>
                        <small class="text-muted">
                            ${date} • ${this.getCategoryLabel(transaction.category)}
                            ${transaction.tags ? ` • ${transaction.tags}` : ''}
                        </small>
                    </div>
                    <div class="d-flex align-items-center gap-2">
                        <span class="badge ${typeClass} fs-6">${amount}</span>
                        <button class="btn btn-sm btn-outline-primary" onclick="budgetTracker.editTransaction('${transaction.id}')">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="budgetTracker.deleteTransaction('${transaction.id}')">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </li>
            `;
        }).join('');
    }

    updateChart() {
        const canvas = document.getElementById('budget-chart');
        const emptyMessage = document.getElementById('empty-chart-message');
        const budgetContent = document.getElementById('budget-overview-content');
        
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        // Filter transactions based on time filter
        let filteredTransactions = this.state.transactions;
        if (this.state.currentTimeFilter === 'this-month') {
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();
            
            filteredTransactions = this.state.transactions.filter(transaction => {
                const transactionDate = new Date(transaction.date);
                return transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear;
            });
        }
        
        if (filteredTransactions.length === 0) {
            if (this.state.chart) {
                this.state.chart.destroy();
                this.state.chart = null;
            }
            emptyMessage.style.display = 'block';
            budgetContent.style.display = 'none';
            return;
        }
        
        emptyMessage.style.display = 'none';
        budgetContent.style.display = 'block';
        
        // Destroy existing chart
        if (this.state.chart) {
            this.state.chart.destroy();
        }
        
        if (this.state.currentChartType === 'overview') {
            this.renderOverviewChart(ctx, filteredTransactions);
        } else {
            this.renderCategoryChart(ctx, filteredTransactions);
        }
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
        
        const formData = new FormData(e.target);
        const transaction = {
            id: this.state.editingTransactionId || Date.now().toString(),
            type: formData.get('type'),
            amount: parseFloat(formData.get('amount')),
            description: formData.get('description'),
            date: formData.get('date'),
            category: formData.get('category'),
            tags: formData.get('tags') || '',
            timestamp: new Date().toISOString()
        };

        // Validate required fields
        if (!transaction.amount || !transaction.description || !transaction.date || !transaction.category) {
            this.showSnackbar('Please fill in all required fields', 'error');
            return;
        }

        if (this.state.editingTransactionId) {
            // Update existing transaction
            const index = this.state.transactions.findIndex(t => t.id === this.state.editingTransactionId);
            if (index !== -1) {
                this.state.transactions[index] = transaction;
                this.showSnackbar('Transaction updated successfully!', 'success');
            }
            this.cancelEdit();
        } else {
            // Add new transaction
            this.state.transactions.unshift(transaction);
            this.showSnackbar('Transaction added successfully!', 'success');
        }

        // Save and refresh
        this.saveTransactions();
        this.renderTransactions();
        this.renderMonthlyTransactions();
        this.updateChart();
        this.updateSummary();
        this.setupCategoryFilters();
        
        // Reset form
        e.target.reset();
        document.getElementById('date').value = new Date().toISOString().split('T')[0];
    }

    cancelEdit() {
        this.state.editingTransactionId = null;
        
        // Reset form
        const form = document.getElementById('transaction-form');
        if (form) {
            form.reset();
            // Set date to today
            document.getElementById('date').value = new Date().toISOString().split('T')[0];
            
            // Reset button text
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.textContent = 'Save Transaction';
            }
        }
        
        // Hide cancel button
        document.getElementById('cancel-edit').style.display = 'none';
        
        this.showSnackbar('Edit cancelled', 'info');
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
        this.state.currentSearchTerm = e.target.value.trim();
        this.renderTransactions();
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
        this.state.currentFilter = filter;
        this.renderTransactions();
    }

    filterMonthlyTransactions(filter) {
        this.state.currentMonthlyFilter = filter;
        this.renderMonthlyTransactions();
    }

    handleMonthlySearchInput(e) {
        this.state.currentMonthlySearchTerm = e.target.value.trim();
        this.renderMonthlyTransactions();
    }

    changeChartType(type) {
        this.state.currentChartType = type;
        
        // Show/hide category subtype selector
        const subtypeSelector = document.getElementById('category-subtype-selector');
        if (subtypeSelector) {
            if (type === 'category') {
                subtypeSelector.style.display = 'flex';
            } else {
                subtypeSelector.style.display = 'none';
            }
        }
        
        this.updateChart();
    }

    changeCategorySubtype(subtype) {
        this.state.currentCategorySubtype = subtype;
        this.updateChart();
    }

    handleTimeFilterChange(filter) {
        this.state.currentTimeFilter = filter;
        this.updateChart();
        this.updateSummary();
    }

    handleSortFilterChange(filter) {
        this.state.currentSortFilter = filter;
        this.renderTransactions();
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
        e.preventDefault();
        const currency = e.target.dataset.currency;
        const symbol = e.target.dataset.symbol;
        
        if (!currency || !symbol) return;
        
        this.state.currentCurrency = currency;
        this.state.currentCurrencySymbol = symbol;
        
        // Save to localStorage
        localStorage.setItem('selectedCurrency', currency);
        localStorage.setItem('selectedCurrencySymbol', symbol);
        
        // Update UI
        const currentCurrencySpan = document.getElementById('current-currency');
        if (currentCurrencySpan) {
            currentCurrencySpan.textContent = `${symbol} ${currency}`;
        }
        
        // Refresh all displays
        this.updateSummary();
        this.renderTransactions();
        this.renderMonthlyTransactions();
        
        this.showSnackbar(`Currency changed to ${currency}`, 'success');
    }
    
    getCategoryLabel(categoryValue) {
        if (!this.state.transactionTypes) return categoryValue;
        
        // Search in both income and expense categories
        for (const [type, config] of Object.entries(this.state.transactionTypes)) {
            if (config.types) {
                const category = config.types.find(cat => cat.value === categoryValue);
                if (category) {
                    return category.label;
                }
            }
        }
        return categoryValue;
    }
    
    editTransaction(id) {
        const transaction = this.state.transactions.find(t => t.id === id);
        if (!transaction) return;
        
        // Set editing state
        this.state.editingTransactionId = id;
        
        // Populate form
        const form = document.getElementById('transaction-form');
        if (!form) return;
        
        document.querySelector(`input[name="type"][value="${transaction.type}"]`).checked = true;
        document.getElementById('amount').value = transaction.amount;
        document.getElementById('description').value = transaction.description;
        document.getElementById('date').value = transaction.date;
        document.getElementById('tags').value = transaction.tags;
        
        // Update categories and select the right one
        this.populateCategories();
        setTimeout(() => {
            document.getElementById('category').value = transaction.category;
        }, 50);
        
        // Show cancel button
        document.getElementById('cancel-edit').style.display = 'block';
        
        // Update form button text
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.textContent = 'Update Transaction';
        }
        
        // Scroll to form
        form.scrollIntoView({ behavior: 'smooth' });
        
        this.showSnackbar('Edit mode activated', 'info');
    }
    
    deleteTransaction(id) {
        if (!confirm('Are you sure you want to delete this transaction?')) return;
        
        const index = this.state.transactions.findIndex(t => t.id === id);
        if (index === -1) return;
        
        this.state.transactions.splice(index, 1);
        this.saveTransactions();
        
        // Refresh displays
        this.renderTransactions();
        this.renderMonthlyTransactions();
        this.updateChart();
        this.updateSummary();
        this.setupCategoryFilters();
        
        this.showSnackbar('Transaction deleted successfully', 'success');
    }
    
    renderOverviewChart(ctx, transactions) {
        const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const expenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        
        this.state.chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Income', 'Expenses'],
                datasets: [{
                    data: [income, expenses],
                    backgroundColor: [
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(239, 68, 68, 0.8)'
                    ],
                    borderColor: [
                        'rgba(16, 185, 129, 1)',
                        'rgba(239, 68, 68, 1)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#f1f5f9',
                            font: {
                                size: 14
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        titleColor: '#f1f5f9',
                        bodyColor: '#f1f5f9',
                        borderColor: '#334155',
                        borderWidth: 1,
                        callbacks: {
                            label: (context) => {
                                const value = context.parsed;
                                return `${context.label}: ${this.state.currentCurrencySymbol}${value.toFixed(2)}`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    renderCategoryChart(ctx, transactions) {
        const filteredTransactions = transactions.filter(t => t.type === this.state.currentCategorySubtype);
        
        if (filteredTransactions.length === 0) {
            this.state.chart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['No Data'],
                    datasets: [{
                        data: [1],
                        backgroundColor: ['rgba(100, 116, 139, 0.5)'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });
            return;
        }
        
        // Group by category
        const categoryData = {};
        filteredTransactions.forEach(transaction => {
            if (!categoryData[transaction.category]) {
                categoryData[transaction.category] = 0;
            }
            categoryData[transaction.category] += transaction.amount;
        });
        
        const labels = Object.keys(categoryData).map(cat => this.getCategoryLabel(cat));
        const data = Object.values(categoryData);
        const colors = this.generateColors(labels.length);
        
        this.state.chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors.backgrounds,
                    borderColor: colors.borders,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#f1f5f9',
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        titleColor: '#f1f5f9',
                        bodyColor: '#f1f5f9',
                        borderColor: '#334155',
                        borderWidth: 1,
                        callbacks: {
                            label: (context) => {
                                const value = context.parsed;
                                const percentage = ((value / data.reduce((a, b) => a + b, 0)) * 100).toFixed(1);
                                return `${context.label}: ${this.state.currentCurrencySymbol}${value.toFixed(2)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    generateColors(count) {
        const baseColors = [
            'rgba(59, 130, 246, 0.8)',   // blue
            'rgba(16, 185, 129, 0.8)',   // green
            'rgba(239, 68, 68, 0.8)',    // red
            'rgba(245, 158, 11, 0.8)',   // yellow
            'rgba(139, 92, 246, 0.8)',   // purple
            'rgba(236, 72, 153, 0.8)',   // pink
            'rgba(6, 182, 212, 0.8)',    // cyan
            'rgba(34, 197, 94, 0.8)',    // emerald
            'rgba(251, 146, 60, 0.8)',   // orange
            'rgba(168, 85, 247, 0.8)'    // violet
        ];
        
        const backgrounds = [];
        const borders = [];
        
        for (let i = 0; i < count; i++) {
            const colorIndex = i % baseColors.length;
            backgrounds.push(baseColors[colorIndex]);
            borders.push(baseColors[colorIndex].replace('0.8', '1'));
        }
        
        return { backgrounds, borders };
    }
    
    toggleAllTransactionsView() {
        const allSection = this.elements.allTransactionsSection;
        const monthlySection = document.querySelector('.row:has(#monthly-transaction-list)').parentElement;
        const toggleText = this.elements.viewToggleText;
        
        if (allSection.style.display === 'none') {
            // Show all transactions view
            allSection.style.display = 'block';
            monthlySection.style.display = 'none';
            toggleText.textContent = 'Hide All Transactions';
            
            // Update transaction rendering for full view
            this.renderTransactions();
            this.setupCategoryFilters();
            this.updateTransactionCount();
            this.showListHeader();
            
            // Scroll to the section
            allSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            // Hide all transactions view
            allSection.style.display = 'none';
            monthlySection.style.display = 'block';
            toggleText.textContent = 'Show All Transactions';
            
            // Re-render with limited view
            this.renderTransactions();
        }
    }
    
    applySorting(transactions) {
        const sortBy = this.state.currentSortFilter || 'date-desc';
        
        transactions.sort((a, b) => {
            switch (sortBy) {
                case 'date-desc':
                    return new Date(b.date) - new Date(a.date);
                case 'date-asc':
                    return new Date(a.date) - new Date(b.date);
                case 'amount-desc':
                    return b.amount - a.amount;
                case 'amount-asc':
                    return a.amount - b.amount;
                case 'description':
                    return a.description.localeCompare(b.description);
                default:
                    return new Date(b.date) - new Date(a.date);
            }
        });
    }
    
    clearAllFilters() {
        // Reset all filter states
        this.state.currentFilter = 'all';
        this.state.currentCategoryFilter = 'all';
        this.state.currentSearchTerm = '';
        this.state.currentSortFilter = 'date-desc';
        
        // Reset UI elements
        const allRadio = document.getElementById('all-transactions');
        if (allRadio) allRadio.checked = true;
        
        const searchInput = document.getElementById('transaction-search');
        if (searchInput) searchInput.value = '';
        
        const sortFilter = document.getElementById('sort-filter');
        if (sortFilter) sortFilter.value = 'date-desc';
        
        const timeFilter = document.getElementById('all-time-filter');
        if (timeFilter) timeFilter.value = 'all';
        
        // Clear category filters
        const categoryFilters = document.querySelectorAll('#category-filters .btn');
        categoryFilters.forEach(btn => btn.classList.remove('active'));
        
        // Re-render
        this.renderTransactions();
        this.updateTransactionCount();
        
        this.showSnackbar('All filters cleared', 'success');
    }
    
    handleAllTimeFilterChange(period) {
        this.state.currentTimeFilter = period;
        this.renderTransactions();
        this.updateTransactionCount();
    }
    
    setupCategoryFilters() {
        const container = document.getElementById('category-filters');
        if (!container) return;
        
        // Get unique categories from transactions
        const categories = new Set();
        this.state.transactions.forEach(transaction => {
            categories.add(transaction.category);
        });
        
        const categoryButtons = Array.from(categories).map(category => {
            const label = this.getCategoryLabel(category);
            return `
                <button class="btn btn-outline-secondary btn-sm category-filter" 
                        data-category="${category}" 
                        onclick="budgetTracker.toggleCategoryFilter('${category}')">
                    ${label}
                </button>
            `;
        }).join('');
        
        container.innerHTML = `
            <button class="btn btn-secondary btn-sm category-filter active" 
                    data-category="all" 
                    onclick="budgetTracker.toggleCategoryFilter('all')">
                All Categories
            </button>
            ${categoryButtons}
        `;
    }
    
    toggleCategoryFilter(category) {
        // Update filter state
        this.state.currentCategoryFilter = category;
        
        // Update button states
        const buttons = document.querySelectorAll('.category-filter');
        buttons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.category === category) {
                btn.classList.add('active');
            }
        });
        
        // Re-render
        this.renderTransactions();
        this.updateTransactionCount();
    }
    
    updateTransactionCount() {
        const countElement = document.getElementById('transaction-count');
        const showingElement = document.getElementById('showing-info');
        
        if (!countElement || !showingElement) return;
        
        // Apply current filters to get count
        let filteredTransactions = this.state.transactions.filter(transaction => {
            const matchesType = this.state.currentFilter === 'all' || transaction.type === this.state.currentFilter;
            const matchesSearch = !this.state.currentSearchTerm || 
                transaction.description.toLowerCase().includes(this.state.currentSearchTerm.toLowerCase()) ||
                transaction.tags.toLowerCase().includes(this.state.currentSearchTerm.toLowerCase());
            const matchesCategory = this.state.currentCategoryFilter === 'all' || transaction.category === this.state.currentCategoryFilter;
            
            // Apply time filter
            let matchesTime = true;
            if (this.state.currentTimeFilter && this.state.currentTimeFilter !== 'all') {
                const now = new Date();
                const transactionDate = new Date(transaction.date);
                
                switch (this.state.currentTimeFilter) {
                    case 'this-month':
                        matchesTime = transactionDate.getMonth() === now.getMonth() && 
                                    transactionDate.getFullYear() === now.getFullYear();
                        break;
                    case 'last-month':
                        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
                        matchesTime = transactionDate.getMonth() === lastMonth.getMonth() && 
                                    transactionDate.getFullYear() === lastMonth.getFullYear();
                        break;
                    case 'last-3-months':
                        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3);
                        matchesTime = transactionDate >= threeMonthsAgo;
                        break;
                    case 'this-year':
                        matchesTime = transactionDate.getFullYear() === now.getFullYear();
                        break;
                }
            }
            
            return matchesType && matchesSearch && matchesCategory && matchesTime;
        });
        
        countElement.textContent = `${filteredTransactions.length} transaction${filteredTransactions.length !== 1 ? 's' : ''}`;
        showingElement.textContent = `Showing ${filteredTransactions.length} of ${this.state.transactions.length} transactions`;
    }
    
    showListHeader() {
        const listHeader = document.getElementById('list-header');
        if (listHeader && this.elements.allTransactionsSection?.style.display !== 'none') {
            listHeader.style.display = 'block';
        }
    }
    
    updateBulkActions() {
        const checkboxes = document.querySelectorAll('.transaction-checkbox:checked');
        const bulkActions = document.getElementById('bulk-actions');
        const selectedCount = document.getElementById('selected-count');
        
        if (!bulkActions || !selectedCount) return;
        
        if (checkboxes.length > 0) {
            bulkActions.style.display = 'block';
            selectedCount.textContent = `${checkboxes.length} selected`;
        } else {
            bulkActions.style.display = 'none';
        }
    }
    
    showAnalyticsDashboard() {
        const dashboard = document.getElementById('analytics-dashboard');
        const showBtn = document.getElementById('show-analytics');
        
        if (dashboard && showBtn) {
            dashboard.style.display = 'block';
            showBtn.style.display = 'none';
            
            // Render all analytics charts
            this.renderAnalyticsCharts();
            this.updateKeyMetrics();
            
            // Scroll to dashboard
            setTimeout(() => {
                dashboard.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
    }
    
    hideAnalyticsDashboard() {
        const dashboard = document.getElementById('analytics-dashboard');
        const showBtn = document.getElementById('show-analytics');
        
        if (dashboard && showBtn) {
            dashboard.style.display = 'none';
            showBtn.style.display = 'block';
            
            // Destroy charts to free memory
            this.destroyAnalyticsCharts();
        }
    }
    
    renderAnalyticsCharts() {
        this.renderTrendChart();
        this.renderCategoryBreakdownChart();
        this.renderDailyPatternChart();
        this.renderBudgetHealthChart();
    }
    
    destroyAnalyticsCharts() {
        if (this.analyticsCharts) {
            Object.values(this.analyticsCharts).forEach(chart => {
                if (chart) chart.destroy();
            });
            this.analyticsCharts = {};
        }
    }
    
    renderTrendChart() {
        const canvas = document.getElementById('trend-chart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        if (!this.analyticsCharts) this.analyticsCharts = {};
        
        // Destroy existing chart
        if (this.analyticsCharts.trend) {
            this.analyticsCharts.trend.destroy();
        }
        
        // Get monthly data for the last 6 months
        const monthlyData = this.getMonthlyTrendData();
        
        this.analyticsCharts.trend = new Chart(ctx, {
            type: 'line',
            data: {
                labels: monthlyData.labels,
                datasets: [{
                    label: 'Income',
                    data: monthlyData.income,
                    borderColor: 'rgba(16, 185, 129, 1)',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    fill: true,
                    tension: 0.4
                }, {
                    label: 'Expenses',
                    data: monthlyData.expenses,
                    borderColor: 'rgba(239, 68, 68, 1)',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#f1f5f9',
                            font: { size: 12 }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        titleColor: '#f1f5f9',
                        bodyColor: '#f1f5f9',
                        borderColor: '#334155',
                        borderWidth: 1
                    }
                },
                scales: {
                    x: {
                        ticks: { color: '#cbd5e1' },
                        grid: { color: 'rgba(203, 213, 225, 0.1)' }
                    },
                    y: {
                        ticks: { color: '#cbd5e1' },
                        grid: { color: 'rgba(203, 213, 225, 0.1)' }
                    }
                }
            }
        });
    }
    
    renderCategoryBreakdownChart() {
        const canvas = document.getElementById('category-breakdown-chart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        if (!this.analyticsCharts) this.analyticsCharts = {};
        
        if (this.analyticsCharts.categoryBreakdown) {
            this.analyticsCharts.categoryBreakdown.destroy();
        }
        
        // Get current month expense categories
        const categoryData = this.getCurrentMonthCategoryData();
        
        this.analyticsCharts.categoryBreakdown = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: categoryData.labels,
                datasets: [{
                    data: categoryData.values,
                    backgroundColor: this.generateColors(categoryData.labels.length).backgrounds,
                    borderWidth: 2,
                    borderColor: '#334155'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#f1f5f9',
                            font: { size: 10 }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        titleColor: '#f1f5f9',
                        bodyColor: '#f1f5f9',
                        callbacks: {
                            label: (context) => {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return `${context.label}: ${this.state.currentCurrencySymbol}${context.parsed.toFixed(2)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    renderDailyPatternChart() {
        const canvas = document.getElementById('daily-pattern-chart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        if (!this.analyticsCharts) this.analyticsCharts = {};
        
        if (this.analyticsCharts.dailyPattern) {
            this.analyticsCharts.dailyPattern.destroy();
        }
        
        const dailyData = this.getDailySpendingPattern();
        
        this.analyticsCharts.dailyPattern = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Average Spending',
                    data: dailyData,
                    backgroundColor: 'rgba(59, 130, 246, 0.8)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        titleColor: '#f1f5f9',
                        bodyColor: '#f1f5f9',
                        callbacks: {
                            label: (context) => {
                                return `Avg: ${this.state.currentCurrencySymbol}${context.parsed.y.toFixed(2)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: { color: '#cbd5e1' },
                        grid: { display: false }
                    },
                    y: {
                        ticks: { color: '#cbd5e1' },
                        grid: { color: 'rgba(203, 213, 225, 0.1)' }
                    }
                }
            }
        });
    }
    
    renderBudgetHealthChart() {
        const canvas = document.getElementById('health-score-chart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        if (!this.analyticsCharts) this.analyticsCharts = {};
        
        if (this.analyticsCharts.healthScore) {
            this.analyticsCharts.healthScore.destroy();
        }
        
        const score = this.calculateBudgetHealthScore();
        const remaining = 100 - score;
        
        this.analyticsCharts.healthScore = new Chart(ctx, {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: [score, remaining],
                    backgroundColor: [
                        this.getHealthScoreColor(score),
                        'rgba(100, 116, 139, 0.2)'
                    ],
                    borderWidth: 0,
                    cutout: '70%'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false }
                }
            }
        });
        
        // Update score display
        document.getElementById('budget-health-score').textContent = score;
        document.getElementById('health-score-description').textContent = this.getHealthScoreDescription(score);
    }
    
    getMonthlyTrendData() {
        const months = [];
        const income = [];
        const expenses = [];
        
        // Get last 6 months
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            
            const monthName = date.toLocaleDateString('en-US', { month: 'short' });
            months.push(monthName);
            
            const monthTransactions = this.state.transactions.filter(t => {
                const tDate = new Date(t.date);
                return tDate.getMonth() === date.getMonth() && tDate.getFullYear() === date.getFullYear();
            });
            
            const monthIncome = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
            const monthExpenses = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
            
            income.push(monthIncome);
            expenses.push(monthExpenses);
        }
        
        return { labels: months, income, expenses };
    }
    
    getCurrentMonthCategoryData() {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        const monthlyExpenses = this.state.transactions.filter(transaction => {
            const tDate = new Date(transaction.date);
            return transaction.type === 'expense' && 
                   tDate.getMonth() === currentMonth && 
                   tDate.getFullYear() === currentYear;
        });
        
        const categoryTotals = {};
        monthlyExpenses.forEach(t => {
            const category = this.getCategoryLabel(t.category);
            categoryTotals[category] = (categoryTotals[category] || 0) + t.amount;
        });
        
        return {
            labels: Object.keys(categoryTotals),
            values: Object.values(categoryTotals)
        };
    }
    
    getDailySpendingPattern() {
        const dailyTotals = [0, 0, 0, 0, 0, 0, 0]; // Mon-Sun
        const dailyCounts = [0, 0, 0, 0, 0, 0, 0];
        
        this.state.transactions.filter(t => t.type === 'expense').forEach(transaction => {
            const date = new Date(transaction.date);
            const dayOfWeek = (date.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0
            
            dailyTotals[dayOfWeek] += transaction.amount;
            dailyCounts[dayOfWeek]++;
        });
        
        return dailyTotals.map((total, i) => dailyCounts[i] > 0 ? total / dailyCounts[i] : 0);
    }
    
    calculateBudgetHealthScore() {
        // Complex algorithm to calculate financial health (0-100)
        const totalIncome = this.state.transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const totalExpenses = this.state.transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        
        if (totalIncome === 0) return 0;
        
        const savingsRate = ((totalIncome - totalExpenses) / totalIncome) * 100;
        const consistencyScore = this.calculateConsistencyScore();
        const diversityScore = this.calculateCategoryDiversityScore();
        
        // Weighted scoring
        const healthScore = Math.max(0, Math.min(100, 
            (savingsRate * 0.5) + 
            (consistencyScore * 0.3) + 
            (diversityScore * 0.2)
        ));
        
        return Math.round(healthScore);
    }
    
    calculateConsistencyScore() {
        // Measure how consistent spending is month over month
        const monthlyData = this.getMonthlyTrendData();
        if (monthlyData.expenses.length < 2) return 50;
        
        const avgExpense = monthlyData.expenses.reduce((a, b) => a + b, 0) / monthlyData.expenses.length;
        const variance = monthlyData.expenses.reduce((sum, expense) => sum + Math.pow(expense - avgExpense, 2), 0) / monthlyData.expenses.length;
        const stdDev = Math.sqrt(variance);
        
        // Lower standard deviation = higher consistency score
        const consistencyScore = Math.max(0, 100 - (stdDev / avgExpense * 100));
        return Math.min(100, consistencyScore);
    }
    
    calculateCategoryDiversityScore() {
        // Measure how well-distributed expenses are across categories
        const categoryData = this.getCurrentMonthCategoryData();
        if (categoryData.labels.length < 2) return 20;
        
        const total = categoryData.values.reduce((a, b) => a + b, 0);
        if (total === 0) return 50;
        
        // Calculate entropy (higher entropy = better diversity)
        let entropy = 0;
        categoryData.values.forEach(value => {
            const p = value / total;
            if (p > 0) entropy -= p * Math.log2(p);
        });
        
        const maxEntropy = Math.log2(categoryData.labels.length);
        const diversityScore = (entropy / maxEntropy) * 100;
        
        return Math.min(100, diversityScore);
    }
    
    getHealthScoreColor(score) {
        if (score >= 80) return 'rgba(16, 185, 129, 0.8)'; // green
        if (score >= 60) return 'rgba(59, 130, 246, 0.8)'; // blue
        if (score >= 40) return 'rgba(245, 158, 11, 0.8)'; // yellow
        return 'rgba(239, 68, 68, 0.8)'; // red
    }
    
    getHealthScoreDescription(score) {
        if (score >= 80) return 'Excellent financial health';
        if (score >= 60) return 'Good financial health';
        if (score >= 40) return 'Fair financial health';
        return 'Needs improvement';
    }
    
    updateKeyMetrics() {
        const monthlyData = this.getMonthlyTrendData();
        const avgMonthlySpending = monthlyData.expenses.reduce((a, b) => a + b, 0) / monthlyData.expenses.length;
        
        const totalIncome = this.state.transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const totalExpenses = this.state.transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100) : 0;
        
        const highestExpense = Math.max(...this.state.transactions.filter(t => t.type === 'expense').map(t => t.amount));
        const totalTransactions = this.state.transactions.length;
        
        // Update with animation
        this.animateMetricUpdate('avg-monthly-spending', `${this.state.currentCurrencySymbol}${avgMonthlySpending.toFixed(0)}`);
        this.animateMetricUpdate('savings-rate', `${savingsRate.toFixed(1)}%`);
        this.animateMetricUpdate('highest-expense', `${this.state.currentCurrencySymbol}${(highestExpense || 0).toFixed(0)}`);
        this.animateMetricUpdate('total-transactions', totalTransactions.toString());
    }
    
    animateMetricUpdate(elementId, newValue) {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.add('pulse-on-update');
            element.textContent = newValue;
            setTimeout(() => {
                element.classList.remove('pulse-on-update');
            }, 600);
        }
    }
}

window.addEventListener('load', () => {
    window.budgetTracker = new BudgetTracker();
});
