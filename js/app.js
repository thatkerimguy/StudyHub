/**
 * StudyHub - Main Application Controller
 * Initializes and coordinates all modules
 */

const App = {
    currentView: 'dashboard',
    activeSubject: 'all',

    init() {
        console.log('StudyHub starting...');

        // Initialize data
        DataManager.init();

        // Bind navigation
        this.bindNavigation();
        this.bindQuickActions();
        this.bindMobileMenu();

        // Initialize modules
        FlashcardsModule.init();
        PomodoroModule.init();
        NotesModule.init();
        QuizModule.init();
        ProgressModule.init();
        PlannerModule.init();
        FocusModule.init();
        MusicModule.init();

        // Render dashboard
        this.renderDashboard();

        // Handle URL hash for navigation
        this.handleHashChange();
        window.addEventListener('hashchange', () => this.handleHashChange());

        console.log('StudyHub ready! 🚀');
    },

    bindNavigation() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const view = item.dataset.view;
                this.showView(view);
            });
        });

        // Subject selector
        document.getElementById('activeSubject')?.addEventListener('change', (e) => {
            this.setActiveSubject(e.target.value);
        });

        // Sidebar toggle
        document.getElementById('sidebarToggle')?.addEventListener('click', () => {
            document.getElementById('sidebar')?.classList.toggle('collapsed');
        });
    },

    bindQuickActions() {
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                this.handleQuickAction(action);
            });
        });
    },

    bindMobileMenu() {
        // Check if mobile button already exists
        if (document.querySelector('.mobile-menu-toggle')) return;

        // Add mobile menu button with logo
        const mobileBtn = document.createElement('button');
        mobileBtn.className = 'mobile-menu-toggle';
        mobileBtn.innerHTML = '<i class="fas fa-graduation-cap"></i><span>StudyHub</span>';
        document.body.appendChild(mobileBtn);

        // Add overlay for mobile
        const overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        document.body.appendChild(overlay);

        const sidebar = document.getElementById('sidebar');

        mobileBtn.addEventListener('click', () => {
            sidebar?.classList.toggle('open');
            overlay.classList.toggle('active', sidebar?.classList.contains('open'));
        });

        // Close sidebar when clicking overlay
        overlay.addEventListener('click', () => {
            sidebar?.classList.remove('open');
            overlay.classList.remove('active');
        });

        // Close sidebar on nav click (mobile)
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    sidebar?.classList.remove('open');
                    overlay.classList.remove('active');
                }
            });
        });
    },

    handleQuickAction(action) {
        switch (action) {
            case 'start-pomodoro':
                PomodoroModule.quickStart();
                break;
            case 'review-cards':
                this.showView('flashcards');
                setTimeout(() => FlashcardsModule.loadReviewCards(), 300);
                break;
            case 'quick-quiz':
                QuizModule.quickQuiz();
                break;
            case 'focus-mode':
                FocusModule.quickStart();
                break;
        }
    },

    showView(viewId) {
        // Update URL hash
        window.location.hash = viewId;

        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.view === viewId);
        });

        // Update views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.toggle('active', view.id === `view-${viewId}`);
        });

        this.currentView = viewId;

        // Refresh view-specific content
        switch (viewId) {
            case 'dashboard':
                this.renderDashboard();
                break;
            case 'flashcards':
                FlashcardsModule.loadCards();
                break;
            case 'notes':
                NotesModule.loadNotesList();
                break;
            case 'progress':
                ProgressModule.refresh();
                break;
            case 'planner':
                PlannerModule.refresh();
                break;
        }
    },

    handleHashChange() {
        const hash = window.location.hash.slice(1) || 'dashboard';
        const validViews = ['dashboard', 'flashcards', 'pomodoro', 'notes', 'quiz', 'progress', 'planner', 'focus'];

        if (validViews.includes(hash)) {
            this.showView(hash);
        }
    },

    setActiveSubject(subject) {
        this.activeSubject = subject;
        DataManager.updateSettings({ activeSubject: subject });

        // Refresh current view
        this.showView(this.currentView);
    },

    renderDashboard() {
        // Render subject cards
        renderSubjectCards('subjectsGrid');

        // Update stats
        this.updateDashboardStats();
    },

    updateDashboardStats() {
        const stats = DataManager.getStats();

        document.getElementById('streakCount').textContent = stats.streak || 0;
        document.getElementById('todayMinutes').textContent = stats.todayMinutes || 0;
        document.getElementById('cardsReviewed').textContent = stats.todayCards || 0;
        document.getElementById('quizScore').textContent = `${stats.avgQuizScore || 0}%`;
    },

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-times-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };

        toast.innerHTML = `
            <i class="${icons[type] || icons.info}"></i>
            <span>${message}</span>
        `;

        container.appendChild(toast);

        // Auto remove
        setTimeout(() => {
            toast.style.animation = 'toastIn 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Expose to global for debugging
window.App = App;
window.DataManager = DataManager;
