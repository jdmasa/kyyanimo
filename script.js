class FieldGameTracker {
    constructor() {
        this.players = [];
        this.currentPlayerIndex = 0;
        this.gameStarted = false;
        this.selectedAnimals = new Set();
        this.roundConfirmed = false;
        this.deferredPrompt = null;
        
        this.animals = [
            { name: 'Penguin', emoji: '🐧' },
            { name: 'Elephant', emoji: '🐘' },
            { name: 'Pig', emoji: '🐷' },
            { name: 'Sheep', emoji: '🐑' },
            { name: 'Lion', emoji: '🦁' },
            { name: 'Monkey', emoji: '🐵' },
            { name: 'Cat', emoji: '🐱' },
            { name: 'Cow', emoji: '🐮' }
        ];
        
        this.initializeEventListeners();
        this.updateUI();
        this.setupPWAInstall();
    }
    
    setupPWAInstall() {
        // Check if PWA is already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            console.log('PWA is already installed');
            return;
        }

        // Check if browser supports PWA installation
        if (!('serviceWorker' in navigator)) {
            console.log('Service Worker not supported');
            return;
        }

        // Listen for the beforeinstallprompt event
        window.addEventListener('beforeinstallprompt', (e) => {
            console.log('PWA install prompt available');
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallPrompt();
        });

        // For debugging - show install prompt after a delay if not triggered
        setTimeout(() => {
            if (!this.deferredPrompt) {
                console.log('No install prompt available. Checking requirements...');
                this.checkPWARequirements();
            }
        }, 3000);

        // Handle install button click
        document.getElementById('install-button').addEventListener('click', () => {
            this.installApp();
        });

        // Handle dismiss button click
        document.getElementById('dismiss-install').addEventListener('click', () => {
            this.hideInstallPrompt();
        });

        // Listen for app installed event
        window.addEventListener('appinstalled', () => {
            console.log('PWA was installed');
            this.hideInstallPrompt();
        });
    }

    checkPWARequirements() {
        console.log('Checking PWA requirements:');
        console.log('- HTTPS:', location.protocol === 'https:' || location.hostname === 'localhost');
        console.log('- Service Worker:', 'serviceWorker' in navigator);
        console.log('- Manifest:', document.querySelector('link[rel="manifest"]') !== null);
        console.log('- Not already installed:', !window.matchMedia('(display-mode: standalone)').matches);
        
        // Show manual install instructions
        if (!this.deferredPrompt) {
            this.showManualInstallInstructions();
        }
    }

    showManualInstallInstructions() {
        const installPrompt = document.getElementById('install-prompt');
        const installButton = document.getElementById('install-button');
        const promptText = installPrompt.querySelector('p');
        
        promptText.innerHTML = '📱 To install this app:<br>• Chrome/Brave: Menu → "Install app"<br>• Safari: Share → "Add to Home Screen"';
        installButton.style.display = 'none';
        installPrompt.classList.remove('hidden');
    }

    showInstallPrompt() {
        const installPrompt = document.getElementById('install-prompt');
        const installButton = document.getElementById('install-button');
        const promptText = installPrompt.querySelector('p');
        
        promptText.textContent = '📱 Install this app for the best experience!';
        installButton.style.display = 'inline-block';
        installPrompt.classList.remove('hidden');
    }

    hideInstallPrompt() {
        const installPrompt = document.getElementById('install-prompt');
        installPrompt.classList.add('hidden');
    }

    async installApp() {
        if (!this.deferredPrompt) {
            alert('Install not available. Try accessing this page in Chrome or Safari.');
            return;
        }

        const result = await this.deferredPrompt.prompt();
        console.log('Install prompt result:', result);
        
        this.deferredPrompt = null;
        this.hideInstallPrompt();
    }

    initializeEventListeners() {
        // Player setup
        document.getElementById('player-name').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addPlayer();
            }
        });
        
        document.getElementById('add-player').addEventListener('click', () => {
            this.addPlayer();
        });
        
        document.getElementById('start-game').addEventListener('click', () => {
            this.startGame();
        });
        
        // Game controls
        document.getElementById('confirm-round').addEventListener('click', () => {
            this.confirmRound();
        });
        
        document.getElementById('next-player').addEventListener('click', () => {
            this.nextPlayer();
        });
        
        // New game
        document.getElementById('new-game').addEventListener('click', () => {
            this.resetGame();
        });
    }
    
    addPlayer() {
        const nameInput = document.getElementById('player-name');
        const name = nameInput.value.trim();
        
        if (name && !this.players.find(p => p.name === name)) {
            this.players.push({
                name: name,
                animalsHit: new Set(),
                score: 0
            });
            
            nameInput.value = '';
            this.updateUI();
        }
    }
    
    removePlayer(index) {
        this.players.splice(index, 1);
        this.updateUI();
    }
    
    startGame() {
        if (this.players.length < 2) {
            alert('Please add at least 2 players to start the game.');
            return;
        }
        
        // Hide the header when starting the game
        const header = document.querySelector('header');
        if (header) {
            header.classList.add('hidden');
            header.style.display = 'none';
        }
        
        this.gameStarted = true;
        this.currentPlayerIndex = 0;
        this.createAnimalGrid();
        this.updateUI();
    }
    
    createAnimalGrid() {
        const grid = document.getElementById('animal-grid');
        grid.innerHTML = '';
        
        this.animals.forEach((animal, index) => {
            const animalElement = document.createElement('div');
            animalElement.className = 'animal-item';
            animalElement.dataset.index = index;
            
            const currentPlayer = this.players[this.currentPlayerIndex];
            const isAlreadyHit = currentPlayer.animalsHit.has(index);
            
            if (isAlreadyHit) {
                animalElement.classList.add('hit');
                animalElement.classList.add('disabled');
            }
            
            animalElement.innerHTML = `
                <span class="animal-emoji">${animal.emoji}</span>
                <span class="animal-name">${animal.name}</span>
            `;
            
            if (!isAlreadyHit) {
                animalElement.addEventListener('click', () => {
                    this.toggleAnimalSelection(index);
                });
            }
            
            grid.appendChild(animalElement);
        });
    }
    
    toggleAnimalSelection(index) {
        const currentPlayer = this.players[this.currentPlayerIndex];
        
        // Can't select already hit animals
        if (currentPlayer.animalsHit.has(index)) {
            return;
        }
        
        const animalElement = document.querySelector(`[data-index="${index}"]`);
        
        if (this.selectedAnimals.has(index)) {
            this.selectedAnimals.delete(index);
            animalElement.classList.remove('selected');
        } else {
            this.selectedAnimals.add(index);
            animalElement.classList.add('selected');
        }
        
        this.updateGameControls();
    }
    
    confirmRound() {
        const currentPlayer = this.players[this.currentPlayerIndex];
        
        // Add selected animals to player's hit list
        this.selectedAnimals.forEach(index => {
            currentPlayer.animalsHit.add(index);
        });
        
        // Update score
        currentPlayer.score = currentPlayer.animalsHit.size;
        
        // Check for winner
        if (currentPlayer.animalsHit.size === this.animals.length) {
            this.declareWinner(currentPlayer);
            return;
        }
        
        this.roundConfirmed = true;
        this.updateUI();
    }
    
    nextPlayer() {
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        this.selectedAnimals.clear();
        this.roundConfirmed = false;
        this.createAnimalGrid();
        this.updateUI();
    }
    
    declareWinner(winner) {
        const modal = document.getElementById('winner-modal');
        const message = document.getElementById('winner-message');
        
        message.textContent = `${winner.name} wins! They successfully hit all 8 animal sticks!`;
        modal.classList.remove('hidden');
        
        this.updateScoreboard();
    }
    
    resetGame() {
        // Hide the modal first
        const modal = document.getElementById('winner-modal');
        modal.classList.add('hidden');
        
        // Show the header again when resetting
        const header = document.querySelector('header');
        if (header) {
            header.classList.remove('hidden');
            header.style.display = '';
        }
        
        this.players = [];
        this.currentPlayerIndex = 0;
        this.gameStarted = false;
        this.selectedAnimals.clear();
        this.roundConfirmed = false;
        
        this.updateUI();
    }
    
    updateUI() {
        this.updatePlayerList();
        this.updateGameVisibility();
        this.updateCurrentPlayer();
        this.updateGameControls();
        this.updateScoreboard();
    }
    
    updatePlayerList() {
        const playerList = document.getElementById('player-list');
        const startButton = document.getElementById('start-game');
        
        playerList.innerHTML = '';
        
        this.players.forEach((player, index) => {
            const playerTag = document.createElement('div');
            playerTag.className = 'player-tag';
            playerTag.innerHTML = `
                <span>${player.name}</span>
                <button class="remove-player" onclick="game.removePlayer(${index})">×</button>
            `;
            playerList.appendChild(playerTag);
        });
        
        startButton.disabled = this.players.length < 2;
    }
    
    updateGameVisibility() {
        const setupSection = document.getElementById('setup-section');
        const gameSection = document.getElementById('game-section');
        
        if (this.gameStarted) {
            setupSection.classList.add('hidden');
            gameSection.classList.remove('hidden');
        } else {
            setupSection.classList.remove('hidden');
            gameSection.classList.add('hidden');
        }
    }
    
    updateCurrentPlayer() {
        if (!this.gameStarted) return;
        
        const currentPlayer = this.players[this.currentPlayerIndex];
        document.getElementById('current-player-name').textContent = currentPlayer.name;
        document.getElementById('current-player-score').textContent = 
            `${currentPlayer.score}/8`;
    }
    
    updateGameControls() {
        const confirmButton = document.getElementById('confirm-round');
        const nextButton = document.getElementById('next-player');
        
        confirmButton.disabled = this.roundConfirmed;
        nextButton.disabled = !this.roundConfirmed;
    }
    
    updateScoreboard() {
        const scoreSheetsContainer = document.getElementById('score-sheets');
        scoreSheetsContainer.innerHTML = '';
        
        this.players.forEach((player, index) => {
            const scoreSheet = document.createElement('div');
            scoreSheet.className = 'score-sheet';
            
            if (index === this.currentPlayerIndex && this.gameStarted) {
                scoreSheet.classList.add('current');
            }
            
            if (player.score === this.animals.length) {
                scoreSheet.classList.add('winner');
            }
            
            const animalsHtml = this.animals.map((animal, animalIndex) => {
                const isHit = player.animalsHit.has(animalIndex);
                return `
                    <div class="animal-status ${isHit ? 'hit' : ''}">
                        <div>${animal.emoji}</div>
                        <div>${animal.name}</div>
                    </div>
                `;
            }).join('');
            
            scoreSheet.innerHTML = `
                <div class="score-sheet-header">
                    <span class="player-name">${player.name}</span>
                    <span class="score">${player.score}/8</span>
                </div>
                <div class="animals-hit">
                    ${animalsHtml}
                </div>
            `;
            
            scoreSheetsContainer.appendChild(scoreSheet);
        });
    }
}

// Register service worker for PWA functionality
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// Initialize the game
const game = new FieldGameTracker();