// Google Sheets Database Service Layer
class DatabaseService {
    constructor() {
        // Replace with your deployed Google Apps Script web app URL
        // this.apiUrl = 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL'; 
        this.apiUrl = 'https://script.google.com/macros/s/AKfycbyYASVPmRvFwtIcKRhyfxzB9hRTEceObNbgY-v_jTtuvL91NPThiWqUBR3Abpu2m_atEA/exec'; 
        this.isConnected = false;
    }

    // Initialize connection
    async connect() {
        try {
            const response = await fetch(this.apiUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                this.isConnected = true;
                console.log('Connected to Google Sheets backend');
                return true;
            }
        } catch (error) {
            console.error('Google Sheets connection failed:', error);
            this.isConnected = false;
            return false;
        }
    }

    // Generic API call method
    async apiCall(action, data = null) {
        try {
            const payload = { action, data };
            
            const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            };

            const response = await fetch(this.apiUrl, options);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'API call failed');
            }
            
            return result.data;
        } catch (error) {
            console.error('API call failed:', error);
            throw error;
        }
    }

    // User Authentication
    async login(email, password) {
        return await this.apiCall('login', { email, password });
    }

    async signup(name, email, password) {
        return await this.apiCall('signup', { name, email, password });
    }

    async logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }

    // Transactions
    async getTransactions(filters = {}) {
        const userId = JSON.parse(localStorage.getItem('user')).id;
        return await this.apiCall('getTransactions', { userId, filters });
    }

    async getTransaction(id) {
        // In a real implementation, you would filter by ID
        // For now, we'll get all transactions and filter client-side
        const transactions = await this.getTransactions();
        return transactions.find(t => t.id == id) || null;
    }

    async createTransaction(transaction) {
        const userId = JSON.parse(localStorage.getItem('user')).id;
        transaction.user_id = userId;
        return await this.apiCall('createTransaction', { transaction });
    }

    async updateTransaction(id, transaction) {
        return await this.apiCall('updateTransaction', { id, transaction });
    }

    async deleteTransaction(id) {
        return await this.apiCall('deleteTransaction', { id });
    }

    // Income
    async getIncomes(filters = {}) {
        filters.type = 'income';
        return await this.getTransactions(filters);
    }

    async createIncome(income) {
        income.type = 'income';
        return await this.createTransaction(income);
    }

    // Expenses
    async getExpenses(filters = {}) {
        filters.type = 'expense';
        return await this.getTransactions(filters);
    }

    async createExpense(expense) {
        expense.type = 'expense';
        return await this.createTransaction(expense);
    }

    // Loans
    async getLoans(type = 'all') {
        const userId = JSON.parse(localStorage.getItem('user')).id;
        return await this.apiCall('getLoans', { userId, type });
    }

    async getLoan(id) {
        // In a real implementation, you would filter by ID
        // For now, we'll get all loans and filter client-side
        const loans = await this.getLoans();
        return loans.find(l => l.id == id) || null;
    }

    async createLoan(loan) {
        const userId = JSON.parse(localStorage.getItem('user')).id;
        loan.user_id = userId;
        return await this.apiCall('createLoan', { loan });
    }

    async updateLoan(id, loan) {
        // Implementation depends on your Google Apps Script function
        // This is a placeholder
        console.log('Update loan not implemented in Google Sheets version');
        return loan;
    }

    async addRepayment(loanId, repayment) {
        return await this.apiCall('addRepayment', { loanId, repayment });
    }

    async getRepayments(loanId) {
        // In a real implementation, you would filter by loanId
        // For now, this is a placeholder
        console.log('Get repayments not implemented in Google Sheets version');
        return [];
    }

    // Categories
    async getCategories(type = 'all') {
        const userId = JSON.parse(localStorage.getItem('user')).id;
        return await this.apiCall('getCategories', { userId, type });
    }

    async createCategory(category) {
        const userId = JSON.parse(localStorage.getItem('user')).id;
        category.user_id = userId;
        return await this.apiCall('createCategory', { category });
    }

    async updateCategory(id, category) {
        // Implementation depends on your Google Apps Script function
        // This is a placeholder
        console.log('Update category not implemented in Google Sheets version');
        return category;
    }

    async deleteCategory(id) {
        // Implementation depends on your Google Apps Script function
        // This is a placeholder
        console.log('Delete category not implemented in Google Sheets version');
        return true;
    }

    // Accounts
    async getAccounts() {
        // In a real implementation, you would fetch accounts
        // For now, this is a placeholder that returns default accounts
        return [
            { id: 1, name: 'Cash', type: 'cash', balance: 0, icon: 'fa-wallet' },
            { id: 2, name: 'Bank Account', type: 'bank', balance: 0, icon: 'fa-university' },
            { id: 3, name: 'Credit Card', type: 'card', balance: 0, icon: 'fa-credit-card' }
        ];
    }

    async createAccount(account) {
        // Implementation depends on your Google Apps Script function
        // This is a placeholder
        console.log('Create account not implemented in Google Sheets version');
        return account;
    }

    async updateAccount(id, account) {
        // Implementation depends on your Google Apps Script function
        // This is a placeholder
        console.log('Update account not implemented in Google Sheets version');
        return account;
    }

    // Reports & Analytics
    async getDashboardStats() {
        // In a real implementation, you would calculate dashboard stats
        // For now, this is a placeholder
        return {
            totalIncome: 0,
            totalExpense: 0,
            netBalance: 0,
            loansGiven: 0,
            loansTaken: 0
        };
    }

    async getIncomeExpenseReport(startDate, endDate) {
        // In a real implementation, you would generate reports
        // For now, this is a placeholder
        return {
            income: [],
            expense: []
        };
    }

    async getCategoryReport(type, startDate, endDate) {
        // In a real implementation, you would generate reports
        // For now, this is a placeholder
        return [];
    }

    async getLoanReport() {
        // In a real implementation, you would generate reports
        // For now, this is a placeholder
        return [];
    }

    // User Profile
    async getProfile() {
        const userId = JSON.parse(localStorage.getItem('user')).id;
        return await this.apiCall('getUserProfile', { userId });
    }

    async updateProfile(profile) {
        const userId = JSON.parse(localStorage.getItem('user')).id;
        return await this.apiCall('updateUserProfile', { userId, profile });
    }

    async updatePassword(oldPassword, newPassword) {
        // Implementation depends on your Google Apps Script function
        // This is a placeholder
        console.log('Update password not implemented in Google Sheets version');
        return true;
    }

    // Settings
    async getSettings() {
        // In a real implementation, you would fetch settings
        // For now, this is a placeholder
        return {
            currency: 'USD',
            defaultAccount: 'cash',
            notifications: {
                transactions: true,
                loans: true,
                budgets: false
            },
            theme: 'light'
        };
    }

    async updateSettings(settings) {
        // Implementation depends on your Google Apps Script function
        // This is a placeholder
        console.log('Update settings not implemented in Google Sheets version');
        return settings;
    }

    // File Attachments
    async uploadFile(file, type, entityId) {
        // File uploads are not supported in this Google Sheets version
        console.log('File upload not supported in Google Sheets version');
        throw new Error('File upload not supported in Google Sheets version');
    }

    async getFile(fileId) {
        // File downloads are not supported in this Google Sheets version
        console.log('File download not supported in Google Sheets version');
        throw new Error('File download not supported in Google Sheets version');
    }

    async deleteFile(fileId) {
        // File deletion is not supported in this Google Sheets version
        console.log('File deletion not supported in Google Sheets version');
        throw new Error('File deletion not supported in Google Sheets version');
    }

    // Backup & Export
    async exportData(format = 'csv') {
        // Export is not implemented in this Google Sheets version
        console.log('Export not implemented in Google Sheets version');
        throw new Error('Export not implemented in Google Sheets version');
    }

    async backupData() {
        // Backup is not implemented in this Google Sheets version
        console.log('Backup not implemented in Google Sheets version');
        throw new Error('Backup not implemented in Google Sheets version');
    }
}

