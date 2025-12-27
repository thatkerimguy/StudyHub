/**
 * StudyHub - Notes Module
 * Handles note creation and rich text editing
 */

const NotesModule = {
    currentNoteId: null,
    autoSaveTimeout: null,

    init() {
        this.bindEvents();
        this.loadNotesList();
    },

    bindEvents() {
        // Create note button
        document.getElementById('createNoteBtn')?.addEventListener('click', () => {
            this.openModal();
        });

        // Create note submit
        document.getElementById('createNoteSubmit')?.addEventListener('click', () => {
            this.createNote();
        });

        // Modal close
        document.querySelectorAll('[data-close="noteModal"]').forEach(btn => {
            btn.addEventListener('click', () => this.closeModal());
        });

        // Search
        document.getElementById('notesSearch')?.addEventListener('input', (e) => {
            this.filterNotes(e.target.value);
        });

        // Toolbar buttons
        document.querySelectorAll('.toolbar-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const command = btn.dataset.command;
                const value = btn.dataset.value || null;
                document.execCommand(command, false, value);
                btn.classList.toggle('active');
            });
        });

        // Note content auto-save
        document.getElementById('noteContent')?.addEventListener('input', () => {
            this.scheduleAutoSave();
        });

        document.getElementById('noteTitle')?.addEventListener('input', () => {
            this.scheduleAutoSave();
        });
    },

    loadNotesList(subject = null) {
        const container = document.getElementById('notesList');
        if (!container) return;

        const activeSubject = subject || DataManager.getSettings().activeSubject || 'all';
        const notes = DataManager.getNotes(activeSubject);

        if (notes.length === 0) {
            container.innerHTML = `
                <div class="notes-empty" style="text-align: center; padding: 2rem; color: var(--text-muted);">
                    <i class="fas fa-sticky-note" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                    <p>Henüz not yok</p>
                </div>
            `;
            return;
        }

        // Sort by updated date
        notes.sort((a, b) => b.updated - a.updated);

        container.innerHTML = notes.map(note => {
            const subject = getSubject(note.subject);
            const date = new Date(note.updated).toLocaleDateString('tr-TR');

            return `
                <div class="note-item ${note.id === this.currentNoteId ? 'active' : ''}" 
                     data-note-id="${note.id}">
                    <div class="note-item-title">${note.title || 'Başlıksız Not'}</div>
                    <div class="note-item-meta">
                        <span style="color: ${subject?.color || '#6c5ce7'}">${subject?.name || note.subject}</span>
                        <span>${date}</span>
                    </div>
                </div>
            `;
        }).join('');

        // Bind click events
        container.querySelectorAll('.note-item').forEach(item => {
            item.addEventListener('click', () => {
                const noteId = item.dataset.noteId;
                this.loadNote(noteId);
            });
        });

        // Load first note if none selected
        if (!this.currentNoteId && notes.length > 0) {
            this.loadNote(notes[0].id);
        }
    },

    loadNote(noteId) {
        const notes = DataManager.getNotes();
        const note = notes.find(n => n.id === noteId);

        if (!note) return;

        this.currentNoteId = noteId;

        document.getElementById('noteTitle').value = note.title || '';
        document.getElementById('noteContent').innerHTML = note.content || '';
        document.getElementById('saveStatus').textContent = 'Kaydedildi';

        // Update active state in list
        document.querySelectorAll('.note-item').forEach(item => {
            item.classList.toggle('active', item.dataset.noteId === noteId);
        });
    },

    scheduleAutoSave() {
        document.getElementById('saveStatus').textContent = 'Kaydediliyor...';

        if (this.autoSaveTimeout) {
            clearTimeout(this.autoSaveTimeout);
        }

        this.autoSaveTimeout = setTimeout(() => {
            this.saveCurrentNote();
        }, 1000);
    },

    saveCurrentNote() {
        if (!this.currentNoteId) return;

        const title = document.getElementById('noteTitle').value;
        const content = document.getElementById('noteContent').innerHTML;

        DataManager.updateNote(this.currentNoteId, { title, content });
        document.getElementById('saveStatus').textContent = 'Kaydedildi';

        // Update list
        this.loadNotesList();
    },

    openModal() {
        const modal = document.getElementById('noteModal');
        const subjectSelect = document.getElementById('noteSubject');

        // Set active subject as default
        const activeSubject = DataManager.getSettings().activeSubject;
        if (activeSubject && activeSubject !== 'all') {
            subjectSelect.value = activeSubject;
        }

        document.getElementById('newNoteTitle').value = '';
        modal?.classList.add('active');
    },

    closeModal() {
        document.getElementById('noteModal')?.classList.remove('active');
    },

    createNote() {
        const subject = document.getElementById('noteSubject').value;
        const title = document.getElementById('newNoteTitle').value.trim() || 'Yeni Not';

        const note = DataManager.addNote(subject, title);
        App.showToast('Not oluşturuldu! 📝', 'success');

        this.closeModal();
        this.loadNotesList();
        this.loadNote(note.id);

        // Update dashboard
        renderSubjectCards('subjectsGrid');
    },

    deleteCurrentNote() {
        if (!this.currentNoteId) return;

        if (confirm('Bu notu silmek istediğinize emin misiniz?')) {
            DataManager.deleteNote(this.currentNoteId);
            this.currentNoteId = null;

            document.getElementById('noteTitle').value = '';
            document.getElementById('noteContent').innerHTML = '';

            App.showToast('Not silindi', 'info');
            this.loadNotesList();
            renderSubjectCards('subjectsGrid');
        }
    },

    filterNotes(query) {
        const notes = DataManager.getNotes();
        const filtered = notes.filter(note =>
            note.title.toLowerCase().includes(query.toLowerCase()) ||
            note.content.toLowerCase().includes(query.toLowerCase())
        );

        const container = document.getElementById('notesList');
        if (filtered.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
                    <p>Sonuç bulunamadı</p>
                </div>
            `;
            return;
        }

        container.innerHTML = filtered.map(note => {
            const subject = getSubject(note.subject);
            const date = new Date(note.updated).toLocaleDateString('tr-TR');

            return `
                <div class="note-item ${note.id === this.currentNoteId ? 'active' : ''}" 
                     data-note-id="${note.id}">
                    <div class="note-item-title">${note.title || 'Başlıksız Not'}</div>
                    <div class="note-item-meta">
                        <span style="color: ${subject?.color || '#6c5ce7'}">${subject?.name || note.subject}</span>
                        <span>${date}</span>
                    </div>
                </div>
            `;
        }).join('');

        container.querySelectorAll('.note-item').forEach(item => {
            item.addEventListener('click', () => {
                this.loadNote(item.dataset.noteId);
            });
        });
    }
};
