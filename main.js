import './style.css';
import { DUMMY_PODCASTS } from './data.js';

// ---- Application State ----
let currentUser = localStorage.getItem('chillcast_user') || null;
let userLibrary = JSON.parse(localStorage.getItem('chillcast_library')) || [];
let playingPodcast = null;
let isPlaying = false;

// ---- DOM Elements ----
const appEl = document.getElementById('app');
const homeNav = document.getElementById('nav-home');
const libraryNav = document.getElementById('nav-library');
const trendingNav = document.getElementById('nav-trending');

const viewHome = document.getElementById('view-home');
const viewLibrary = document.getElementById('view-library');
const homeGrid = document.getElementById('home-grid');
const libraryGrid = document.getElementById('library-grid');

const userControls = document.getElementById('user-controls');

const authOverlay = document.getElementById('auth-modal-overlay');
const addOverlay = document.getElementById('add-modal-overlay');
const authCloseBtn = document.getElementById('auth-close-btn');
const authSubmitBtn = document.getElementById('auth-submit-btn');

// Player Elements
const audio = document.getElementById('audio-player');
const playerBar = document.getElementById('player-bar');
const playBtn = document.getElementById('btn-play-pause');
const playIcon = document.getElementById('play-pause-icon');
const playerCover = document.getElementById('player-cover');
const playerTitle = document.getElementById('player-title');
const playerAuthor = document.getElementById('player-author');
const progressFill = document.getElementById('progress-fill');
const progressContainer = document.getElementById('progress-bar-container');
const timeCurrent = document.getElementById('time-current');
const timeTotal = document.getElementById('time-total');
const btnSavePlaying = document.getElementById('btn-save-playing');
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');

// ---- Initialization ----

function init() {
    renderPodcasts(DUMMY_PODCASTS, homeGrid);
    updateAuthUI();
    setupEventListeners();
}

function updateAuthUI() {
    if (currentUser) {
        userControls.innerHTML = `
      <span>Welcome, ${currentUser}</span>
      <button class="btn btn-add" id="btn-open-add"><i class="ri-add-line"></i> Add Podcast</button>
      <button class="btn" id="btn-logout">Logout</button>
    `;
        libraryNav.classList.remove('hidden');
        renderLibrary();

        document.getElementById('btn-logout').addEventListener('click', () => {
            currentUser = null;
            localStorage.removeItem('chillcast_user');
            switchView('home');
            updateAuthUI();
        });
        document.getElementById('btn-open-add').addEventListener('click', () => {
            addOverlay.classList.add('active');
        });

    } else {
        userControls.innerHTML = `
      <button class="btn btn-primary" id="btn-open-login">Log In / Sign Up</button>
    `;
        libraryNav.classList.add('hidden');

        document.getElementById('btn-open-login').addEventListener('click', () => {
            authOverlay.classList.add('active');
        });
    }
}

// ---- Render Helpers ----
function createPodcastCard(podcast) {
    const isSaved = userLibrary.some(p => p.id === podcast.id);
    const div = document.createElement('div');
    div.className = 'podcast-card fade-in';
    div.innerHTML = `
    <img src="${podcast.cover}" alt="${podcast.title}" class="podcast-cover" />
    <div class="podcast-title">${podcast.title}</div>
    <div class="podcast-author">${podcast.author}</div>
    <div class="play-hover">
      <i class="ri-play-fill"></i>
    </div>
  `;
    div.addEventListener('click', () => playPodcast(podcast));
    return div;
}

function renderPodcasts(podcasts, container) {
    container.innerHTML = '';
    if (podcasts.length === 0) {
        container.innerHTML = '<p style="color:var(--text-secondary)">No podcasts here yet. Add some chill vibes!</p>';
        return;
    }
    podcasts.forEach(p => {
        container.appendChild(createPodcastCard(p));
    });
}

function renderLibrary() {
    renderPodcasts(userLibrary, libraryGrid);
}

// ---- Views ----
function switchView(view) {
    [viewHome, viewLibrary].forEach(v => v.classList.add('hidden'));
    [homeNav, libraryNav, trendingNav].forEach(n => n.classList.remove('active'));

    if (view === 'home' || view === 'trending') {
        viewHome.classList.remove('hidden');
        (view === 'home' ? homeNav : trendingNav).classList.add('active');
    } else if (view === 'library') {
        viewLibrary.classList.remove('hidden');
        libraryNav.classList.add('active');
        renderLibrary();
    }
}

// ---- Player Logic ----
function playPodcast(podcast) {
    playingPodcast = podcast;
    audio.src = podcast.audio;
    audio.play();
    isPlaying = true;

    // Update UI
    playerBar.classList.add('active');
    playerCover.src = podcast.cover;
    playerTitle.textContent = podcast.title;
    playerAuthor.textContent = podcast.author;
    playIcon.className = 'ri-pause-fill';

    updateSaveButtonState();
}

