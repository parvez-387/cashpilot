// Cash Pilot - Main Application JavaScript

// Global State
let currentScreen = 'login-screen';
let currentAppScreen = 'dashboard-screen';
let currentUser = null;
let currentTransactionId = null;
let currentLoanId = null;
let isOnline = false;
let transactionOffset = 0;
let transactionLimit = 10;
let hasMoreTransactions = true;
let notifications = [];
let currentFilters = {};
let userSettings = {
    currency: 'USD',
    defaultAccount: 'cash',
    dateFormat: 'MM/DD/YYYY',
    language: 'en',
    theme: 'light'
};
let masterPreferences = [];

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    checkAuthentication();
    loadNotifications();
});

async function initializeApp() {
    // Try to connect to database
    isOnline = await db.connect();
    
    if (!isOnline) {
        console.log('Using offline mode with LocalStorage');
    }
    
    // Load user settings
    loadUserSettings();
    
    // Load master preferences
    loadMasterPreferences();
    
    // Set today's date as default for date inputs
    const today = new Date().toISOString().split('T')[0];
    document.querySelectorAll('input[type="date"]').forEach(input => {
        if (!input.value) {
            input.value = today;
        }
    });
}

function setupEventListeners() {
    // Login Form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Signup Form
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }
    
    // Transaction Forms
    const addIncomeForm = document.getElementById('add-income-form');
    if (addIncomeForm) {
        addIncomeForm.addEventListener('submit', handleAddIncome);
    }
    
    const addExpenseForm = document.getElementById('add-expense-form');
    if (addExpenseForm) {
        addExpenseForm.addEventListener('submit', handleAddExpense);
    }
    
    const addLoanGivenForm = document.getElementById('add-loan-given-form');
    if (addLoanGivenForm) {
        addLoanGivenForm.addEventListener('submit', handleAddLoanGiven);
    }
    
    const addLoanTakenForm = document.getElementById('add-loan-taken-form');
    if (addLoanTakenForm) {
        addLoanTakenForm.addEventListener('submit', handleAddLoanTaken);
    }
    
    const addRepaymentForm = document.getElementById('add-repayment-form');
    if (addRepaymentForm) {
        addRepaymentForm.addEventListener('submit', handleAddRepayment);
    }
    
    const addCategoryForm = document.getElementById('add-category-form');
    if (addCategoryForm) {
        addCategoryForm.addEventListener('submit', handleAddCategory);
    }
    
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', handleUpdateProfile);
    }
    
    const editTransactionForm = document.getElementById('edit-transaction-form');
    if (editTransactionForm) {
        editTransactionForm.addEventListener('submit', handleEditTransaction);
    }
    
    // Click outside modal to close
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });
}

// Authentication Functions
function checkAuthentication() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
        currentUser = JSON.parse(user);
        showScreen('main-app');
        loadDashboard();
        
        // Add welcome notification
        addNotification(
            'Welcome Back!', 
            `Hello ${currentUser.name}, you have successfully logged in.`,
            'success'
        );
    } else {
        showScreen('login-screen');
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    // Show loading state
    document.getElementById('login-btn-text').classList.add('hidden');
    document.getElementById('login-btn-loading').classList.remove('hidden');
    
    try {
        let response;
        if (isOnline) {
            response = await db.login(email, password);
        } else {
            // Offline mode - simulate login
            response = {
                token: 'offline-token-' + Date.now(),
                user: { id: 1, name: 'Demo User', email: email }
            };
        }
        
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        currentUser = response.user;
        
        showScreen('main-app');
        loadDashboard();
        showNotification('Welcome back!', 'success');
    } catch (error) {
        showNotification('Invalid email or password', 'error');
    } finally {
        document.getElementById('login-btn-text').classList.remove('hidden');
        document.getElementById('login-btn-loading').classList.add('hidden');
    }
}

async function handleSignup(e) {
    e.preventDefault();
    
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;
    
    if (password !== confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return;
    }
    
    if (password.length < 8) {
        showNotification('Password must be at least 8 characters', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        let response;
        if (isOnline) {
            response = await db.signup(name, email, password);
        } else {
            // Offline mode - create user locally
            response = {
                token: 'offline-token-' + Date.now(),
                user: { id: Date.now(), name, email }
            };
            localDB.setUser(response.user);
        }
        
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        currentUser = response.user;
        
        showScreen('main-app');
        loadDashboard();
        showNotification('Account created successfully!', 'success');
    } catch (error) {
        showNotification('Signup failed. Email may already exist.', 'error');
    } finally {
        showLoading(false);
    }
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        currentUser = null;
        showScreen('login-screen');
        showNotification('Logged out successfully', 'success');
    }
}

function showForgotPassword() {
    alert('Password reset functionality will be implemented with backend.');
}

// Screen Management
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
    currentScreen = screenId;
}

