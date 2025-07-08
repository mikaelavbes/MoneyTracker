class BudgetTracker {
    constructor() {
        this.transactions = JSON.parse(localStorage.getItem('transactions')) || [];
        this.categories = {
            income: ['Gaji', 'Freelance', 'Bisnis', 'Investasi', 'Hadiah', 'Lainnya'],
            expense: ['Makanan', 'Transportasi', 'Belanja', 'Hiburan', 'Tagihan', 'Kesehatan', 'Pendidikan', 'Lainnya']
        };
    }

    // --- METODE INISIALISASI HALAMAN ---
    initPage() {
        this.setActiveNavLink();
        const path = window.location.pathname.split("/").pop();

        switch(path) {
            case 'dashboard.html':
                this.initDashboardPage();
                break;
            case 'budget.html':
                this.initBudgetPage();
                break;
            case 'history.html':
                this.initHistoryPage();
                break;
            case 'accounts.html':
                this.initAccountsPage();
                break;
        }
    }

    initDashboardPage() {
        this.updateDashboard();
    }
    
    initBudgetPage() {
        document.getElementById('transactionForm').addEventListener('submit', (e) => this.handleTransactionSubmit(e));
        document.getElementById('transactionType').addEventListener('change', () => this.updateCategoryOptions());
        this.setTodayDate();
        this.updateCategoryOptions();
    }

    initHistoryPage() {
        this.populateFilterCategories();
        this.applyFilters();
        document.querySelectorAll('#filterType, #filterCategory, #filterDateFrom, #filterDateTo').forEach(el => {
            el.addEventListener('change', () => this.applyFilters());
        });
        document.getElementById('clearFiltersBtn').addEventListener('click', () => this.clearFilters());
    }

    initAccountsPage() {
        this.updateAccounts();
    }

    // --- METODE LOGIKA INTI ---
    handleTransactionSubmit(e) {
        e.preventDefault();
        const transaction = {
            id: Date.now(),
            type: document.getElementById('transactionType').value,
            amount: parseFloat(document.getElementById('amount').value),
            category: document.querySelector('input[name="category"]:checked').value,
            account: document.getElementById('account').value,
            description: document.getElementById('description').value,
            date: document.getElementById('date').value,
        };
        this.transactions.unshift(transaction);
        this.saveData();
        this.showNotification('Transaksi berhasil ditambahkan!', 'success');
        e.target.reset();
        this.setTodayDate();
        this.updateCategoryOptions();
    }

    applyFilters() {
        const filters = {
            type: document.getElementById('filterType').value,
            category: document.getElementById('filterCategory').value,
            from: document.getElementById('filterDateFrom').value,
            to: document.getElementById('filterDateTo').value,
        };
        let filtered = this.transactions.filter(t => 
            (!filters.type || t.type === filters.type) &&
            (!filters.category || t.category === filters.category) &&
            (!filters.from || t.date >= filters.from) &&
            (!filters.to || t.date <= filters.to)
        );
        this.renderTransactionList(filtered, 'transactionHistory', 'Tidak ada transaksi yang cocok.');
    }

    // --- METODE PEMBARUAN UI ---
    updateDashboard() {
        const now = new Date();
        const monthlyTx = this.transactions.filter(t => {
            const txDate = new Date(t.date);
            return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
        });
        const totalIncome = this.transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
        const totalExpenses = this.transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

        this.updateElement('totalBalance', this.formatCurrency(totalIncome - totalExpenses));
        this.updateElement('monthlyIncome', this.formatCurrency(monthlyTx.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0)));
        this.updateElement('monthlyExpenses', this.formatCurrency(monthlyTx.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0)));
        this.updateElement('totalAssets', this.formatCurrency(totalIncome - totalExpenses > 0 ? totalIncome - totalExpenses : 0));
        this.renderTransactionList(this.transactions.slice(0, 5), 'recentTransactions', 'Belum ada transaksi.');
    }

    updateAccounts() {
        const balances = { 'Rekening': 0, 'Tabungan': 0, 'Kredit': 0, 'Tunai': 0 };
        this.transactions.forEach(tx => {
            if (balances.hasOwnProperty(tx.account)) {
                balances[tx.account] += tx.type === 'income' ? tx.amount : -tx.amount;
            }
        });
        this.updateElement('checkingBalance', this.formatCurrency(balances['Rekening']));
        this.updateElement('savingsBalance', this.formatCurrency(balances['Tabungan']));
        this.updateElement('creditBalance', this.formatCurrency(balances['Kredit']));
        this.updateElement('cashBalance', this.formatCurrency(balances['Tunai']));
        
        const liquidAssets = balances['Rekening'] + balances['Tabungan'] + balances['Tunai'];
        this.updateElement('liquidAssets', this.formatCurrency(liquidAssets));
        this.updateElement('netWorth', this.formatCurrency(liquidAssets + balances['Kredit']));
    }

    renderTransactionList(transactions, containerId, emptyMessage) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '';
        if (transactions.length === 0) {
            container.innerHTML = `<p class="text-center text-muted p-3">${emptyMessage}</p>`;
            return;
        }
        transactions.forEach(tx => {
            const isIncome = tx.type === 'income';
            const item = document.createElement('div');
            item.className = 'list-group-item d-flex justify-content-between align-items-center';
            item.innerHTML = `<div><div class="fw-bold">${tx.description}</div><small class="text-muted">${tx.category} &bull; ${tx.account} &bull; ${this.formatDate(tx.date)}</small></div><div class="fw-bold fs-5 ${isIncome ? 'text-success' : 'text-danger'}">${isIncome ? '+' : '-'}${this.formatCurrency(tx.amount)}</div>`;
            container.appendChild(item);
        });
    }

    // --- METODE BANTUAN ---
    saveData() { localStorage.setItem('transactions', JSON.stringify(this.transactions)); }
    formatCurrency(amount) { return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount); }
    formatDate(dateString) { return new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }); }
    updateElement(id, content) { const el = document.getElementById(id); if (el) el.textContent = content; }
    setTodayDate() { if (document.getElementById('date')) document.getElementById('date').valueAsDate = new Date(); }
    
    updateCategoryOptions() {
        const typeEl = document.getElementById('transactionType');
        const categoryGroup = document.getElementById('categoryRadioGroup');
        if (!typeEl || !categoryGroup) return;
        const type = typeEl.value;
        categoryGroup.innerHTML = '';
        if (!type) { categoryGroup.innerHTML = '<p class="text-muted small">Pilih tipe transaksi dahulu.</p>'; return; }
        this.categories[type].forEach(cat => {
            const div = document.createElement('div');
            div.className = 'form-check form-check-inline';
            div.innerHTML = `<input class="form-check-input" type="radio" name="category" id="cat-${cat}" value="${cat}" required><label class="form-check-label" for="cat-${cat}">${cat}</label>`;
            categoryGroup.appendChild(div);
        });
    }

    populateFilterCategories() {
        const filterCatSelect = document.getElementById('filterCategory');
        if (!filterCatSelect) return;
        filterCatSelect.innerHTML = '<option value="">Semua</option>';
        [...this.categories.income, ...this.categories.expense].sort().forEach(cat => {
            filterCatSelect.innerHTML += `<option value="${cat}">${cat}</option>`;
        });
    }

    clearFilters() {
        document.getElementById('filterType').value = '';
        document.getElementById('filterCategory').value = '';
        document.getElementById('filterDateFrom').value = '';
        document.getElementById('filterDateTo').value = '';
        this.applyFilters();
    }

    showNotification(message, type = 'success') {
        const container = document.getElementById('notification-container');
        const color = type === 'success' ? 'success' : 'primary';
        const notif = document.createElement('div');
        notif.className = `alert alert-${color} alert-dismissible fade show shadow-lg`;
        notif.innerHTML = `${message}<button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
        container.appendChild(notif);
        setTimeout(() => bootstrap.Alert.getOrCreateInstance(notif).close(), 3000);
    }

    setActiveNavLink() {
        const path = window.location.pathname.split("/").pop();
        const targetFile = path === '' || path === 'index.html' ? 'index.html' : path;
        document.querySelectorAll('.navbar-nav .nav-link').forEach(link => {
            if (link.getAttribute('href') === targetFile) {
                link.classList.add('active');
            }
        });
    }
}

// Inisialisasi Aplikasi
document.addEventListener('DOMContentLoaded', () => {
    const tracker = new BudgetTracker();
    tracker.initPage();
});