function togglePlay() {
    if (!playingPodcast) return;
    if (isPlaying) {
        audio.pause();
        playIcon.className = 'ri-play-fill';
    } else {
        audio.play();
        playIcon.className = 'ri-pause-fill';
    }
    isPlaying = !isPlaying;
}

function updateSaveButtonState() {
    if (!playingPodcast) return;
    const exists = userLibrary.find(p => p.id === playingPodcast.id);
    if (exists) {
        btnSavePlaying.classList.add('saved');
        btnSavePlaying.innerHTML = '<i class="ri-heart-fill"></i>';
    } else {
        btnSavePlaying.classList.remove('saved');
        btnSavePlaying.innerHTML = '<i class="ri-heart-line"></i>';
    }
}

function toggleSavePodcast() {
    if (!playingPodcast) return;
    if (!currentUser) {
        authOverlay.classList.add('active');
        return;
    }

    const idx = userLibrary.findIndex(p => p.id === playingPodcast.id);
    if (idx > -1) {
        userLibrary.splice(idx, 1);
    } else {
        userLibrary.push(playingPodcast);
    }
    localStorage.setItem('chillcast_library', JSON.stringify(userLibrary));
    updateSaveButtonState();
    if (!viewLibrary.classList.contains('hidden')) {
        renderLibrary();
    }
}

function formatTime(sec) {
    if (isNaN(sec)) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

// ---- Event Listeners ----
function setupEventListeners() {
    // Navigation
    homeNav.addEventListener('click', () => switchView('home'));
    trendingNav.addEventListener('click', () => switchView('trending'));
    libraryNav.addEventListener('click', () => {
        if (!currentUser) return authOverlay.classList.add('active');
        switchView('library');
    });

    // Auth Overlay
    authCloseBtn.addEventListener('click', () => {
        authOverlay.classList.remove('active');
    });

    let isSignupMode = false;
    document.getElementById('toggle-auth-mode').addEventListener('click', () => {
        isSignupMode = !isSignupMode;
        document.getElementById('auth-title').textContent = isSignupMode ? 'Sign Up' : 'Log In';
        document.getElementById('auth-submit-btn').textContent = isSignupMode ? 'Create Account' : 'Login';
        document.getElementById('toggle-auth-mode').textContent = isSignupMode ? 'Log In' : 'Sign Up';
        document.querySelector('.auth-toggle').childNodes[0].nodeValue = isSignupMode ? 'Already have an account? ' : "Don't have an account? ";
    });

    document.getElementById('auth-submit-btn').addEventListener('click', (e) => {
        e.preventDefault();
        const email = document.getElementById('auth-email').value;
        const password = document.getElementById('auth-password').value;
        if (email && password) {
            currentUser = email.split('@')[0];
            localStorage.setItem('chillcast_user', currentUser);
            authOverlay.classList.remove('active');
            document.getElementById('auth-email').value = '';
            document.getElementById('auth-password').value = '';
            updateAuthUI();
        } else {
            alert('Please fill out all fields.');
        }
    });

    // Add Podcast Overlay
    document.getElementById('add-close-btn').addEventListener('click', () => {
        addOverlay.classList.remove('active');
    });

    document.getElementById('add-podcast-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('add-title').value;
        const author = document.getElementById('add-author').value;
        const cover = document.getElementById('add-cover').value;
        const audioUrl = document.getElementById('add-audio').value;

        const newPodcast = {
            id: 'custom-' + Date.now(),
            title,
            author,
            cover,
            audio: audioUrl
        };

        userLibrary.push(newPodcast);
        localStorage.setItem('chillcast_library', JSON.stringify(userLibrary));

        addOverlay.classList.remove('active');
        e.target.reset();

        if (!viewLibrary.classList.contains('hidden')) renderLibrary();
        // Play it immediately right after adding!
        playPodcast(newPodcast);
    });

    // Player Controls
    playBtn.addEventListener('click', togglePlay);
    btnSavePlaying.addEventListener('click', toggleSavePodcast);

    audio.addEventListener('timeupdate', () => {
        const ratio = audio.currentTime / audio.duration;
        progressFill.style.width = ratio * 100 + '%';
        timeCurrent.textContent = formatTime(audio.currentTime);
    });

    audio.addEventListener('loadedmetadata', () => {
        timeTotal.textContent = formatTime(audio.duration);
    });

    progressContainer.addEventListener('click', (e) => {
        if (!playingPodcast) return;
        const rect = progressContainer.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        audio.currentTime = percent * audio.duration;
    });

    // Basic Next/Prev Mock (Loops randomly through user library or dummy)
    const getRandom = (list) => list[Math.floor(Math.random() * list.length)];
    btnNext.addEventListener('click', () => {
        const list = userLibrary.length > 0 ? [...userLibrary, ...DUMMY_PODCASTS] : DUMMY_PODCASTS;
        playPodcast(getRandom(list));
    });
    btnPrev.addEventListener('click', () => {
        playPodcast(getRandom(DUMMY_PODCASTS));
    });
}

init();

