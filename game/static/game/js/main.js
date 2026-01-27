let currentPokemonId = null;
let isLoggedIn = false;
let isVoteLoading = false; // Prevent double voting

// DOM Elements
const pokemonName = document.getElementById('pokemon-name');
const pokemonImage = document.getElementById('pokemon-image');
const imageLoader = document.getElementById('image-loader');
const pokemonCard = document.querySelector('.card-inner');
const smashBtn = document.getElementById('smash-btn');
const passBtn = document.getElementById('pass-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const idInput = document.getElementById('pokemon-id-input');
const idForm = document.getElementById('id-jump-form');

// Constants
const MAX_POKEMON_ID = 151; // Or 1025 depending on seeded data
const SWIPE_THRESHOLD = 120;

// --- Auth Logic ---

async function checkLoginStatus() {
    try {
        const response = await fetch('/api/username/');
        if (response.status === 401) {
            showLoginModal();
            return false;
        }
        const data = await response.json();
        updateUserUI(data.username);
        return true;
    } catch (error) {
        console.error('Error checking login status:', error);
        showLoginModal();
        return false;
    }
}

function updateUserUI(username) {
    document.getElementById('username-display').textContent = username;
    document.getElementById('user-info').style.display = 'flex';
}

function showLoginModal() {
    const modal = document.getElementById('login-modal');
    modal.classList.add('active');
}

function hideLoginModal() {
    const modal = document.getElementById('login-modal');
    modal.classList.remove('active');
}

async function handleLogin(event) {
    event.preventDefault();
    const usernameInput = document.getElementById('username-input');
    const username = usernameInput.value.trim();
    const errorMsg = document.getElementById('login-error');

    if (!username) {
        errorMsg.textContent = 'Please enter a username';
        errorMsg.style.display = 'block';
        return;
    }

    try {
        const response = await fetch('/api/login/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username })
        });

        const data = await response.json();

        if (response.ok) {
            isLoggedIn = true;
            updateUserUI(data.username);
            hideLoginModal();
            usernameInput.value = '';
            errorMsg.style.display = 'none';
            fetchStartingId();
        } else {
            errorMsg.textContent = data.error || 'Login failed';
            errorMsg.style.display = 'block';
        }
    } catch (error) {
        console.error('Error logging in:', error);
        errorMsg.textContent = 'Login failed. Please try again.';
        errorMsg.style.display = 'block';
    }
}

async function handleLogout() {
    try {
        await fetch('/api/logout/');
        location.reload();
    } catch (error) {
        console.error('Error logging out:', error);
    }
}

// --- Navigation Logic ---

async function fetchStartingId() {
    try {
        const response = await fetch('/api/start/');
        const data = await response.json();
        if (response.ok) {
            fetchPokemon(data.id);
        }
    } catch (error) {
        console.error('Error fetching start ID:', error);
    }
}

// Caching layer for metadata
const dataCache = {};
const fetchingIds = new Set();

async function fetchPokemon(id, pushState = true) {
    id = parseInt(id);
    if (!id || id < 1) return;

    currentPokemonId = id;
    idInput.value = id;

    // Update URL
    if (pushState) {
        const url = new URL(window.location);
        url.searchParams.set('id', id);
        window.history.pushState({ id }, '', url);
    }

    // 1. Hide old image immediately to prevent "ghosting/flashing"
    pokemonImage.classList.remove('loaded');

    // 2. Reset visual state
    if (typeof resetCard === 'function') resetCard();

    // 3. Get Data (Cache first, then Fetch)
    let data = dataCache[id];
    if (!data) {
        showLoadingState();
        try {
            const res = await fetch(`/api/pokemon/${id}/`);
            if (!res.ok) throw new Error('Not found');
            data = await res.json();
            dataCache[id] = data;
        } catch (e) {
            pokemonName.textContent = 'Error';
            imageLoader.classList.remove('active');
            return;
        }
    }

    // 4. Update UI Metadata (Instant if cached)
    displayMetadata(data);

    // 5. Handle Image
    pokemonImage.src = data.image_url;

    if (pokemonImage.complete) {
        onImageLoaded();
    } else {
        imageLoader.classList.add('active');
        pokemonImage.onload = onImageLoaded;
        pokemonImage.onerror = () => imageLoader.classList.remove('active');
    }

    // 6. Preload adjacent range in background
    preloadAdjacent(id);
}

function showLoadingState() {
    pokemonName.textContent = 'Loading...';
    imageLoader.classList.add('active');
}

function displayMetadata(data) {
    pokemonName.textContent = data.name;

    // Always clear both before setting new state
    smashBtn.classList.remove('active');
    passBtn.classList.remove('active');

    if (data.user_vote) {
        if (data.user_vote === 'smash') smashBtn.classList.add('active');
        else passBtn.classList.add('active');
    }
}

function onImageLoaded() {
    pokemonImage.classList.add('loaded');
    imageLoader.classList.remove('active');
}

function preloadAdjacent(centerId) {
    // Preload next 5 and previous 2 to ensure smooth traversal
    for (let i = 1; i <= 5; i++) {
        preloadSingle(centerId + i);
    }
    if (centerId > 1) preloadSingle(centerId - 1);
}