// Local Storage Fallback (for offline mode or when backend is not available)
class LocalStorageService {
    constructor() {
        this.initializeStorage();
    }

    initializeStorage() {
        if (!localStorage.getItem('cashpilot_data')) {
            const initialData = {
                transactions: [],
                loans: [],
                categories: this.getDefaultCategories(),
                accounts: this.getDefaultAccounts(),
                settings: this.getDefaultSettings(),
                user: null
            };
            localStorage.setItem('cashpilot_data', JSON.stringify(initialData));
        }
    }

    getDefaultCategories() {
        return [
            // Income Categories
            { id: 1, name: 'Salary', type: 'income', icon: 'fa-money-bill-wave', color: '#10b981' },
            { id: 2, name: 'Business', type: 'income', icon: 'fa-briefcase', color: '#3b82f6' },
            { id: 3, name: 'Bonus', type: 'income', icon: 'fa-gift', color: '#8b5cf6' },
            { id: 4, name: 'Investment', type: 'income', icon: 'fa-chart-line', color: '#06b6d4' },
            { id: 5, name: 'Other Income', type: 'income', icon: 'fa-plus-circle', color: '#14b8a6' },
            
            // Expense Categories
            { id: 6, name: 'Food & Dining', type: 'expense', icon: 'fa-utensils', color: '#ef4444' },
            { id: 7, name: 'Transport', type: 'expense', icon: 'fa-car', color: '#f59e0b' },
            { id: 8, name: 'Utilities', type: 'expense', icon: 'fa-bolt', color: '#eab308' },
            { id: 9, name: 'Shopping', type: 'expense', icon: 'fa-shopping-bag', color: '#ec4899' },
            { id: 10, name: 'Entertainment', type: 'expense', icon: 'fa-film', color: '#a855f7' },
            { id: 11, name: 'Healthcare', type: 'expense', icon: 'fa-heartbeat', color: '#dc2626' },
            { id: 12, name: 'Education', type: 'expense', icon: 'fa-graduation-cap', color: '#2563eb' },
            { id: 13, name: 'Other Expense', type: 'expense', icon: 'fa-minus-circle', color: '#6b7280' }
        ];
    }

