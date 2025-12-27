/**
 * StudyHub - Planner Module
 * Handles study session scheduling
 */

const PlannerModule = {
    currentWeekStart: null,

    init() {
        this.currentWeekStart = this.getWeekStart(new Date());
        this.bindEvents();
        this.renderCalendar();
    },

    bindEvents() {
        document.getElementById('addEventBtn')?.addEventListener('click', () => {
            this.openModal();
        });

        document.getElementById('prevWeek')?.addEventListener('click', () => {
            this.currentWeekStart = new Date(this.currentWeekStart.getTime() - 7 * 24 * 60 * 60 * 1000);
            this.renderCalendar();
        });

        document.getElementById('nextWeek')?.addEventListener('click', () => {
            this.currentWeekStart = new Date(this.currentWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
            this.renderCalendar();
        });

        document.getElementById('saveEventBtn')?.addEventListener('click', () => {
            this.saveEvent();
        });

        document.querySelectorAll('[data-close="eventModal"]').forEach(btn => {
            btn.addEventListener('click', () => this.closeModal());
        });
    },

    getWeekStart(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    },

    renderCalendar() {
        const container = document.getElementById('calendarGrid');
        if (!container) return;

        const today = new Date().toDateString();
        const events = DataManager.getEvents();
        const days = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

        // Update week label
        const weekEnd = new Date(this.currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
        const formatDate = (d) => `${d.getDate()} ${['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'][d.getMonth()]}`;
        document.getElementById('currentWeekLabel').textContent =
            `${formatDate(this.currentWeekStart)} - ${formatDate(weekEnd)}`;

        let html = '';

        // Day headers
        days.forEach(day => {
            html += `<div class="calendar-day-header">${day}</div>`;
        });

        // Day cells
        for (let i = 0; i < 7; i++) {
            const date = new Date(this.currentWeekStart.getTime() + i * 24 * 60 * 60 * 1000);
            const dateStr = date.toDateString();
            const isToday = dateStr === today;
            const dateNum = date.getDate();

            // Get events for this day
            const dayEvents = events.filter(e => new Date(e.date).toDateString() === dateStr);

            html += `
                <div class="calendar-day ${isToday ? 'today' : ''}" data-date="${date.toISOString().split('T')[0]}">
                    <div class="calendar-day-number">${dateNum}</div>
                    ${dayEvents.map(event => {
                const subject = getSubject(event.subject);
                return `
                            <div class="calendar-event" 
                                 style="--event-color: ${subject?.color || '#6c5ce7'}"
                                 data-event-id="${event.id}">
                                ${event.time ? event.time + ' ' : ''}${event.title}
                            </div>
                        `;
            }).join('')}
                </div>
            `;
        }

        container.innerHTML = html;

        // Bind event click handlers
        container.querySelectorAll('.calendar-event').forEach(eventEl => {
            eventEl.addEventListener('click', (e) => {
                e.stopPropagation();
                const eventId = eventEl.dataset.eventId;
                this.showEventDetails(eventId);
            });
        });

        // Bind day click for adding events
        container.querySelectorAll('.calendar-day').forEach(dayEl => {
            dayEl.addEventListener('click', () => {
                const date = dayEl.dataset.date;
                this.openModal(date);
            });
        });
    },

    openModal(date = null) {
        const modal = document.getElementById('eventModal');
        const dateInput = document.getElementById('eventDate');
        const timeInput = document.getElementById('eventTime');

        // Set date
        if (date) {
            dateInput.value = date;
        } else {
            dateInput.value = new Date().toISOString().split('T')[0];
        }

        // Set current time
        const now = new Date();
        timeInput.value = `${now.getHours().toString().padStart(2, '0')}:00`;

        // Reset other fields
        document.getElementById('eventTitle').value = '';
        document.getElementById('eventSubject').value = '';
        document.getElementById('eventDuration').value = 60;

        modal?.classList.add('active');
    },

    closeModal() {
        document.getElementById('eventModal')?.classList.remove('active');
    },

    saveEvent() {
        const title = document.getElementById('eventTitle').value.trim();
        const subject = document.getElementById('eventSubject').value;
        const date = document.getElementById('eventDate').value;
        const time = document.getElementById('eventTime').value;
        const duration = parseInt(document.getElementById('eventDuration').value);

        if (!title) {
            App.showToast('Lütfen bir başlık girin!', 'error');
            return;
        }

        if (!date) {
            App.showToast('Lütfen tarih seçin!', 'error');
            return;
        }

        DataManager.addEvent(title, subject, date, time, duration);
        App.showToast('Etkinlik eklendi! 📅', 'success');

        this.closeModal();
        this.renderCalendar();
    },

    showEventDetails(eventId) {
        const events = DataManager.getEvents();
        const event = events.find(e => e.id === eventId);

        if (!event) return;

        const subject = getSubject(event.subject);
        const date = new Date(event.date).toLocaleDateString('tr-TR');

        const message = `
            ${event.title}
            ${subject ? `Ders: ${subject.name}` : ''}
            Tarih: ${date} ${event.time || ''}
            Süre: ${event.duration} dakika
        `;

        if (confirm(message + '\n\nBu etkinliği silmek ister misiniz?')) {
            DataManager.deleteEvent(eventId);
            App.showToast('Etkinlik silindi', 'info');
            this.renderCalendar();
        }
    },

    refresh() {
        this.renderCalendar();
    }
};
