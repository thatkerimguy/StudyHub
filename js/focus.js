/**
 * StudyHub - Focus Mode Module
 * Distraction-free study environment
 */

const FocusModule = {
    isActive: false,
    startTime: null,
    timerInterval: null,

    init() {
        this.bindEvents();
    },

    bindEvents() {
        document.getElementById('enterFocusMode')?.addEventListener('click', () => {
            this.enterFocus();
        });

        document.getElementById('exitFocusMode')?.addEventListener('click', () => {
            this.exitFocus();
        });

        // ESC key to exit
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isActive) {
                this.exitFocus();
            }
        });

        document.getElementById('focusMusicToggle')?.addEventListener('click', () => {
            MusicModule.toggle();
        });
    },

    enterFocus() {
        const task = document.getElementById('focusTask').value.trim() || 'Çalışıyorum...';

        this.isActive = true;
        this.startTime = Date.now();

        // Show overlay
        const overlay = document.getElementById('focusOverlay');
        overlay?.classList.remove('hidden');

        // Set task text
        document.getElementById('focusCurrentTask').textContent = task;

        // Start timer
        this.timerInterval = setInterval(() => this.updateTimer(), 1000);

        // Enter fullscreen if supported
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(() => { });
        }

        App.showToast('Odak modu aktif! Başarılar! 🎯', 'success');
    },

    exitFocus() {
        if (!this.isActive) return;

        this.isActive = false;
        clearInterval(this.timerInterval);

        // Calculate elapsed time
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000 / 60);

        if (elapsed > 0) {
            DataManager.addStudyTime(elapsed, DataManager.getSettings().activeSubject);
            App.showToast(`${elapsed} dakika çalıştın! Harika! 🌟`, 'success');
        }

        // Hide overlay
        document.getElementById('focusOverlay')?.classList.add('hidden');

        // Exit fullscreen
        if (document.exitFullscreen && document.fullscreenElement) {
            document.exitFullscreen().catch(() => { });
        }

        // Reset timer display
        document.getElementById('focusTime').textContent = '00:00:00';
        document.getElementById('focusOverlayTimer').textContent = '00:00:00';

        // Update progress
        App.updateDashboardStats();
    },

    updateTimer() {
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        const hours = Math.floor(elapsed / 3600);
        const minutes = Math.floor((elapsed % 3600) / 60);
        const seconds = elapsed % 60;

        const timeString = [
            hours.toString().padStart(2, '0'),
            minutes.toString().padStart(2, '0'),
            seconds.toString().padStart(2, '0')
        ].join(':');

        document.getElementById('focusTime').textContent = timeString;
        document.getElementById('focusOverlayTimer').textContent = timeString;
    },

    // Quick start from dashboard
    quickStart() {
        App.showView('focus');
        setTimeout(() => {
            document.getElementById('focusTask').focus();
        }, 300);
    }
};
