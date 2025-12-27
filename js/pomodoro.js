/**
 * StudyHub - Pomodoro Timer Module
 * Handles timed study sessions with breaks
 */

const PomodoroModule = {
    timerInterval: null,
    remainingSeconds: 0,
    totalSeconds: 0,
    isRunning: false,
    isPaused: false,
    currentMode: 'work', // 'work', 'shortBreak', 'longBreak'
    sessionsCompleted: 0,

    // Audio context for sounds
    audioContext: null,

    init() {
        this.loadSettings();
        this.bindEvents();
        this.updateDisplay();
    },

    loadSettings() {
        const settings = DataManager.getSettings();
        document.getElementById('workDuration').value = settings.workDuration || 25;
        document.getElementById('shortBreak').value = settings.shortBreak || 5;
        document.getElementById('longBreak').value = settings.longBreak || 15;

        this.resetTimer();
    },

    bindEvents() {
        document.getElementById('startTimer')?.addEventListener('click', () => this.start());
        document.getElementById('pauseTimer')?.addEventListener('click', () => this.pause());
        document.getElementById('resetTimer')?.addEventListener('click', () => this.reset());

        // Settings changes
        ['workDuration', 'shortBreak', 'longBreak'].forEach(id => {
            document.getElementById(id)?.addEventListener('change', (e) => {
                const value = parseInt(e.target.value) || 25;
                DataManager.updateSettings({ [id]: value });
                if (!this.isRunning) this.resetTimer();
            });
        });
    },

    start() {
        if (this.isRunning && !this.isPaused) return;

        this.isRunning = true;
        this.isPaused = false;

        document.getElementById('startTimer').disabled = true;
        document.getElementById('pauseTimer').disabled = false;

        this.timerInterval = setInterval(() => this.tick(), 1000);
    },

    pause() {
        if (!this.isRunning) return;

        this.isPaused = true;
        this.isRunning = false;
        clearInterval(this.timerInterval);

        document.getElementById('startTimer').disabled = false;
        document.getElementById('pauseTimer').disabled = true;
    },

    reset() {
        clearInterval(this.timerInterval);
        this.isRunning = false;
        this.isPaused = false;
        this.resetTimer();

        document.getElementById('startTimer').disabled = false;
        document.getElementById('pauseTimer').disabled = true;
    },

    resetTimer() {
        const settings = DataManager.getSettings();
        let minutes;

        switch (this.currentMode) {
            case 'shortBreak':
                minutes = settings.shortBreak || 5;
                break;
            case 'longBreak':
                minutes = settings.longBreak || 15;
                break;
            default:
                minutes = settings.workDuration || 25;
        }

        this.totalSeconds = minutes * 60;
        this.remainingSeconds = this.totalSeconds;
        this.updateDisplay();
    },

    tick() {
        if (this.remainingSeconds > 0) {
            this.remainingSeconds--;
            this.updateDisplay();
        } else {
            this.complete();
        }
    },

    complete() {
        clearInterval(this.timerInterval);
        this.isRunning = false;
        this.playSound();

        if (this.currentMode === 'work') {
            this.sessionsCompleted++;
            const settings = DataManager.getSettings();
            DataManager.addStudyTime(settings.workDuration || 25, DataManager.getSettings().activeSubject);

            document.getElementById('completedSessions').textContent = this.sessionsCompleted;
            document.getElementById('totalFocusTime').textContent =
                `${this.sessionsCompleted * (settings.workDuration || 25)} dk`;

            // Determine break type
            if (this.sessionsCompleted % 4 === 0) {
                this.currentMode = 'longBreak';
                App.showToast('Harika iş! Uzun mola zamanı! 🎉', 'success');
            } else {
                this.currentMode = 'shortBreak';
                App.showToast('Oturum tamamlandı! Kısa mola zamanı! ☕', 'success');
            }
        } else {
            this.currentMode = 'work';
            App.showToast('Mola bitti! Çalışmaya devam! 💪', 'info');
        }

        this.resetTimer();
        document.getElementById('startTimer').disabled = false;
        document.getElementById('pauseTimer').disabled = true;
    },

    updateDisplay() {
        const minutes = Math.floor(this.remainingSeconds / 60);
        const seconds = this.remainingSeconds % 60;
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        document.getElementById('timerTime').textContent = timeString;

        // Update label
        const labels = {
            work: 'Çalışma',
            shortBreak: 'Kısa Mola',
            longBreak: 'Uzun Mola'
        };
        document.getElementById('timerLabel').textContent = labels[this.currentMode];

        // Update progress circle
        const progress = document.getElementById('timerProgress');
        if (progress) {
            const circumference = 2 * Math.PI * 45;
            const offset = circumference * (1 - (this.remainingSeconds / this.totalSeconds));
            progress.style.strokeDasharray = circumference;
            progress.style.strokeDashoffset = offset;

            // Change color based on mode
            const colors = {
                work: '#6c5ce7',
                shortBreak: '#00cec9',
                longBreak: '#00b894'
            };
            progress.style.stroke = colors[this.currentMode];
        }
    },

    playSound() {
        try {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }

            // Create a simple beep
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.frequency.value = 800;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);

            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.5);

            // Play again for double beep
            setTimeout(() => {
                const osc2 = this.audioContext.createOscillator();
                const gain2 = this.audioContext.createGain();
                osc2.connect(gain2);
                gain2.connect(this.audioContext.destination);
                osc2.frequency.value = 800;
                osc2.type = 'sine';
                gain2.gain.setValueAtTime(0.3, this.audioContext.currentTime);
                gain2.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
                osc2.start(this.audioContext.currentTime);
                osc2.stop(this.audioContext.currentTime + 0.5);
            }, 600);

        } catch (e) {
            console.log('Sound not supported');
        }
    },

    // Quick start from dashboard
    quickStart() {
        App.showView('pomodoro');
        setTimeout(() => this.start(), 300);
    }
};
