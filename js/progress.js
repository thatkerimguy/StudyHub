/**
 * StudyHub - Progress Module
 * Handles progress tracking and charts
 */

const ProgressModule = {
    weeklyChart: null,

    init() {
        this.renderWeeklyChart();
        this.renderSubjectProgress();
        this.renderAchievements();
    },

    renderWeeklyChart() {
        const ctx = document.getElementById('weeklyChart');
        if (!ctx) return;

        const weeklyData = DataManager.getWeeklyStudyData();

        // Destroy existing chart
        if (this.weeklyChart) {
            this.weeklyChart.destroy();
        }

        this.weeklyChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: weeklyData.map(d => d.day),
                datasets: [{
                    label: 'Dakika',
                    data: weeklyData.map(d => d.minutes),
                    backgroundColor: 'rgba(108, 92, 231, 0.6)',
                    borderColor: '#6c5ce7',
                    borderWidth: 2,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)'
                        },
                        ticks: {
                            color: '#a0a0b0'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#a0a0b0'
                        }
                    }
                }
            }
        });
    },

    renderSubjectProgress() {
        const container = document.getElementById('subjectProgressList');
        if (!container) return;

        const progress = DataManager.getData('PROGRESS');
        const subjects = getAllSubjects();

        // Calculate max study time for percentage
        const times = subjects.map(s => progress.studyTime[s.id] || 0);
        const maxTime = Math.max(...times, 60); // minimum 60 for display

        container.innerHTML = subjects.map(subject => {
            const time = progress.studyTime[subject.id] || 0;
            const percentage = Math.round((time / maxTime) * 100);

            return `
                <div class="subject-progress-item">
                    <span class="label">${subject.name}</span>
                    <div class="bar">
                        <div class="bar-fill" style="width: ${percentage}%; background: ${subject.color}"></div>
                    </div>
                    <span class="value">${time} dk</span>
                </div>
            `;
        }).join('');
    },

    renderAchievements() {
        const container = document.getElementById('achievementsGrid');
        if (!container) return;

        const stats = DataManager.getStats();
        const progress = DataManager.getData('PROGRESS');

        const achievements = [
            {
                id: 'first_session',
                icon: 'fas fa-play-circle',
                name: 'İlk Adım',
                unlocked: stats.totalSessions >= 1
            },
            {
                id: 'week_streak',
                icon: 'fas fa-fire',
                name: '7 Gün Seri',
                unlocked: stats.streak >= 7
            },
            {
                id: 'cards_100',
                icon: 'fas fa-clone',
                name: '100 Kart',
                unlocked: DataManager.getFlashcards().length >= 100
            },
            {
                id: 'quiz_master',
                icon: 'fas fa-trophy',
                name: 'Quiz Master',
                unlocked: stats.avgQuizScore >= 80
            },
            {
                id: 'hour_study',
                icon: 'fas fa-clock',
                name: '1 Saat',
                unlocked: stats.todayMinutes >= 60
            },
            {
                id: 'perfect_quiz',
                icon: 'fas fa-star',
                name: 'Mükemmel',
                unlocked: this.hasPerfectQuiz()
            }
        ];

        container.innerHTML = achievements.map(a => `
            <div class="achievement ${a.unlocked ? 'unlocked' : ''}" title="${a.name}">
                <i class="${a.icon}"></i>
                <span>${a.name}</span>
            </div>
        `).join('');
    },

    hasPerfectQuiz() {
        const progress = DataManager.getData('PROGRESS');
        const allScores = Object.values(progress.quizScores || {}).flat();
        return allScores.some(s => s.percentage === 100);
    },

    refresh() {
        this.renderWeeklyChart();
        this.renderSubjectProgress();
        this.renderAchievements();
    }
};
