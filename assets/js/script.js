class BudgetTracker {
    constructor() {
        console.log('Initializing BudgetTracker...');
        this.setupContinuousAnimation();
        this.detectPage();
        this.initializeElements();
        this.initializeState();
        this.bindEvents();
        this.setupStorageListener();
        this.initializeMobileMenu();
        this.initialize();
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
            monthlyTransactionListSkeleton: document.getElementById('monthly-transaction-list-skeleton'),
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

    initializeState() {
        let transactions = [];
        let tooltipsEnabled = true;
        let selectedCurrency = 'INR';
        let selectedCurrencySymbol = '₹';
        
        try {
            const storedTransactions = localStorage.getItem('transactions');
            transactions = storedTransactions ? JSON.parse(storedTransactions) : [];
            
            // Add sample transactions for first-time users
            if (transactions.length === 0) {
                transactions = this.createSampleTransactions();
            }
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
            {
                id: String(new Date(currentYear, currentMonth, 15, 14, 30).getTime()),
                type: 'income',
                description: 'Freelance Web Design Project',
                amount: 25000,
                category: 'freelance',
                tags: 'project, design',
                date: new Date(currentYear, currentMonth, 15, 14, 30).toISOString()
            },
            {
                id: String(new Date(currentYear, currentMonth, 22, 11, 15).getTime()),
                type: 'income',
                description: 'Stock Dividend',
                amount: 3500,
                category: 'investment',
                tags: 'dividend, stocks',
                date: new Date(currentYear, currentMonth, 22, 11, 15).toISOString()
            },
            
            // Expense examples
            {
                id: String(new Date(currentYear, currentMonth, 2, 19, 45).getTime()),
                type: 'expense',
                description: 'Grocery Shopping - Weekly',
                amount: 3200,
                category: 'food',
                tags: 'grocery, weekly',
                date: new Date(currentYear, currentMonth, 2, 19, 45).toISOString()
            },
            {
                id: String(new Date(currentYear, currentMonth, 5, 8, 30).getTime()),
                type: 'expense',
                description: 'Metro Card Recharge',
                amount: 1500,
                category: 'transportation',
                tags: 'metro, transport',
                date: new Date(currentYear, currentMonth, 5, 8, 30).toISOString()
            },
            {
                id: String(new Date(currentYear, currentMonth, 8, 21, 0).getTime()),
                type: 'expense',
                description: 'Movie Night with Friends',
                amount: 800,
                category: 'entertainment',
                tags: 'movies, friends',
                date: new Date(currentYear, currentMonth, 8, 21, 0).toISOString()
            },
            {
                id: String(new Date(currentYear, currentMonth, 10, 10, 15).getTime()),
                type: 'expense',
                description: 'Electricity Bill',
                amount: 2800,
                category: 'utilities',
                tags: 'bill, electricity',
                date: new Date(currentYear, currentMonth, 10, 10, 15).toISOString()
            },
            {
                id: String(new Date(currentYear, currentMonth, 12, 16, 30).getTime()),
                type: 'expense',
                description: 'New Running Shoes',
                amount: 4500,
                category: 'shopping',
                tags: 'shoes, fitness',
                date: new Date(currentYear, currentMonth, 12, 16, 30).toISOString()
            },
            {
                id: String(new Date(currentYear, currentMonth, 18, 13, 45).getTime()),
                type: 'expense',
                description: 'Monthly SIP Investment',
                amount: 5000,
                category: 'savings',
                tags: 'sip, investment',
                date: new Date(currentYear, currentMonth, 18, 13, 45).toISOString()
            },
            {
                id: String(new Date(currentYear, currentMonth, 20, 12, 0).getTime()),
                type: 'expense',
                description: 'Doctor Consultation',
                amount: 1200,
                category: 'healthcare',
                tags: 'medical, checkup',
                date: new Date(currentYear, currentMonth, 20, 12, 0).toISOString()
            }
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

        // Export/Import modal event listeners
        this.bindModalEvents();
    }

    bindModalEvents() {
        // Export modal events
        const exportModal = document.getElementById('exportModal');
        const confirmExport = document.getElementById('confirmExport');
        const emailMethodRadio = document.getElementById('emailMethod');
        const downloadMethodRadio = document.getElementById('downloadMethod');
        const emailFields = document.getElementById('emailFields');

        // Show/hide email fields based on method selection
        if (emailMethodRadio && downloadMethodRadio && emailFields) {
            emailMethodRadio.addEventListener('change', () => {
                emailFields.style.display = emailMethodRadio.checked ? 'block' : 'none';
            });
            downloadMethodRadio.addEventListener('change', () => {
                emailFields.style.display = emailMethodRadio.checked ? 'block' : 'none';
            });
        }

        // Handle export confirmation
        if (confirmExport) {
            confirmExport.addEventListener('click', async () => {
                const passphrase = document.getElementById('exportPassphrase').value;
                const method = document.querySelector('input[name="exportMethod"]:checked').value;
                const email = document.getElementById('recipientEmail').value;

                if (!passphrase) {
                    this.showSnackbar('Please enter a passphrase', 'error');
                    return;
                }

                if (method === 'email' && !email) {
                    this.showSnackbar('Please enter an email address', 'error');
                    return;
                }

                try {
                    await this.exportDataEncrypted(passphrase, method, email);
                    
                    // Hide modal and reset form
                    const modal = bootstrap.Modal.getInstance(exportModal);
                    if (modal) {
                        modal.hide();
                    }
                    document.getElementById('exportForm').reset();
                    emailFields.style.display = 'none';
                } catch (error) {
                    console.error('Export error:', error);
                }
            });
        }

        // Import modal events
        const importModal = document.getElementById('importModal');
        const confirmImport = document.getElementById('confirmImport');

        if (confirmImport) {
            confirmImport.addEventListener('click', async () => {
                const passphrase = document.getElementById('importPassphrase').value;
                
                if (!passphrase) {
                    this.showSnackbar('Please enter a passphrase', 'error');
                    return;
                }

                if (this.pendingImportFile) {
                    // Hide error message
                    const errorDiv = document.getElementById('importError');
                    if (errorDiv) {
                        errorDiv.classList.add('d-none');
                    }
                    
                    await this.importDataEncrypted(this.pendingImportFile, passphrase);
                    
                    // Reset form
                    document.getElementById('importForm').reset();
                    this.pendingImportFile = null;
                }
            });
        }

        // Reset modals when closed
        if (exportModal) {
            exportModal.addEventListener('hidden.bs.modal', () => {
                document.getElementById('exportForm').reset();
                emailFields.style.display = 'none';
            });
        }

        if (importModal) {
            importModal.addEventListener('hidden.bs.modal', () => {
                document.getElementById('importForm').reset();
                const errorDiv = document.getElementById('importError');
                if (errorDiv) {
                    errorDiv.classList.add('d-none');
                }
                this.pendingImportFile = null;
            });
        }
    }

    // Handle file selection for import
    handleFileSelect(e) {
        const file = e.target.files[0];
        if (!file) return;

        // Check if file looks like it might be encrypted
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const content = JSON.parse(event.target.result);
                if (content.encrypted || content.version === '1.0') {
                    // This looks like an encrypted file, show passphrase modal
                    this.showImportModal(file);
                } else {
                    // This looks like a regular file, import directly
                    this.importData(e);
                }
            } catch (error) {
                // File might be encrypted but parsing failed, show passphrase modal
                this.showImportModal(file);
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    }

    initializeMobileMenu() {
        // Mobile menu elements
        this.mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
        this.mobileMenuOverlay = document.getElementById('mobile-menu-overlay');
        this.mobileMenuPanel = document.getElementById('mobile-menu-panel');
        this.mobileMenuClose = document.querySelector('.mobile-menu-close');
        
        // Scroll detection for mobile header
        let lastScrollY = window.scrollY;
        const header = document.querySelector('header');
        
        if (header) {
            window.addEventListener('scroll', () => {
                const currentScrollY = window.scrollY;
                
                // Only apply on mobile screens
                if (window.innerWidth <= 767) {
                    if (currentScrollY > 100) {
                        header.classList.add('scrolled');
                    } else {
                        header.classList.remove('scrolled');
                    }
                }
                
                lastScrollY = currentScrollY;
            });
        }
        
        // Mobile menu toggle
        if (this.mobileMenuToggle) {
            this.mobileMenuToggle.addEventListener('click', () => {
                this.openMobileMenu();
            });
        }
        
        // Mobile menu close
        if (this.mobileMenuClose) {
            this.mobileMenuClose.addEventListener('click', () => {
                this.closeMobileMenu();
            });
        }
        
        // Mobile menu overlay
        if (this.mobileMenuOverlay) {
            this.mobileMenuOverlay.addEventListener('click', () => {
                this.closeMobileMenu();
            });
        }
        
        // Mobile menu item handlers
        this.bindMobileMenuItems();
        
        // Close menu on window resize if it becomes desktop
        window.addEventListener('resize', () => {
            if (window.innerWidth > 767) {
                this.closeMobileMenu();
                document.querySelector('header').classList.remove('scrolled');
            }
        });
    }

    openMobileMenu() {
        if (this.mobileMenuOverlay && this.mobileMenuPanel) {
            this.mobileMenuOverlay.classList.add('active');
            this.mobileMenuPanel.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    closeMobileMenu() {
        if (this.mobileMenuOverlay && this.mobileMenuPanel) {
            this.mobileMenuOverlay.classList.remove('active');
            this.mobileMenuPanel.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    bindMobileMenuItems() {
        // Export data
        const mobileExportBtn = document.getElementById('mobile-export-btn');
        if (mobileExportBtn) {
            mobileExportBtn.addEventListener('click', () => {
                this.showExportModal();
                this.closeMobileMenu();
            });
        }
        
        // Import data
        const mobileImportBtn = document.getElementById('mobile-import-btn');
        const mobileImportFile = document.getElementById('mobile-import-file');
        if (mobileImportBtn && mobileImportFile) {
            mobileImportBtn.addEventListener('click', () => {
                mobileImportFile.click();
            });
            
            mobileImportFile.addEventListener('change', (e) => {
                this.handleFileSelect(e);
                this.closeMobileMenu();
            });
        }
        
        // Currency selector
        const mobileCurrencyBtn = document.getElementById('mobile-currency-btn');
        const mobileCurrencyList = document.querySelector('.mobile-currency-list');
        if (mobileCurrencyBtn && mobileCurrencyList) {
            mobileCurrencyBtn.addEventListener('click', () => {
                const isVisible = mobileCurrencyList.style.display === 'block';
                mobileCurrencyList.style.display = isVisible ? 'none' : 'block';
            });
            
            // Currency selection
            mobileCurrencyList.querySelectorAll('.dropdown-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    const currency = e.target.dataset.currency;
                    const symbol = e.target.dataset.symbol;
                    this.updateCurrency(currency, symbol);
                    mobileCurrencyList.style.display = 'none';
                    this.closeMobileMenu();
                });
            });
        }
        
        // Tooltip toggle
        const mobileTooltipBtn = document.getElementById('mobile-tooltip-btn');
        if (mobileTooltipBtn) {
            mobileTooltipBtn.addEventListener('click', () => {
                this.toggleTooltips();
                this.closeMobileMenu();
            });
        }
    }

    updateCurrency(currency, symbol) {
        this.state.currentCurrency = currency;
        this.state.currentCurrencySymbol = symbol;
        
        localStorage.setItem('selectedCurrency', currency);
        localStorage.setItem('selectedCurrencySymbol', symbol);
        
        // Update current currency display
        const currentCurrencySpan = document.getElementById('current-currency');
        if (currentCurrencySpan) {
            currentCurrencySpan.textContent = `${symbol} ${currency}`;
        }
        
        // Refresh displays
        this.updateSummary();
        this.renderTransactions();
        this.renderMonthlyTransactions();
        
        this.showSnackbar(`Currency changed to ${currency}`, 'success');
    }

    toggleTooltips() {
        this.state.tooltipsEnabled = !this.state.tooltipsEnabled;
        localStorage.setItem('tooltipsEnabled', this.state.tooltipsEnabled);
        this.showSnackbar(`Tooltips ${this.state.tooltipsEnabled ? 'enabled' : 'disabled'}`, 'info', true);
    }

    toggleHelpSection() {
        const helpContent = document.getElementById('help-section-content');
        const toggleIcon = document.querySelector('#toggle-help-section i');
        
        if (helpContent && toggleIcon) {
            const isCollapsed = helpContent.style.display === 'none';
            
            if (isCollapsed) {
                helpContent.style.display = 'block';
                toggleIcon.className = 'bi bi-chevron-up';
            } else {
                helpContent.style.display = 'none';
                toggleIcon.className = 'bi bi-chevron-down';
            }
            
            // Save state to localStorage
            localStorage.setItem('helpSectionCollapsed', !isCollapsed);
        }
    }

    initializeHelpSection() {
        const helpContent = document.getElementById('help-section-content');
        const toggleIcon = document.querySelector('#toggle-help-section i');
        
        if (helpContent && toggleIcon) {
            // Check if user has collapsed the help section before
            const isCollapsed = localStorage.getItem('helpSectionCollapsed') === 'true';
            
            if (isCollapsed) {
                helpContent.style.display = 'none';
                toggleIcon.className = 'bi bi-chevron-down';
            } else {
                helpContent.style.display = 'block';
                toggleIcon.className = 'bi bi-chevron-up';
            }
        }
    }

    async initialize() {
        this.showSkeletons(true);
        try {
            this.showLoading(true);
            await this.loadConfiguration();
            this.initializeCurrency();
            this.setupTypeChangeListeners();
            
            if (!this.isTransactionsPage) {
                this.initializeChartDisplay();
            }
            
            this.initializeDateField();
            this.renderTransactions();
            
            if (!this.isTransactionsPage) {
                this.renderMonthlyTransactions();
                this.updateChart();
            }
            
            this.updateSummary();
            this.setupTooltips();
            this.updateTooltipButtonState();
            this.setupCategoryFilters();
            
            if (!this.isTransactionsPage) {
                this.setupMonthlyCategoryFilters();
            }
            
            this.setupKeyboardShortcuts();
            this.initializeHelpSection();
            
            // Transactions page specific initialization
            if (this.isTransactionsPage) {
                console.log('Initializing transactions page specific features');
                this.updateTransactionCount();
                this.showListHeader();
                console.log('Transactions page initialization complete');
            }
            
            console.log('BudgetTracker initialized successfully');
        } catch (error) {
            console.error('Failed to initialize BudgetTracker:', error);
            this.showCriticalError('Failed to initialize application. Please refresh the page.');
        } finally {
            this.showLoading(false);
            this.showSkeletons(false);
        }
    }

    showListHeader() {
        try {
            if (this.elements.listHeader && this.state.transactions.length > 0) {
                this.elements.listHeader.style.display = 'flex';
                console.log('List header shown');
            } else {
                console.log('List header not shown:', {
                    hasElement: !!this.elements.listHeader,
                    transactionCount: this.state.transactions.length
                });
            }
        } catch (error) {
            console.error('Error in showListHeader:', error);
        }
    }

    showSkeletons(show) {
        const overviewContent = document.getElementById('budget-overview-content');
        const overviewSkeleton = document.getElementById('budget-overview-skeleton');
        const transactionContent = document.getElementById('transaction-list');
        const transactionSkeleton = document.getElementById('transaction-list-skeleton');
        const monthlyTransactionContent = document.getElementById('monthly-transaction-list');
        const monthlyTransactionSkeleton = document.getElementById('monthly-transaction-list-skeleton');

        if (show) {
            // Chart overview elements (only on dashboard)
            if (overviewContent) overviewContent.style.display = 'none';
            if (overviewSkeleton) overviewSkeleton.style.display = 'block';
            
            // Transaction list elements (on both pages)
            if (transactionContent) transactionContent.style.display = 'none';
            if (transactionSkeleton) transactionSkeleton.style.display = 'block';
            
            // Monthly transaction elements (only on dashboard)
            if (monthlyTransactionContent) monthlyTransactionContent.style.display = 'none';
            if (monthlyTransactionSkeleton) monthlyTransactionSkeleton.style.display = 'block';
        } else {
            // Chart overview elements (only on dashboard)
            if (overviewContent) overviewContent.style.display = 'block';
            if (overviewSkeleton) overviewSkeleton.style.display = 'none';
            
            // Transaction list elements (on both pages)
            if (transactionContent) transactionContent.style.display = 'block';
            if (transactionSkeleton) transactionSkeleton.style.display = 'none';
            
            // Monthly transaction elements (only on dashboard)
            if (monthlyTransactionContent) monthlyTransactionContent.style.display = 'block';
            if (monthlyTransactionSkeleton) monthlyTransactionSkeleton.style.display = 'none';
        }
    }

    showSnackbar(message, type = 'success', important = false) {
        if (!this.elements.snackbar) return;

        // Only show snackbar for important messages
        if (!important) {
            const nonEssentialTypes = ['info'];
            if (nonEssentialTypes.includes(type)) {
                return;
            }
        }

        this.elements.snackbar.innerHTML = `
            <span>${message}</span>
            <button class="snackbar-close">&times;</button>
        `;
        this.elements.snackbar.className = `snackbar ${type}`;
        this.elements.snackbar.classList.add('show');

        // Auto-dismiss after 3 seconds
        const timeoutId = setTimeout(() => {
            this.elements.snackbar.classList.remove('show');
        }, 3000);

        // Allow manual closing
        const closeButton = this.elements.snackbar.querySelector('.snackbar-close');
        closeButton.addEventListener('click', () => {
            clearTimeout(timeoutId);
            this.elements.snackbar.classList.remove('show');
        });
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
            // Use correct path based on current page location
            const jsonPath = this.isTransactionsPage ? '../assets/json/transaction-types.json' : 'assets/json/transaction-types.json';
            const response = await fetch(jsonPath);
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

    initializeDateField() {
        const dateInput = document.getElementById('date');
        if (dateInput) {
            const today = new Date();
            const todayString = today.toISOString().split('T')[0];
            dateInput.value = todayString;
            this.updateDateTags();
        }
    }

    getRelativeDateText(dateString) {
        if (!dateString) return null;
        
        const inputDate = new Date(dateString + 'T00:00:00');
        const today = new Date();
        const yesterday = new Date(today);
        const tomorrow = new Date(today);
        
        yesterday.setDate(today.getDate() - 1);
        tomorrow.setDate(today.getDate() + 1);
        
        // Reset time for accurate comparison
        today.setHours(0, 0, 0, 0);
        yesterday.setHours(0, 0, 0, 0);
        tomorrow.setHours(0, 0, 0, 0);
        inputDate.setHours(0, 0, 0, 0);
        
        if (inputDate.getTime() === today.getTime()) {
            return { text: 'Today', class: 'today' };
        } else if (inputDate.getTime() === yesterday.getTime()) {
            return { text: 'Yesterday', class: 'yesterday' };
        } else if (inputDate.getTime() === tomorrow.getTime()) {
            return { text: 'Tomorrow', class: 'future' };
        } else if (inputDate > today) {
            const diffTime = Math.abs(inputDate - today);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays <= 7) {
                return { text: `+${diffDays}d`, class: 'future' };
            }
        } else if (inputDate < today) {
            const diffTime = Math.abs(today - inputDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays <= 7) {
                return { text: `-${diffDays}d`, class: 'yesterday' };
            }
        }
        
        return null;
    }

    getTransactionDateDisplay(transactionDate) {
        const date = new Date(transactionDate);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        
        // Reset time for accurate comparison
        today.setHours(0, 0, 0, 0);
        yesterday.setHours(0, 0, 0, 0);
        date.setHours(0, 0, 0, 0);
        
        if (date.getTime() === today.getTime()) {
            return `<span class="transaction-date">
                <span class="date-relative-tag today" style="font-size: 0.7rem;">Today</span>
            </span>`;
        } else if (date.getTime() === yesterday.getTime()) {
            return `<span class="transaction-date">
                <span class="date-relative-tag yesterday" style="font-size: 0.7rem;">Yesterday</span>
            </span>`;
        } else {
            // Format as "29 Dec 2024"
            const day = date.getDate();
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const month = monthNames[date.getMonth()];
            const year = date.getFullYear();
            
            return `<span class="transaction-date">${day} ${month} ${year}</span>`;
        }
    }

    getDateOptions() {
        const today = new Date();
        const options = [];
        
        // Add quick date options
        const dateOptions = [
            { days: 0, label: 'Today' },
            { days: -1, label: 'Yesterday' },
            { days: -2, label: '2 days ago' },
            { days: -3, label: '3 days ago' },
            { days: -4, label: '4 days ago' },
            { days: -5, label: '5 days ago' },
            { days: -6, label: '6 days ago' },
            { days: -7, label: '1 week ago' },
        ];
        
        dateOptions.forEach(option => {
            const date = new Date(today);
            date.setDate(today.getDate() + option.days);
            const dateString = date.toISOString().split('T')[0];
            
            options.push({
                dateString,
                label: option.label,
                days: option.days
            });
        });
        
        return options;
    }

    updateDateTags() {
        const dateInput = document.getElementById('date');
        const dateTagsContainer = document.querySelector('.date-quick-tags');
        const clearDateBtn = document.getElementById('clear-date-btn');
        
        if (!dateInput || !dateTagsContainer) return;
        
        const currentDate = dateInput.value;
        const dateOptions = this.getDateOptions();
        
        dateTagsContainer.innerHTML = '';
        
        dateOptions.forEach(option => {
            const chip = document.createElement('button');
            chip.type = 'button';
            chip.className = `date-tag-chip ${currentDate === option.dateString ? 'active' : ''}`;
            chip.textContent = option.label;
            
            chip.addEventListener('click', (e) => {
                e.preventDefault();
                dateInput.value = option.dateString;
                this.updateDateTags();
            });
            
            dateTagsContainer.appendChild(chip);
        });
        
        // Show/hide clear button
        const today = new Date().toISOString().split('T')[0];
        const showClear = currentDate !== today;
        clearDateBtn.classList.toggle('show', showClear);
        
        if (dateOptions.length === 0) {
            dateTagsContainer.classList.add('empty');
        } else {
            dateTagsContainer.classList.remove('empty');
        }
    }

    clearDateToToday() {
        const dateInput = document.getElementById('date');
        if (dateInput) {
            const today = new Date().toISOString().split('T')[0];
            dateInput.value = today;
            this.updateDateTags();
            
            // Add subtle feedback
            dateInput.style.transform = 'scale(0.98)';
            setTimeout(() => {
                dateInput.style.transform = '';
            }, 150);
        }
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
            this.showSnackbar('Currency changed but failed to save setting', 'warning', true);
        }
        
        this.initializeCurrency();
        this.renderTransactions();
        this.renderMonthlyTransactions();
        this.showSnackbar(`Currency changed to ${currency}`, 'success', true);
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
            date: formData.get('date') ? new Date(formData.get('date')).toISOString() : new Date().toISOString()
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
        this.renderMonthlyTransactions();
        this.updateChart();
        this.updateSummary();
        
        // Update transactions page specific elements
        if (this.isTransactionsPage) {
            this.updateTransactionCount();
            this.showListHeader();
        }
        
        // Update tag chips to reflect new usage counts
        if (this.elements.tagsChips) {
            this.updateTagChips();
        }
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
            if (!this.isTransactionsPage) {
                this.setupMonthlyCategoryFilters(); // Refresh monthly category filters
                this.renderMonthlyTransactions(); // Refresh monthly display
                this.updateChart(); // Refresh chart
            }
            this.updateSummary(); // Always update summary
            if (this.isTransactionsPage) {
                this.updateTransactionCount();
                this.showListHeader();
            }
            this.showSnackbar('Transaction added successfully', 'success', true);
        } catch (error) {
            console.error('Error adding transaction:', error);
            this.showSnackbar('Failed to add transaction. Please try again.', 'error', true);
        }
    }

    updateTransaction(transaction) {
        try {
            const index = this.state.transactions.findIndex(t => t.id === transaction.id);
            if (index !== -1) {
                this.state.transactions[index] = transaction;
                this.setupCategoryFilters(); // Refresh category filters
                if (!this.isTransactionsPage) {
                    this.setupMonthlyCategoryFilters(); // Refresh monthly category filters
                    this.renderMonthlyTransactions(); // Refresh monthly display
                    this.updateChart(); // Refresh chart
                }
                this.updateSummary(); // Always update summary
                if (this.isTransactionsPage) {
                    this.updateTransactionCount();
                }
                this.showSnackbar('Transaction updated successfully', 'success', true);
            } else {
                throw new Error('Transaction not found');
            }
        } catch (error) {
            console.error('Error updating transaction:', error);
            this.showSnackbar('Failed to update transaction. Please try again.', 'error', true);
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
            this.setupCategoryFilters(); // Refresh category filters
            if (!this.isTransactionsPage) {
                this.setupMonthlyCategoryFilters(); // Refresh monthly category filters BEFORE rendering
                this.renderMonthlyTransactions();
                this.updateChart();
            }
            this.renderTransactions();
            this.updateSummary();
            if (this.isTransactionsPage) {
                this.updateTransactionCount();
            }
            this.showSnackbar('Transaction deleted successfully', 'success', true);
            console.log('Transaction deleted successfully');
        } catch (error) {
            console.error('Error deleting transaction:', error);
            this.showSnackbar('Failed to delete transaction. Please try again.', 'error', true);
        }
    }

    clearAllTransactions() {
        try {
            console.log('Clearing all transactions');
            this.state.transactions = [];
            this.saveTransactions();
            this.renderTransactions();
            this.renderMonthlyTransactions();
            this.updateChart();
            this.updateSummary();
            this.setupCategoryFilters();
            this.setupMonthlyCategoryFilters();
            this.showSnackbar('All transactions cleared. Ready for fresh start!', 'success', true);
            console.log('All transactions cleared successfully');
        } catch (error) {
            console.error('Error clearing transactions:', error);
            this.showSnackbar('Failed to clear transactions. Please try again.', 'error', true);
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
        
        // Set the date from the transaction
        const dateInput = form.querySelector('#date');
        if (dateInput && transaction.date) {
            const transactionDate = new Date(transaction.date);
            const dateString = transactionDate.toISOString().split('T')[0];
            dateInput.value = dateString;
            this.updateDateTags();
        }
        
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

    // Edit modal functionality for transactions page
    openEditModal(id) {
        console.log('openEditModal called with ID:', id);
        const transaction = this.state.transactions.find(t => t.id === id);
        if (!transaction) {
            console.error('Transaction not found for ID:', id);
            return;
        }

        // Get modal elements
        const modal = document.getElementById('edit-transaction-modal');
        if (!modal) {
            console.error('Edit transaction modal not found in DOM');
            return;
        }
        console.log('Modal found, populating with transaction:', transaction);
        console.log('Transaction category:', transaction.category, 'Transaction type:', transaction.type);
        console.log('Transaction types loaded:', !!this.state.transactionTypes);
        console.log('Number of income categories:', this.state.transactionTypes?.income?.types?.length || 0);
        if (this.state.transactionTypes?.income?.types?.length === 3) {
            console.warn('⚠️ Using FALLBACK categories - JSON file failed to load!');
        } else {
            console.log('✅ Using FULL categories from JSON file');
        }

        // Populate form with transaction data
        document.getElementById('edit-transaction-id').value = transaction.id;
        document.querySelector(`input[name="edit-type"][value="${transaction.type}"]`).checked = true;
        
        const amountInput = document.getElementById('edit-amount');
        amountInput.value = transaction.amount;
        amountInput.placeholder = `Amount (${this.state.currentCurrencySymbol})`;
        
        document.getElementById('edit-description').value = transaction.description;
        
        // Set the date
        const dateInput = document.getElementById('edit-date');
        if (dateInput && transaction.date) {
            const transactionDate = new Date(transaction.date);
            const dateString = transactionDate.toISOString().split('T')[0];
            dateInput.value = dateString;
        }

        // Populate categories based on type
        console.log('About to populate categories for type:', transaction.type);
        this.populateEditCategories(transaction.type);
        
        // Try multiple times to set the category value with increasing delays
        const trySetCategory = (attempt = 1) => {
            const categorySelect = document.getElementById('edit-category');
            if (categorySelect && categorySelect.options.length > 1) {
                const availableOptions = Array.from(categorySelect.options).map(o => o.value);
                console.log('=== CATEGORY DEBUG ===');
                console.log('Available options:', availableOptions);
                console.log('Transaction category:', transaction.category);
                console.log('Match found:', availableOptions.includes(transaction.category));
                console.table(Array.from(categorySelect.options).map(o => ({ value: o.value, text: o.text })));
                
                categorySelect.value = transaction.category;
                
                if (categorySelect.value === transaction.category) {
                    console.log('✅ Category set successfully:', transaction.category);
                } else {
                    console.log('❌ Category not set. Current value:', categorySelect.value);
                    if (attempt < 3) {
                        setTimeout(() => trySetCategory(attempt + 1), 100 * attempt);
                    } else {
                        console.error('Failed to set category after 3 attempts');
                    }
                }
            } else {
                console.log(`Attempt ${attempt} - Category select not ready:`, {
                    found: !!categorySelect,
                    optionCount: categorySelect?.options.length || 0
                });
                if (attempt < 5) {
                    setTimeout(() => trySetCategory(attempt + 1), 50 * attempt);
                }
            }
        };
        
        // Start trying to set the category
        setTimeout(() => trySetCategory(1), 50);

        // Handle tags - convert from comma-separated string to array
        if (transaction.tags && typeof transaction.tags === 'string') {
            this.editModalTags = transaction.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
        } else if (Array.isArray(transaction.tags)) {
            this.editModalTags = [...transaction.tags];
        } else {
            this.editModalTags = [];
        }
        this.renderEditModalTags();

        // Setup date quick tags
        this.setupEditModalDateTags();

        // Show modal
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
        
        console.log('Edit modal should now be visible');
    }

    populateEditCategories(type) {
        const categorySelect = document.getElementById('edit-category');
        if (!categorySelect) {
            console.error('Edit category select not found');
            return;
        }

        categorySelect.innerHTML = '<option value="">Select Category</option>';
        
        if (this.state.transactionTypes?.[type]) {
            console.log('Populating categories for type:', type, 'Categories:', this.state.transactionTypes[type].types);
            const categoriesAdded = [];
            this.state.transactionTypes[type].types.forEach(category => {
                const option = document.createElement('option');
                option.value = category.value;
                option.textContent = category.label;
                categorySelect.appendChild(option);
                categoriesAdded.push(category.value);
            });
            console.log('Categories added to dropdown:', categoriesAdded);
        } else {
            console.error('No transaction types found for type:', type, 'Available types:', this.state.transactionTypes);
        }
    }

    setupEditModalDateTags() {
        const container = document.getElementById('edit-date-quick-tags');
        if (!container) return;

        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const thisWeekStart = new Date(today);
        thisWeekStart.setDate(today.getDate() - today.getDay());
        
        const lastWeekStart = new Date(thisWeekStart);
        lastWeekStart.setDate(lastWeekStart.getDate() - 7);

        const dateOptions = [
            { label: 'Today', date: today.toISOString().split('T')[0] },
            { label: 'Yesterday', date: yesterday.toISOString().split('T')[0] },
            { label: 'This Week', date: thisWeekStart.toISOString().split('T')[0] },
            { label: 'Last Week', date: lastWeekStart.toISOString().split('T')[0] }
        ];

        container.innerHTML = '';
        dateOptions.forEach(option => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'btn btn-sm btn-outline-secondary';
            button.textContent = option.label;
            button.style.fontSize = '0.75rem';
            button.style.padding = '0.25rem 0.5rem';
            button.onclick = () => {
                document.getElementById('edit-date').value = option.date;
                // Update visual state
                container.querySelectorAll('button').forEach(b => b.classList.remove('btn-primary'));
                container.querySelectorAll('button').forEach(b => b.classList.add('btn-outline-secondary'));
                button.classList.remove('btn-outline-secondary');
                button.classList.add('btn-primary');
            };
            container.appendChild(button);
        });
    }

    renderEditModalTags() {
        const container = document.getElementById('edit-tags-chips');
        if (!container) return;

        container.innerHTML = '';
        this.editModalTags.forEach(tag => {
            const chip = document.createElement('span');
            chip.className = 'badge bg-primary d-flex align-items-center gap-1';
            chip.innerHTML = `
                ${tag}
                <button type="button" class="btn-close btn-close-white" style="font-size: 0.6rem; padding: 0" onclick="window.budgetTracker.removeEditModalTag('${tag}')" aria-label="Remove ${tag} tag"></button>
            `;
            container.appendChild(chip);
        });

        // Update clear button state
        const clearBtn = document.getElementById('edit-clear-tags-btn');
        if (clearBtn) {
            clearBtn.disabled = this.editModalTags.length === 0;
        }
    }

    addEditModalTag(tag) {
        const trimmedTag = tag.trim().toLowerCase();
        if (trimmedTag && !this.editModalTags.includes(trimmedTag)) {
            this.editModalTags.push(trimmedTag);
            this.renderEditModalTags();
            document.getElementById('edit-tags').value = '';
        }
    }

    removeEditModalTag(tag) {
        this.editModalTags = this.editModalTags.filter(t => t !== tag);
        this.renderEditModalTags();
    }

    clearEditModalTags() {
        this.editModalTags = [];
        this.renderEditModalTags();
        document.getElementById('edit-tags').value = '';
    }

    saveEditTransaction() {
        console.log('saveEditTransaction called');
        const form = document.getElementById('edit-transaction-form');
        const formData = new FormData(form);
        
        const transactionId = document.getElementById('edit-transaction-id').value;
        const type = formData.get('edit-type');
        const amount = parseFloat(formData.get('edit-amount'));
        const description = formData.get('edit-description');
        const date = formData.get('edit-date');
        const category = formData.get('edit-category');

        console.log('Form data extracted:', { transactionId, type, amount, description, date, category });

        // Validation
        if (!type || !amount || !description || !date || !category) {
            console.error('Validation failed:', { type: !!type, amount: !!amount, description: !!description, date: !!date, category: !!category });
            this.showSnackbar('Please fill in all required fields', 'error');
            return;
        }

        // Find and update transaction
        const transactionIndex = this.state.transactions.findIndex(t => t.id === transactionId);
        console.log('Transaction lookup:', { transactionId, transactionIndex, totalTransactions: this.state.transactions.length });
        if (transactionIndex === -1) {
            console.error('Transaction not found with ID:', transactionId);
            this.showSnackbar('Transaction not found', 'error');
            return;
        }

        // Get category emoji
        const categoryData = this.state.transactionTypes?.[type]?.types?.find(cat => cat.value === category);
        const emoji = categoryData ? categoryData.emoji : '💳';

        // Update transaction
        this.state.transactions[transactionIndex] = {
            ...this.state.transactions[transactionIndex],
            type,
            amount,
            description,
            date,
            category,
            tags: this.editModalTags.join(', '), // Convert array back to comma-separated string
            emoji
        };

        // Save to localStorage
        this.saveTransactions();

        // Close modal
        const modal = document.getElementById('edit-transaction-modal');
        const bsModal = bootstrap.Modal.getInstance(modal);
        if (bsModal) {
            bsModal.hide();
        } else {
            console.warn('Bootstrap modal instance not found, hiding manually');
            modal?.classList.remove('show');
            document.body.classList.remove('modal-open');
            const backdrop = document.querySelector('.modal-backdrop');
            backdrop?.remove();
        }

        // Refresh displays
        console.log('Refreshing displays after update');
        this.renderTransactions();
        if (!this.isTransactionsPage) {
            this.renderMonthlyTransactions();
            this.updateChart();
        }
        this.updateSummary();
        this.setupCategoryFilters();
        if (this.isTransactionsPage) {
            this.updateTransactionCount();
        }
        
        console.log('Transaction update completed successfully');
        this.showSnackbar('Transaction updated successfully!', 'success');
    }

    handleFreshStart() {
        if (this.state.transactions.length === 0) {
            this.showSnackbar('No transactions to clear', 'info', true);
            return;
        }

        this.showFreshStartConfirmation();
    }

    showFreshStartConfirmation() {
        const transactionCount = this.state.transactions.length;
        
        // Create modern confirmation dialog
        const modal = document.createElement('div');
        modal.className = 'delete-confirmation-modal';
        modal.innerHTML = `
            <div class="modal-backdrop">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="bi bi-exclamation-triangle text-warning me-2"></i>
                            Fresh Start Warning
                        </h5>
                    </div>
                    <div class="modal-body">
                        <p><strong>This will permanently DELETE ALL ${transactionCount} transactions from your budget tracker.</strong></p>
                        <div class="fresh-start-warning">
                            <p>You will lose:</p>
                            <ul class="text-muted">
                                <li>All income and expense records</li>
                                <li>Transaction history and categories</li>
                                <li>All your financial data</li>
                            </ul>
                        </div>
                        <p class="text-danger small mt-3">
                            <i class="bi bi-exclamation-circle me-1"></i>
                            This action CANNOT BE UNDONE! You'll start with a completely fresh slate.
                        </p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary cancel-btn">Cancel</button>
                        <button type="button" class="btn btn-warning confirm-btn">
                            <i class="bi bi-arrow-clockwise me-1"></i>Fresh Start
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
            this.clearAllTransactions();
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

    resetForm() {
        // Get the currently selected transaction type before resetting
        const currentTypeElement = this.elements.transactionForm.querySelector('input[name="type"]:checked');
        const currentType = currentTypeElement ? currentTypeElement.value : 'income';
        
        this.elements.transactionForm.reset();
        this.elements.cancelEditBtn.style.display = 'none';
        this.elements.transactionForm.querySelector('button[type="submit"]').textContent = 'Save Transaction';
        
        // Restore the previously selected transaction type
        this.elements.transactionForm.querySelector(`input[name="type"][value="${currentType}"]`).checked = true;
        this.populateCategories(currentType);
        
        // Set today's date as default
        const dateInput = document.getElementById('date');
        if (dateInput) {
            const today = new Date();
            const todayString = today.toISOString().split('T')[0];
            dateInput.value = todayString;
            this.updateDateTags();
        }
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
        const emoji = this.getCategoryEmoji(transaction.category);
        const formattedAmount = this.formatCurrency(transaction.amount);
        const dateDisplay = this.getTransactionDateDisplay(transaction.date);
        
        const tags = (transaction.tags && typeof transaction.tags === 'string') ? 
            transaction.tags.split(',').map(tag => 
                `<span class="badge bg-secondary">${tag.trim()}</span>`
            ).join(' ') : '';

        const safeId = String(transaction.id).replace(/['"]/g, '');

        // Add checkbox for bulk selection on transactions page
        const checkboxHtml = this.isTransactionsPage ? `
            <div class="transaction-checkbox">
                <div class="form-check">
                    <input class="form-check-input transaction-select" type="checkbox" 
                           data-transaction-id="${safeId}" onchange="window.budgetTracker?.updateBulkActions()">
                </div>
            </div>
        ` : '';

        return `
            <li class="list-group-item transaction-item" data-transaction-id="${safeId}">
                <div class="transaction-item-grid ${this.isTransactionsPage ? 'with-checkbox' : ''}">
                    ${checkboxHtml}
                    <div class="transaction-icon">
                        <span class="transaction-emoji">${emoji}</span>
                    </div>
                    <div class="transaction-details">
                        <div class="transaction-description">${transaction.description}</div>
                        <div class="transaction-meta">
                            <span>${dateDisplay}</span>
                            ${tags ? `<span>${tags}</span>` : ''}
                        </div>
                    </div>
                    <div class="transaction-amount">
                        <span class="amount ${transaction.type}">${transaction.type === 'expense' ? '−' : '+'} ${formattedAmount}</span>
                    </div>
                    <div class="transaction-actions">
                        <button class="btn btn-sm btn-outline-primary edit-btn" data-action="edit" data-id="${safeId}" title="Edit transaction">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger delete-btn" data-action="delete" data-id="${safeId}" title="Delete transaction">
                            <i class="bi bi-trash"></i>
                        </button>
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
        
        // For dashboard (not transactions page): Sort by amount (highest first) and limit to top 10
        if (!this.isTransactionsPage) {
            const sortedByAmount = filtered.sort((a, b) => b.amount - a.amount);
            const top10 = sortedByAmount.slice(0, 10);
            
            if (this.state.currentSearchTerm) {
                console.log(`Filtered ${filtered.length} transactions, showing top 10 by amount`);
            }
            
            return top10;
        }
        
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
            this.renderMonthlyTransactions();
            
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
        this.renderMonthlyTransactions();
        this.updateFilterUI();
        
        // Show filter feedback
        const filterLabels = {
            'all': 'All Transactions',
            'income': 'Income Only',
            'expense': 'Expenses Only'
        };
        this.showSnackbar(`Showing: ${filterLabels[filter]}`, 'info');
    }

    // Monthly Transactions Methods
    renderMonthlyTransactions() {
        try {
            console.log('Rendering monthly transactions...');
            if (!this.elements.monthlyTransactionList) {
                console.error('Monthly transaction list element not found');
                return;
            }
            
            const monthlyTransactions = this.getMonthlyFilteredTransactions();
            console.log('Monthly filtered transactions:', monthlyTransactions.length);
            
            if (monthlyTransactions.length === 0) {
                this.showEmptyMonthlyTransactionState();
                return;
            }

            this.elements.emptyMonthlyMessage.style.display = 'none';
            const transactionElements = monthlyTransactions
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .map(transaction => {
                    try {
                        return this.createTransactionElement(transaction);
                    } catch (error) {
                        console.error('Error creating monthly transaction element:', error, transaction);
                        return this.createErrorTransactionElement(transaction.id);
                    }
                });
            
            this.elements.monthlyTransactionList.innerHTML = transactionElements.join('');
            console.log('Rendered', transactionElements.length, 'monthly transactions');
            
            // Add event delegation for monthly transaction buttons
            this.setupMonthlyTransactionEventDelegation();
            
        } catch (error) {
            console.error('Error rendering monthly transactions:', error);
            this.showSnackbar('Failed to display monthly transactions', 'error');
        }
    }

    showEmptyMonthlyTransactionState() {
        this.elements.monthlyTransactionList.innerHTML = '';
        
        const currentMonthTransactions = this.getThisMonthTransactions();
        const isEmpty = currentMonthTransactions.length === 0;
        const hasNoFilterResults = currentMonthTransactions.length > 0 && this.getMonthlyFilteredTransactions().length === 0;
        
        let emptyMessage = {
            icon: 'bi-calendar-month',
            title: 'No Transactions This Month',
            subtitle: 'Your monthly transactions will appear here.'
        };
        
        if (hasNoFilterResults) {
            const filterType = this.state.currentMonthlyFilter;
            
            emptyMessage = {
                icon: 'bi-funnel',
                title: 'No Matching Monthly Transactions',
                subtitle: `No monthly transactions found for current filters.${filterType !== 'all' ? ` Try changing the type filter.` : ''}`
            };
        } else if (isEmpty) {
            emptyMessage = {
                icon: 'bi-calendar-plus',
                title: 'No Transactions This Month Yet',
                subtitle: 'Add transactions using the form above to see them appear here for this month.'
            };
        }
        
        this.elements.emptyMonthlyMessage.innerHTML = `
            <i class="${emptyMessage.icon}" aria-hidden="true"></i>
            <p>${emptyMessage.title}</p>
            <small class="text-muted">${emptyMessage.subtitle}</small>
        `;
        this.elements.emptyMonthlyMessage.style.display = 'block';
    }

    getThisMonthTransactions() {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        return this.state.transactions.filter(transaction => {
            const transactionDate = new Date(transaction.date);
            return transactionDate.getMonth() === currentMonth && 
                   transactionDate.getFullYear() === currentYear;
        });
    }

    getMonthlyFilteredTransactions() {
        const thisMonthTransactions = this.getThisMonthTransactions();
        
        const filtered = thisMonthTransactions.filter(transaction => {
            const typeMatch = this.state.currentMonthlyFilter === 'all' || transaction.type === this.state.currentMonthlyFilter;
            const categoryMatch = this.state.currentMonthlyCategoryFilter === 'all' || transaction.category === this.state.currentMonthlyCategoryFilter;
            
            let searchMatch = true;
            if (this.state.currentMonthlySearchTerm) {
                const searchTerm = this.state.currentMonthlySearchTerm.toLowerCase();
                const description = (transaction.description || '').toLowerCase();
                const tags = (transaction.tags || '').toLowerCase();
                const category = (transaction.category || '').toLowerCase();
                
                searchMatch = description.includes(searchTerm) || 
                             tags.includes(searchTerm) || 
                             category.includes(searchTerm);
            }
            
            return typeMatch && categoryMatch && searchMatch;
        });
        
        return filtered;
    }

    handleMonthlySearchInput(e) {
        const searchTerm = e.target.value.trim();
        console.log('Monthly search input:', searchTerm);
        this.state.currentMonthlySearchTerm = searchTerm;
        
        // Debounce search to avoid excessive filtering
        clearTimeout(this.monthlySearchTimeout);
        this.monthlySearchTimeout = setTimeout(() => {
            console.log('Executing monthly search for:', searchTerm);
            this.renderMonthlyTransactions();
            
            if (searchTerm) {
                const count = this.getMonthlyFilteredTransactions().length;
                console.log('Monthly search results:', count);
                this.showSnackbar(`Found ${count} monthly transaction${count !== 1 ? 's' : ''} matching "${searchTerm}"`, 'info');
            }
        }, 300);
    }

    filterMonthlyTransactions(filter) {
        console.log('Filtering monthly transactions by:', filter);
        this.state.currentMonthlyFilter = filter;
        this.renderMonthlyTransactions();
        
        // Show filter feedback
        const filterLabels = {
            'all': 'All Monthly Transactions',
            'income': 'Monthly Income Only',
            'expense': 'Monthly Expenses Only'
        };
        this.showSnackbar(`Showing: ${filterLabels[filter]}`, 'info');
    }

    setupMonthlyTransactionEventDelegation() {
        if (!this.elements.monthlyTransactionList) return;
        
        // Remove existing listeners to prevent duplicates
        this.elements.monthlyTransactionList.removeEventListener('click', this.monthlyTransactionListHandler);
        
        // Create handler function that can be properly removed
        this.monthlyTransactionListHandler = (e) => {
            const button = e.target.closest('button[data-action]');
            if (!button) return;
            
            const action = button.dataset.action;
            const transactionId = button.dataset.id;
            
            if (action === 'edit') {
                this.editTransaction(transactionId);
            } else if (action === 'delete') {
                this.deleteTransaction(transactionId);
            }
        };
        
        this.elements.monthlyTransactionList.addEventListener('click', this.monthlyTransactionListHandler);
    }

    setupMonthlyCategoryFilters() {
        const monthlyCategoryFiltersContainer = document.getElementById('monthly-category-filters');
        if (!monthlyCategoryFiltersContainer) return;

        // Get unique categories from monthly transactions only
        const categories = new Set();
        const monthlyTransactions = this.getThisMonthTransactions();
        monthlyTransactions.forEach(transaction => {
            if (transaction.category) {
                categories.add(transaction.category);
            }
        });

        // Check if current monthly category filter still exists
        if (this.state.currentMonthlyCategoryFilter !== 'all' && !categories.has(this.state.currentMonthlyCategoryFilter)) {
            // Current category no longer exists, reset to "all"
            console.log(`Monthly category filter "${this.state.currentMonthlyCategoryFilter}" no longer exists, resetting to "all"`);
            this.state.currentMonthlyCategoryFilter = 'all';
            // Force re-render the monthly transactions list with the new filter
            setTimeout(() => {
                this.renderMonthlyTransactions();
            }, 0);
        }

        // Create filter tags
        const filterHTML = [
            '<span class="category-filter-tag" data-category="all">All Categories</span>',
            ...Array.from(categories).map(category => {
                const emoji = this.getCategoryEmoji(category);
                const label = this.getCategoryLabel(category);
                return `<span class="category-filter-tag" data-category="${category}">${emoji} ${label}</span>`;
            })
        ].join('');

        monthlyCategoryFiltersContainer.innerHTML = filterHTML;

        // Update UI to reflect current filter
        this.updateMonthlyCategoryFilterUI();

        // Add click handlers
        monthlyCategoryFiltersContainer.addEventListener('click', (e) => {
            const tag = e.target.closest('.category-filter-tag');
            if (tag) {
                this.filterMonthlyByCategory(tag.dataset.category);
            }
        });
    }

    filterMonthlyByCategory(category) {
        this.state.currentMonthlyCategoryFilter = category;
        this.renderMonthlyTransactions();
        this.updateMonthlyCategoryFilterUI();
        
        const filterLabel = category === 'all' ? 'All Categories' : this.getCategoryLabel(category);
        this.showSnackbar(`Monthly category filter: ${filterLabel}`, 'info');
    }

    updateMonthlyCategoryFilterUI() {
        const tags = document.querySelectorAll('#monthly-category-filters .category-filter-tag');
        tags.forEach(tag => {
            if (tag.dataset.category === this.state.currentMonthlyCategoryFilter) {
                tag.classList.add('active');
            } else {
                tag.classList.remove('active');
            }
        });
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
        
        // Show/hide category subtype selector
        console.log('changeChartType called with:', type);
        const selector = this.elements.categorySubtypeSelector;
        console.log('categorySubtypeSelector element:', selector);
        
        if (selector) {
            if (type === 'category') {
                selector.style.setProperty('display', 'flex', 'important');
                console.log('Showing category subtype selector');
            } else {
                selector.style.setProperty('display', 'none', 'important');
                console.log('Hiding category subtype selector');
            }
        } else {
            console.error('categorySubtypeSelector element not found');
        }
        
        this.updateChart();
    }
    
    changeCategorySubtype(subtype) {
        this.state.currentCategorySubtype = subtype;
        this.updateChart();
    }
    
    handleTimeFilterChange(timeFilter) {
        this.state.currentTimeFilter = timeFilter;
        this.updateChart();
        this.updateSummary();
        if (this.isTransactionsPage) {
            this.renderTransactions();
            this.updateTransactionCount();
        }
    }

    handleSortFilterChange(sortFilter) {
        this.state.currentSortFilter = sortFilter;
        if (this.isTransactionsPage) {
            this.renderTransactions();
        }
    }

    clearSearch() {
        if (this.elements.searchInput) {
            this.elements.searchInput.value = '';
            this.handleSearchInput({ target: { value: '' } });
        }
    }

    handleSelectAll(checked) {
        const checkboxes = document.querySelectorAll('#transaction-list input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = checked;
        });
        this.updateBulkActions();
    }

    handleBulkDelete() {
        const selectedCheckboxes = document.querySelectorAll('#transaction-list input[type="checkbox"]:checked');
        const selectedIds = Array.from(selectedCheckboxes).map(cb => cb.dataset.transactionId);
        
        if (selectedIds.length === 0) return;

        if (confirm(`Are you sure you want to delete ${selectedIds.length} transaction(s)?`)) {
            selectedIds.forEach(id => this.deleteTransaction(id));
            this.clearSelection();
            this.showSnackbar(`Deleted ${selectedIds.length} transaction(s)`, 'success');
        }
    }

    clearSelection() {
        const checkboxes = document.querySelectorAll('#transaction-list input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
        if (this.elements.selectAll) {
            this.elements.selectAll.checked = false;
        }
        this.updateBulkActions();
    }

    updateBulkActions() {
        const selectedCheckboxes = document.querySelectorAll('#transaction-list input[type="checkbox"]:checked');
        const count = selectedCheckboxes.length;
        
        if (this.elements.bulkActions) {
            if (count > 0) {
                this.elements.bulkActions.classList.remove('d-none');
            } else {
                this.elements.bulkActions.classList.add('d-none');
            }
        }
        
        if (this.elements.selectedCount) {
            this.elements.selectedCount.textContent = count;
        }
    }

    updateTransactionCount() {
        try {
            const filteredTransactions = this.getFilteredTransactions();
            console.log('Updating transaction count:', filteredTransactions.length);
            
            if (this.elements.transactionCount) {
                this.elements.transactionCount.textContent = filteredTransactions.length;
            }
            
            if (this.elements.showingInfo) {
                this.elements.showingInfo.textContent = `Showing ${filteredTransactions.length} transaction${filteredTransactions.length !== 1 ? 's' : ''}`;
            }
        } catch (error) {
            console.error('Error in updateTransactionCount:', error);
        }
    }
    
    getFilteredTransactions() {
        let filtered = [...this.state.transactions];
        
        // Apply time filter
        if (this.state.currentTimeFilter !== 'all') {
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();
            
            filtered = filtered.filter(transaction => {
                const transactionDate = new Date(transaction.date);
                const transactionMonth = transactionDate.getMonth();
                const transactionYear = transactionDate.getFullYear();
                
                switch (this.state.currentTimeFilter) {
                    case 'this-month':
                        return transactionMonth === currentMonth && transactionYear === currentYear;
                    case 'last-month':
                        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
                        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
                        return transactionMonth === lastMonth && transactionYear === lastMonthYear;
                    case 'this-year':
                        return transactionYear === currentYear;
                    case 'last-year':
                        return transactionYear === currentYear - 1;
                    default:
                        return true;
                }
            });
        }
        
        // Apply sorting if on transactions page
        if (this.isTransactionsPage && this.state.currentSortFilter) {
            filtered.sort((a, b) => {
                switch (this.state.currentSortFilter) {
                    case 'date-desc':
                        return new Date(b.date) - new Date(a.date);
                    case 'date-asc':
                        return new Date(a.date) - new Date(b.date);
                    case 'amount-desc':
                        return b.amount - a.amount;
                    case 'amount-asc':
                        return a.amount - b.amount;
                    case 'category':
                        return a.category.localeCompare(b.category);
                    default:
                        return new Date(b.date) - new Date(a.date);
                }
            });
        } else {
            // Default sorting for dashboard (newest first)
            filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
        }
        
        return filtered;
    }
    
    initializeChartDisplay() {
        // Ensure the category subtype selector is hidden on page load since overview is default
        console.log('initializeChartDisplay called');
        const selector = this.elements.categorySubtypeSelector;
        console.log('categorySubtypeSelector during init:', selector);
        
        if (selector) {
            selector.style.setProperty('display', 'none', 'important');
            console.log('Category subtype selector hidden during initialization');
        } else {
            console.error('categorySubtypeSelector element not found during initialization');
        }
        
        // Also ensure overview chart is selected by default
        const overviewRadio = document.getElementById('overview-chart');
        if (overviewRadio && !overviewRadio.checked) {
            overviewRadio.checked = true;
        }
    }

    updateChart() {
        if (!this.budgetChart) return;
        
        // Check if Chart.js is loaded
        if (typeof Chart === 'undefined') {
            console.error('Chart.js is not loaded');
            this.showSnackbar('Chart library failed to load', 'error');
            return;
        }
        
        const filteredTransactions = this.getFilteredTransactions();
        
        const income = filteredTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
            
        const expenses = filteredTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        // For overview chart, check if both income and expenses are zero
        if (this.state.currentChartType === 'overview' && income === 0 && expenses === 0) {
            this.elements.emptyChartMessage.style.display = 'block';
            this.elements.budgetChartCanvas.style.display = 'none';
            return;
        }

        // For category chart, we'll handle empty states within the chart itself
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
        const total = income + expenses;
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
                        align: 'center',
                        labels: { 
                            color: '#ffffff',
                            font: {
                                size: 14,
                                weight: 'normal'
                            },
                            padding: 20,
                            usePointStyle: true,
                            pointStyle: 'circle',
                            generateLabels: function(chart) {
                                const data = chart.data;
                                if (data.labels.length && data.datasets.length) {
                                    return data.labels.map((label, i) => {
                                        const dataset = data.datasets[0];
                                        const value = dataset.data[i];
                                        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                        return {
                                            text: `${label}: ${percentage}%`,
                                            fillStyle: dataset.backgroundColor[i],
                                            strokeStyle: dataset.borderColor[i],
                                            lineWidth: dataset.borderWidth,
                                            hidden: false,
                                            index: i,
                                            fontColor: '#ffffff'
                                        };
                                    });
                                }
                                return [];
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed;
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return `${context.label}: $${value.toFixed(2)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        };
    }

    getCategoryChartData() {
        const categoryTotals = {};
        const transactionType = this.state.currentCategorySubtype || 'expense';
        
        const timeFilteredTransactions = this.getFilteredTransactions();
        const filteredTransactions = timeFilteredTransactions
            .filter(t => t.type === transactionType);
            
        filteredTransactions.forEach(t => {
            categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
        });

        // Check if there's no data for the selected category type
        if (Object.keys(categoryTotals).length === 0) {
            // Check if there are any transactions of the opposite type
            const oppositeType = transactionType === 'expense' ? 'income' : 'expense';
            const oppositeTransactions = this.state.transactions.filter(t => t.type === oppositeType);
            
            if (oppositeTransactions.length > 0) {
                // Automatically switch to the opposite category type
                this.state.currentCategorySubtype = oppositeType;
                
                // Update the radio button selection in the UI
                const oppositeButton = document.querySelector(`input[name="category-subtype"][value="${oppositeType}"]`);
                if (oppositeButton) {
                    oppositeButton.checked = true;
                }
                
                // Reset transaction list filter to show all categories
                this.state.currentCategoryFilter = 'all';
                this.updateCategoryFilterUI();
                this.renderTransactions();
                this.renderMonthlyTransactions();
                
                // Show a brief message about the automatic switch
                this.showSnackbar(`Switched to ${oppositeType} categories`, 'info');
                
                // Recursively call this function with the new category type
                return this.getCategoryChartData();
            }
            
            // If no transactions exist at all, switch back to overview chart
            if (this.state.transactions.length === 0) {
                this.state.currentChartType = 'overview';
                const overviewButton = document.querySelector(`input[name="chart-type"][value="overview"]`);
                if (overviewButton) {
                    overviewButton.checked = true;
                }
                // Hide category subtype selector
                if (this.elements.categorySubtypeSelector) {
                    this.elements.categorySubtypeSelector.style.display = 'none';
                }
                this.showSnackbar('No transactions available, switched to overview', 'info');
                // Return overview chart data instead
                const income = 0;
                const expenses = 0;
                return this.getOverviewChartData(income, expenses);
            }
            
            // If no data in the current category but other transactions exist, show empty chart
            return this.getEmptyCategoryChartData(transactionType);
        }

        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16', '#d946ef', '#06b6d4'];
        const total = Object.values(categoryTotals).reduce((sum, value) => sum + value, 0);
        
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
                        align: 'center',
                        maxHeight: 100,
                        labels: { 
                            color: '#ffffff',
                            font: {
                                size: 13,
                                weight: 'normal'
                            },
                            padding: 15,
                            usePointStyle: true,
                            pointStyle: 'circle',
                            boxWidth: 12,
                            boxHeight: 12,
                            generateLabels: function(chart) {
                                const data = chart.data;
                                if (data.labels.length && data.datasets.length) {
                                    return data.labels.map((label, i) => {
                                        const dataset = data.datasets[0];
                                        const value = dataset.data[i];
                                        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                        return {
                                            text: `${label}: ${percentage}%`,
                                            fillStyle: dataset.backgroundColor[i],
                                            strokeStyle: dataset.borderColor ? dataset.borderColor[i] : dataset.backgroundColor[i],
                                            lineWidth: dataset.borderWidth,
                                            hidden: false,
                                            index: i,
                                            fontColor: '#ffffff'
                                        };
                                    });
                                }
                                return [];
                            }
                        }
                    },
                    title: {
                        display: true,
                        text: `${transactionType.charAt(0).toUpperCase() + transactionType.slice(1)} Categories`,
                        color: '#ffffff',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed;
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return `${context.label}: $${value.toFixed(2)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        };
    }
    
    getEmptyCategoryChartData(transactionType) {
        return {
            type: 'pie',
            data: {
                labels: ['No Data'],
                datasets: [{
                    data: [1],
                    backgroundColor: ['#6b7280'],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: `No ${transactionType.charAt(0).toUpperCase() + transactionType.slice(1)} Data`,
                        color: '#ffffff',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    tooltip: {
                        enabled: false
                    }
                },
                elements: {
                    arc: {
                        hoverBackgroundColor: '#6b7280'
                    }
                }
            }
        };
    }

    updateSummary() {
        const filteredTransactions = this.getFilteredTransactions();
        
        const income = filteredTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
            
        const expenses = filteredTransactions
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
            
            // Dispatch storage event to notify other tabs/pages of changes
            window.dispatchEvent(new StorageEvent('storage', {
                key: 'transactions',
                newValue: JSON.stringify(this.state.transactions),
                oldValue: null, // Could store previous value if needed
                storageArea: localStorage,
                url: window.location.href
            }));
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
        this.showSnackbar('Data exported successfully', 'success', true);
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
                    this.renderMonthlyTransactions();
                    this.updateChart();
                    this.updateSummary();
                    
                    this.showSnackbar('Data imported successfully', 'success', true);
                } else {
                    this.showSnackbar('Invalid file format', 'error', true);
                }
            } catch (error) {
                this.showSnackbar('Error reading file', 'error', true);
            }
        };
        
        reader.onerror = () => {
            this.showSnackbar('Error reading file', 'error', true);
        };
        
        reader.readAsText(file);
        e.target.value = '';
    }

    // Encryption utility functions
    encryptData(data, passphrase) {
        try {
            const salt = CryptoJS.lib.WordArray.random(128/8);
            const key = CryptoJS.PBKDF2(passphrase, salt, {
                keySize: 256/32,
                iterations: 1000
            });
            
            const iv = CryptoJS.lib.WordArray.random(128/8);
            const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), key, {
                iv: iv,
                padding: CryptoJS.pad.Pkcs7,
                mode: CryptoJS.mode.CBC
            });
            
            const result = {
                encrypted: encrypted.toString(),
                salt: salt.toString(),
                iv: iv.toString(),
                iterations: 1000,
                keySize: 256,
                version: '1.0'
            };
            
            return JSON.stringify(result);
        } catch (error) {
            console.error('Encryption error:', error);
            throw new Error('Failed to encrypt data');
        }
    }

    decryptData(encryptedData, passphrase) {
        try {
            const data = JSON.parse(encryptedData);
            
            if (!data.encrypted || !data.salt || !data.iv) {
                throw new Error('Invalid encrypted file format');
            }
            
            const salt = CryptoJS.enc.Hex.parse(data.salt);
            const iv = CryptoJS.enc.Hex.parse(data.iv);
            
            const key = CryptoJS.PBKDF2(passphrase, salt, {
                keySize: data.keySize/32 || 256/32,
                iterations: data.iterations || 1000
            });
            
            const decrypted = CryptoJS.AES.decrypt(data.encrypted, key, {
                iv: iv,
                padding: CryptoJS.pad.Pkcs7,
                mode: CryptoJS.mode.CBC
            });
            
            const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
            if (!decryptedText) {
                throw new Error('Invalid passphrase');
            }
            
            return JSON.parse(decryptedText);
        } catch (error) {
            console.error('Decryption error:', error);
            if (error.message === 'Invalid passphrase') {
                throw error;
            }
            throw new Error('Failed to decrypt data');
        }
    }

    // New export function that shows modal
    showExportModal() {
        const exportModal = document.getElementById('exportModal');
        if (exportModal) {
            const modal = new bootstrap.Modal(exportModal);
            modal.show();
        }
    }

    // Updated export function with encryption and mailto link
    async exportDataEncrypted(passphrase, method, email = null) {
        try {
            const data = {
                transactions: this.state.transactions,
                currency: this.state.currentCurrency,
                currencySymbol: this.state.currentCurrencySymbol,
                exportDate: new Date().toISOString(),
                version: '2.0',
                encrypted: true
            };

            const encryptedData = this.encryptData(data, passphrase);
            const filename = `budget-backup-encrypted-${new Date().toISOString().split('T')[0]}.json`;

            if (method === 'download') {
                const dataBlob = new Blob([encryptedData], { type: 'application/json' });
                const url = URL.createObjectURL(dataBlob);
                
                const link = document.createElement('a');
                link.href = url;
                link.download = filename;
                link.click();
                
                URL.revokeObjectURL(url);
                this.showSnackbar('Encrypted backup downloaded successfully', 'success');

            } else if (method === 'email' && email) {
                const subject = 'Dhanika Encrypted Budget Backup';
                const body = `
Hello,

Here is your encrypted Dhanika backup data.

--- IMPORTANT ---
To restore this backup:
1. Copy the entire block of text below, starting from '{' and ending with '}'.
2. Save it as a text file with a .json extension (e.g., 'my-backup.json').
3. Use the 'Import Data' feature in Dhanika and select the file you just saved.
-----------------

${encryptedData}
                `;
                
                const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                
                // Open the user's default email client
                window.location.href = mailtoLink;
                
                this.showSnackbar('Your email client has been opened.', 'success');
            }
        } catch (error) {
            console.error('Export error:', error);
            this.showSnackbar('Failed to export data: ' + error.message, 'error');
        }
    }

    // New import function that shows modal for passphrase
    showImportModal(file) {
        this.pendingImportFile = file;
        const importModal = document.getElementById('importModal');
        if (importModal) {
            const modal = new bootstrap.Modal(importModal);
            modal.show();
        }
    }

    // Updated import function with decryption
    async importDataEncrypted(file, passphrase) {
        try {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    let data;
                    const fileContent = event.target.result;
                    
                    // Try to parse as encrypted format first
                    try {
                        const parsedContent = JSON.parse(fileContent);
                        if (parsedContent.encrypted || parsedContent.version === '1.0') {
                            // This is an encrypted file
                            data = this.decryptData(fileContent, passphrase);
                        } else {
                            // This is a regular unencrypted file
                            data = parsedContent;
                        }
                    } catch (parseError) {
                        // Try decryption in case it's encrypted but parsing failed
                        data = this.decryptData(fileContent, passphrase);
                    }
                    
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
                        this.renderMonthlyTransactions();
                        this.updateChart();
                        this.updateSummary();
                        
                        this.showSnackbar('Data imported successfully', 'success');
                        
                        // Hide import modal
                        const importModal = bootstrap.Modal.getInstance(document.getElementById('importModal'));
                        if (importModal) {
                            importModal.hide();
                        }
                    } else {
                        this.showSnackbar('Invalid file format', 'error');
                    }
                } catch (error) {
                    console.error('Import error:', error);
                    if (error.message === 'Invalid passphrase') {
                        // Show error in modal
                        const errorDiv = document.getElementById('importError');
                        if (errorDiv) {
                            errorDiv.classList.remove('d-none');
                        }
                        return;
                    }
                    this.showSnackbar('Error reading encrypted file', 'error');
                }
            };
            
            reader.onerror = () => {
                this.showSnackbar('Error reading file', 'error');
            };
            
            reader.readAsText(file);
        } catch (error) {
            console.error('Import error:', error);
            this.showSnackbar('Failed to import data: ' + error.message, 'error');
        }
    }

    async downloadSummary() {
        try {
            const baseName = prompt("Enter a name for your report:", "Dhanika-Report");
            if (!baseName) {
                this.showSnackbar('Download cancelled', 'info');
                return;
            }
            const fileName = `${baseName}-${new Date().toISOString().split('T')[0]}.pdf`;

            this.showLoading(true);
            
            const income = this.state.transactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0);
                
            const expenses = this.state.transactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0);
                
            const balance = income - expenses;
            
            // Create a minimal container optimized for PDF
            const pdfContainer = document.createElement('div');
            pdfContainer.style.cssText = `
                position: fixed;
                top: -9999px;
                left: 0;
                width: 794px;
                background: white;
                font-family: Arial, sans-serif;
                font-size: 10px;
                padding: 40px;
                color: #333;
            `;
            
            // Generate super compact content
            pdfContainer.innerHTML = this.generateMinimalPDFContent(income, expenses, balance);
            document.body.appendChild(pdfContainer);
            
            const canvas = await html2canvas(pdfContainer, {
                scale: 1.5,
                useCORS: true,
                backgroundColor: '#ffffff',
                width: 794,
                height: Math.min(pdfContainer.offsetHeight, 1123)
            });
            
            // Create PDF
            const { jsPDF } = window.jspdf;
            if (jsPDF) {
                const pdf = new jsPDF('p', 'px', [794, 1123]);
                const imgData = canvas.toDataURL('image/png');
                pdf.addImage(imgData, 'PNG', 0, 0, 794, Math.min(canvas.height, 1123));
                pdf.save(fileName);
            }
            
            document.body.removeChild(pdfContainer);
            this.showSnackbar('Budget report downloaded successfully!', 'success');
            
        } catch (error) {
            console.error('Error generating PDF report:', error);
            this.showSnackbar('Failed to generate report. Please try again.', 'error');
        } finally {
            this.showLoading(false);
        }
    }
    
    async proceedWithPDF() {
        try {
            const previewElement = document.getElementById('pdf-preview');
            if (!previewElement) return;
            
            // Remove buttons before capture
            const buttons = previewElement.querySelectorAll('button');
            buttons.forEach(btn => btn.remove());
            
            // Let's try just downloading as image first since html2pdf isn't working
            const canvas = await html2canvas(previewElement, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                width: previewElement.offsetWidth,
                height: previewElement.offsetHeight
            });
            
            // Create download link for image
            const link = document.createElement('a');
            link.download = `Dhanika-Budget-Report-${new Date().toISOString().split('T')[0]}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            
            // Also try to create a simple PDF using jsPDF directly
            const { jsPDF } = window.jspdf || {};
            if (jsPDF) {
                const pdf = new jsPDF('p', 'mm', 'a4');
                const imgData = canvas.toDataURL('image/png');
                
                // Calculate dimensions to fit A4
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();
                const canvasAspectRatio = canvas.height / canvas.width;
                const pdfAspectRatio = pdfHeight / pdfWidth;
                
                let renderWidth, renderHeight;
                if (canvasAspectRatio > pdfAspectRatio) {
                    renderHeight = pdfHeight - 20; // 10mm margin top/bottom
                    renderWidth = renderHeight / canvasAspectRatio;
                } else {
                    renderWidth = pdfWidth - 20; // 10mm margin left/right
                    renderHeight = renderWidth * canvasAspectRatio;
                }
                
                const xOffset = (pdfWidth - renderWidth) / 2;
                const yOffset = (pdfHeight - renderHeight) / 2;
                
                pdf.addImage(imgData, 'PNG', xOffset, yOffset, renderWidth, renderHeight);
                pdf.save(`Dhanika-Budget-Report-${new Date().toISOString().split('T')[0]}.pdf`);
            }
            
            // Clean up
            document.body.removeChild(previewElement);
            delete window.budgetTracker;
            
            this.showSnackbar('Budget report downloaded as image and PDF!', 'success');
        } catch (error) {
            console.error('Error generating report:', error);
            this.showSnackbar('Failed to generate report. Please try again.', 'error');
        }
    }

    createCompactVersion() {
        const previewElement = document.getElementById('pdf-preview');
        if (!previewElement) return;
        
        // Make everything even more compact
        const innerContent = previewElement.querySelector('div');
        if (innerContent) {
            // Scale down everything
            innerContent.style.transform = 'scale(0.8)';
            innerContent.style.transformOrigin = 'top center';
            innerContent.style.margin = '-40px auto 0 auto';
        }
        
        this.showSnackbar('Switched to compact view for better fit', 'info');
    }

    async skipPreviewAndDownload() {
        try {
            const previewElement = document.getElementById('pdf-preview');
            if (!previewElement) return;
            
            // Close preview and directly generate PDF with optimized settings
            document.body.removeChild(previewElement);
            
            const income = this.state.transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
            const expenses = this.state.transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
            const balance = income - expenses;
            
            // Create a minimal container optimized for PDF
            const pdfContainer = document.createElement('div');
            pdfContainer.style.cssText = `
                position: fixed;
                top: -9999px;
                left: 0;
                width: 794px;
                background: white;
                font-family: Arial, sans-serif;
                font-size: 10px;
                padding: 40px;
                color: #333;
            `;
            
            // Generate super compact content
            pdfContainer.innerHTML = this.generateMinimalPDFContent(income, expenses, balance);
            document.body.appendChild(pdfContainer);
            
            const canvas = await html2canvas(pdfContainer, {
                scale: 1.5,
                useCORS: true,
                backgroundColor: '#ffffff',
                width: 794,
                height: Math.min(pdfContainer.offsetHeight, 1123)
            });
            
            // Create PDF
            const { jsPDF } = window.jspdf;
            if (jsPDF) {
                const pdf = new jsPDF('p', 'px', [794, 1123]);
                const imgData = canvas.toDataURL('image/png');
                pdf.addImage(imgData, 'PNG', 0, 0, 794, Math.min(canvas.height, 1123));
                pdf.save(`Dhanika-Budget-Report-${new Date().toISOString().split('T')[0]}.pdf`);
            }
            
            document.body.removeChild(pdfContainer);
            delete window.budgetTracker;
            this.showSnackbar('PDF generated successfully with optimized layout!', 'success');
            
        } catch (error) {
            console.error('Error generating direct PDF:', error);
            this.showSnackbar('Failed to generate PDF. Please try again.', 'error');
        }
    }

    generateMinimalPDFContent(income, expenses, balance) {
        const currencySymbol = this.state.currentCurrencySymbol || '₹';
        const formatAmount = (amount) => `${currencySymbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        const timestamp = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        
        return `
            <div style="text-align: center; margin-bottom: 30px; padding-bottom: 15px; border-bottom: 3px solid #3b82f6;">
                <h1 style="color: #3b82f6; margin: 0 0 10px 0; font-size: 36px; font-weight: bold;">📊 Dhanika Budget Report</h1>
                <p style="color: #666; margin: 0; font-size: 14px;">spendora.eknath.dev • ${timestamp}</p>
            </div>
            
            <table style="width: 100%; margin: 30px 0; border-collapse: collapse;">
                <tr>
                    <td style="width: 33%; text-align: center; padding: 30px; background: #e8f5e8; border: 3px solid #10b981;">
                        <h2 style="color: #10b981; margin: 0 0 10px 0; font-size: 16px;">💰 TOTAL INCOME</h2>
                        <p style="font-size: 32px; font-weight: bold; color: #10b981; margin: 0; font-family: monospace;">${formatAmount(income)}</p>
                    </td>
                    <td style="width: 33%; text-align: center; padding: 30px; background: #fde8e8; border: 3px solid #ef4444;">
                        <h2 style="color: #ef4444; margin: 0 0 10px 0; font-size: 16px;">💸 TOTAL EXPENSES</h2>
                        <p style="font-size: 32px; font-weight: bold; color: #ef4444; margin: 0; font-family: monospace;">${formatAmount(expenses)}</p>
                    </td>
                    <td style="width: 33%; text-align: center; padding: 30px; background: ${balance >= 0 ? '#e8f5e8' : '#fde8e8'}; border: 3px solid ${balance >= 0 ? '#10b981' : '#ef4444'};">
                        <h2 style="color: ${balance >= 0 ? '#10b981' : '#ef4444'}; margin: 0 0 10px 0; font-size: 16px;">💳 NET BALANCE</h2>
                        <p style="font-size: 32px; font-weight: bold; color: ${balance >= 0 ? '#10b981' : '#ef4444'}; margin: 0; font-family: monospace;">${formatAmount(balance)}</p>
                    </td>
                </tr>
            </table>
            
            <div style="background: #fff3cd; padding: 30px; border: 2px solid #ffc107; margin: 30px 0; text-align: center;">
                <h2 style="color: #856404; margin: 0 0 20px 0; font-size: 20px;">💡 Financial Summary</h2>
                <div style="display: flex; justify-content: space-around;">
                    <div>
                        <div style="font-size: 24px; font-weight: bold; color: ${income > 0 ? (balance/income >= 0.2 ? '#10b981' : '#f59e0b') : '#64748b'};">
                            ${income > 0 ? `${((balance/income)*100).toFixed(1)}%` : 'N/A'}
                        </div>
                        <div style="color: #666; font-size: 14px;">Savings Rate</div>
                    </div>
                    <div>
                        <div style="font-size: 24px; font-weight: bold; color: #3b82f6;">${this.state.transactions.length}</div>
                        <div style="color: #666; font-size: 14px;">Total Transactions</div>
                    </div>
                    <div>
                        <div style="font-size: 20px; font-weight: bold; color: ${balance >= 0 ? '#10b981' : '#ef4444'};">
                            ${balance >= 0 ? '🟢 Healthy' : '🔴 Review Needed'}
                        </div>
                        <div style="color: #666; font-size: 14px;">Financial Status</div>
                    </div>
                </div>
            </div>
            
            <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #ccc;">
                <p style="color: #666; font-size: 12px; margin: 0;">
                    <strong style="color: #3b82f6;">Dhanika Personal Budget Tracker</strong> • Visit dhanika.eknath.dev
                </p>
            </div>
        `;
    }

    generateInlineChart(type, income, expenses) {
        if (income === 0 && expenses === 0) {
            return '<div style="color: #64748b; text-align: center; padding: 40px; font-style: italic;">No data available</div>';
        }
        
        const total = income + expenses;
        if (total === 0) return '<div style="color: #64748b; text-align: center; padding: 40px;">No transactions</div>';
        
        const incomePercent = ((income / total) * 100).toFixed(1);
        const expensePercent = ((expenses / total) * 100).toFixed(1);
        
        // Create a simple visual representation
        return `
            <div style="display: flex; align-items: center; justify-content: center; margin: 10px 0;">
                <div style="width: 120px; height: 120px; border-radius: 50%; background: conic-gradient(#10b981 0% ${incomePercent}%, #ef4444 ${incomePercent}% 100%); position: relative; display: flex; align-items: center; justify-content: center;">
                    <div style="width: 65px; height: 65px; background: linear-gradient(135deg, #1e293b, #334155); border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-direction: column;">
                        <div style="color: #f1f5f9; font-size: 11px; font-weight: 600;">Total</div>
                        <div style="color: #cbd5e1; font-size: 9px;">${total.toLocaleString()}</div>
                    </div>
                </div>
            </div>
            <div style="display: flex; justify-content: center; gap: 15px; margin-top: 8px;">
                <div style="display: flex; align-items: center; gap: 4px;">
                    <div style="width: 10px; height: 10px; background: #10b981; border-radius: 2px;"></div>
                    <span style="color: #cbd5e1; font-size: 10px;">Income ${incomePercent}%</span>
                </div>
                <div style="display: flex; align-items: center; gap: 4px;">
                    <div style="width: 10px; height: 10px; background: #ef4444; border-radius: 2px;"></div>
                    <span style="color: #cbd5e1; font-size: 10px;">Expenses ${expensePercent}%</span>
                </div>
            </div>
        `;
    }

    generateCategoryBreakdown(incomeByCategory, expensesByCategory) {
        const formatAmount = (amount) => `${this.state.currentCurrencySymbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
        
        // Get top categories
        const topIncomeCategories = Object.entries(incomeByCategory)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3);
        const topExpenseCategories = Object.entries(expensesByCategory)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5);
        
        let content = '';
        
        if (topIncomeCategories.length > 0) {
            content += `
                <div style="margin-bottom: 20px;">
                    <h4 style="color: #10b981; font-size: 13px; margin: 0 0 10px 0; text-align: center;">💰 Top Income Sources</h4>
                    ${topIncomeCategories.map(([category, amount]) => `
                        <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #334155;">
                            <span style="color: #cbd5e1; font-size: 11px;">${this.getCategoryLabel(category)}</span>
                            <span style="color: #10b981; font-size: 11px; font-weight: 600;">${formatAmount(amount)}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        if (topExpenseCategories.length > 0) {
            content += `
                <div>
                    <h4 style="color: #ef4444; font-size: 13px; margin: 0 0 10px 0; text-align: center;">💸 Top Expense Categories</h4>
                    ${topExpenseCategories.map(([category, amount]) => `
                        <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #334155;">
                            <span style="color: #cbd5e1; font-size: 11px;">${this.getCategoryLabel(category)}</span>
                            <span style="color: #ef4444; font-size: 11px; font-weight: 600;">${formatAmount(amount)}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        if (topIncomeCategories.length === 0 && topExpenseCategories.length === 0) {
            content = '<div style="color: #64748b; text-align: center; padding: 40px; font-style: italic;">No category data available</div>';
        }
        
        return content;
    }

    generateAdvicePrompt() {
        const income = this.state.transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const expenses = this.state.transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        const balance = income - expenses;

        const expenseByCategory = this.state.transactions
            .filter(t => t.type === 'expense')
            .reduce((acc, t) => {
                acc[t.category] = (acc[t.category] || 0) + t.amount;
                return acc;
            }, {});

        const topExpenseCategories = Object.entries(expenseByCategory)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([category, amount]) => ` - ${this.getCategoryLabel(category)}: ${this.formatCurrency(amount)}`)
            .join('\n');

        const prompt = `
I am looking for financial advice. Here is a summary of my recent financial activity in ${this.state.currentCurrency}:

**Overall Summary:**
- Total Income: ${this.formatCurrency(income)}
- Total Expenses: ${this.formatCurrency(expenses)}
- Net Balance: ${this.formatCurrency(balance)}

**Top 5 Expense Categories:**
${topExpenseCategories || 'No expenses yet.'}

**My Goal:**
I want to improve my financial health. Based on the data above, please provide actionable advice. Specifically, I am looking for:
1.  **Spending Analysis:** Are there any red flags in my spending habits? Where are my biggest opportunities to save?
2.  **Budgeting Suggestions:** How can I create a more effective budget based on my income and spending?
3.  **Savings & Investment:** What are some simple strategies for saving or investing the money I have left over?

Please provide clear, practical, and easy-to-follow recommendations.
        `;

        const promptContainer = document.getElementById('ai-prompt-container');
        const promptOutput = document.getElementById('advice-prompt-output');

        if (promptContainer && promptOutput) {
            promptOutput.value = prompt.trim();
            promptContainer.style.display = 'block';
        }

        this.showSnackbar('AI prompt generated!', 'success');
    }

    copyAdvicePrompt() {
        const promptOutput = document.getElementById('advice-prompt-output');
        if (promptOutput) {
            promptOutput.select();
            document.execCommand('copy');
            this.showSnackbar('Prompt copied to clipboard!', 'info');
        }
    }

    generateSimplePDFContent(income, expenses, balance) {
        const currentDate = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        // Format currency manually
        const formatAmount = (amount) => {
            return `${this.state.currentCurrencySymbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        };
        
        // Get transactions
        const incomeTransactions = this.state.transactions
            .filter(t => t.type === 'income')
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 8);
            
        const expenseTransactions = this.state.transactions
            .filter(t => t.type === 'expense')
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 8);
            
        const incomeCount = this.state.transactions.filter(t => t.type === 'income').length;
        const expenseCount = this.state.transactions.filter(t => t.type === 'expense').length;
        
        // Use simple table-based layout for maximum compatibility
        return `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px; padding: 20px; border-bottom: 3px solid #3b82f6;">
                    <h1 style="color: #3b82f6; margin: 0 0 10px 0; font-size: 28px;">📊 Dhanika Budget Report</h1>
                    <p style="color: #666; margin: 0; font-size: 14px;">spendora.eknath.dev • ${currentDate}</p>
                </div>
                
                <table width="100%" style="margin-bottom: 30px;" cellpadding="20" cellspacing="20">
                    <tr>
                        <td width="33%" style="text-align: center; padding: 20px; background: #e8f5e8; border: 3px solid #10b981;">
                            <h3 style="color: #10b981; margin: 0 0 10px 0; font-size: 16px;">💰 TOTAL INCOME</h3>
                            <p style="font-size: 22px; font-weight: bold; color: #10b981; margin: 0;">${formatAmount(income)}</p>
                        </td>
                        <td width="33%" style="text-align: center; padding: 20px; background: #fde8e8; border: 3px solid #ef4444;">
                            <h3 style="color: #ef4444; margin: 0 0 10px 0; font-size: 16px;">💸 TOTAL EXPENSES</h3>
                            <p style="font-size: 22px; font-weight: bold; color: #ef4444; margin: 0;">${formatAmount(expenses)}</p>
                        </td>
                        <td width="33%" style="text-align: center; padding: 20px; background: ${balance >= 0 ? '#e8f5e8' : '#fde8e8'}; border: 3px solid ${balance >= 0 ? '#10b981' : '#ef4444'};">
                            <h3 style="color: ${balance >= 0 ? '#10b981' : '#ef4444'}; margin: 0 0 10px 0; font-size: 16px;">💳 BALANCE</h3>
                            <p style="font-size: 22px; font-weight: bold; color: ${balance >= 0 ? '#10b981' : '#ef4444'}; margin: 0;">${formatAmount(balance)}</p>
                        </td>
                    </tr>
                </table>
                
                <table width="100%" style="margin-bottom: 30px;" cellpadding="0" cellspacing="20">
                    <tr>
                        <td width="48%" valign="top">
                            <div style="border: 2px solid #10b981;">
                                <div style="background: #10b981; color: white; padding: 12px; font-weight: bold; font-size: 14px;">
                                    💰 RECENT INCOME (${incomeCount} total transactions)
                                </div>
                                <div style="background: white; min-height: 200px; padding: 10px;">
                                    ${incomeTransactions.length > 0 ? incomeTransactions.map(t => `
                                        <div style="padding: 10px; border-bottom: 1px solid #eee; margin-bottom: 5px;">
                                            <div style="font-weight: bold; font-size: 12px; color: #333; margin-bottom: 3px;">${t.description}</div>
                                            <div style="font-size: 10px; color: #666; margin-bottom: 3px;">${new Date(t.date).toLocaleDateString()}</div>
                                            <div style="font-weight: bold; color: #10b981; font-size: 12px;">${formatAmount(t.amount)}</div>
                                        </div>
                                    `).join('') : '<div style="padding: 20px; text-align: center; color: #666; font-size: 12px;">No income transactions yet</div>'}
                                </div>
                                <div style="background: #f0f0f0; padding: 10px; font-weight: bold; font-size: 12px; text-align: right;">
                                    Total: <span style="color: #10b981;">${formatAmount(income)}</span>
                                </div>
                            </div>
                        </td>
                        <td width="48%" valign="top">
                            <div style="border: 2px solid #ef4444;">
                                <div style="background: #ef4444; color: white; padding: 12px; font-weight: bold; font-size: 14px;">
                                    💸 RECENT EXPENSES (${expenseCount} total transactions)
                                </div>
                                <div style="background: white; min-height: 200px; padding: 10px;">
                                    ${expenseTransactions.length > 0 ? expenseTransactions.map(t => `
                                        <div style="padding: 10px; border-bottom: 1px solid #eee; margin-bottom: 5px;">
                                            <div style="font-weight: bold; font-size: 12px; color: #333; margin-bottom: 3px;">${t.description}</div>
                                            <div style="font-size: 10px; color: #666; margin-bottom: 3px;">${new Date(t.date).toLocaleDateString()}</div>
                                            <div style="font-weight: bold; color: #ef4444; font-size: 12px;">${formatAmount(t.amount)}</div>
                                        </div>
                                    `).join('') : '<div style="padding: 20px; text-align: center; color: #666; font-size: 12px;">No expense transactions yet</div>'}
                                </div>
                                <div style="background: #f0f0f0; padding: 10px; font-weight: bold; font-size: 12px; text-align: right;">
                                    Total: <span style="color: #ef4444;">${formatAmount(expenses)}</span>
                                </div>
                            </div>
                        </td>
                    </tr>
                </table>
                
                <div style="margin-top: 30px; padding: 20px; background: #fff3cd; border: 2px solid #ffc107;">
                    <h3 style="color: #856404; margin: 0 0 15px 0; font-size: 16px;">💡 FINANCIAL SUMMARY</h3>
                    <div style="color: #333; font-size: 13px; line-height: 1.6;">
                        ${balance >= 0 
                            ? `<p><strong>✅ Positive Balance:</strong> You have ${formatAmount(balance)} remaining after expenses.</p>${income > 0 ? `<p><strong>Savings Rate:</strong> ${((balance / income) * 100).toFixed(1)}% of your income is being saved.</p>` : ''}`
                            : `<p><strong>⚠️ Overspending Alert:</strong> You are spending ${formatAmount(Math.abs(balance))} more than you earn.</p><p><strong>Action Required:</strong> Review your expenses or increase income to achieve financial balance.</p>`
                        }
                        <p><strong>Total Transactions:</strong> ${this.state.transactions.length} (${incomeCount} income + ${expenseCount} expenses)</p>
                        ${this.state.transactions.length > 0 ? `<p><strong>Most Recent Transaction:</strong> ${this.state.transactions.sort((a, b) => new Date(b.date) - new Date(a.date))[0].description} on ${new Date(this.state.transactions.sort((a, b) => new Date(b.date) - new Date(a.date))[0].date).toLocaleDateString()}</p>` : ''}
                    </div>
                </div>
                
                <div style="margin-top: 30px; text-align: center; padding-top: 20px; border-top: 2px solid #ccc;">
                    <p style="color: #666; font-size: 11px; margin: 0;">
                        <strong>Generated by Dhanika Personal Budget Tracker</strong><br>
                        Visit dhanika.eknath.dev • Report generated on ${currentDate}
                    </p>
                </div>
            </div>
        `;
    }

    generatePDFContent(income, expenses, balance) {
        const currentDate = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        // Get transactions (limit for single page)
        const incomeTransactions = this.state.transactions
            .filter(t => t.type === 'income')
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 8); // Limit for space
            
        const expenseTransactions = this.state.transactions
            .filter(t => t.type === 'expense')
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 8); // Limit for space
        
        // Generate advice
        const expensesByCategory = {};
        this.state.transactions.forEach(t => {
            if (t.type === 'expense') {
                expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
            }
        });
        const advice = this.generateFinancialAdvice(income, expenses, balance, expensesByCategory).slice(0, 4);
        
        return `
            <!-- Header with website styling -->
            <div style="text-align: center; margin-bottom: 25px; padding: 20px; background: linear-gradient(135deg, #1e293b, #334155); border-radius: 12px; border: 2px solid #3b82f6;">
                <h1 style="font-size: 24px; color: #3b82f6; margin: 0 0 8px 0; font-weight: 700;">📊 Dhanika</h1>
                <p style="font-size: 13px; color: #cbd5e1; margin: 0;">Personal Budget Report • spendora.eknath.dev • ${currentDate}</p>
            </div>
            
            <!-- Summary Cards Row -->
            <div style="display: flex; gap: 15px; margin-bottom: 20px;">
                <div style="flex: 1; background: linear-gradient(135deg, #1e293b, #334155); padding: 15px; border-radius: 8px; border: 1px solid #475569; text-align: center;">
                    <div style="color: #10b981; font-size: 20px; font-weight: 700; margin-bottom: 5px;">${this.formatCurrency(income)}</div>
                    <div style="color: #cbd5e1; font-size: 11px;">💰 Total Income</div>
                </div>
                <div style="flex: 1; background: linear-gradient(135deg, #1e293b, #334155); padding: 15px; border-radius: 8px; border: 1px solid #475569; text-align: center;">
                    <div style="color: #ef4444; font-size: 20px; font-weight: 700; margin-bottom: 5px;">${this.formatCurrency(expenses)}</div>
                    <div style="color: #cbd5e1; font-size: 11px;">💸 Total Expenses</div>
                </div>
                <div style="flex: 1; background: linear-gradient(135deg, #1e293b, #334155); padding: 15px; border-radius: 8px; border: 1px solid ${balance >= 0 ? '#10b981' : '#ef4444'}; text-align: center;">
                    <div style="color: ${balance >= 0 ? '#10b981' : '#ef4444'}; font-size: 20px; font-weight: 700; margin-bottom: 5px;">${this.formatCurrency(balance)}</div>
                    <div style="color: #cbd5e1; font-size: 11px;">💳 Balance</div>
                </div>
            </div>
            
            <!-- Transactions Side by Side -->
            <div style="display: flex; gap: 15px; margin-bottom: 20px;">
                <!-- Income Transactions -->
                <div style="flex: 1;">
                    <div style="background: #10b981; color: white; padding: 8px 12px; font-weight: 600; font-size: 12px; border-radius: 8px 8px 0 0;">
                        💰 Recent Income (${this.state.transactions.filter(t => t.type === 'income').length})
                    </div>
                    <div style="background: #1e293b; border: 1px solid #334155; border-top: none; border-radius: 0 0 8px 8px; min-height: 200px;">
                        ${incomeTransactions.length > 0 ? incomeTransactions.map(t => `
                            <div style="padding: 8px 12px; border-bottom: 1px solid #334155; display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <div style="color: #f1f5f9; font-size: 11px; font-weight: 500;">${this.getCategoryEmoji(t.category)} ${t.description}</div>
                                    <div style="color: #64748b; font-size: 9px;">${new Date(t.date).toLocaleDateString()} • ${this.getCategoryLabel(t.category)}</div>
                                </div>
                                <div style="color: #10b981; font-weight: 600; font-size: 11px;">${this.formatCurrency(t.amount)}</div>
                            </div>
                        `).join('') : '<div style="padding: 20px; text-align: center; color: #64748b; font-size: 11px;">No income transactions</div>'}
                        <div style="background: #334155; padding: 8px 12px; color: #f1f5f9; font-weight: 600; font-size: 11px; text-align: right;">
                            Total: <span style="color: #10b981;">${this.formatCurrency(income)}</span>
                        </div>
                    </div>
                </div>
                
                <!-- Expense Transactions -->
                <div style="flex: 1;">
                    <div style="background: #ef4444; color: white; padding: 8px 12px; font-weight: 600; font-size: 12px; border-radius: 8px 8px 0 0;">
                        💸 Recent Expenses (${this.state.transactions.filter(t => t.type === 'expense').length})
                    </div>
                    <div style="background: #1e293b; border: 1px solid #334155; border-top: none; border-radius: 0 0 8px 8px; min-height: 200px;">
                        ${expenseTransactions.length > 0 ? expenseTransactions.map(t => `
                            <div style="padding: 8px 12px; border-bottom: 1px solid #334155; display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <div style="color: #f1f5f9; font-size: 11px; font-weight: 500;">${this.getCategoryEmoji(t.category)} ${t.description}</div>
                                    <div style="color: #64748b; font-size: 9px;">${new Date(t.date).toLocaleDateString()} • ${this.getCategoryLabel(t.category)}</div>
                                </div>
                                <div style="color: #ef4444; font-weight: 600; font-size: 11px;">${this.formatCurrency(t.amount)}</div>
                            </div>
                        `).join('') : '<div style="padding: 20px; text-align: center; color: #64748b; font-size: 11px;">No expense transactions</div>'}
                        <div style="background: #334155; padding: 8px 12px; color: #f1f5f9; font-weight: 600; font-size: 11px; text-align: right;">
                            Total: <span style="color: #ef4444;">${this.formatCurrency(expenses)}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Financial Insights -->
            <div style="background: linear-gradient(135deg, #1e293b, #334155); border: 1px solid #475569; border-radius: 8px; padding: 15px;">
                <h3 style="color: #f59e0b; margin: 0 0 12px 0; font-size: 13px; font-weight: 600;">💡 Financial Insights</h3>
                <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                    ${advice.map(tip => `
                        <div style="background: #334155; padding: 8px 12px; border-radius: 6px; border: 1px solid #475569; flex: 1; min-width: 45%;">
                            <div style="color: #cbd5e1; font-size: 10px; line-height: 1.4;">${tip}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; margin-top: 20px; padding-top: 15px; border-top: 1px solid #334155;">
                <div style="color: #64748b; font-size: 10px;">
                    <strong style="color: #3b82f6;">Dhanika</strong> - Personal Budget Tracker | dhanika.eknath.dev
                </div>
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
                        <h1>📊 Dhanika</h1>
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
                        <p><strong>This report was generated by Dhanika - Your Personal Budget Tracker</strong></p>
                        <p>Visit dhanika.eknath.dev for more financial management tools</p>
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
        
        // Update button visual state
        this.updateTooltipButtonState();
    }

    updateTooltipButtonState() {
        const desktopBtn = document.getElementById('tooltip-toggle');
        const mobileBtn = document.getElementById('mobile-tooltip-btn');
        
        if (!desktopBtn || !mobileBtn) return;
        
        // Remove all possible button classes first
        desktopBtn.classList.remove('btn-outline-info', 'btn-success', 'btn-outline-secondary');
        
        if (this.state.tooltipsEnabled) {
            // Active state - tooltips enabled
            desktopBtn.classList.add('btn-success');
            desktopBtn.setAttribute('title', 'Tooltips enabled - Click to disable');
            desktopBtn.innerHTML = '<i class="bi bi-question-circle-fill" aria-hidden="true"></i>';
            mobileBtn.innerHTML = '<i class="bi bi-question-circle-fill" aria-hidden="true"></i> Tooltips: ON';
        } else {
            // Inactive state - tooltips disabled
            desktopBtn.classList.add('btn-outline-secondary');
            desktopBtn.setAttribute('title', 'Tooltips disabled - Click to enable');
            desktopBtn.innerHTML = '<i class="bi bi-question-circle" aria-hidden="true"></i>';
            mobileBtn.innerHTML = '<i class="bi bi-question-circle" aria-hidden="true"></i> Tooltips: OFF';
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
                console.log('Edit action triggered. isTransactionsPage:', this.isTransactionsPage, 'ID:', id);
                if (this.isTransactionsPage) {
                    this.openEditModal(id);
                } else {
                    this.editTransaction(id);
                }
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
        console.log('showLoading called with:', show);
        
        if (show) {
            document.body.classList.add('loading');
        } else {
            document.body.classList.remove('loading');
        }
        
        // Also handle the loading screen element directly (for transactions page)
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            if (show) {
                loadingScreen.style.display = 'flex';
            } else {
                loadingScreen.style.display = 'none';
                console.log('Loading screen hidden');
            }
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

        // Check if current category filter still exists
        if (this.state.currentCategoryFilter !== 'all' && !categories.has(this.state.currentCategoryFilter)) {
            // Current category no longer exists, reset to "all"
            console.log(`Category filter "${this.state.currentCategoryFilter}" no longer exists, resetting to "all"`);
            this.state.currentCategoryFilter = 'all';
            // Force re-render the transactions list with the new filter
            setTimeout(() => {
                this.renderTransactions();
                this.renderMonthlyTransactions();
            }, 0);
        }

        // Create filter tags
        const filterHTML = [
            '<span class="category-filter-tag" data-category="all">All Categories</span>',
            ...Array.from(categories).map(category => {
                const emoji = this.getCategoryEmoji(category);
                const label = this.getCategoryLabel(category);
                return `<span class="category-filter-tag" data-category="${category}">${emoji} ${label}</span>`;
            })
        ].join('');

        categoryFiltersContainer.innerHTML = filterHTML;

        // Update UI to reflect current filter
        this.updateCategoryFilterUI();

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
        this.renderMonthlyTransactions();
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
                        const descriptionInput = this.elements.transactionForm?.querySelector('#description');
                        if (descriptionInput) {
                            descriptionInput.focus();
                            this.showSnackbar('Keyboard shortcut: New transaction', 'info');
                        }
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
                    this.renderMonthlyTransactions();
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

    // Tags Autocomplete Functionality
    getDefaultTags() {
        return [
            'monthly', 'weekly', 'daily', 'regular', 'urgent', 'planned',
            'food', 'grocery', 'restaurant', 'delivery', 'snacks',
            'transport', 'metro', 'bus', 'taxi', 'fuel', 'parking',
            'entertainment', 'movies', 'music', 'games', 'books',
            'health', 'medical', 'fitness', 'pharmacy', 'checkup',
            'shopping', 'clothes', 'electronics', 'home', 'gifts',
            'bills', 'electricity', 'water', 'internet', 'phone',
            'education', 'course', 'books', 'supplies',
            'work', 'office', 'meeting', 'travel', 'supplies',
            'investment', 'stocks', 'mutual-funds', 'savings', 'dividend',
            'salary', 'bonus', 'freelance', 'project', 'commission',
            'friends', 'family', 'personal', 'emergency'
        ];
    }

    getUserTags() {
        const usedTags = new Map();
        this.state.transactions.forEach(transaction => {
            if (transaction.tags) {
                const tags = transaction.tags.split(',').map(tag => tag.trim().toLowerCase()).filter(tag => tag);
                tags.forEach(tag => {
                    usedTags.set(tag, (usedTags.get(tag) || 0) + 1);
                });
            }
        });
        return usedTags;
    }

    getAllTagSuggestions(currentInput = '') {
        const userTags = this.getUserTags();
        const defaultTags = this.getDefaultTags();
        const suggestions = [];

        // Add user tags (previously used)
        [...userTags.entries()].forEach(([tag, count]) => {
            if (tag.includes(currentInput.toLowerCase())) {
                suggestions.push({
                    name: tag,
                    count: count,
                    type: 'used'
                });
            }
        });

        // Add default tags
        defaultTags.forEach(tag => {
            if (tag.includes(currentInput.toLowerCase()) && !userTags.has(tag)) {
                suggestions.push({
                    name: tag,
                    count: 0,
                    type: 'default'
                });
            }
        });

        // Sort: user tags by usage count, then default tags alphabetically
        return suggestions.sort((a, b) => {
            if (a.type === 'used' && b.type === 'default') return -1;
            if (a.type === 'default' && b.type === 'used') return 1;
            if (a.type === 'used' && b.type === 'used') return b.count - a.count;
            return a.name.localeCompare(b.name);
        });
    }

    getCurrentTags() {
        const input = this.elements.tagsInput.value;
        const lastCommaIndex = input.lastIndexOf(',');
        
        if (lastCommaIndex === -1) {
            return { existingTags: '', currentTag: input.trim() };
        }
        
        const existingTags = input.substring(0, lastCommaIndex + 1);
        const currentTag = input.substring(lastCommaIndex + 1).trim();
        
        return { existingTags, currentTag };
    }

    updateTagChips() {
        const { existingTags } = this.getCurrentTags();
        const existingTagsList = existingTags ? 
            existingTags.split(',').map(tag => tag.trim().toLowerCase()).filter(tag => tag) : [];
        
        const suggestions = this.getAllTagSuggestions('').filter(suggestion => 
            !existingTagsList.includes(suggestion.name.toLowerCase())
        );
        const chipsContainer = this.elements.tagsChips;

        if (!chipsContainer) {
            console.log('Tags chips container not found, skipping tag chips update');
            return;
        }

        chipsContainer.innerHTML = '';

        if (suggestions.length === 0) {
            chipsContainer.classList.add('empty');
            return;
        }

        chipsContainer.classList.remove('empty');
        
        // Show more tags for horizontal scrolling - up to 30 tags
        suggestions.slice(0, 30).forEach(suggestion => {
            const chip = this.createTagChip(suggestion);
            chipsContainer.appendChild(chip);
        });
    }

    createTagChip(suggestion) {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = `tag-chip ${suggestion.type}-tag`;
        
        if (suggestion.type === 'used') {
            chip.innerHTML = `${suggestion.name} <span class="usage-count">${suggestion.count}</span>`;
        } else {
            chip.innerHTML = suggestion.name;
        }
        
        chip.addEventListener('click', (e) => {
            e.preventDefault();
            this.selectTag(suggestion.name);
        });
        
        return chip;
    }

    handleTagsInput(e) {
        const { currentTag } = this.getCurrentTags();
        
        this.updateClearButton();
        
        if (currentTag.length === 0) {
            this.updateTagChips();
            this.hideTagSuggestions();
            return;
        }

        this.showTagSuggestions();
    }

    showTagChipsAndSuggestions() {
        this.updateTagChips();
        this.showTagSuggestions();
    }

    showTagSuggestions() {
        const { currentTag, existingTags } = this.getCurrentTags();
        
        if (currentTag.length === 0) {
            this.hideTagSuggestions();
            return;
        }
        
        // Filter out already selected tags
        const existingTagsList = existingTags ? 
            existingTags.split(',').map(tag => tag.trim().toLowerCase()).filter(tag => tag) : [];
        
        const suggestions = this.getAllTagSuggestions(currentTag).filter(suggestion => 
            !existingTagsList.includes(suggestion.name.toLowerCase())
        );
        const suggestionsContainer = this.elements.tagsSuggestions;

        if (suggestions.length === 0) {
            this.hideTagSuggestions();
            return;
        }

        suggestionsContainer.innerHTML = '';
        
        suggestions.slice(0, 6).forEach((suggestion, index) => {
            const div = document.createElement('div');
            div.className = `tag-suggestion ${suggestion.type}-tag`;
            div.innerHTML = `
                <span class="tag-name">${suggestion.name}</span>
                <span class="tag-usage">${suggestion.count > 0 ? `used ${suggestion.count}x` : 'suggested'}</span>
            `;
            
            div.addEventListener('click', () => this.selectTag(suggestion.name));
            suggestionsContainer.appendChild(div);
        });

        suggestionsContainer.classList.add('show');
        this.selectedSuggestionIndex = -1;
    }

    hideTagSuggestions() {
        this.elements.tagsSuggestions.classList.remove('show');
        this.selectedSuggestionIndex = -1;
    }

    selectTag(tagName) {
        const { existingTags, currentTag } = this.getCurrentTags();
        
        // Check if tag already exists (case insensitive)
        const existingTagsList = existingTags ? 
            existingTags.split(',').map(tag => tag.trim().toLowerCase()).filter(tag => tag) : [];
        
        if (existingTagsList.includes(tagName.toLowerCase())) {
            // Tag already exists, just clear current input and refocus
            this.elements.tagsInput.focus();
            this.hideTagSuggestions();
            return;
        }
        
        const newValue = existingTags + (existingTags ? ' ' : '') + tagName + ', ';
        this.elements.tagsInput.value = newValue;
        this.elements.tagsInput.focus();
        this.hideTagSuggestions();
        this.updateTagChips(); // Refresh chips to show remaining suggestions
        this.updateClearButton(); // Show clear button when tags are added
    }

    handleTagsKeydown(e) {
        const suggestions = this.elements.tagsSuggestions.querySelectorAll('.tag-suggestion');
        
        if (suggestions.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.selectedSuggestionIndex = Math.min(this.selectedSuggestionIndex + 1, suggestions.length - 1);
                this.highlightSuggestion();
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                this.selectedSuggestionIndex = Math.max(this.selectedSuggestionIndex - 1, -1);
                this.highlightSuggestion();
                break;
                
            case 'Enter':
                if (this.selectedSuggestionIndex >= 0) {
                    e.preventDefault();
                    const selectedSuggestion = suggestions[this.selectedSuggestionIndex];
                    const tagName = selectedSuggestion.querySelector('.tag-name').textContent;
                    this.selectTag(tagName);
                }
                break;
                
            case 'Escape':
                this.hideTagSuggestions();
                break;
        }
    }

    highlightSuggestion() {
        const suggestions = this.elements.tagsSuggestions.querySelectorAll('.tag-suggestion');
        
        suggestions.forEach((suggestion, index) => {
            suggestion.classList.toggle('highlighted', index === this.selectedSuggestionIndex);
        });
    }

    handleDocumentClick(e) {
        if (!this.elements.tagsInput.contains(e.target) && !this.elements.tagsSuggestions.contains(e.target)) {
            this.hideTagSuggestions();
        }
    }

    updateClearButton() {
        if (!this.elements.tagsInput || !this.elements.clearTagsBtn) {
            console.log('Tags input or clear button not found, skipping clear button update');
            return;
        }
        const hasContent = this.elements.tagsInput.value.trim().length > 0;
        this.elements.clearTagsBtn.classList.toggle('show', hasContent);
    }

    clearAllTags() {
        if (!this.elements.tagsInput) {
            console.log('Tags input not found, skipping clear tags');
            return;
        }
        this.elements.tagsInput.value = '';
        this.elements.tagsInput.focus();
        this.updateTagChips();
        this.updateClearButton();
        this.hideTagSuggestions();
        
        // Optional: Show a subtle feedback
        this.elements.tagsInput.style.transform = 'scale(0.98)';
        setTimeout(() => {
            this.elements.tagsInput.style.transform = '';
        }, 150);
    }
}

// Initialize the application
let budgetTracker;
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing BudgetTracker...');
    budgetTracker = new BudgetTracker();
    window.budgetTracker = budgetTracker; // Make globally available
    
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