    getDefaultAccounts() {
        return [
            { id: 1, name: 'Cash', type: 'cash', balance: 0, icon: 'fa-wallet' },
            { id: 2, name: 'Bank Account', type: 'bank', balance: 0, icon: 'fa-university' },
            { id: 3, name: 'Credit Card', type: 'card', balance: 0, icon: 'fa-credit-card' }
        ];
    }

    getDefaultSettings() {
        return {
            currency: 'USD',
            defaultAccount: 'cash',
            notifications: {
                transactions: true,
                loans: true,
                budgets: false
            },
            theme: 'light'
        };
    }

    getData() {
        return JSON.parse(localStorage.getItem('cashpilot_data'));
    }

    saveData(data) {
        localStorage.setItem('cashpilot_data', JSON.stringify(data));
    }

    // Transactions
    getTransactions(filters = {}) {
        const data = this.getData();
        let transactions = data.transactions;

        if (filters.type) {
            transactions = transactions.filter(t => t.type === filters.type);
        }
        if (filters.startDate) {
            transactions = transactions.filter(t => new Date(t.date) >= new Date(filters.startDate));
        }
        if (filters.endDate) {
            transactions = transactions.filter(t => new Date(t.date) <= new Date(filters.endDate));
        }
        if (filters.category) {
            transactions = transactions.filter(t => t.category === filters.category);
        }

        return transactions;
    }

    createTransaction(transaction) {
        const data = this.getData();
        transaction.id = Date.now();
        transaction.createdAt = new Date().toISOString();
        data.transactions.push(transaction);
        this.saveData(data);
        return transaction;
    }

    updateTransaction(id, updates) {
        const data = this.getData();
        const index = data.transactions.findIndex(t => t.id === id);
        if (index !== -1) {
            data.transactions[index] = { ...data.transactions[index], ...updates };
            this.saveData(data);
            return data.transactions[index];
        }
        return null;
    }

    deleteTransaction(id) {
        const data = this.getData();
        data.transactions = data.transactions.filter(t => t.id !== id);
        this.saveData(data);
        return true;
    }

    // Loans
    getLoans(type = 'all') {
        const data = this.getData();
        if (type === 'all') return data.loans;
        return data.loans.filter(l => l.type === type);
    }

    createLoan(loan) {
        const data = this.getData();
        loan.id = Date.now();
        loan.createdAt = new Date().toISOString();
        loan.repayments = [];
        data.loans.push(loan);
        this.saveData(data);
        return loan;
    }

    addRepayment(loanId, repayment) {
        const data = this.getData();
        const loan = data.loans.find(l => l.id === loanId);
        if (loan) {
            repayment.id = Date.now();
            repayment.createdAt = new Date().toISOString();
            loan.repayments.push(repayment);
            loan.outstanding -= repayment.amount;
            this.saveData(data);
            return repayment;
        }
        return null;
    }

    // Categories
    getCategories(type = 'all') {
        const data = this.getData();
        if (type === 'all') return data.categories;
        return data.categories.filter(c => c.type === type);
    }

    createCategory(category) {
        const data = this.getData();
        category.id = Date.now();
        data.categories.push(category);
        this.saveData(data);
        return category;
    }

    // User
    getUser() {
        const data = this.getData();
        return data.user;
    }

    setUser(user) {
        const data = this.getData();
        data.user = user;
        this.saveData(data);
    }
}

// Initialize services
const db = new DatabaseService();
const localDB = new LocalStorageService();