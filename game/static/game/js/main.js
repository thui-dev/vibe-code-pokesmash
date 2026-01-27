let currentPokemonId = null;
let nextPokemon = null;
let isLoggedIn = false;
const pokemonName = document.getElementById('pokemon-name');
const pokemonImage = document.getElementById('pokemon-image');
const imageLoader = document.getElementById('image-loader');
const pokemonCard = document.querySelector('.card-inner');
const smashBtn = document.getElementById('smash-btn');
const passBtn = document.getElementById('pass-btn');

// Swipe/Tilt Variables
let startX = 0;
let currentX = 0;
let isDragging = false;
const SWIPE_THRESHOLD = 150;

// Check if user is logged in on page load
async function checkLoginStatus() {
    try {
        const response = await fetch('/api/username/');
        if (response.status === 401) {
            showLoginModal();
            return false;
        }
        const data = await response.json();
        document.getElementById('username-display').textContent = data.username;
        document.getElementById('user-info').style.display = 'flex';
        return true;
    } catch (error) {
        console.error('Error checking login status:', error);
        showLoginModal();
        return false;
    }
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
            document.getElementById('username-display').textContent = data.username;
            document.getElementById('user-info').style.display = 'flex';
            hideLoginModal();
            usernameInput.value = '';
            errorMsg.style.display = 'none';
            fetchPokemonCycle();
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
        isLoggedIn = false;
        currentPokemonId = null;
        nextPokemon = null;
        document.getElementById('user-info').style.display = 'none';
        pokemonName.textContent = 'Loading...';
        pokemonImage.src = '';
        pokemonImage.classList.remove('loaded');
        smashBtn.disabled = false;
        passBtn.disabled = false;
        smashBtn.classList.remove('active');
        passBtn.classList.remove('active');
        showLoginModal();
    } catch (error) {
        console.error('Error logging out:', error);
    }
}

async function fetchPokemonCycle() {
    await fetchRandomPokemon();
    preloadNextPokemon();
}

async function preloadNextPokemon() {
    if (!isLoggedIn || nextPokemon) return;

    try {
        const response = await fetch('/api/random/');
        const data = await response.json();

        if (response.ok && data.id) {
            const img = new Image();
            img.src = data.image_url;
            img.onload = () => {
                nextPokemon = data;
            };
        }
    } catch (error) {
        console.error('Error preloading:', error);
    }
}

async function fetchRandomPokemon() {
    if (!isLoggedIn) return;

    if (nextPokemon) {
        displayPokemon(nextPokemon);
        nextPokemon = null;
        preloadNextPokemon();
        return;
    }

    try {
        imageLoader.classList.add('active');
        const response = await fetch('/api/random/');
        const data = await response.json();

        if (response.ok && data.id) {
            displayPokemon(data);
            preloadNextPokemon();
        } else if (data.all_voted) {
            pokemonName.textContent = '🎉 You voted on all Pokémon!';
            pokemonImage.src = '';
            currentPokemonId = null;
            smashBtn.disabled = true;
            passBtn.disabled = true;
        } else if (response.status === 401) {
            isLoggedIn = false;
            showLoginModal();
        }
    } catch (error) {
        console.error('Error fetching pokemon:', error);
        pokemonName.textContent = 'Error loading Pokémon';
    }
}

function displayPokemon(data) {
    currentPokemonId = data.id;

    // Preparation
    pokemonImage.classList.remove('loaded');
    imageLoader.classList.add('active');

    // Set text
    pokemonName.textContent = data.name.charAt(0).toUpperCase() + data.name.slice(1);

    // Load image
    const tempImg = new Image();
    tempImg.onload = () => {
        pokemonImage.src = data.image_url;
        pokemonImage.classList.add('loaded');
        imageLoader.classList.remove('active');
    };
    tempImg.src = data.image_url;

    // MANDATORY RESET of all buttons and card styles
    clearActiveStates();

    pokemonCard.classList.remove('transitioning');
    pokemonCard.style.transform = '';
    pokemonCard.style.opacity = '1';
}

