/**
 * StudyHub - Flashcards Module
 * Handles flashcard creation, review, and spaced repetition
 */

const FlashcardsModule = {
    currentCards: [],
    currentIndex: 0,
    isFlipped: false,
    isReviewMode: false,

    init() {
        this.bindEvents();
        this.renderDeckTabs();
        this.loadCards();
    },

    bindEvents() {
        // Create card button
        document.getElementById('createCardBtn')?.addEventListener('click', () => {
            this.openModal();
        });

        // Save card button
        document.getElementById('saveCardBtn')?.addEventListener('click', () => {
            this.saveCard();
        });

        // Navigation
        document.getElementById('prevCard')?.addEventListener('click', () => {
            this.prevCard();
        });

        document.getElementById('nextCard')?.addEventListener('click', () => {
            this.nextCard();
        });

        // Rating buttons
        document.querySelectorAll('.rating-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const rating = parseInt(e.target.dataset.rating);
                this.rateCard(rating);
            });
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (document.getElementById('view-flashcards')?.classList.contains('active')) {
                if (e.code === 'Space') {
                    e.preventDefault();
                    this.flipCard();
                } else if (e.code === 'ArrowLeft') {
                    this.prevCard();
                } else if (e.code === 'ArrowRight') {
                    this.nextCard();
                } else if (e.key >= '1' && e.key <= '4' && this.isFlipped) {
                    this.rateCard(parseInt(e.key));
                }
            }
        });

        // Modal close
        document.querySelectorAll('[data-close="flashcardModal"]').forEach(btn => {
            btn.addEventListener('click', () => this.closeModal());
        });
    },

    renderDeckTabs() {
        const container = document.getElementById('deckTabs');
        if (!container) return;

        const subjects = getAllSubjects();
        const activeSubject = DataManager.getSettings().activeSubject || 'all';

        container.innerHTML = `
            <button class="deck-tab ${activeSubject === 'all' ? 'active' : ''}" data-subject="all">
                Tümü
            </button>
            ${subjects.map(s => `
                <button class="deck-tab ${activeSubject === s.id ? 'active' : ''}" 
                        data-subject="${s.id}"
                        style="border-left: 3px solid ${s.color}">
                    ${s.name}
                </button>
            `).join('')}
        `;

        container.querySelectorAll('.deck-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                container.querySelectorAll('.deck-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const subject = tab.dataset.subject;
                DataManager.updateSettings({ activeSubject: subject });
                this.loadCards(subject);
            });
        });
    },

    loadCards(subject = null) {
        const activeSubject = subject || DataManager.getSettings().activeSubject || 'all';
        this.currentCards = DataManager.getFlashcards(activeSubject);
        this.currentIndex = 0;
        this.isFlipped = false;
        this.isReviewMode = false;
        this.renderCurrentCard();
    },

    loadReviewCards(subject = null) {
        const activeSubject = subject || DataManager.getSettings().activeSubject || 'all';
        this.currentCards = DataManager.getCardsForReview(activeSubject);
        this.currentIndex = 0;
        this.isFlipped = false;
        this.isReviewMode = true;

        if (this.currentCards.length === 0) {
            App.showToast('Şu an gözden geçirilecek kart yok!', 'info');
        }

        this.renderCurrentCard();
    },

    renderCurrentCard() {
        const container = document.getElementById('flashcardContainer');
        const controls = document.getElementById('flashcardControls');
        const ratingButtons = document.getElementById('ratingButtons');

        if (!container) return;

        if (this.currentCards.length === 0) {
            container.innerHTML = `
                <div class="flashcard-empty">
                    <i class="fas fa-inbox"></i>
                    <p>Henüz kart yok. Yeni bir kart oluştur!</p>
                </div>
            `;
            controls?.classList.add('hidden');
            ratingButtons?.classList.add('hidden');
            return;
        }

        const card = this.currentCards[this.currentIndex];
        const subject = getSubject(card.subject);

        container.innerHTML = `
            <div class="flashcard ${this.isFlipped ? 'flipped' : ''}" id="currentFlashcard">
                <div class="flashcard-face front">
                    <span class="label" style="color: ${subject?.color || '#6c5ce7'}">${subject?.name || card.subject}</span>
                    <div class="content">${card.front}</div>
                    <span class="hint">Çevirmek için tıkla veya Space tuşuna bas</span>
                </div>
                <div class="flashcard-face back">
                    <span class="label">Cevap</span>
                    <div class="content">${card.back}</div>
                    <span class="hint">Bir sonraki kart için → tuşuna bas</span>
                </div>
            </div>
        `;

        // Update counter
        document.getElementById('currentCardNum').textContent = this.currentIndex + 1;
        document.getElementById('totalCards').textContent = this.currentCards.length;

        // Show controls
        controls?.classList.remove('hidden');

        // Show/hide rating buttons
        if (this.isFlipped && this.isReviewMode) {
            ratingButtons?.classList.remove('hidden');
        } else {
            ratingButtons?.classList.add('hidden');
        }

        // Bind flip
        document.getElementById('currentFlashcard')?.addEventListener('click', () => {
            this.flipCard();
        });
    },

    flipCard() {
        if (this.currentCards.length === 0) return;

        this.isFlipped = !this.isFlipped;
        const flashcard = document.getElementById('currentFlashcard');

        if (flashcard) {
            flashcard.classList.toggle('flipped', this.isFlipped);
        }

        // Show rating buttons in review mode
        if (this.isFlipped && this.isReviewMode) {
            document.getElementById('ratingButtons')?.classList.remove('hidden');
        } else {
            document.getElementById('ratingButtons')?.classList.add('hidden');
        }
    },

    prevCard() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.isFlipped = false;
            this.renderCurrentCard();
        }
    },

    nextCard() {
        if (this.currentIndex < this.currentCards.length - 1) {
            this.currentIndex++;
            this.isFlipped = false;
            this.renderCurrentCard();
        } else if (this.isReviewMode) {
            App.showToast('Tebrikler! Tüm kartları gözden geçirdin! 🎉', 'success');
            this.loadCards();
        }
    },

    rateCard(quality) {
        if (this.currentCards.length === 0) return;

        const card = this.currentCards[this.currentIndex];
        DataManager.updateCardReview(card.id, quality);

        // Show feedback
        const messages = {
            1: 'Tekrar edeceksin 💪',
            2: 'Biraz daha pratik lazım 📚',
            3: 'İyi gidiyorsun! 👍',
            4: 'Mükemmel! 🌟'
        };
        App.showToast(messages[quality], quality >= 3 ? 'success' : 'info');

        this.nextCard();
    },

    openModal(card = null) {
        const modal = document.getElementById('flashcardModal');
        const subjectSelect = document.getElementById('cardSubject');
        const frontInput = document.getElementById('cardFront');
        const backInput = document.getElementById('cardBack');

        if (!modal) return;

        // Set active subject as default
        const activeSubject = DataManager.getSettings().activeSubject;
        if (activeSubject && activeSubject !== 'all') {
            subjectSelect.value = activeSubject;
        }

        // Clear inputs
        frontInput.value = card?.front || '';
        backInput.value = card?.back || '';

        modal.classList.add('active');
    },

    closeModal() {
        const modal = document.getElementById('flashcardModal');
        modal?.classList.remove('active');

        // Clear inputs
        document.getElementById('cardFront').value = '';
        document.getElementById('cardBack').value = '';
    },

    saveCard() {
        const subject = document.getElementById('cardSubject').value;
        const front = document.getElementById('cardFront').value.trim();
        const back = document.getElementById('cardBack').value.trim();

        if (!front || !back) {
            App.showToast('Lütfen ön ve arka yüzü doldurun!', 'error');
            return;
        }

        DataManager.addFlashcard(subject, front, back);
        App.showToast('Kart başarıyla oluşturuldu! ✨', 'success');
        this.closeModal();

        // Reload if viewing same subject
        const activeSubject = DataManager.getSettings().activeSubject;
        if (activeSubject === 'all' || activeSubject === subject) {
            this.loadCards(activeSubject);
        }

        // Update dashboard
        renderSubjectCards('subjectsGrid');
    },

    deleteCurrentCard() {
        if (this.currentCards.length === 0) return;

        if (confirm('Bu kartı silmek istediğinize emin misiniz?')) {
            const card = this.currentCards[this.currentIndex];
            DataManager.deleteFlashcard(card.id);
            App.showToast('Kart silindi', 'info');

            const activeSubject = DataManager.getSettings().activeSubject;
            this.loadCards(activeSubject);
            renderSubjectCards('subjectsGrid');
        }
    }
};
