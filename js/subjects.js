/**
 * StudyHub - Subject Configuration
 * Defines all subjects with their colors and icons
 */

const Subjects = {
    almanca: {
        id: 'almanca',
        name: 'Almanca',
        color: '#e17055',
        icon: 'fas fa-language',
        description: 'Almanca dil dersi'
    },
    biyoloji: {
        id: 'biyoloji',
        name: 'Biyoloji',
        color: '#00b894',
        icon: 'fas fa-dna',
        description: 'Biyoloji ve yaşam bilimleri'
    },
    turkce: {
        id: 'turkce',
        name: 'Türk Dili ve Edebiyatı',
        color: '#d63031',
        icon: 'fas fa-book-open',
        description: 'Türk dili ve edebiyatı dersi'
    },
    matematik: {
        id: 'matematik',
        name: 'Matematik',
        color: '#0984e3',
        icon: 'fas fa-calculator',
        description: 'Matematik ve problem çözme'
    },
    din: {
        id: 'din',
        name: 'Din Kültürü',
        color: '#6c5ce7',
        icon: 'fas fa-mosque',
        description: 'Din kültürü ve ahlak bilgisi'
    },
    ingilizce: {
        id: 'ingilizce',
        name: 'İngilizce',
        color: '#00cec9',
        icon: 'fas fa-globe-americas',
        description: 'İngilizce dil dersi'
    },
    kimya: {
        id: 'kimya',
        name: 'Kimya',
        color: '#fdcb6e',
        icon: 'fas fa-flask',
        description: 'Kimya ve element bilimi'
    },
    fizik: {
        id: 'fizik',
        name: 'Fizik',
        color: '#e84393',
        icon: 'fas fa-atom',
        description: 'Fizik ve hareket bilimleri'
    }
};

// Get subject info
function getSubject(id) {
    return Subjects[id] || null;
}

// Get all subjects as array
function getAllSubjects() {
    return Object.values(Subjects);
}

// Get subject color
function getSubjectColor(id) {
    const subject = Subjects[id];
    return subject ? subject.color : '#6c5ce7';
}

// Get subject name
function getSubjectName(id) {
    const subject = Subjects[id];
    return subject ? subject.name : id;
}

// Render subject cards for dashboard
function renderSubjectCards(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const flashcards = DataManager.getData('FLASHCARDS');
    const notes = DataManager.getData('NOTES');

    container.innerHTML = Object.values(Subjects).map(subject => {
        const cardCount = (flashcards[subject.id] || []).length;
        const noteCount = (notes[subject.id] || []).length;

        return `
            <div class="subject-card" 
                 data-subject="${subject.id}" 
                 style="--subject-color: ${subject.color}">
                <div class="icon"><i class="${subject.icon}"></i></div>
                <div class="name">${subject.name}</div>
                <div class="count">${cardCount} kart • ${noteCount} not</div>
            </div>
        `;
    }).join('');

    // Add click handlers
    container.querySelectorAll('.subject-card').forEach(card => {
        card.addEventListener('click', () => {
            const subjectId = card.dataset.subject;
            document.getElementById('activeSubject').value = subjectId;
            App.setActiveSubject(subjectId);
            App.showView('flashcards');
        });
    });
}
