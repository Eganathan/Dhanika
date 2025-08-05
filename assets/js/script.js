document.addEventListener('DOMContentLoaded', () => {
    const transactionForm = document.getElementById('transaction-form');
    const transactionList = document.getElementById('transaction-list');
    const budgetChart = document.getElementById('budget-chart').getContext('2d');
    const cancelEditBtn = document.getElementById('cancel-edit');
    const downloadBtn = document.getElementById('download-btn');
    const exportBtnHeader = document.getElementById('export-btn-header');
    const importFileHeader = document.getElementById('import-file-header');
    const tooltipToggle = document.getElementById('tooltip-toggle');
    const currencySelector = document.getElementById('currency-selector');
    const currentCurrencySpan = document.getElementById('current-currency');
    const totalIncomeEl = document.getElementById('total-income');
    const totalExpensesEl = document.getElementById('total-expenses');
    const balanceEl = document.getElementById('balance');
    const filterButtons = document.querySelectorAll('input[name="filter"]');
    const chartTypeButtons = document.querySelectorAll('input[name="chart-type"]');
    const emptyChartMessage = document.getElementById('empty-chart-message');
    const emptyTransactionMessage = document.getElementById('empty-transaction-message');

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
            const response = await fetch('assets/json/transaction-types.json');
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

    // Tooltip configuration (loaded from JSON)
    let tooltipConfig = {};
    let tooltipsEnabled = localStorage.getItem('tooltipsEnabled') !== 'false'; // Default to true
    let activeTooltipInstances = [];
    let currentActiveTooltip = null;
    
    // Currency configuration
    let currentCurrency = localStorage.getItem('selectedCurrency') || 'INR';
    let currentCurrencySymbol = localStorage.getItem('selectedCurrencySymbol') || '₹';
    
    const currencyConfig = {
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

    // Format amount with current currency and locale-specific formatting
    function formatCurrency(amount) {
        const config = currencyConfig[currentCurrency];
        const absAmount = Math.abs(amount);
        
        try {
            // Use Intl.NumberFormat for proper locale formatting
            const formatter = new Intl.NumberFormat(config.locale, {
                minimumFractionDigits: config.decimals,
                maximumFractionDigits: config.decimals
            });
            
            const formattedNumber = formatter.format(absAmount);
            return `${currentCurrencySymbol}${formattedNumber}`;
        } catch (error) {
            // Fallback to manual formatting if Intl is not supported
            const formattedAmount = absAmount.toFixed(config.decimals);
            if (currentCurrency === 'INR') {
                // Indian numbering system with commas
                return `${currentCurrencySymbol}${formatIndianNumber(formattedAmount)}`;
            } else {
                // Standard thousand separators
                return `${currentCurrencySymbol}${formattedAmount.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
            }
        }
    }

    // Indian numbering system helper
    function formatIndianNumber(num) {
        const parts = num.split('.');
        const integerPart = parts[0];
        const decimalPart = parts[1] ? '.' + parts[1] : '';
        
        // Indian numbering: first comma after 3 digits, then every 2 digits
        let formatted = integerPart;
        if (integerPart.length > 3) {
            const lastThree = integerPart.slice(-3);
            const remaining = integerPart.slice(0, -3);
            formatted = remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree;
        }
        
        return formatted + decimalPart;
    }

    // Currency selection functionality
    function initializeCurrency() {
        currentCurrencySpan.textContent = `${currentCurrencySymbol} ${currentCurrency}`;
        
        // Add click listeners to dropdown items
        document.querySelectorAll('.dropdown-item[data-currency]').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const currency = e.target.dataset.currency;
                const symbol = e.target.dataset.symbol;
                
                currentCurrency = currency;
                currentCurrencySymbol = symbol;
                
                // Save to localStorage
                localStorage.setItem('selectedCurrency', currency);
                localStorage.setItem('selectedCurrencySymbol', symbol);
                
                // Update UI
                currentCurrencySpan.textContent = `${symbol} ${currency}`;
                
                // Re-render all transactions and stats
                renderTransactions();
                
                showSnackbar(`Currency changed to ${currencyConfig[currency].name}`);
            });
        });
    }

    // Load tooltip configuration from JSON file
    async function loadTooltipConfig() {
        try {
            const response = await fetch('assets/json/tooltips.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const tooltipData = await response.json();
            
            // Flatten the nested structure into a single object
            tooltipConfig = {};
            Object.values(tooltipData).forEach(section => {
                Object.assign(tooltipConfig, section);
            });
            
            console.log('Tooltip configuration loaded successfully');
        } catch (error) {
            console.error('Failed to load tooltip configuration:', error);
            // Fallback to basic tooltips if JSON fails to load
            tooltipConfig = {
                '#export-btn-header': { placement: 'bottom', title: 'Export your data with password encryption' },
                'label[for="import-file-header"]': { placement: 'bottom', title: 'Import encrypted data backup' }
            };
        }
    }

    // Function to hide all active tooltips
    function hideAllTooltips() {
        activeTooltipInstances.forEach(tooltipInstance => {
            try {
                tooltipInstance.hide();
            } catch (e) {
                // Ignore errors if tooltip is already disposed
            }
        });
        currentActiveTooltip = null;
    }

    // Function to apply tooltips from configuration
    function initializeTooltips() {
        // Clear existing tooltips
        activeTooltipInstances.forEach(tooltip => {
            try {
                tooltip.dispose();
            } catch (e) {
                // Ignore errors
            }
        });
        activeTooltipInstances = [];

        if (!tooltipsEnabled) {
            updateTooltipToggleButton();
            return;
        }

        Object.keys(tooltipConfig).forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                const config = tooltipConfig[selector];
                element.setAttribute('data-bs-toggle', 'tooltip');
                element.setAttribute('data-bs-placement', config.placement);
                element.setAttribute('title', config.title);
            });
        });
        
        // Initialize Bootstrap tooltips with custom behavior
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.forEach(function (tooltipTriggerEl) {
            const tooltipInstance = new bootstrap.Tooltip(tooltipTriggerEl, {
                trigger: 'hover focus',
                delay: { show: 500, hide: 100 }
            });
            
            activeTooltipInstances.push(tooltipInstance);
            
            // Add event listeners for single tooltip visibility
            tooltipTriggerEl.addEventListener('show.bs.tooltip', function() {
                // Hide other tooltips when showing this one
                if (currentActiveTooltip && currentActiveTooltip !== tooltipInstance) {
                    currentActiveTooltip.hide();
                }
                currentActiveTooltip = tooltipInstance;
            });
            
            tooltipTriggerEl.addEventListener('hidden.bs.tooltip', function() {
                if (currentActiveTooltip === tooltipInstance) {
                    currentActiveTooltip = null;
                }
            });
        });
        
        updateTooltipToggleButton();
    }

    // Function to toggle tooltips on/off
    function toggleTooltips() {
        tooltipsEnabled = !tooltipsEnabled;
        localStorage.setItem('tooltipsEnabled', tooltipsEnabled.toString());
        
        if (!tooltipsEnabled) {
            hideAllTooltips();
            // Remove all tooltip attributes
            document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(element => {
                element.removeAttribute('data-bs-toggle');
                element.removeAttribute('data-bs-placement');
                element.removeAttribute('title');
            });
            // Dispose all tooltip instances
            activeTooltipInstances.forEach(tooltip => {
                try {
                    tooltip.dispose();
                } catch (e) {
                    // Ignore errors
                }
            });
            activeTooltipInstances = [];
        } else {
            initializeTooltips();
        }
        
        updateTooltipToggleButton();
        showSnackbar(tooltipsEnabled ? 'Tooltips enabled' : 'Tooltips disabled');
    }

    // Function to update tooltip toggle button appearance
    function updateTooltipToggleButton() {
        if (tooltipsEnabled) {
            tooltipToggle.classList.remove('btn-outline-info');
            tooltipToggle.classList.add('btn-info');
            tooltipToggle.innerHTML = '<i class="bi bi-question-circle-fill"></i>';
        } else {
            tooltipToggle.classList.remove('btn-info');
            tooltipToggle.classList.add('btn-outline-info');
            tooltipToggle.innerHTML = '<i class="bi bi-question-circle"></i>';
        }
    }

    // Function to hide tooltips on user input
    function addInputListeners() {
        // Hide tooltips when user starts typing in any input field
        document.addEventListener('input', hideAllTooltips);
        document.addEventListener('keydown', hideAllTooltips);
        document.addEventListener('click', function(e) {
            // Hide tooltips when clicking on form elements (but not tooltip triggers)
            if (e.target.matches('input, select, textarea, button[type="submit"]')) {
                hideAllTooltips();
            }
        });
    }

    // Encryption utilities
    async function encryptData(data, password) {
        const enc = new TextEncoder();
        const keyMaterial = await window.crypto.subtle.importKey(
            'raw',
            enc.encode(password),
            { name: 'PBKDF2' },
            false,
            ['deriveBits', 'deriveKey']
        );
        
        const salt = window.crypto.getRandomValues(new Uint8Array(16));
        const key = await window.crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt']
        );
        
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const encrypted = await window.crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: iv },
            key,
            enc.encode(JSON.stringify(data))
        );
        
        return {
            encrypted: Array.from(new Uint8Array(encrypted)),
            salt: Array.from(salt),
            iv: Array.from(iv)
        };
    }

    async function decryptData(encryptedData, password) {
        const enc = new TextEncoder();
        const dec = new TextDecoder();
        
        const keyMaterial = await window.crypto.subtle.importKey(
            'raw',
            enc.encode(password),
            { name: 'PBKDF2' },
            false,
            ['deriveBits', 'deriveKey']
        );
        
        const key = await window.crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: new Uint8Array(encryptedData.salt),
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['decrypt']
        );
        
        const decrypted = await window.crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: new Uint8Array(encryptedData.iv) },
            key,
            new Uint8Array(encryptedData.encrypted)
        );
        
        return JSON.parse(dec.decode(decrypted));
    }

    // Export data with encryption
    async function exportData() {
        const password = prompt('Enter a password to encrypt your data:');
        if (!password) return;
        
        try {
            const exportData = {
                transactions: transactions,
                transactionTypes: transactionTypes,
                currency: currentCurrency,
                currencySymbol: currentCurrencySymbol,
                exportDate: new Date().toISOString(),
                version: '1.0'
            };
            
            const encrypted = await encryptData(exportData, password);
            const blob = new Blob([JSON.stringify(encrypted)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `budget-export-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            showSnackbar('Data exported successfully!');
        } catch (error) {
            console.error('Export error:', error);
            showSnackbar('Export failed. Please try again.', 'error');
        }
    }

    // Import data with decryption
    async function importData(file) {
        const password = prompt('Enter the password to decrypt your data:');
        if (!password) return;
        
        try {
            const text = await file.text();
            const encryptedData = JSON.parse(text);
            const decrypted = await decryptData(encryptedData, password);
            
            if (decrypted.transactions && Array.isArray(decrypted.transactions)) {
                if (confirm(`This will replace your current ${transactions.length} transactions with ${decrypted.transactions.length} imported transactions. Continue?`)) {
                    transactions = decrypted.transactions;
                    if (decrypted.transactionTypes) {
                        transactionTypes = decrypted.transactionTypes;
                    }
                    if (decrypted.currency && decrypted.currencySymbol) {
                        currentCurrency = decrypted.currency;
                        currentCurrencySymbol = decrypted.currencySymbol;
                        localStorage.setItem('selectedCurrency', currentCurrency);
                        localStorage.setItem('selectedCurrencySymbol', currentCurrencySymbol);
                        currentCurrencySpan.textContent = `${currentCurrencySymbol} ${currentCurrency}`;
                    }
                    renderTransactions();
                    showSnackbar(`Successfully imported ${transactions.length} transactions!`);
                }
            } else {
                throw new Error('Invalid file format');
            }
        } catch (error) {
            console.error('Import error:', error);
            showSnackbar('Import failed. Check password and file format.', 'error');
        }
    }

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

        if (filteredTransactions.length === 0) {
            transactionList.style.display = 'none';
            emptyTransactionMessage.style.display = 'block';
        } else {
            transactionList.style.display = 'block';
            emptyTransactionMessage.style.display = 'none';
        }
        
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
                        <p class="amount ${transaction.type} mb-1 fs-5">${transaction.type === 'income' ? '+' : '-'}${formatCurrency(transaction.amount)}</p>
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
        
        // Apply tooltips to dynamically created transaction buttons
        if (tooltipsEnabled) {
            document.querySelectorAll('.edit-btn, .delete-btn').forEach(btn => {
                const btnClass = btn.classList.contains('edit-btn') ? '.edit-btn' : '.delete-btn';
                const config = tooltipConfig[btnClass];
                if (config && !btn.hasAttribute('data-bs-toggle')) {
                    btn.setAttribute('data-bs-toggle', 'tooltip');
                    btn.setAttribute('data-bs-placement', config.placement);
                    btn.setAttribute('title', config.title);
                    
                    const tooltipInstance = new bootstrap.Tooltip(btn, {
                        trigger: 'hover focus',
                        delay: { show: 500, hide: 100 }
                    });
                    
                    activeTooltipInstances.push(tooltipInstance);
                    
                    // Add event listeners for single tooltip visibility
                    btn.addEventListener('show.bs.tooltip', function() {
                        if (currentActiveTooltip && currentActiveTooltip !== tooltipInstance) {
                            currentActiveTooltip.hide();
                        }
                        currentActiveTooltip = tooltipInstance;
                    });
                    
                    btn.addEventListener('hidden.bs.tooltip', function() {
                        if (currentActiveTooltip === tooltipInstance) {
                            currentActiveTooltip = null;
                        }
                    });
                }
            });
        }
    }

    function updateChart() {
        if (chart) {
            chart.destroy();
        }

        const hasTransactions = transactions.length > 0;
        budgetChart.canvas.style.display = hasTransactions ? 'block' : 'none';
        emptyChartMessage.style.display = hasTransactions ? 'none' : 'block';

        if (!hasTransactions) {
            return;
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
                                    return context.label + ': ' + formatCurrency(context.parsed);
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
                                    return context.label + ': ' + formatCurrency(context.parsed) + ' (' + percentage + '%)';
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
        
        totalIncomeEl.textContent = formatCurrency(income);
        totalExpensesEl.textContent = formatCurrency(expenses);
        balanceEl.textContent = formatCurrency(balance);
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
                    ${incomes.map(t => `<tr><td>${t.description}</td><td>${formatCurrency(t.amount)}</td></tr>`).join('')}
                    <tr class="total"><td>Total</td><td>${formatCurrency(totalIncome)}</td></tr>
                </tbody>
            </table>
            <h2>Expenses</h2>
            <table>
                <thead><tr><th>Description</th><th>Amount</th></tr></thead>
                <tbody>
                    ${expenses.map(t => `<tr><td>${t.description}</td><td>${formatCurrency(t.amount)}</td></tr>`).join('')}
                    <tr class="total"><td>Total</td><td>${formatCurrency(totalExpense)}</td></tr>
                </tbody>
            </table>
            <h2>Summary</h2>
            <table>
                <tbody>
                    <tr><td>Total Income</td><td>${formatCurrency(totalIncome)}</td></tr>
                    <tr><td>Total Expense</td><td>${formatCurrency(totalExpense)}</td></tr>
                    <tr class="total"><td>Balance</td><td>${formatCurrency(balance)}</td></tr>
                </tbody>
            </table>
        `;

        html2pdf().from(report).save('budget-summary.pdf');
    });

    exportBtnHeader.addEventListener('click', exportData);

    importFileHeader.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            importData(file);
            e.target.value = '';
        }
    });

    tooltipToggle.addEventListener('click', toggleTooltips);
    
    
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
    initializeCurrency();
    
    // Load tooltip configuration and initialize all tooltips
    loadTooltipConfig().then(() => {
        initializeTooltips();
        addInputListeners();
    });
});