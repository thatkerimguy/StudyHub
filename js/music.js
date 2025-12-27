/**
 * StudyHub - Music Player Module
 * Ambient music for focus with YouTube streams
 */

const MusicModule = {
    isPlaying: false,
    currentStream: 'lofi',
    player: null,

    // YouTube video IDs for different study music streams
    streams: {
        lofi: {
            name: 'Lo-Fi Beats',
            videoId: 'jfKfPfyJRdk', // Lofi Girl
            fallback: '5qap5aO4i9A'
        },
        piano: {
            name: 'Piyano',
            videoId: 'HSOtku1j600', // Piano Study Music
            fallback: 'VGNTiaJhFRo'
        },
        nature: {
            name: 'Doğa Sesleri',
            videoId: 'eKFTSSKCzWA', // Rain sounds
            fallback: 'q76bMs-NwRk'
        },
        ambient: {
            name: 'Ambient',
            videoId: 'S_MOd40zlYU', // Ambient study
            fallback: 'hHW1oY26kxQ'
        }
    },

    init() {
        this.bindEvents();
        this.loadYouTubeAPI();
    },

    bindEvents() {
        document.getElementById('musicToggle')?.addEventListener('click', () => {
            this.togglePanel();
        });

        document.getElementById('musicPlayPause')?.addEventListener('click', () => {
            this.toggle();
        });

        document.getElementById('musicVolume')?.addEventListener('input', (e) => {
            this.setVolume(e.target.value);
        });

        // Stream selection
        document.querySelectorAll('.music-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.music-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.changeStream(btn.dataset.stream);
            });
        });
    },

    loadYouTubeAPI() {
        // Load YouTube IFrame API
        if (!window.YT) {
            const tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        }
    },

    togglePanel() {
        const panel = document.getElementById('musicPanel');
        panel?.classList.toggle('hidden');
    },

    toggle() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    },

    play() {
        const container = document.getElementById('youtubeEmbed');
        const toggleBtn = document.getElementById('musicToggle');
        const playPauseBtn = document.getElementById('musicPlayPause');

        if (!container) return;

        container.classList.remove('hidden');

        const stream = this.streams[this.currentStream];
        const volume = document.getElementById('musicVolume').value;

        // Create iframe
        container.innerHTML = `
            <iframe 
                id="ytPlayer"
                width="100%" 
                height="0"
                src="https://www.youtube.com/embed/${stream.videoId}?autoplay=1&loop=1&enablejsapi=1"
                frameborder="0"
                allow="autoplay; encrypted-media"
                style="position: absolute; visibility: hidden;">
            </iframe>
        `;

        this.isPlaying = true;
        toggleBtn?.classList.add('playing');
        playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';

        App.showToast(`🎵 ${stream.name} başlatıldı`, 'info');
    },

    pause() {
        const container = document.getElementById('youtubeEmbed');
        const toggleBtn = document.getElementById('musicToggle');
        const playPauseBtn = document.getElementById('musicPlayPause');

        container.innerHTML = '';
        container?.classList.add('hidden');

        this.isPlaying = false;
        toggleBtn?.classList.remove('playing');
        playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    },

    changeStream(streamId) {
        if (this.streams[streamId]) {
            this.currentStream = streamId;
            if (this.isPlaying) {
                this.pause();
                setTimeout(() => this.play(), 300);
            }
        }
    },

    setVolume(value) {
        // Note: YouTube iframe API volume control is limited
        // This is a visual feedback only - actual volume comes from YouTube
        const volumePercentage = Math.round(value);
        // Volume control would require YouTube API player
    }
};