function showAppScreen(screenId) {
    document.querySelectorAll('.app-screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
    currentAppScreen = screenId;
    
    // Update navigation active states
    document.querySelectorAll('.nav-btn, .sidebar-link').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Load screen-specific data
    switch(screenId) {
        case 'dashboard-screen':
            loadDashboard();
            break;
        case 'transactions-screen':
            loadTransactions();
            break;
        case 'income-screen':
            loadIncomes();
            break;
        case 'expense-screen':
            loadExpenses();
            break;
        case 'loans-screen':
            loadLoans();
            break;
        case 'reports-screen':
            loadReports();
            break;
        case 'settings-screen':
            loadSettings();
            break;
        case 'profile-screen':
            loadProfile();
            break;
    }
}

// Modal Management
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Dashboard Functions
async function loadDashboard() {
    showLoading(true);
    
    try {
        let stats;
        if (isOnline) {
            stats = await db.getDashboardStats();
        } else {
            stats = calculateLocalStats();
        }
        
        // Update balance cards
        document.getElementById('total-income').textContent = formatCurrency(stats.totalIncome || 0);
        document.getElementById('total-expense').textContent = formatCurrency(stats.totalExpense || 0);
        document.getElementById('net-balance').textContent = formatCurrency(stats.netBalance || 0);
        document.getElementById('loans-given').textContent = formatCurrency(stats.loansGiven || 0);
        document.getElementById('loans-taken').textContent = formatCurrency(stats.loansTaken || 0);
        
        // Load recent transactions
        await loadRecentTransactions();
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showNotification('Error loading dashboard', 'error');
    } finally {
        showLoading(false);
    }
}

function calculateLocalStats() {
    const transactions = localDB.getTransactions();
    const loans = localDB.getLoans();
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    let totalIncome = 0;
    let totalExpense = 0;
    
    transactions.forEach(t => {
        const tDate = new Date(t.date);
        if (tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear) {
            if (t.type === 'income') {
                totalIncome += parseFloat(t.amount);
            } else if (t.type === 'expense') {
                totalExpense += parseFloat(t.amount);
            }
        }
    });
    
    const loansGiven = loans.filter(l => l.type === 'given').reduce((sum, l) => sum + parseFloat(l.outstanding || l.amount), 0);
    const loansTaken = loans.filter(l => l.type === 'taken').reduce((sum, l) => sum + parseFloat(l.outstanding || l.amount), 0);
    
    return {
        totalIncome,
        totalExpense,
        netBalance: totalIncome - totalExpense,
        loansGiven,
        loansTaken
    };
}

async function loadRecentTransactions() {
    try {
        let transactions;
        if (isOnline) {
            transactions = await db.getTransactions({ limit: 10, sort: 'date_desc' });
        } else {
            transactions = localDB.getTransactions();
            transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
            transactions = transactions.slice(0, 10);
        }
        
        const container = document.getElementById('recent-transactions');
        
        if (transactions.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-receipt text-4xl mb-2"></i>
                    <p>No transactions yet</p>
                    <p class="text-sm mt-2">Start by adding your first transaction</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = transactions.map(t => createTransactionCard(t)).join('');
        
    } catch (error) {
        console.error('Error loading recent transactions:', error);
    }
}

function createTransactionCard(transaction) {
    const iconClass = getTransactionIcon(transaction.type);
    const iconBg = getTransactionColor(transaction.type);
    const amount = transaction.type === 'expense' ? `-${formatCurrency(transaction.amount)}` : `+${formatCurrency(transaction.amount)}`;
    const amountColor = transaction.type === 'expense' ? 'text-red-600' : 'text-green-600';
    
    return `
        <div class="transaction-card" onclick="showTransactionDetail(${transaction.id})">
            <div class="flex items-center flex-1">
                <div class="transaction-icon ${iconBg}">
                    <i class="fas ${iconClass}"></i>
                </div>
                <div>
                    <p class="font-medium text-gray-800">${transaction.category || transaction.type}</p>
                    <p class="text-sm text-gray-500">${formatDate(transaction.date)}</p>
                </div>
            </div>
            <div class="text-right">
                <p class="font-bold ${amountColor}">${amount}</p>
                <p class="text-xs text-gray-500">${transaction.account || 'Cash'}</p>
            </div>
        </div>
    `;
}

// Transaction Functions
async function loadTransactions(reset = true) {
    if (reset) {
        transactionOffset = 0;
        hasMoreTransactions = true;
    }
    
    // Populate filter dropdowns
    populateFilterDropdowns();
    
    showLoading(true);
    
    try {
        let transactions;
        if (isOnline) {
            transactions = await db.getTransactions({ limit: transactionLimit, offset: transactionOffset });
        } else {
            const allTransactions = localDB.getTransactions();
            allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
            transactions = allTransactions.slice(transactionOffset, transactionOffset + transactionLimit);
        }
        
        const container = document.getElementById('transactions-list');
        
        if (reset) {
            if (transactions.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-receipt"></i>
                        <p>No transactions found</p>
                    </div>
                `;
                document.getElementById('load-more-btn').classList.add('hidden');
                return;
            }
            container.innerHTML = '';
        }
        
        // Append new transactions
        transactions.forEach(t => {
            const div = document.createElement('div');
            div.innerHTML = createTransactionListItem(t);
            container.appendChild(div.firstElementChild);
        });
        
        // Update load more button state
        if (transactions.length < transactionLimit) {
            hasMoreTransactions = false;
            document.getElementById('load-more-btn').classList.add('hidden');
            document.getElementById('no-more-transactions').classList.remove('hidden');
        } else {
            document.getElementById('load-more-btn').classList.remove('hidden');
            document.getElementById('no-more-transactions').classList.add('hidden');
        }
        
    } catch (error) {
        console.error('Error loading transactions:', error);
        showNotification('Error loading transactions', 'error');
    } finally {
        showLoading(false);
    }
}

function createTransactionListItem(transaction) {
    const iconClass = getTransactionIcon(transaction.type);
    const iconBg = getTransactionColor(transaction.type);
    const amount = transaction.type === 'expense' ? `-${formatCurrency(transaction.amount)}` : `+${formatCurrency(transaction.amount)}`;
    const amountColor = transaction.type === 'expense' ? 'text-red-600' : 'text-green-600';
    
    return `
        <div class="p-4 hover:bg-gray-50 cursor-pointer transition" onclick="showTransactionDetail(${transaction.id})">
            <div class="flex items-center justify-between">
                <div class="flex items-center flex-1">
                    <div class="transaction-icon ${iconBg} mr-3">
                        <i class="fas ${iconClass}"></i>
                    </div>
                    <div>
                        <p class="font-medium text-gray-800">${transaction.category || transaction.type}</p>
                        <p class="text-sm text-gray-500">${formatDateTime(transaction.date)}</p>
                        ${transaction.notes ? `<p class="text-xs text-gray-400 mt-1">${transaction.notes}</p>` : ''}
                    </div>
                </div>
                <div class="text-right">
                    <p class="font-bold ${amountColor} text-lg">${amount}</p>
                    <p class="text-xs text-gray-500">${transaction.account || 'Cash'}</p>
                </div>
            </div>
        </div>
    `;
}

function showTransactionDetail(id) {
    currentTransactionId = id;
    let transaction;
    
    if (isOnline) {
        db.getTransaction(id).then(t => {
            transaction = t;
            displayTransactionDetail(transaction);
        });
    } else {
        const transactions = localDB.getTransactions();
        transaction = transactions.find(t => t.id === id);
        displayTransactionDetail(transaction);
    }
}

function displayTransactionDetail(transaction) {
    const content = document.getElementById('transaction-detail-content');
    const iconClass = getTransactionIcon(transaction.type);
    const amount = formatCurrency(transaction.amount);
    
    content.innerHTML = `
        <div class="space-y-4">
            <div class="flex items-center justify-between">
                <div class="flex items-center">
                    <i class="fas ${iconClass} text-2xl mr-3 text-blue-600"></i>
                    <div>
                        <p class="text-sm text-gray-500">Type</p>
                        <p class="font-medium capitalize">${transaction.type}</p>
                    </div>
                </div>
                <div class="text-right">
                    <p class="text-sm text-gray-500">Amount</p>
                    <p class="text-2xl font-bold text-blue-600">${amount}</p>
                </div>
            </div>
            
            <hr>
            
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <p class="text-sm text-gray-500">Date</p>
                    <p class="font-medium">${formatDate(transaction.date)}</p>
                </div>
                <div>
                    <p class="text-sm text-gray-500">Time</p>
                    <p class="font-medium">${formatTime(transaction.date)}</p>
                </div>
                <div>
                    <p class="text-sm text-gray-500">Category</p>
                    <p class="font-medium">${transaction.category || 'N/A'}</p>
                </div>
                <div>
                    <p class="text-sm text-gray-500">Account</p>
                    <p class="font-medium">${transaction.account || 'Cash'}</p>
                </div>
            </div>
            
            ${transaction.counterparty ? `
                <div>
                    <p class="text-sm text-gray-500">Counterparty</p>
                    <p class="font-medium">${transaction.counterparty}</p>
                </div>
            ` : ''}
            
            ${transaction.notes ? `
                <div>
                    <p class="text-sm text-gray-500">Notes</p>
                    <p class="font-medium">${transaction.notes}</p>
                </div>
            ` : ''}
        </div>
    `;
    
    openModal('transaction-detail-modal');
}

function editTransaction() {
    if (!currentTransactionId) return;
    
    let transaction;
    
    if (isOnline) {
        db.getTransaction(currentTransactionId).then(t => {
            transaction = t;
            openEditTransactionModal(transaction);
        });
    } else {
        const transactions = localDB.getTransactions();
        transaction = transactions.find(t => t.id === currentTransactionId);
        openEditTransactionModal(transaction);
    }
    
    closeModal('transaction-detail-modal');
}

function openEditTransactionModal(transaction) {
    // Populate form fields
    document.getElementById('edit-transaction-id').value = transaction.id;
    document.getElementById('edit-transaction-type').value = transaction.type;
    document.getElementById('edit-amount').value = transaction.amount;
    document.getElementById('edit-date').value = transaction.date;
    document.getElementById('edit-account').value = transaction.account || 'cash';
    document.getElementById('edit-notes').value = transaction.notes || '';
    
    // Populate category dropdown based on transaction type
    const categorySelect = document.getElementById('edit-category');
    const categories = localDB.getCategories(transaction.type);
    
    categorySelect.innerHTML = '<option value="">Select Category</option>';
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.name;
        option.textContent = cat.name;
        if (cat.name === transaction.category) {
            option.selected = true;
        }
        categorySelect.appendChild(option);
    });
    
    // Show/hide counterparty field
    const counterpartyField = document.getElementById('edit-counterparty-field');
    if (transaction.type === 'expense') {
        counterpartyField.classList.remove('hidden');
        document.getElementById('edit-counterparty').value = transaction.counterparty || '';
    } else {
        counterpartyField.classList.add('hidden');
    }
    
    openModal('edit-transaction-modal');
}

async function handleEditTransaction(e) {
    e.preventDefault();
    
    const id = parseInt(document.getElementById('edit-transaction-id').value);
    const type = document.getElementById('edit-transaction-type').value;
    
    const updates = {
        type: type,
        amount: parseFloat(document.getElementById('edit-amount').value),
        category: document.getElementById('edit-category').value,
        date: document.getElementById('edit-date').value,
        account: document.getElementById('edit-account').value,
        notes: document.getElementById('edit-notes').value
    };
    
    if (type === 'expense') {
        updates.counterparty = document.getElementById('edit-counterparty').value;
    }
    
    try {
        if (isOnline) {
            await db.updateTransaction(id, updates);
        } else {
            localDB.updateTransaction(id, updates);
        }
        
        closeModal('edit-transaction-modal');
        showNotification('Transaction updated successfully', 'success');
        
        // Add notification
        addNotification('Transaction Updated', `${type} of ${formatCurrency(updates.amount)} has been updated`, 'success');
        
        // Reload current view
        loadDashboard();
        
        if (currentAppScreen === 'transactions-screen') {
            transactionOffset = 0;
            loadTransactions();
        } else if (currentAppScreen === 'income-screen') {
            loadIncomes();
        } else if (currentAppScreen === 'expense-screen') {
            loadExpenses();
        }
    } catch (error) {
        showNotification('Error updating transaction', 'error');
    }
}

async function deleteTransaction() {
    if (!confirm('Are you sure you want to delete this transaction?')) {
        return;
    }
    
    try {
        let transaction;
        if (isOnline) {
            transaction = await db.getTransaction(currentTransactionId);
            await db.deleteTransaction(currentTransactionId);
        } else {
            const transactions = localDB.getTransactions();
            transaction = transactions.find(t => t.id === currentTransactionId);
            localDB.deleteTransaction(currentTransactionId);
        }
        
        closeModal('transaction-detail-modal');
        showNotification('Transaction deleted successfully', 'success');
        
        // Add notification
        addNotification('Transaction Deleted', `${transaction.type} of ${formatCurrency(transaction.amount)} has been deleted`, 'warning');
        
        loadDashboard();
        
        if (currentAppScreen === 'transactions-screen') {
            transactionOffset = 0;
            loadTransactions();
        }
    } catch (error) {
        showNotification('Error deleting transaction', 'error');
    }
}

// Income Functions
async function loadIncomes() {
    showLoading(true);
    
    try {
        let incomes;
        if (isOnline) {
            incomes = await db.getIncomes();
        } else {
            incomes = localDB.getTransactions({ type: 'income' });
        }
        
        incomes.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Calculate summaries
        const thisMonth = calculatePeriodTotal(incomes, 'month');
        const lastMonth = calculatePeriodTotal(incomes, 'lastMonth');
        const thisYear = calculatePeriodTotal(incomes, 'year');
        
        document.getElementById('income-this-month').textContent = formatCurrency(thisMonth);
        document.getElementById('income-last-month').textContent = formatCurrency(lastMonth);
        document.getElementById('income-this-year').textContent = formatCurrency(thisYear);
        
        const container = document.getElementById('income-list');
        
        if (incomes.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-arrow-up"></i>
                    <p>No income records found</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = incomes.map(i => createTransactionListItem(i)).join('');
        
    } catch (error) {
        console.error('Error loading incomes:', error);
        showNotification('Error loading income data', 'error');
    } finally {
        showLoading(false);
    }
}

async function handleAddIncome(e) {
    e.preventDefault();
    
    const form = e.target;
    const income = {
        type: 'income',
        amount: parseFloat(form.elements[0].value),
        category: form.elements[1].value,
        date: form.elements[2].value,
        account: form.elements[3].value,
        notes: form.elements[4].value,
        createdAt: new Date().toISOString()
    };
    
    try {
        if (isOnline) {
            await db.createIncome(income);
        } else {
            localDB.createTransaction(income);
        }
        
        closeModal('add-income-modal');
        form.reset();
        showNotification('Income added successfully', 'success');
        
        // Add notification
        addNotification('Income Added', `New income of ${formatCurrency(income.amount)} added successfully`, 'success');
        
        loadDashboard();
        
        if (currentAppScreen === 'income-screen') {
            loadIncomes();
        }
    } catch (error) {
        showNotification('Error adding income', 'error');
    }
}

// Expense Functions
async function loadExpenses() {
    showLoading(true);
    
    try {
        let expenses;
        if (isOnline) {
            expenses = await db.getExpenses();
        } else {
            expenses = localDB.getTransactions({ type: 'expense' });
        }
        
        expenses.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Calculate summaries
        const thisMonth = calculatePeriodTotal(expenses, 'month');
        const lastMonth = calculatePeriodTotal(expenses, 'lastMonth');
        const thisYear = calculatePeriodTotal(expenses, 'year');
        
        document.getElementById('expense-this-month').textContent = formatCurrency(thisMonth);
        document.getElementById('expense-last-month').textContent = formatCurrency(lastMonth);
        document.getElementById('expense-this-year').textContent = formatCurrency(thisYear);
        
        const container = document.getElementById('expense-list');
        
        if (expenses.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-arrow-down"></i>
                    <p>No expense records found</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = expenses.map(e => createTransactionListItem(e)).join('');
        
    } catch (error) {
        console.error('Error loading expenses:', error);
        showNotification('Error loading expense data', 'error');
    } finally {
        showLoading(false);
    }
}

async function handleAddExpense(e) {
    e.preventDefault();
    
    const form = e.target;
    const expense = {
        type: 'expense',
        amount: parseFloat(form.elements[0].value),
        category: form.elements[1].value,
        date: form.elements[2].value,
        account: form.elements[3].value,
        counterparty: form.elements[4].value,
        notes: form.elements[5].value,
        createdAt: new Date().toISOString()
    };
    
    try {
        if (isOnline) {
            await db.createExpense(expense);
        } else {
            localDB.createTransaction(expense);
        }
        
        closeModal('add-expense-modal');
        form.reset();
        showNotification('Expense added successfully', 'success');
        
        // Add notification
        addNotification('Expense Added', `New expense of ${formatCurrency(expense.amount)} added successfully`, 'info');
        
        loadDashboard();
        
        if (currentAppScreen === 'expense-screen') {
            loadExpenses();
        }
    } catch (error) {
        showNotification('Error adding expense', 'error');
    }
}

// Loan Functions
async function loadLoans() {
    showLoading(true);
    
    try {
        let loansGiven, loansTaken;
        
        if (isOnline) {
            loansGiven = await db.getLoans('given');
            loansTaken = await db.getLoans('taken');
        } else {
            loansGiven = localDB.getLoans('given');
            loansTaken = localDB.getLoans('taken');
        }
        
        displayLoans('loans-given-list', loansGiven, 'given');
        displayLoans('loans-taken-list', loansTaken, 'taken');
        
    } catch (error) {
        console.error('Error loading loans:', error);
        showNotification('Error loading loans', 'error');
    } finally {
        showLoading(false);
    }
}

function displayLoans(containerId, loans, type) {
    const container = document.getElementById(containerId);
    
    if (loans.length === 0) {
        container.innerHTML = `
            <div class="empty-state py-8">
                <i class="fas fa-hand-holding-usd text-3xl"></i>
                <p class="text-sm mt-2">No ${type === 'given' ? 'loans given' : 'loans taken'}</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = loans.map(loan => createLoanCard(loan, type)).join('');
}

function createLoanCard(loan, type) {
    const outstanding = loan.outstanding || loan.amount;
    const percentage = ((outstanding / loan.amount) * 100).toFixed(0);
    const daysUntilDue = Math.ceil((new Date(loan.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
    const statusClass = daysUntilDue < 0 ? 'overdue' : daysUntilDue < 7 ? 'due-soon' : '';
    const statusText = daysUntilDue < 0 ? 'Overdue' : daysUntilDue < 7 ? 'Due Soon' : `${daysUntilDue} days left`;
    const color = type === 'given' ? 'orange' : 'purple';
    
    return `
        <div class="loan-card ${statusClass}" onclick="showLoanDetail(${loan.id})">
            <div class="flex items-center justify-between mb-3">
                <div>
                    <p class="font-semibold text-gray-800">${loan.borrowerName || loan.lenderName}</p>
                    <p class="text-sm text-gray-500">${formatDate(loan.startDate)}</p>
                </div>
                <div class="text-right">
                    <p class="text-xl font-bold text-${color}-600">${formatCurrency(outstanding)}</p>
                    <p class="text-xs text-gray-500">of ${formatCurrency(loan.amount)}</p>
                </div>
            </div>
            
            <div class="mb-2">
                <div class="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Repaid: ${100 - percentage}%</span>
                    <span>${statusText}</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-bar-fill" style="width: ${100 - percentage}%"></div>
                </div>
            </div>
            
            ${loan.interestRate ? `<p class="text-xs text-gray-500">Interest: ${loan.interestRate}%</p>` : ''}
        </div>
    `;
}

function showLoanDetail(id) {
    currentLoanId = id;
    let loan;
    
    if (isOnline) {
        db.getLoan(id).then(l => {
            loan = l;
            displayLoanDetail(loan);
        });
    } else {
        const loans = localDB.getLoans();
        loan = loans.find(l => l.id === id);
        displayLoanDetail(loan);
    }
}

function displayLoanDetail(loan) {
    const content = document.getElementById('loan-detail-content');
    const outstanding = loan.outstanding || loan.amount;
    const daysUntilDue = Math.ceil((new Date(loan.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
    const isOverdue = daysUntilDue < 0;
    
    content.innerHTML = `
        <div class="space-y-4">
            <div class="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
                <p class="text-sm opacity-90">${loan.type === 'given' ? 'Borrower' : 'Lender'}</p>
                <h3 class="text-2xl font-bold mb-4">${loan.borrowerName || loan.lenderName}</h3>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <p class="text-sm opacity-90">Principal</p>
                        <p class="text-xl font-bold">${formatCurrency(loan.amount)}</p>
                    </div>
                    <div>
                        <p class="text-sm opacity-90">Outstanding</p>
                        <p class="text-xl font-bold">${formatCurrency(outstanding)}</p>
                    </div>
                </div>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <p class="text-sm text-gray-500">Start Date</p>
                    <p class="font-medium">${formatDate(loan.startDate)}</p>
                </div>
                <div>
                    <p class="text-sm text-gray-500">Due Date</p>
                    <p class="font-medium ${isOverdue ? 'text-red-600' : ''}">${formatDate(loan.dueDate)}</p>
                </div>
                <div>
                    <p class="text-sm text-gray-500">Interest Rate</p>
                    <p class="font-medium">${loan.interestRate || 0}%</p>
                </div>
                <div>
                    <p class="text-sm text-gray-500">Days ${isOverdue ? 'Overdue' : 'Until Due'}</p>
                    <p class="font-medium ${isOverdue ? 'text-red-600' : ''}">${Math.abs(daysUntilDue)} days</p>
                </div>
            </div>
            
            ${loan.notes ? `
                <div>
                    <p class="text-sm text-gray-500">Notes</p>
                    <p class="font-medium">${loan.notes}</p>
                </div>
            ` : ''}
            
            <hr>
            
            <div>
                <div class="flex items-center justify-between mb-3">
                    <h4 class="font-semibold">Repayment History</h4>
                    <button onclick="openRepaymentModal(${loan.id})" class="text-blue-600 text-sm hover:underline">
                        <i class="fas fa-plus mr-1"></i> Add Repayment
                    </button>
                </div>
                <div id="repayment-history" class="space-y-2">
                    ${loan.repayments && loan.repayments.length > 0 ? 
                        loan.repayments.map(r => `
                            <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <div>
                                    <p class="font-medium">${formatCurrency(r.amount)}</p>
                                    <p class="text-xs text-gray-500">${formatDate(r.date)}</p>
                                </div>
                                <i class="fas fa-check-circle text-green-500"></i>
                            </div>
                        `).join('') : 
                        '<p class="text-sm text-gray-500 text-center py-4">No repayments yet</p>'
                    }
                </div>
            </div>
            
            ${outstanding === 0 ? `
                <div class="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <i class="fas fa-check-circle text-green-600 text-2xl mb-2"></i>
                    <p class="text-green-800 font-medium">Fully Repaid</p>
                </div>
            ` : ''}
        </div>
    `;
    
    openModal('loan-detail-modal');
}

async function handleAddLoanGiven(e) {
    e.preventDefault();
    
    const form = e.target;
    const loan = {
        type: 'given',
        borrowerName: form.elements[0].value,
        amount: parseFloat(form.elements[1].value),
        interestRate: parseFloat(form.elements[2].value) || 0,
        startDate: form.elements[3].value,
        dueDate: form.elements[4].value,
        notes: form.elements[5].value,
        outstanding: parseFloat(form.elements[1].value),
        repayments: []
    };
    
    try {
        if (isOnline) {
            await db.createLoan(loan);
        } else {
            localDB.createLoan(loan);
        }
        
        closeModal('add-loan-given-modal');
        form.reset();
        showNotification('Loan given added successfully', 'success');
        
        // Add notification
        addNotification('Loan Given', `Loan of ${formatCurrency(loan.amount)} given to ${loan.borrowerName}`, 'info');
        
        loadDashboard();
        
        if (currentAppScreen === 'loans-screen') {
            loadLoans();
        }
    } catch (error) {
        showNotification('Error adding loan', 'error');
    }
}

async function handleAddLoanTaken(e) {
    e.preventDefault();
    
    const form = e.target;
    const loan = {
        type: 'taken',
        lenderName: form.elements[0].value,
        amount: parseFloat(form.elements[1].value),
        interestRate: parseFloat(form.elements[2].value) || 0,
        startDate: form.elements[3].value,
        dueDate: form.elements[4].value,
        notes: form.elements[5].value,
        outstanding: parseFloat(form.elements[1].value),
        repayments: []
    };
    
    try {
        if (isOnline) {
            await db.createLoan(loan);
        } else {
            localDB.createLoan(loan);
        }
        
        closeModal('add-loan-taken-modal');
        form.reset();
        showNotification('Loan taken added successfully', 'success');
        
        // Add notification
        addNotification('Loan Taken', `Loan of ${formatCurrency(loan.amount)} taken from ${loan.lenderName}`, 'warning');
        
        loadDashboard();
        
        if (currentAppScreen === 'loans-screen') {
            loadLoans();
        }
    } catch (error) {
        showNotification('Error adding loan', 'error');
    }
}

function openRepaymentModal(loanId) {
    currentLoanId = loanId;
    document.getElementById('repayment-loan-id').value = loanId;
    closeModal('loan-detail-modal');
    openModal('add-repayment-modal');
}

async function handleAddRepayment(e) {
    e.preventDefault();
    
    const form = e.target;
    const repaymentAmount = parseFloat(form.elements[1].value);
    const repaymentDate = form.elements[2].value;
    const repaymentNotes = form.elements[3].value;
    
    const repayment = {
        amount: repaymentAmount,
        date: repaymentDate,
        notes: repaymentNotes
    };
    
    try {
        // Get loan details first
        let loan;
        if (isOnline) {
            loan = await db.getLoan(currentLoanId);
        } else {
            const loans = localDB.getLoans();
            loan = loans.find(l => l.id === currentLoanId);
        }
        
        // Add repayment to loan
        if (isOnline) {
            await db.addRepayment(currentLoanId, repayment);
        } else {
            localDB.addRepayment(currentLoanId, repayment);
        }
        
        // Create a transaction entry for the repayment
        const repaymentTransaction = {
            type: 'repayment',
            amount: repaymentAmount,
            category: loan.type === 'given' ? 'Loan Repayment Received' : 'Loan Repayment Paid',
            date: repaymentDate,
            account: userSettings.defaultAccount || 'cash',
            notes: repaymentNotes || `Repayment for loan ${loan.type === 'given' ? 'from' : 'to'} ${loan.borrowerName || loan.lenderName}`,
            counterparty: loan.borrowerName || loan.lenderName,
            createdAt: new Date().toISOString()
        };
        
        if (isOnline) {
            await db.createTransaction(repaymentTransaction);
        } else {
            localDB.createTransaction(repaymentTransaction);
        }
        
        closeModal('add-repayment-modal');
        form.reset();
        showNotification('Repayment added successfully', 'success');
        
        // Add notification
        addNotification('Repayment Added', `Repayment of ${formatCurrency(repaymentAmount)} has been recorded`, 'success');
        
        loadDashboard();
        
        if (currentAppScreen === 'loans-screen') {
            loadLoans();
        }
        if (currentAppScreen === 'transactions-screen') {
            transactionOffset = 0;
            loadTransactions();
        }
    } catch (error) {
        showNotification('Error adding repayment', 'error');
    }
}

// Reports Functions
async function loadReports() {
    showLoading(true);
    
    try {
        // Apply default date range if not set
        const reportDateFrom = document.getElementById('report-date-from');
        const reportDateTo = document.getElementById('report-date-to');
        
        if (!reportDateFrom.value) {
            const firstDayOfMonth = new Date();
            firstDayOfMonth.setDate(1);
            reportDateFrom.value = firstDayOfMonth.toISOString().split('T')[0];
        }
        
        if (!reportDateTo.value) {
            reportDateTo.value = new Date().toISOString().split('T')[0];
        }
        
        loadReportData();
        
    } catch (error) {
        console.error('Error loading reports:', error);
        showNotification('Error loading reports', 'error');
    } finally {
        showLoading(false);
    }
}

async function loadReportData() {
    const dateFrom = document.getElementById('report-date-from').value;
    const dateTo = document.getElementById('report-date-to').value;
    const reportType = document.getElementById('report-type-filter')?.value || 'all';
    
    let transactions;
    if (isOnline) {
        transactions = await db.getTransactions({ startDate: dateFrom, endDate: dateTo });
    } else {
        transactions = localDB.getTransactions();
        transactions = transactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate >= new Date(dateFrom) && tDate <= new Date(dateTo);
        });
    }
    
    // Filter by type if selected
    if (reportType && reportType !== 'all') {
        transactions = transactions.filter(t => t.type === reportType);
    }
    
    // Calculate stats
    const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const netBalance = income - expense;
    
    document.getElementById('report-monthly-income').textContent = formatCurrency(income);
    document.getElementById('report-monthly-expense').textContent = formatCurrency(expense);
    document.getElementById('report-net-balance').textContent = formatCurrency(netBalance);
    
    const savingsRate = income > 0 ? ((netBalance / income) * 100).toFixed(1) : 0;
    document.getElementById('report-savings-rate').textContent = savingsRate + '%';
    
    // Load charts
    loadIncomeExpenseChart(transactions);
    loadCategoryChart(transactions);
    loadTopCategories(transactions);
}

function loadIncomeExpenseChart(transactions) {
    const ctx = document.getElementById('income-expense-chart');
    if (!ctx) return;
    
    // Clear previous chart
    const existingChart = Chart.getChart(ctx);
    if (existingChart) {
        existingChart.destroy();
    }
    
    // Group by month
    const monthlyData = {};
    transactions.forEach(t => {
        const month = new Date(t.date).toISOString().slice(0, 7);
        if (!monthlyData[month]) {
            monthlyData[month] = { income: 0, expense: 0 };
        }
        if (t.type === 'income') {
            monthlyData[month].income += parseFloat(t.amount);
        } else if (t.type === 'expense') {
            monthlyData[month].expense += parseFloat(t.amount);
        }
    });
    
    const months = Object.keys(monthlyData).sort().slice(-6);
    const incomeData = months.map(m => monthlyData[m].income);
    const expenseData = months.map(m => monthlyData[m].expense);
    
    const data = {
        labels: months.map(m => new Date(m + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })),
        datasets: [{
            label: 'Income',
            data: incomeData,
            backgroundColor: 'rgba(16, 185, 129, 0.5)',
            borderColor: 'rgb(16, 185, 129)',
            borderWidth: 2
        }, {
            label: 'Expense',
            data: expenseData,
            backgroundColor: 'rgba(239, 68, 68, 0.5)',
            borderColor: 'rgb(239, 68, 68)',
            borderWidth: 2
        }]
    };
    
    new Chart(ctx, {
        type: 'bar',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

function loadCategoryChart(transactions) {
    const ctx = document.getElementById('category-chart');
    if (!ctx) return;
    
    // Clear previous chart
    const existingChart = Chart.getChart(ctx);
    if (existingChart) {
        existingChart.destroy();
    }
    
    // Group expenses by category
    const categoryData = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
        const cat = t.category || 'Other';
        categoryData[cat] = (categoryData[cat] || 0) + parseFloat(t.amount);
    });
    
    const categories = Object.keys(categoryData).slice(0, 8);
    const amounts = categories.map(c => categoryData[c]);
    
    const data = {
        labels: categories,
        datasets: [{
            data: amounts,
            backgroundColor: [
                '#ef4444', '#f59e0b', '#eab308', '#ec4899', 
                '#a855f7', '#3b82f6', '#06b6d4', '#10b981'
            ]
        }]
    };
    
    new Chart(ctx, {
        type: 'doughnut',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: true
        }
    });
}

function loadTopCategories(transactions) {
    const container = document.getElementById('top-categories');
    
    // Group expenses by category
    const categoryData = {};
    let totalExpense = 0;
    
    transactions.filter(t => t.type === 'expense').forEach(t => {
        const cat = t.category || 'Other';
        categoryData[cat] = (categoryData[cat] || 0) + parseFloat(t.amount);
        totalExpense += parseFloat(t.amount);
    });
    
    // Sort and get top 5
    const topCategories = Object.entries(categoryData)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, amount]) => ({
            name,
            amount,
            percentage: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0
        }));
    
    if (topCategories.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500">No expense data available</p>';
        return;
    }
    
    container.innerHTML = topCategories.map(cat => `
        <div class="flex items-center justify-between">
            <div class="flex-1">
                <div class="flex justify-between mb-1">
                    <span class="text-sm font-medium">${cat.name}</span>
                    <span class="text-sm font-bold text-red-600">${formatCurrency(cat.amount)}</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-bar-fill bg-red-500" style="width: ${cat.percentage}%"></div>
                </div>
            </div>
        </div>
    `).join('');
}

// Advanced Report Functions
function toggleReportOptions() {
    const reportType = document.getElementById('report-type-filter').value;
    // Can add conditional UI changes based on report type if needed
}

async function generateCustomReport() {
    const reportType = document.getElementById('report-type-filter').value;
    const dateFrom = document.getElementById('report-date-from').value;
    const dateTo = document.getElementById('report-date-to').value;
    
    if (!dateFrom || !dateTo) {
        showNotification('Please select date range', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        let transactions;
        if (isOnline) {
            transactions = await db.getTransactions({ startDate: dateFrom, endDate: dateTo });
        } else {
            transactions = localDB.getTransactions();
            transactions = transactions.filter(t => {
                const tDate = new Date(t.date);
                return tDate >= new Date(dateFrom) && tDate <= new Date(dateTo);
            });
        }
        
        let reportData;
        
        switch(reportType) {
            case 'summary':
                loadReportData();
                return;
                
            case 'income_details':
                reportData = generateIncomeDetailsReport(transactions);
                break;
            case 'income_total':
                reportData = generateIncomeTotalReport(transactions);
                break;
                
            case 'expense_details':
                reportData = generateExpenseDetailsReport(transactions);
                break;
            case 'expense_total':
                reportData = generateExpenseTotalReport(transactions);
                break;
                
            case 'loan_given_details':
                reportData = generateLoanGivenDetailsReport(transactions);
                break;
            case 'loan_given_total':
                reportData = generateLoanGivenTotalReport(transactions);
                break;
                
            case 'loan_taken_details':
                reportData = generateLoanTakenDetailsReport(transactions);
                break;
            case 'loan_taken_total':
                reportData = generateLoanTakenTotalReport(transactions);
                break;
                
            case 'repayment_received_details':
                reportData = generateRepaymentReceivedDetailsReport(transactions);
                break;
            case 'repayment_received_total':
                reportData = generateRepaymentReceivedTotalReport(transactions);
                break;
                
            case 'repayment_paid_details':
                reportData = generateRepaymentPaidDetailsReport(transactions);
                break;
            case 'repayment_paid_total':
                reportData = generateRepaymentPaidTotalReport(transactions);
                break;
        }
        
        displayCustomReport(reportData);
        
    } catch (error) {
        console.error('Report generation error:', error);
        showNotification('Error generating report', 'error');
    } finally {
        showLoading(false);
    }
}

function generateIncomeDetailsReport(transactions) {
    const incomes = transactions.filter(t => t.type === 'income');
    const total = incomes.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    return {
        title: 'Income Transactions - Details',
        subtitle: `Total: ${formatCurrency(total)} | Count: ${incomes.length}`,
        items: incomes,
        showDetails: true
    };
}

function generateIncomeTotalReport(transactions) {
    const incomes = transactions.filter(t => t.type === 'income');
    const total = incomes.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const byCategory = {};
    
    incomes.forEach(t => {
        const cat = t.category || 'Uncategorized';
        byCategory[cat] = (byCategory[cat] || 0) + parseFloat(t.amount);
    });
    
    return {
        title: 'Income Transactions - Total Only',
        subtitle: `Grand Total: ${formatCurrency(total)}`,
        summary: byCategory,
        total: total,
        showDetails: false
    };
}

function generateExpenseDetailsReport(transactions) {
    const expenses = transactions.filter(t => t.type === 'expense');
    const total = expenses.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    return {
        title: 'Expense Transactions - Details',
        subtitle: `Total: ${formatCurrency(total)} | Count: ${expenses.length}`,
        items: expenses,
        showDetails: true
    };
}

function generateExpenseTotalReport(transactions) {
    const expenses = transactions.filter(t => t.type === 'expense');
    const total = expenses.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const byCategory = {};
    
    expenses.forEach(t => {
        const cat = t.category || 'Uncategorized';
        byCategory[cat] = (byCategory[cat] || 0) + parseFloat(t.amount);
    });
    
    return {
        title: 'Expense Transactions - Total Only',
        subtitle: `Grand Total: ${formatCurrency(total)}`,
        summary: byCategory,
        total: total,
        showDetails: false
    };
}

function generateLoanGivenDetailsReport(transactions) {
    const loans = transactions.filter(t => t.type === 'loan_given');
    const total = loans.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    return {
        title: 'Loans Given - Details',
        subtitle: `Total: ${formatCurrency(total)} | Count: ${loans.length}`,
        items: loans,
        showDetails: true
    };
}

function generateLoanGivenTotalReport(transactions) {
    const loans = transactions.filter(t => t.type === 'loan_given');
    const total = loans.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    return {
        title: 'Loans Given - Total Only',
        subtitle: `Grand Total: ${formatCurrency(total)}`,
        summary: { 'Total Loans Given': total },
        total: total,
        showDetails: false
    };
}

function generateLoanTakenDetailsReport(transactions) {
    const loans = transactions.filter(t => t.type === 'loan_taken');
    const total = loans.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    return {
        title: 'Loans Taken - Details',
        subtitle: `Total: ${formatCurrency(total)} | Count: ${loans.length}`,
        items: loans,
        showDetails: true
    };
}

function generateLoanTakenTotalReport(transactions) {
    const loans = transactions.filter(t => t.type === 'loan_taken');
    const total = loans.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    return {
        title: 'Loans Taken - Total Only',
        subtitle: `Grand Total: ${formatCurrency(total)}`,
        summary: { 'Total Loans Taken': total },
        total: total,
        showDetails: false
    };
}

function generateRepaymentReceivedDetailsReport(transactions) {
    const repayments = transactions.filter(t => 
        t.type === 'repayment' && t.category && t.category.includes('Received')
    );
    const total = repayments.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    return {
        title: 'Repayment Received - Details',
        subtitle: `Total: ${formatCurrency(total)} | Count: ${repayments.length}`,
        items: repayments,
        showDetails: true
    };
}

function generateRepaymentReceivedTotalReport(transactions) {
    const repayments = transactions.filter(t => 
        t.type === 'repayment' && t.category && t.category.includes('Received')
    );
    const total = repayments.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    return {
        title: 'Repayment Received - Total Only',
        subtitle: `Grand Total: ${formatCurrency(total)}`,
        summary: { 'Total Repayment Received': total },
        total: total,
        showDetails: false
    };
}

function generateRepaymentPaidDetailsReport(transactions) {
    const repayments = transactions.filter(t => 
        t.type === 'repayment' && t.category && t.category.includes('Paid')
    );
    const total = repayments.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    return {
        title: 'Repayment Paid - Details',
        subtitle: `Total: ${formatCurrency(total)} | Count: ${repayments.length}`,
        items: repayments,
        showDetails: true
    };
}

function generateRepaymentPaidTotalReport(transactions) {
    const repayments = transactions.filter(t => 
        t.type === 'repayment' && t.category && t.category.includes('Paid')
    );
    const total = repayments.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    return {
        title: 'Repayment Paid - Total Only',
        subtitle: `Grand Total: ${formatCurrency(total)}`,
        summary: { 'Total Repayment Paid': total },
        total: total,
        showDetails: false
    };
}

function displayCustomReport(reportData) {
    const output = document.getElementById('report-output');
    const title = document.getElementById('report-title');
    const content = document.getElementById('report-content');
    
    title.textContent = reportData.title;
    
    let html = `<div class="mb-4"><p class="text-lg font-semibold text-gray-700">${reportData.subtitle}</p></div>`;
    
    if (reportData.showDetails && reportData.items) {
        html += `<div class="overflow-x-auto"><table class="data-table w-full">`;
        html += `<thead><tr>
            <th>Date</th>
            <th>Category</th>
            <th>Amount</th>
            <th>Account</th>
            <th>Notes</th>
        </tr></thead><tbody>`;
        
        reportData.items.forEach(item => {
            html += `<tr>
                <td>${formatDate(item.date)}</td>
                <td>${item.category || 'N/A'}</td>
                <td class="font-bold">${formatCurrency(item.amount)}</td>
                <td>${item.account || 'N/A'}</td>
                <td>${item.notes || '-'}</td>
            </tr>`;
        });
        
        html += `</tbody></table></div>`;
    } else if (reportData.summary) {
        html += `<div class="grid grid-cols-1 md:grid-cols-2 gap-4">`;
        
        Object.entries(reportData.summary).forEach(([key, value]) => {
            html += `
                <div class="bg-gray-50 p-4 rounded-lg">
                    <p class="text-sm text-gray-600">${key}</p>
                    <p class="text-2xl font-bold text-blue-600">${formatCurrency(value)}</p>
                </div>
            `;
        });
        
        html += `</div>`;
        html += `<div class="mt-6 bg-blue-50 p-6 rounded-lg border-l-4 border-blue-600">
            <p class="text-sm text-gray-600">Grand Total</p>
            <p class="text-3xl font-bold text-blue-600">${formatCurrency(reportData.total)}</p>
        </div>`;
    }
    
    content.innerHTML = html;
    output.classList.remove('hidden');
    
    // Scroll to report
    output.scrollIntoView({ behavior: 'smooth' });
}

function printReport() {
    const reportContent = document.getElementById('report-output').innerHTML;
    const printWindow = window.open('', '', 'height=600,width=800');
    
    printWindow.document.write('<html><head><title>Cash Pilot Report</title>');
    printWindow.document.write('<style>');
    printWindow.document.write('body { font-family: Arial, sans-serif; padding: 20px; }');
    printWindow.document.write('table { width: 100%; border-collapse: collapse; margin: 20px 0; }');
    printWindow.document.write('th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }');
    printWindow.document.write('th { background-color: #4f46e5; color: white; }');
    printWindow.document.write('</style></head><body>');
    printWindow.document.write(reportContent);
    printWindow.document.write('</body></html>');
    
    printWindow.document.close();
    printWindow.print();
}

// Master Preferences Functions
function loadMasterPreferences() {
    const saved = localStorage.getItem('cashpilot_master_preferences');
    if (saved) {
        masterPreferences = JSON.parse(saved);
    } else {
        // Initialize with default preferences
        masterPreferences = getDefaultPreferences();
        saveMasterPreferences();
    }
}

function saveMasterPreferences() {
    localStorage.setItem('cashpilot_master_preferences', JSON.stringify(masterPreferences));
}

function getDefaultPreferences() {
    return [
        // Currency
        { id: 1, category: 'Currency', name: 'USD', value: 'US Dollar ($)', icon: 'fa-dollar-sign' },
        { id: 2, category: 'Currency', name: 'EUR', value: 'Euro (€)', icon: 'fa-euro-sign' },
        { id: 3, category: 'Currency', name: 'BDT', value: 'Bangladeshi Taka (৳)', icon: 'fa-money-bill' },
        { id: 4, category: 'Currency', name: 'INR', value: 'Indian Rupee (₹)', icon: 'fa-rupee-sign' },
        
        // Account Types
        { id: 5, category: 'Account', name: 'Cash', value: 'Cash Account', icon: 'fa-wallet' },
        { id: 6, category: 'Account', name: 'Bank', value: 'Bank Account', icon: 'fa-university' },
        { id: 7, category: 'Account', name: 'Card', value: 'Credit Card', icon: 'fa-credit-card' },
        
        // Income Categories
        { id: 8, category: 'Income', name: 'Salary', value: 'Monthly Salary', icon: 'fa-money-bill-wave' },
        { id: 9, category: 'Income', name: 'Business', value: 'Business Income', icon: 'fa-briefcase' },
        { id: 10, category: 'Income', name: 'Freelance', value: 'Freelance Work', icon: 'fa-laptop' },
        
        // Expense Categories
        { id: 11, category: 'Expense', name: 'Food', value: 'Food & Dining', icon: 'fa-utensils' },
        { id: 12, category: 'Expense', name: 'Transport', value: 'Transportation', icon: 'fa-car' },
        { id: 13, category: 'Expense', name: 'Utilities', value: 'Utility Bills', icon: 'fa-bolt' },
        
        // Theme
        { id: 14, category: 'Theme', name: 'Light', value: 'Light Theme', icon: 'fa-sun' },
        { id: 15, category: 'Theme', name: 'Dark', value: 'Dark Theme', icon: 'fa-moon' },
        
        // Language
        { id: 16, category: 'Language', name: 'English', value: 'English (US)', icon: 'fa-flag-usa' },
        { id: 17, category: 'Language', name: 'Bengali', value: 'Bengali', icon: 'fa-language' },
        
        // Date Format
        { id: 18, category: 'Date Format', name: 'MM/DD/YYYY', value: 'Month/Day/Year', icon: 'fa-calendar' },
        { id: 19, category: 'Date Format', name: 'DD/MM/YYYY', value: 'Day/Month/Year', icon: 'fa-calendar' },
        
        // Default Actions
        { id: 20, category: 'Default Action', name: 'Add Income', value: 'Quick Add Income', icon: 'fa-plus' },
        { id: 21, category: 'Default Action', name: 'Add Expense', value: 'Quick Add Expense', icon: 'fa-minus' }
    ];
}

function loadPreferencesList() {
    const container = document.getElementById('preferences-list');
    if (!container) return;
    
    const filter = document.getElementById('preference-category-filter')?.value || 'all';
    
    let filtered = masterPreferences;
    if (filter !== 'all') {
        filtered = masterPreferences.filter(p => p.category === filter);
    }
    
    if (filtered.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500 py-4">No preferences found</p>';
        return;
    }
    
    container.innerHTML = filtered.map(pref => `
        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
            <div class="flex items-center flex-1">
                <i class="fas ${pref.icon || 'fa-tag'} mr-3 text-blue-600 text-lg"></i>
                <div>
                    <p class="font-medium text-gray-800">${pref.name}</p>
                    <p class="text-xs text-gray-500">${pref.category} | ${pref.value}</p>
                    ${pref.description ? `<p class="text-xs text-gray-400 mt-1">${pref.description}</p>` : ''}
                </div>
            </div>
            <div class="flex items-center space-x-2">
                <span class="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">${pref.category}</span>
                <button onclick="editPreference(${pref.id})" class="text-blue-600 hover:text-blue-800" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deletePreference(${pref.id})" class="text-red-600 hover:text-red-800" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function filterPreferences() {
    loadPreferencesList();
}

async function handleAddPreference(e) {
    e.preventDefault();
    
    const form = e.target;
    const preference = {
        id: Date.now(),
        category: form.elements[0].value,
        name: form.elements[1].value,
        value: form.elements[2].value,
        icon: form.elements[3].value || 'fa-tag',
        description: form.elements[4].value || ''
    };
    
    try {
        masterPreferences.push(preference);
        saveMasterPreferences();
        
        closeModal('add-preference-modal');
        form.reset();
        
        showNotification('Preference added successfully', 'success');
        addNotification('Preference Added', `${preference.name} has been added to ${preference.category}`, 'success');
        
        if (currentAppScreen === 'settings-screen') {
            loadPreferencesList();
        }
        
        // Update dropdowns if category matches
        updatePreferenceDropdowns(preference.category);
        
    } catch (error) {
        showNotification('Error adding preference', 'error');
    }
}

function editPreference(id) {
    const pref = masterPreferences.find(p => p.id === id);
    if (!pref) {
        showNotification('Preference not found', 'error');
        return;
    }
    
    const newValue = prompt(`Edit value for "${pref.name}":`, pref.value);
    
    if (newValue !== null && newValue.trim() !== '') {
        pref.value = newValue.trim();
        saveMasterPreferences();
        loadPreferencesList();
        showNotification('Preference updated successfully', 'success');
    }
}

function deletePreference(id) {
    const pref = masterPreferences.find(p => p.id === id);
    if (!pref) return;
    
    if (!confirm(`Delete preference "${pref.name}"?`)) {
        return;
    }
    
    masterPreferences = masterPreferences.filter(p => p.id !== id);
    saveMasterPreferences();
    loadPreferencesList();
    showNotification('Preference deleted successfully', 'success');
}

function updatePreferenceDropdowns(category) {
    // Update currency dropdown
    if (category === 'Currency') {
        const currencySelect = document.getElementById('currency-setting');
        if (currencySelect) {
            const currencies = masterPreferences.filter(p => p.category === 'Currency');
            const currentValue = currencySelect.value;
            
            currencySelect.innerHTML = currencies.map(c => 
                `<option value="${c.name}">${c.name} - ${c.value}</option>`
            ).join('');
            
            if (currentValue) {
                currencySelect.value = currentValue;
            }
        }
    }
}

function openAddAccountModal() {
    openModal('add-account-modal');
}

async function handleAddAccount(e) {
    e.preventDefault();
    
    const form = e.target;
    const account = {
        id: Date.now(),
        name: form.elements[0].value,
        type: form.elements[1].value,
        balance: parseFloat(form.elements[2].value) || 0,
        icon: getAccountIcon(form.elements[1].value)
    };
    
    try {
        const data = localDB.getData();
        if (!data.accounts) {
            data.accounts = localDB.getDefaultAccounts();
        }
        data.accounts.push(account);
        localDB.saveData(data);
        
        closeModal('add-account-modal');
        form.reset();
        showNotification('Account added successfully', 'success');
        addNotification('Account Added', `${account.name} has been added`, 'success');
        
        if (currentAppScreen === 'settings-screen') {
            loadAccountsList();
        }
    } catch (error) {
        showNotification('Error adding account', 'error');
    }
}

function getAccountIcon(type) {
    const icons = {
        cash: 'fa-wallet',
        bank: 'fa-university',
        card: 'fa-credit-card',
        savings: 'fa-piggy-bank',
        investment: 'fa-chart-line'
    };
    return icons[type] || 'fa-wallet';
}

function editAccount(id) {
    const data = localDB.getData();
    const account = data.accounts.find(a => a.id === id);
    
    if (!account) {
        showNotification('Account not found', 'error');
        return;
    }
    
    const newBalance = prompt(`Update balance for ${account.name}:`, account.balance);
    
    if (newBalance !== null && !isNaN(newBalance)) {
        account.balance = parseFloat(newBalance);
        localDB.saveData(data);
        loadAccountsList();
        showNotification('Account updated successfully', 'success');
    }
}

function deleteAccount(id) {
    if (!confirm('Are you sure you want to delete this account?')) {
        return;
    }
    
    const data = localDB.getData();
    data.accounts = data.accounts.filter(a => a.id !== id);
    localDB.saveData(data);
    loadAccountsList();
    showNotification('Account deleted successfully', 'success');
}

// Settings Functions
function loadUserSettings() {
    const saved = localStorage.getItem('cashpilot_settings');
    if (saved) {
        userSettings = JSON.parse(saved);
    }
    applySettings();
}

function saveUserSettings() {
    localStorage.setItem('cashpilot_settings', JSON.stringify(userSettings));
    applySettings();
}

function applySettings() {
    // Apply currency format globally
    if (userSettings.currency) {
        // Currency is applied in formatCurrency function
    }
    
    // Apply theme
    const theme = userSettings.theme || 'light';
    
    if (theme === 'dark') {
        document.body.classList.add('dark-theme');
    } else if (theme === 'light') {
        document.body.classList.remove('dark-theme');
    } else if (theme === 'auto') {
        // Auto detect system theme
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
    }
}

async function loadSettings() {
    const categories = localDB.getCategories();
    const accounts = localDB.getData().accounts || [];
    
    // Populate settings form
    document.getElementById('currency-setting').value = userSettings.currency || 'USD';
    document.getElementById('default-account-setting').value = userSettings.defaultAccount || 'cash';
    document.getElementById('date-format-setting').value = userSettings.dateFormat || 'MM/DD/YYYY';
    document.getElementById('language-setting').value = userSettings.language || 'en';
    document.getElementById('theme-setting').value = userSettings.theme || 'light';
    
    // Load notification settings
    const notifSettings = userSettings.notifications || {};
    document.getElementById('notif-transactions').checked = notifSettings.transactions !== false;
    document.getElementById('notif-loans').checked = notifSettings.loans !== false;
    document.getElementById('notif-budgets').checked = notifSettings.budgets === true;
    
    loadCategoriesList();
    loadAccountsList();
    loadPreferencesList();
}

function loadAccountsList() {
    const data = localDB.getData();
    const accounts = data.accounts || localDB.getDefaultAccounts();
    const container = document.getElementById('accounts-list');
    
    if (!container) return;
    
    container.innerHTML = accounts.map(acc => `
        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
            <div class="flex items-center flex-1">
                <i class="fas ${acc.icon} mr-3 text-blue-600 text-xl"></i>
                <div>
                    <span class="font-medium text-gray-800">${acc.name}</span>
                    <p class="text-xs text-gray-500 capitalize">${acc.type}</p>
                </div>
            </div>
            <div class="flex items-center space-x-3">
                <div class="text-right">
                    <p class="font-bold text-blue-600">${formatCurrency(acc.balance || 0)}</p>
                </div>
                <div class="flex space-x-2">
                    <button onclick="editAccount(${acc.id})" class="text-blue-600 hover:text-blue-800" title="Edit Balance">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteAccount(${acc.id})" class="text-red-600 hover:text-red-800" title="Delete Account">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function editAccount(id) {
    showNotification('Account editing will be implemented', 'info');
}

function handleSettingsUpdate(e) {
    e.preventDefault();
    
    // Update settings object
    userSettings.currency = document.getElementById('currency-setting').value;
    userSettings.defaultAccount = document.getElementById('default-account-setting').value;
    userSettings.dateFormat = document.getElementById('date-format-setting').value;
    userSettings.language = document.getElementById('language-setting').value;
    userSettings.theme = document.getElementById('theme-setting').value;
    
    userSettings.notifications = {
        transactions: document.getElementById('notif-transactions').checked,
        loans: document.getElementById('notif-loans').checked,
        budgets: document.getElementById('notif-budgets').checked
    };
    
    saveUserSettings();
    showNotification('Settings updated successfully', 'success');
    addNotification('Settings Updated', 'Your preferences have been saved', 'success');
    
    // Reload dashboard to apply currency changes
    if (currentAppScreen === 'dashboard-screen') {
        loadDashboard();
    }
}

function loadCategoriesList() {
    const categories = localDB.getCategories();
    const container = document.getElementById('categories-list');
    
    container.innerHTML = categories.map(cat => `
        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div class="flex items-center">
                <i class="fas ${cat.icon} mr-3" style="color: ${cat.color}"></i>
                <span class="font-medium">${cat.name}</span>
                <span class="ml-2 text-xs px-2 py-1 rounded-full ${cat.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
                    ${cat.type}
                </span>
            </div>
            <button onclick="deleteCategory(${cat.id})" class="text-red-600 hover:text-red-800">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
}

async function handleAddCategory(e) {
    e.preventDefault();
    
    const form = e.target;
    const category = {
        name: form.elements[0].value,
        type: form.elements[1].value,
        icon: form.elements[2].value || 'fa-circle',
        color: '#' + Math.floor(Math.random()*16777215).toString(16)
    };
    
    try {
        if (isOnline) {
            await db.createCategory(category);
        } else {
            localDB.createCategory(category);
        }
        
        closeModal('add-category-modal');
        form.reset();
        showNotification('Category added successfully', 'success');
        loadCategoriesList();
    } catch (error) {
        showNotification('Error adding category', 'error');
    }
}

function deleteCategory(id) {
    if (confirm('Delete this category?')) {
        if (isOnline) {
            db.deleteCategory(id);
        } else {
            const data = localDB.getData();
            data.categories = data.categories.filter(c => c.id !== id);
            localDB.saveData(data);
        }
        loadCategoriesList();
        showNotification('Category deleted', 'success');
    }
}

// Profile Functions
function loadProfile() {
    if (currentUser) {
        document.getElementById('profile-name').textContent = currentUser.name || 'User Name';
        document.getElementById('profile-email').textContent = currentUser.email || 'user@email.com';
        document.getElementById('profile-name-input').value = currentUser.name || '';
        document.getElementById('profile-email-input').value = currentUser.email || '';
        
        // Load profile picture
        const profilePic = currentUser.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name || 'User')}&background=4f46e5&color=fff&size=128`;
        document.querySelectorAll('img[alt="Profile"]').forEach(img => {
            img.src = profilePic;
        });
    }
}

async function handleUpdateProfile(e) {
    e.preventDefault();
    
    const form = e.target;
    const updates = {
        name: form.elements[0].value,
        email: form.elements[1].value
    };
    
    const newPassword = form.elements[2].value;
    const confirmPassword = form.elements[3]?.value || '';
    
    // Validate email
    if (!isValidEmail(updates.email)) {
        showNotification('Please enter a valid email address', 'error');
        return;
    }
    
    // Validate password if provided
    if (newPassword) {
        if (newPassword.length < 8) {
            showNotification('Password must be at least 8 characters', 'error');
            return;
        }
        if (newPassword !== confirmPassword) {
            showNotification('Passwords do not match', 'error');
            return;
        }
    }
    
    showLoading(true);
    
    try {
        if (isOnline) {
            await db.updateProfile(updates);
            if (newPassword) {
                await db.updatePassword('', newPassword);
            }
        } else {
            currentUser = { ...currentUser, ...updates };
            localStorage.setItem('user', JSON.stringify(currentUser));
            localDB.setUser(currentUser);
        }
        
        showNotification('Profile updated successfully', 'success');
        addNotification('Profile Updated', `Your profile information has been updated`, 'success');
        
        loadProfile();
        
        // Clear password fields
        form.elements[2].value = '';
        if (form.elements[3]) {
            form.elements[3].value = '';
        }
        
    } catch (error) {
        console.error('Profile update error:', error);
        showNotification('Error updating profile', 'error');
    } finally {
        showLoading(false);
    }
}

function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

function handleProfilePictureChange() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                showNotification('Image must be less than 2MB', 'error');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = (event) => {
                const imageUrl = event.target.result;
                currentUser.profilePicture = imageUrl;
                localStorage.setItem('user', JSON.stringify(currentUser));
                loadProfile();
                showNotification('Profile picture updated', 'success');
            };
            reader.readAsDataURL(file);
        }
    };
    input.click();
}

// Export & Backup Functions
async function exportData() {
    try {
        if (isOnline) {
            await db.exportData('csv');
        } else {
            const data = localDB.getData();
            const dataStr = JSON.stringify(data, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `cashpilot-backup-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
        }
        showNotification('Data exported successfully', 'success');
    } catch (error) {
        showNotification('Error exporting data', 'error');
    }
}

function backupToLocal() {
    const data = localDB.getData();
    const dataStr = JSON.stringify(data, null, 2);
    localStorage.setItem('cashpilot_backup', dataStr);
    showNotification('Local backup created', 'success');
}

function populateFilterDropdowns() {
    // Populate category filter
    const categoryFilter = document.getElementById('filter-category');
    if (categoryFilter) {
        const categories = localDB.getCategories();
        categoryFilter.innerHTML = '<option value="">All Categories</option>';
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.name;
            option.textContent = cat.name;
            categoryFilter.appendChild(option);
        });
    }
}

// Filter Functions
function toggleFilters() {
    const panel = document.getElementById('filters-panel');
    panel.classList.toggle('hidden');
}

async function applyFilters() {
    const filters = {
        type: document.getElementById('filter-type').value,
        dateFrom: document.getElementById('filter-date-from').value,
        dateTo: document.getElementById('filter-date-to').value,
        category: document.getElementById('filter-category').value,
        account: document.getElementById('filter-account')?.value || '',
        minAmount: parseFloat(document.getElementById('filter-min-amount')?.value) || 0,
        maxAmount: parseFloat(document.getElementById('filter-max-amount')?.value) || Infinity,
        sort: document.getElementById('sort-by').value
    };
    
    // Remove empty filters
    Object.keys(filters).forEach(key => {
        if (!filters[key] || filters[key] === '' || filters[key] === 0 || filters[key] === Infinity) {
            delete filters[key];
        }
    });
    
    currentFilters = filters;
    transactionOffset = 0;
    
    showLoading(true);
    
    try {
        let transactions;
        if (isOnline) {
            transactions = await db.getTransactions(filters);
        } else {
            transactions = localDB.getTransactions();
            
            // Apply filters locally
            if (filters.type) {
                transactions = transactions.filter(t => t.type === filters.type);
            }
            if (filters.dateFrom) {
                transactions = transactions.filter(t => new Date(t.date) >= new Date(filters.dateFrom));
            }
            if (filters.dateTo) {
                transactions = transactions.filter(t => new Date(t.date) <= new Date(filters.dateTo));
            }
            if (filters.category) {
                transactions = transactions.filter(t => t.category === filters.category);
            }
            if (filters.account) {
                transactions = transactions.filter(t => t.account === filters.account);
            }
            if (filters.minAmount) {
                transactions = transactions.filter(t => parseFloat(t.amount) >= filters.minAmount);
            }
            if (filters.maxAmount && filters.maxAmount !== Infinity) {
                transactions = transactions.filter(t => parseFloat(t.amount) <= filters.maxAmount);
            }
            
            // Apply sorting
            if (filters.sort) {
                transactions = sortTransactions(transactions, filters.sort);
            } else {
                transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
            }
        }
        
        const container = document.getElementById('transactions-list');
        
        if (transactions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-filter"></i>
                    <p>No transactions match your filters</p>
                    <button onclick="clearFilters()" class="mt-4 text-blue-600 hover:underline">Clear Filters</button>
                </div>
            `;
            document.getElementById('load-more-btn').classList.add('hidden');
            showNotification('No transactions found with current filters', 'info');
            return;
        }
        
        container.innerHTML = '';
        transactions.slice(0, transactionLimit).forEach(t => {
            const div = document.createElement('div');
            div.innerHTML = createTransactionListItem(t);
            container.appendChild(div.firstElementChild);
        });
        
        // Update load more button
        if (transactions.length > transactionLimit) {
            hasMoreTransactions = true;
            document.getElementById('load-more-btn').classList.remove('hidden');
            document.getElementById('no-more-transactions').classList.add('hidden');
        } else {
            hasMoreTransactions = false;
            document.getElementById('load-more-btn').classList.add('hidden');
            document.getElementById('no-more-transactions').classList.remove('hidden');
        }
        
        showNotification(`Found ${transactions.length} transaction(s)`, 'success');
        
    } catch (error) {
        console.error('Filter error:', error);
        showNotification('Error applying filters', 'error');
    } finally {
        showLoading(false);
    }
}

function sortTransactions(transactions, sortBy) {
    switch(sortBy) {
        case 'date_asc':
            return transactions.sort((a, b) => new Date(a.date) - new Date(b.date));
        case 'date_desc':
            return transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        case 'amount_asc':
            return transactions.sort((a, b) => parseFloat(a.amount) - parseFloat(b.amount));
        case 'amount_desc':
            return transactions.sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount));
        case 'category':
            return transactions.sort((a, b) => (a.category || '').localeCompare(b.category || ''));
        default:
            return transactions;
    }
}

function clearFilters() {
    document.getElementById('filter-type').value = '';
    document.getElementById('filter-date-from').value = '';
    document.getElementById('filter-date-to').value = '';
    document.getElementById('filter-category').value = '';
    if (document.getElementById('filter-account')) {
        document.getElementById('filter-account').value = '';
    }
    if (document.getElementById('filter-min-amount')) {
        document.getElementById('filter-min-amount').value = '';
    }
    if (document.getElementById('filter-max-amount')) {
        document.getElementById('filter-max-amount').value = '';
    }
    document.getElementById('sort-by').value = 'date_desc';
    
    currentFilters = {};
    loadTransactions(true);
    showNotification('Filters cleared', 'success');
}

async function loadMoreTransactions() {
    if (!hasMoreTransactions) return;
    
    // Show loading state
    document.getElementById('load-more-text').classList.add('hidden');
    document.getElementById('load-more-loading').classList.remove('hidden');
    
    transactionOffset += transactionLimit;
    
    await loadTransactions(false);
    
    // Hide loading state
    document.getElementById('load-more-text').classList.remove('hidden');
    document.getElementById('load-more-loading').classList.add('hidden');
}

// Notification Functions
function addNotification(title, message, type = 'info') {
    const notification = {
        id: Date.now(),
        title,
        message,
        type,
        timestamp: new Date().toISOString(),
        read: false
    };
    
    notifications.unshift(notification);
    
    // Keep only last 50 notifications
    if (notifications.length > 50) {
        notifications = notifications.slice(0, 50);
    }
    
    // Save to localStorage
    localStorage.setItem('cashpilot_notifications', JSON.stringify(notifications));
    
    updateNotificationBadge();
    renderNotifications();
}

function loadNotifications() {
    const saved = localStorage.getItem('cashpilot_notifications');
    if (saved) {
        notifications = JSON.parse(saved);
        updateNotificationBadge();
    }
}

function updateNotificationBadge() {
    const unreadCount = notifications.filter(n => !n.read).length;
    const badge = document.getElementById('notification-badge');
    
    if (unreadCount > 0) {
        badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
}

function toggleNotifications() {
    const panel = document.getElementById('notifications-panel');
    panel.classList.toggle('hidden');
    
    if (!panel.classList.contains('hidden')) {
        renderNotifications();
        // Mark all as read after 1 second
        setTimeout(() => {
            notifications.forEach(n => n.read = true);
            localStorage.setItem('cashpilot_notifications', JSON.stringify(notifications));
            updateNotificationBadge();
        }, 1000);
    }
}

function renderNotifications() {
    const container = document.getElementById('notifications-list');
    
    if (notifications.length === 0) {
        container.innerHTML = `
            <div class="p-4 text-center text-gray-500 text-sm">
                No new notifications
            </div>
        `;
        return;
    }
    
    container.innerHTML = notifications.map(notif => {
        const icon = getNotificationIcon(notif.type);
        const iconColor = getNotificationIconColor(notif.type);
        const timeAgo = getTimeAgo(notif.timestamp);
        
        return `
            <div class="p-4 hover:bg-gray-50 transition ${!notif.read ? 'bg-blue-50' : ''}">
                <div class="flex items-start">
                    <div class="flex-shrink-0">
                        <div class="w-10 h-10 rounded-full ${iconColor} flex items-center justify-center">
                            <i class="fas ${icon} text-white"></i>
                        </div>
                    </div>
                    <div class="ml-3 flex-1">
                        <p class="text-sm font-medium text-gray-900">${notif.title}</p>
                        <p class="text-sm text-gray-600 mt-1">${notif.message}</p>
                        <p class="text-xs text-gray-400 mt-1">${timeAgo}</p>
                    </div>
                    ${!notif.read ? '<div class="w-2 h-2 bg-blue-600 rounded-full"></div>' : ''}
                </div>
            </div>
        `;
    }).join('');
}

function clearAllNotifications() {
    if (confirm('Clear all notifications?')) {
        notifications = [];
        localStorage.setItem('cashpilot_notifications', JSON.stringify(notifications));
        updateNotificationBadge();
        renderNotifications();
    }
}

function getNotificationIcon(type) {
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    return icons[type] || 'fa-bell';
}

function getNotificationIconColor(type) {
    const colors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        warning: 'bg-yellow-500',
        info: 'bg-blue-500'
    };
    return colors[type] || 'bg-gray-500';
}

function getTimeAgo(timestamp) {
    const now = new Date();
    const past = new Date(timestamp);
    const diffInSeconds = Math.floor((now - past) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return formatDate(timestamp);
}

// UI Helper Functions
function toggleUserMenu() {
    const menu = document.getElementById('user-menu');
    menu.classList.toggle('hidden');
}

function showLoading(show) {
    const loader = document.getElementById('loading-screen');
    if (show) {
        loader.classList.remove('hidden');
    } else {
        loader.classList.add('hidden');
    }
}

function showNotification(message, type = 'info') {
    const colors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        warning: 'bg-yellow-500',
        info: 'bg-blue-500'
    };
    
    const notification = document.createElement('div');
    notification.className = `fixed top-20 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-in`;
    notification.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'} mr-2"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Utility Functions
function formatCurrency(amount) {
    const currencySymbols = {
        'USD': { symbol: '$', name: 'US Dollar' },
        'EUR': { symbol: '€', name: 'Euro' },
        'GBP': { symbol: '£', name: 'British Pound' },
        'INR': { symbol: '₹', name: 'Indian Rupee' },
        'BDT': { symbol: '৳', name: 'Bangladeshi Taka' },
        'JPY': { symbol: '¥', name: 'Japanese Yen' },
        'CNY': { symbol: '¥', name: 'Chinese Yuan' },
        'AUD': { symbol: 'A$', name: 'Australian Dollar' },
        'CAD': { symbol: 'C$', name: 'Canadian Dollar' },
        'CHF': { symbol: 'CHF', name: 'Swiss Franc' }
    };
    
    const currency = userSettings.currency || 'USD';
    const currencyInfo = currencySymbols[currency] || { symbol: '$', name: 'US Dollar' };
    
    try {
        const formatted = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
        
        return `${currencyInfo.symbol}${formatted}`;
    } catch (error) {
        return `${currencyInfo.symbol}${parseFloat(amount).toFixed(2)}`;
    }
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatDateTime(dateString) {
    return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatTime(dateString) {
    return new Date(dateString).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getTransactionIcon(type) {
    const icons = {
        income: 'fa-arrow-up',
        expense: 'fa-arrow-down',
        loan_given: 'fa-hand-holding-usd',
        loan_taken: 'fa-hand-holding',
        repayment: 'fa-exchange-alt'
    };
    return icons[type] || 'fa-circle';
}

function getTransactionColor(type) {
    const colors = {
        income: 'income',
        expense: 'expense',
        loan_given: 'loan',
        loan_taken: 'loan',
        repayment: 'income'
    };
    return colors[type] || 'expense';
}

function calculatePeriodTotal(transactions, period) {
    const now = new Date();
    let total = 0;
    
    transactions.forEach(t => {
        const tDate = new Date(t.date);
        let include = false;
        
        switch(period) {
            case 'month':
                include = tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
                break;
            case 'lastMonth':
                const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                include = tDate.getMonth() === lastMonth.getMonth() && tDate.getFullYear() === lastMonth.getFullYear();
                break;
            case 'year':
                include = tDate.getFullYear() === now.getFullYear();
                break;
        }
        
        if (include) {
            total += parseFloat(t.amount);
        }
    });
    
    return total;
}

// Close dropdowns when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.relative')) {
        const userMenu = document.getElementById('user-menu');
        if (userMenu && !userMenu.classList.contains('hidden')) {
            userMenu.classList.add('hidden');
        }
    }
    
    // Close notifications panel when clicking outside
    const notifPanel = document.getElementById('notifications-panel');
    if (notifPanel && !e.target.closest('#notifications-panel') && !e.target.closest('button[onclick="toggleNotifications()"]')) {
        if (!notifPanel.classList.contains('hidden')) {
            notifPanel.classList.add('hidden');
        }
    }
});
