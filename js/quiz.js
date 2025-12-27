/**
 * StudyHub - Quiz Module
 * Handles quiz creation and testing
 */

const QuizModule = {
    currentQuestions: [],
    currentIndex: 0,
    selectedAnswer: null,
    correctCount: 0,
    wrongCount: 0,
    isTestMode: false,
    wrongAnswers: [],

    init() {
        this.bindEvents();
    },

    bindEvents() {
        // Create question button
        document.getElementById('createQuizBtn')?.addEventListener('click', () => {
            this.openModal();
        });

        // Save question
        document.getElementById('saveQuestionBtn')?.addEventListener('click', () => {
            this.saveQuestion();
        });

        // Modal close
        document.querySelectorAll('[data-close="quizModal"]').forEach(btn => {
            btn.addEventListener('click', () => this.closeModal());
        });

        // Question type change
        document.getElementById('questionType')?.addEventListener('change', (e) => {
            const isMultiple = e.target.value === 'multiple';
            document.getElementById('multipleChoiceOptions').classList.toggle('hidden', !isMultiple);
            document.getElementById('writtenAnswerOption').classList.toggle('hidden', isMultiple);
        });

        // Mode cards
        document.querySelectorAll('.mode-card').forEach(card => {
            card.addEventListener('click', () => {
                const mode = card.dataset.mode;
                this.startQuiz(mode);
            });
        });

        // Quiz actions
        document.getElementById('skipQuestion')?.addEventListener('click', () => {
            this.skipQuestion();
        });

        document.getElementById('submitAnswer')?.addEventListener('click', () => {
            this.submitAnswer();
        });

        document.getElementById('retryQuiz')?.addEventListener('click', () => {
            this.resetQuiz();
        });
    },

    startQuiz(mode) {
        const activeSubject = DataManager.getSettings().activeSubject || 'all';

        if (mode === 'review') {
            this.currentQuestions = DataManager.getWrongAnswers(activeSubject);
        } else {
            this.currentQuestions = DataManager.getQuestions(activeSubject);
        }

        if (this.currentQuestions.length === 0) {
            App.showToast('Bu mod için yeterli soru yok!', 'error');
            return;
        }

        // Shuffle questions
        this.shuffleArray(this.currentQuestions);

        // Limit to 10 for test mode
        if (mode === 'test') {
            this.currentQuestions = this.currentQuestions.slice(0, 10);
            this.isTestMode = true;
        } else {
            this.isTestMode = false;
        }

        this.currentIndex = 0;
        this.correctCount = 0;
        this.wrongCount = 0;
        this.wrongAnswers = [];
        this.selectedAnswer = null;

        // Show quiz area
        document.getElementById('quizModes').classList.add('hidden');
        document.getElementById('quizArea').classList.remove('hidden');
        document.getElementById('quizResults').classList.add('hidden');

        this.renderQuestion();
    },

    renderQuestion() {
        if (this.currentIndex >= this.currentQuestions.length) {
            this.showResults();
            return;
        }

        const question = this.currentQuestions[this.currentIndex];
        const subject = getSubject(question.subject);

        // Update progress
        const progress = ((this.currentIndex) / this.currentQuestions.length) * 100;
        document.getElementById('quizProgress').style.width = `${progress}%`;
        document.getElementById('quizProgressText').textContent =
            `${this.currentIndex + 1}/${this.currentQuestions.length}`;

        // Render question
        document.getElementById('quizQuestion').innerHTML = `
            <div style="margin-bottom: 0.5rem;">
                <span style="font-size: 0.75rem; color: ${subject?.color || '#6c5ce7'}; text-transform: uppercase;">
                    ${subject?.name || question.subject}
                </span>
            </div>
            <h3>${question.question}</h3>
        `;

        // Render options
        const optionsContainer = document.getElementById('quizOptions');

        if (question.type === 'multiple') {
            const letters = ['A', 'B', 'C', 'D'];
            optionsContainer.innerHTML = question.options.map((option, index) => `
                <div class="quiz-option" data-index="${index}">
                    <span class="quiz-option-letter">${letters[index]}</span>
                    <span>${option}</span>
                </div>
            `).join('');

            // Bind click events
            optionsContainer.querySelectorAll('.quiz-option').forEach(opt => {
                opt.addEventListener('click', () => {
                    optionsContainer.querySelectorAll('.quiz-option').forEach(o => o.classList.remove('selected'));
                    opt.classList.add('selected');
                    this.selectedAnswer = parseInt(opt.dataset.index);
                });
            });
        } else {
            optionsContainer.innerHTML = `
                <input type="text" class="written-answer" placeholder="Cevabınızı yazın..." 
                       style="width: 100%; padding: 1rem; background: var(--bg-card); border: 2px solid rgba(255,255,255,0.1); border-radius: 8px; color: var(--text-primary); font-size: 1rem;">
            `;

            optionsContainer.querySelector('.written-answer').addEventListener('input', (e) => {
                this.selectedAnswer = e.target.value.trim();
            });
        }

        this.selectedAnswer = null;
    },

    submitAnswer() {
        if (this.selectedAnswer === null || this.selectedAnswer === '') {
            App.showToast('Lütfen bir cevap seçin!', 'warning');
            return;
        }

        const question = this.currentQuestions[this.currentIndex];
        let isCorrect = false;

        if (question.type === 'multiple') {
            isCorrect = this.selectedAnswer === question.correctAnswer;
        } else {
            isCorrect = this.selectedAnswer.toLowerCase() === question.correctAnswer.toLowerCase();
        }

        // Update question stats
        DataManager.updateQuestionStats(question.id, isCorrect);

        // Show feedback
        const optionsContainer = document.getElementById('quizOptions');

        if (question.type === 'multiple') {
            const options = optionsContainer.querySelectorAll('.quiz-option');
            options.forEach((opt, index) => {
                if (index === question.correctAnswer) {
                    opt.classList.add('correct');
                } else if (index === this.selectedAnswer && !isCorrect) {
                    opt.classList.add('wrong');
                }
            });
        }

        if (isCorrect) {
            this.correctCount++;
            App.showToast('Doğru! ✓', 'success');
        } else {
            this.wrongCount++;
            this.wrongAnswers.push(question);
            App.showToast('Yanlış! ✗', 'error');
        }

        // Next question after delay
        setTimeout(() => {
            this.currentIndex++;
            this.renderQuestion();
        }, 1500);
    },

    skipQuestion() {
        this.wrongCount++;
        this.wrongAnswers.push(this.currentQuestions[this.currentIndex]);
        this.currentIndex++;
        this.renderQuestion();
    },

    showResults() {
        const total = this.correctCount + this.wrongCount;
        const percentage = total > 0 ? Math.round((this.correctCount / total) * 100) : 0;

        // Save score
        const activeSubject = DataManager.getSettings().activeSubject;
        if (activeSubject && activeSubject !== 'all') {
            DataManager.saveQuizScore(activeSubject, this.correctCount, total);
        }

        document.getElementById('quizArea').classList.add('hidden');
        document.getElementById('quizResults').classList.remove('hidden');

        document.getElementById('finalScore').textContent = `${percentage}%`;
        document.getElementById('correctCount').textContent = this.correctCount;
        document.getElementById('wrongCount').textContent = this.wrongCount;

        // Update dashboard stats
        App.updateDashboardStats();
    },

    resetQuiz() {
        document.getElementById('quizModes').classList.remove('hidden');
        document.getElementById('quizArea').classList.add('hidden');
        document.getElementById('quizResults').classList.add('hidden');
    },

    openModal() {
        const modal = document.getElementById('quizModal');
        const subjectSelect = document.getElementById('questionSubject');

        // Set active subject as default
        const activeSubject = DataManager.getSettings().activeSubject;
        if (activeSubject && activeSubject !== 'all') {
            subjectSelect.value = activeSubject;
        }

        // Reset form
        document.getElementById('questionText').value = '';
        document.getElementById('questionType').value = 'multiple';
        document.getElementById('multipleChoiceOptions').classList.remove('hidden');
        document.getElementById('writtenAnswerOption').classList.add('hidden');

        document.querySelectorAll('.option-item input[type="text"]').forEach(input => {
            input.value = '';
        });
        document.querySelectorAll('.option-item input[type="radio"]').forEach(radio => {
            radio.checked = false;
        });
        document.getElementById('correctAnswer').value = '';

        modal?.classList.add('active');
    },

    closeModal() {
        document.getElementById('quizModal')?.classList.remove('active');
    },

    saveQuestion() {
        const subject = document.getElementById('questionSubject').value;
        const questionText = document.getElementById('questionText').value.trim();
        const type = document.getElementById('questionType').value;

        if (!questionText) {
            App.showToast('Lütfen soru metnini girin!', 'error');
            return;
        }

        let options = [];
        let correctAnswer;

        if (type === 'multiple') {
            const optionInputs = document.querySelectorAll('.option-item input[type="text"]');
            const correctRadio = document.querySelector('.option-item input[type="radio"]:checked');

            options = Array.from(optionInputs).map(input => input.value.trim());

            if (options.some(opt => !opt)) {
                App.showToast('Lütfen tüm seçenekleri doldurun!', 'error');
                return;
            }

            if (!correctRadio) {
                App.showToast('Lütfen doğru cevabı işaretleyin!', 'error');
                return;
            }

            correctAnswer = parseInt(correctRadio.value);
        } else {
            correctAnswer = document.getElementById('correctAnswer').value.trim();
            if (!correctAnswer) {
                App.showToast('Lütfen doğru cevabı girin!', 'error');
                return;
            }
        }

        DataManager.addQuestion(subject, questionText, type, options, correctAnswer);
        App.showToast('Soru eklendi! 📚', 'success');
        this.closeModal();
    },

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    },

    // Quick quiz from dashboard
    quickQuiz() {
        App.showView('quiz');
        setTimeout(() => this.startQuiz('practice'), 300);
    }
};
