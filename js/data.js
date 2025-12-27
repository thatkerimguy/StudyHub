/**
 * StudyHub - Data Management Module
 * Handles all LocalStorage operations for persistent data
 */

const DataManager = {
    STORAGE_KEYS: {
        FLASHCARDS: 'studyhub_flashcards',
        NOTES: 'studyhub_notes',
        QUIZZES: 'studyhub_quizzes',
        PROGRESS: 'studyhub_progress',
        PLANNER: 'studyhub_planner',
        SETTINGS: 'studyhub_settings',
        STATS: 'studyhub_stats'
    },

    // Initialize default data if not exists
    init() {
        Object.keys(this.STORAGE_KEYS).forEach(key => {
            if (!localStorage.getItem(this.STORAGE_KEYS[key])) {
                this.setData(key, this.getDefaultData(key));
            }
        });
        this.initializeTodayStats();
    },

    getDefaultData(key) {
        const defaults = {
            FLASHCARDS: {},
            NOTES: {},
            QUIZZES: {},
            PROGRESS: {
                studyTime: {},
                quizScores: {},
                cardsReviewed: 0,
                streak: 0,
                lastStudyDate: null,
                achievements: []
            },
            PLANNER: {
                events: []
            },
            SETTINGS: {
                workDuration: 25,
                shortBreak: 5,
                longBreak: 15,
                soundEnabled: true,
                activeSubject: 'all'
            },
            STATS: {
                todayMinutes: 0,
                todayCards: 0,
                totalSessions: 0,
                weeklyData: {}
            }
        };
        return defaults[key] || {};
    },

    // Generic data operations
    getData(key) {
        try {
            const data = localStorage.getItem(this.STORAGE_KEYS[key]);
            return data ? JSON.parse(data) : this.getDefaultData(key);
        } catch (e) {
            console.error('Error reading data:', e);
            return this.getDefaultData(key);
        }
    },

    setData(key, data) {
        try {
            localStorage.setItem(this.STORAGE_KEYS[key], JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('Error saving data:', e);
            return false;
        }
    },

    // Initialize today's stats
    initializeTodayStats() {
        const stats = this.getData('STATS');
        const today = new Date().toDateString();
        
        if (stats.lastDate !== today) {
            stats.todayMinutes = 0;
            stats.todayCards = 0;
            stats.lastDate = today;
            this.setData('STATS', stats);
        }
    },

    // ======== FLASHCARDS ========
    getFlashcards(subject = null) {
        const data = this.getData('FLASHCARDS');
        if (subject && subject !== 'all') {
            return data[subject] || [];
        }
        // Return all cards flattened
        return Object.values(data).flat();
    },

    addFlashcard(subject, front, back) {
        const data = this.getData('FLASHCARDS');
        if (!data[subject]) data[subject] = [];
        
        const card = {
            id: this.generateId(),
            front,
            back,
            subject,
            created: Date.now(),
            lastReview: null,
            nextReview: Date.now(),
            interval: 1,
            easeFactor: 2.5,
            repetitions: 0
        };
        
        data[subject].push(card);
        this.setData('FLASHCARDS', data);
        return card;
    },

    updateFlashcard(cardId, updates) {
        const data = this.getData('FLASHCARDS');
        for (const subject in data) {
            const index = data[subject].findIndex(c => c.id === cardId);
            if (index !== -1) {
                data[subject][index] = { ...data[subject][index], ...updates };
                this.setData('FLASHCARDS', data);
                return data[subject][index];
            }
        }
        return null;
    },

    deleteFlashcard(cardId) {
        const data = this.getData('FLASHCARDS');
        for (const subject in data) {
            const index = data[subject].findIndex(c => c.id === cardId);
            if (index !== -1) {
                data[subject].splice(index, 1);
                this.setData('FLASHCARDS', data);
                return true;
            }
        }
        return false;
    },

    // SM-2 Spaced Repetition Algorithm
    updateCardReview(cardId, quality) {
        // quality: 1-4 (1=complete blackout, 4=perfect)
        const data = this.getData('FLASHCARDS');
        for (const subject in data) {
            const index = data[subject].findIndex(c => c.id === cardId);
            if (index !== -1) {
                const card = data[subject][index];
                
                if (quality < 2) {
                    // Reset if failed
                    card.repetitions = 0;
                    card.interval = 1;
                } else {
                    // Update using SM-2
                    card.repetitions += 1;
                    if (card.repetitions === 1) {
                        card.interval = 1;
                    } else if (card.repetitions === 2) {
                        card.interval = 6;
                    } else {
                        card.interval = Math.round(card.interval * card.easeFactor);
                    }
                    
                    // Update ease factor
                    card.easeFactor = Math.max(1.3, 
                        card.easeFactor + (0.1 - (4 - quality) * (0.08 + (4 - quality) * 0.02))
                    );
                }
                
                card.lastReview = Date.now();
                card.nextReview = Date.now() + (card.interval * 24 * 60 * 60 * 1000);
                
                data[subject][index] = card;
                this.setData('FLASHCARDS', data);
                
                // Update stats
                this.incrementCardsReviewed();
                
                return card;
            }
        }
        return null;
    },

    getCardsForReview(subject = null) {
        const now = Date.now();
        const cards = this.getFlashcards(subject);
        return cards.filter(card => card.nextReview <= now);
    },

    // ======== NOTES ========
    getNotes(subject = null) {
        const data = this.getData('NOTES');
        if (subject && subject !== 'all') {
            return data[subject] || [];
        }
        return Object.values(data).flat();
    },

    addNote(subject, title) {
        const data = this.getData('NOTES');
        if (!data[subject]) data[subject] = [];
        
        const note = {
            id: this.generateId(),
            title,
            content: '',
            subject,
            created: Date.now(),
            updated: Date.now()
        };
        
        data[subject].push(note);
        this.setData('NOTES', data);
        return note;
    },

    updateNote(noteId, updates) {
        const data = this.getData('NOTES');
        for (const subject in data) {
            const index = data[subject].findIndex(n => n.id === noteId);
            if (index !== -1) {
                data[subject][index] = { 
                    ...data[subject][index], 
                    ...updates,
                    updated: Date.now()
                };
                this.setData('NOTES', data);
                return data[subject][index];
            }
        }
        return null;
    },

    deleteNote(noteId) {
        const data = this.getData('NOTES');
        for (const subject in data) {
            const index = data[subject].findIndex(n => n.id === noteId);
            if (index !== -1) {
                data[subject].splice(index, 1);
                this.setData('NOTES', data);
                return true;
            }
        }
        return false;
    },

    // ======== QUIZZES ========
    getQuestions(subject = null) {
        const data = this.getData('QUIZZES');
        if (subject && subject !== 'all') {
            return data[subject] || [];
        }
        return Object.values(data).flat();
    },

    addQuestion(subject, questionText, type, options, correctAnswer) {
        const data = this.getData('QUIZZES');
        if (!data[subject]) data[subject] = [];
        
        const question = {
            id: this.generateId(),
            question: questionText,
            type, // 'multiple' or 'written'
            options, // array for multiple choice
            correctAnswer, // index for multiple, text for written
            subject,
            created: Date.now(),
            timesAsked: 0,
            timesCorrect: 0
        };
        
        data[subject].push(question);
        this.setData('QUIZZES', data);
        return question;
    },

    updateQuestionStats(questionId, correct) {
        const data = this.getData('QUIZZES');
        for (const subject in data) {
            const index = data[subject].findIndex(q => q.id === questionId);
            if (index !== -1) {
                data[subject][index].timesAsked += 1;
                if (correct) data[subject][index].timesCorrect += 1;
                this.setData('QUIZZES', data);
                return data[subject][index];
            }
        }
        return null;
    },

    deleteQuestion(questionId) {
        const data = this.getData('QUIZZES');
        for (const subject in data) {
            const index = data[subject].findIndex(q => q.id === questionId);
            if (index !== -1) {
                data[subject].splice(index, 1);
                this.setData('QUIZZES', data);
                return true;
            }
        }
        return false;
    },

    getWrongAnswers(subject = null) {
        const questions = this.getQuestions(subject);
        return questions.filter(q => q.timesAsked > 0 && (q.timesCorrect / q.timesAsked) < 0.5);
    },

    // ======== PLANNER ========
    getEvents() {
        const data = this.getData('PLANNER');
        return data.events || [];
    },

    addEvent(title, subject, date, time, duration) {
        const data = this.getData('PLANNER');
        const event = {
            id: this.generateId(),
            title,
            subject,
            date,
            time,
            duration,
            completed: false,
            created: Date.now()
        };
        
        data.events.push(event);
        this.setData('PLANNER', data);
        return event;
    },

    updateEvent(eventId, updates) {
        const data = this.getData('PLANNER');
        const index = data.events.findIndex(e => e.id === eventId);
        if (index !== -1) {
            data.events[index] = { ...data.events[index], ...updates };
            this.setData('PLANNER', data);
            return data.events[index];
        }
        return null;
    },

    deleteEvent(eventId) {
        const data = this.getData('PLANNER');
        const index = data.events.findIndex(e => e.id === eventId);
        if (index !== -1) {
            data.events.splice(index, 1);
            this.setData('PLANNER', data);
            return true;
        }
        return false;
    },

    // ======== STATS & PROGRESS ========
    addStudyTime(minutes, subject = null) {
        const stats = this.getData('STATS');
        const progress = this.getData('PROGRESS');
        const today = new Date().toDateString();
        
        stats.todayMinutes += minutes;
        stats.totalSessions += 1;
        
        // Weekly data
        if (!stats.weeklyData[today]) stats.weeklyData[today] = 0;
        stats.weeklyData[today] += minutes;
        
        // Subject-specific time
        if (subject) {
            if (!progress.studyTime[subject]) progress.studyTime[subject] = 0;
            progress.studyTime[subject] += minutes;
        }
        
        // Update streak
        this.updateStreak();
        
        this.setData('STATS', stats);
        this.setData('PROGRESS', progress);
    },

    incrementCardsReviewed() {
        const stats = this.getData('STATS');
        stats.todayCards += 1;
        this.setData('STATS', stats);
    },

    updateStreak() {
        const progress = this.getData('PROGRESS');
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        
        if (progress.lastStudyDate === yesterday) {
            progress.streak += 1;
        } else if (progress.lastStudyDate !== today) {
            progress.streak = 1;
        }
        
        progress.lastStudyDate = today;
        this.setData('PROGRESS', progress);
    },

    saveQuizScore(subject, score, total) {
        const progress = this.getData('PROGRESS');
        if (!progress.quizScores[subject]) progress.quizScores[subject] = [];
        
        progress.quizScores[subject].push({
            score,
            total,
            percentage: Math.round((score / total) * 100),
            date: Date.now()
        });
        
        // Keep only last 20 scores per subject
        if (progress.quizScores[subject].length > 20) {
            progress.quizScores[subject].shift();
        }
        
        this.setData('PROGRESS', progress);
    },

    getWeeklyStudyData() {
        const stats = this.getData('STATS');
        const weekData = [];
        const days = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date(Date.now() - i * 86400000);
            const dateStr = date.toDateString();
            weekData.push({
                day: days[date.getDay()],
                minutes: stats.weeklyData[dateStr] || 0
            });
        }
        
        return weekData;
    },

    getStats() {
        const stats = this.getData('STATS');
        const progress = this.getData('PROGRESS');
        
        return {
            streak: progress.streak || 0,
            todayMinutes: stats.todayMinutes || 0,
            todayCards: stats.todayCards || 0,
            totalSessions: stats.totalSessions || 0,
            avgQuizScore: this.calculateAvgQuizScore()
        };
    },

    calculateAvgQuizScore() {
        const progress = this.getData('PROGRESS');
        const allScores = Object.values(progress.quizScores || {}).flat();
        if (allScores.length === 0) return 0;
        
        const sum = allScores.reduce((acc, s) => acc + s.percentage, 0);
        return Math.round(sum / allScores.length);
    },

    // ======== SETTINGS ========
    getSettings() {
        return this.getData('SETTINGS');
    },

    updateSettings(updates) {
        const settings = this.getData('SETTINGS');
        const newSettings = { ...settings, ...updates };
        this.setData('SETTINGS', newSettings);
        return newSettings;
    },

    // ======== UTILITIES ========
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    },

    exportData() {
        const exportData = {};
        Object.keys(this.STORAGE_KEYS).forEach(key => {
            exportData[key] = this.getData(key);
        });
        return JSON.stringify(exportData, null, 2);
    },

    importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            Object.keys(data).forEach(key => {
                if (this.STORAGE_KEYS[key]) {
                    this.setData(key, data[key]);
                }
            });
            return true;
        } catch (e) {
            console.error('Import error:', e);
            return false;
        }
    },

    clearAllData() {
        Object.values(this.STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
        this.init();
    }
};

// Initialize on load
DataManager.init();