async function preloadSingle(id) {
    if (id < 1 || id > 1025 || dataCache[id] || fetchingIds.has(id)) return;

    fetchingIds.add(id);
    try {
        const res = await fetch(`/api/pokemon/${id}/`);
        if (res.ok) {
            const data = await res.json();
            dataCache[id] = data;
            // Trigger browser to download/cache the image
            const img = new Image();
            img.src = data.image_url;
        }
    } catch (e) { }
    fetchingIds.delete(id);
}

function handleNext() {
    if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
    }
    fetchPokemon(currentPokemonId + 1);
}

function handlePrev() {
    if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
    }
    if (currentPokemonId > 1) {
        fetchPokemon(currentPokemonId - 1);
    }
}

function handleJump(e) {
    e.preventDefault();
    const id = parseInt(idInput.value);
    if (id && id > 0) {
        fetchPokemon(id);
    }
}

// --- Voting Logic ---

async function handleVote(action) {
    if (!currentPokemonId || !isLoggedIn || isVoteLoading) return;

    const voteId = currentPokemonId; // Lock the ID
    isVoteLoading = true;

    // Visual Feedback (immediate)
    clearActiveStates();
    if (action === 'smash') smashBtn.classList.add('active');
    else passBtn.classList.add('active');

    try {
        const response = await fetch(`/api/vote/${voteId}/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action })
        });

        if (!response.ok) throw new Error('Vote failed');

        const data = await response.json();

        // Update Cache with new vote status
        if (dataCache[voteId]) {
            dataCache[voteId].user_vote = action;
            dataCache[voteId].smash_count = data.smash_count;
            dataCache[voteId].pass_count = data.pass_count;
        }

        // Auto-advance
        setTimeout(() => {
            handleNext();
            isVoteLoading = false;
        }, 200);

    } catch (error) {
        console.error('Vote error:', error);
        isVoteLoading = false;
        // Optionally show toast or error indicator
        resetCard();
    }
}

// --- Gesture Logic (Pointer Events) ---

let startX = 0;
let isDragging = false;
let currentX = 0;

function onPointerDown(e) {
    if (!currentPokemonId || !isLoggedIn || isVoteLoading) return;
    isDragging = true;
    startX = e.clientX;
    currentX = startX;

    pokemonCard.classList.remove('transitioning');
    pokemonCard.setPointerCapture(e.pointerId);
}

function onPointerMove(e) {
    if (!isDragging) return;

    currentX = e.clientX;
    const deltaX = currentX - startX;
    const rotation = deltaX / 20;
    const opacity = Math.max(1 - Math.abs(deltaX) / 1000, 0.5);

    pokemonCard.style.transform = `translateX(${deltaX}px) rotate(${rotation}deg)`;
    pokemonCard.style.opacity = opacity;

    // Button highlights
    if (deltaX > 80) {
        smashBtn.classList.add('active');
        passBtn.classList.remove('active');
    } else if (deltaX < -80) {
        passBtn.classList.add('active');
        smashBtn.classList.remove('active');
    } else {
        clearActiveStates();
    }
}

function onPointerUp(e) {
    if (!isDragging) return;
    isDragging = false;
    pokemonCard.releasePointerCapture(e.pointerId);

    const deltaX = currentX - startX;

    if (Math.abs(deltaX) > SWIPE_THRESHOLD) {
        const action = deltaX > 0 ? 'smash' : 'pass';
        pokemonCard.classList.add('transitioning');
        pokemonCard.style.transform = `translateX(${deltaX > 0 ? 500 : -500}px) rotate(${deltaX > 0 ? 20 : -20}deg)`;
        pokemonCard.style.opacity = '0';
        handleVote(action);
    } else {
        resetCard();
    }
}

function resetCard() {
    clearActiveStates();
    pokemonCard.classList.add('transitioning');
    pokemonCard.style.transform = '';
    pokemonCard.style.opacity = '1';
}

function clearActiveStates() {
    smashBtn.classList.remove('active');
    passBtn.classList.remove('active');
}

// --- Event Listeners ---

document.addEventListener('DOMContentLoaded', async () => {
    const loggedIn = await checkLoginStatus();
    if (loggedIn) {
        isLoggedIn = true;

        // Priority: URL Param > Last voted state
        const urlParams = new URLSearchParams(window.location.search);
        const urlId = urlParams.get('id');

        if (urlId) {
            fetchPokemon(urlId);
        } else {
            fetchStartingId();
        }
    }
});

document.getElementById('login-form').addEventListener('submit', handleLogin);
document.getElementById('logout-btn').addEventListener('click', handleLogout);

smashBtn.addEventListener('click', () => handleVote('smash'));
passBtn.addEventListener('click', () => handleVote('pass'));
prevBtn.addEventListener('click', handlePrev);
nextBtn.addEventListener('click', handleNext);
idForm.addEventListener('submit', handleJump);

// Gestures
pokemonCard.addEventListener('pointerdown', onPointerDown);
pokemonCard.addEventListener('pointermove', onPointerMove);
pokemonCard.addEventListener('pointerup', onPointerUp);
pokemonCard.addEventListener('pointercancel', () => {
    isDragging = false;
    resetCard();
});