function clearActiveStates() {
    smashBtn.disabled = false;
    passBtn.disabled = false;
    smashBtn.classList.remove('active');
    passBtn.classList.remove('active');
}

async function handleVote(action) {
    if (!currentPokemonId || !isLoggedIn) return;

    // Visual feedback
    if (action === 'smash') smashBtn.classList.add('active');
    else passBtn.classList.add('active');

    smashBtn.disabled = true;
    passBtn.disabled = true;

    if (!isDragging) {
        pokemonCard.classList.add('transitioning');
        if (action === 'smash') {
            pokemonCard.style.transform = 'translateX(500px) rotate(20deg)';
        } else {
            pokemonCard.style.transform = 'translateX(-500px) rotate(-20deg)';
        }
        pokemonCard.style.opacity = '0';
    }

    try {
        const response = await fetch(`/api/vote/${currentPokemonId}/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action })
        });

        if (!response.ok) {
            const data = await response.json();
            console.error('Vote error:', data.error);
            clearActiveStates();
            resetCard(); // Backup reset
            if (response.status === 401) {
                isLoggedIn = false;
                showLoginModal();
            }
            return;
        }

        setTimeout(() => {
            fetchRandomPokemon();
        }, 300);

    } catch (error) {
        console.error('Error voting:', error);
        clearActiveStates();
        resetCard();
    }
}

// Gesture Handling
function onTouchStart(e) {
    if (!currentPokemonId || !isLoggedIn || isDragging) return;

    // Prevent default drag behavior for mouse to avoid native ghost image dragging
    if (e.type === 'mousedown') {
        e.preventDefault();
    }

    isDragging = true;
    startX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    currentX = startX; // Reset currentX to prevent stale delta calculations
    pokemonCard.classList.remove('transitioning');
}

function onTouchMove(e) {
    if (!isDragging) return;

    currentX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
    const deltaX = currentX - startX;
    const rotation = deltaX / 20;
    const opacity = Math.max(1 - Math.abs(deltaX) / 1000, 0.5);

    pokemonCard.style.transform = `translateX(${deltaX}px) rotate(${rotation}deg)`;
    pokemonCard.style.opacity = opacity;

    if (deltaX > 80) {
        smashBtn.classList.add('active');
        passBtn.classList.remove('active');
    } else if (deltaX < -80) {
        passBtn.classList.add('active');
        smashBtn.classList.remove('active');
    } else {
        smashBtn.classList.remove('active');
        passBtn.classList.remove('active');
    }
}

function onTouchEnd() {
    if (!isDragging) return;
    isDragging = false;

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
    // Reset buttons and card
    clearActiveStates();

    pokemonCard.classList.add('transitioning');
    pokemonCard.style.transform = '';
    pokemonCard.style.opacity = '1';
}

// Event Listeners
smashBtn.addEventListener('click', () => handleVote('smash'));
passBtn.addEventListener('click', () => handleVote('pass'));
document.getElementById('login-form').addEventListener('submit', handleLogin);
document.getElementById('logout-btn').addEventListener('click', handleLogout);

pokemonCard.addEventListener('touchstart', onTouchStart, { passive: true });
window.addEventListener('touchmove', onTouchMove, { passive: false });
window.addEventListener('touchend', onTouchEnd);
window.addEventListener('touchcancel', () => {
    if (isDragging) {
        isDragging = false;
        resetCard();
    }
});

pokemonCard.addEventListener('mousedown', onTouchStart);
window.addEventListener('mousemove', onTouchMove);
window.addEventListener('mouseup', onTouchEnd);
window.addEventListener('mouseleave', () => {
    if (isDragging) {
        isDragging = false;
        resetCard();
    }
});

// Initial load
document.addEventListener('DOMContentLoaded', async () => {
    const loggedIn = await checkLoginStatus();
    if (loggedIn) {
        isLoggedIn = true;
        fetchPokemonCycle();
    }
});
