// Game state
let gameState = {
    board: Array(9).fill(''),
    currentPlayer: 'X',
    gameMode: '',
    playerSymbol: 'X',
    playerName: '',
    friendName: '', // Added to store friend's name
    gameActive: false
};

// Statistics
let stats = {
    totalGames: 0,
    playerWins: 0,
    aiWins: 0,
    draws: 0,
    friendWins: 0 // Added to track friend vs friend wins
};

function loadStats() {
    // Load from localStorage if available
    const savedStats = localStorage.getItem('ticTacToeStats');
    if (savedStats) {
        stats = { ...stats, ...JSON.parse(savedStats) };
    }
    updateDashboard();
}

function saveStats() {
    // Save to localStorage
    localStorage.setItem('ticTacToeStats', JSON.stringify(stats));
    updateDashboard();
}

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

    const page = document.getElementById(pageId);
    if (page) page.classList.add('active');

    const btn = document.querySelector(`[onclick="showPage('${pageId}')"]`);
    if (btn) btn.classList.add('active');

    if (pageId === 'dashboard') {
        updateDashboard();
    }
    // When navigating away from home, hide friend name input
    if (pageId !== 'home') {
        document.getElementById('friendNameInputGroup').style.display = 'none';
    }
}

function selectPlayMode(mode) {
    gameState.gameMode = mode;

    document.querySelectorAll('#playWithAI, #playWithFriend').forEach(btn => {
        btn.classList.remove('selected');
    });

    document.getElementById(mode === 'ai' ? 'playWithAI' : 'playWithFriend').classList.add('selected');

    // Show/hide friend name input based on mode
    if (mode === 'friend') {
        document.getElementById('friendNameInputGroup').style.display = 'block';
    } else {
        document.getElementById('friendNameInputGroup').style.display = 'none';
        document.getElementById('friendName').value = ''; // Clear friend name if switching to AI
    }

    document.getElementById('symbolSelection').style.display = 'block';
}

function selectSymbol(symbol) {
    gameState.playerSymbol = symbol;

    document.querySelectorAll('.symbol-btn').forEach(btn => {
        btn.classList.remove('selected');
    });

    document.getElementById('symbol' + symbol).classList.add('selected');

    document.getElementById('startGameGroup').style.display = 'block';
}

function startGame() {
    const nameInput = document.getElementById('playerName');

    if (!nameInput.value.trim()) {
        alert('Please enter your name!');
        return;
    }

    if (!gameState.gameMode) {
        alert('Please select play mode!');
        return;
    }

    if (!gameState.playerSymbol) {
        alert('Please choose your symbol!');
        return;
    }

    gameState.playerName = nameInput.value.trim();
    gameState.currentPlayer = 'X';
    gameState.board = Array(9).fill('');
    gameState.gameActive = true;

    if (gameState.gameMode === 'ai') {
        showPage('ai');
        resetGame('ai');
    } else {
        // Get friend's name from the new input field
        const friendNameInput = document.getElementById('friendName');
        if (!friendNameInput.value.trim()) {
            alert("Please enter your friend's name to start the game!");
            return;
        }
        gameState.friendName = friendNameInput.value.trim();
        showPage('friendGame');
        resetGame('friend');
    }
}

function backToSetup() {
    showPage('home');
    // Ensure friend name input is hidden when going back to setup
    document.getElementById('friendNameInputGroup').style.display = 'none';
    document.getElementById('friendName').value = ''; // Clear friend name
    // Also reset selected mode and symbol
    document.querySelectorAll('#playWithAI, #playWithFriend').forEach(btn => {
        btn.classList.remove('selected');
    });
    document.querySelectorAll('.symbol-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    document.getElementById('symbolSelection').style.display = 'none';
    document.getElementById('startGameGroup').style.display = 'none';
    gameState.gameMode = '';
    gameState.playerSymbol = '';
}

function makeMove(index, mode) {
    if (!gameState.gameActive || gameState.board[index] !== '') return;

    const boardId = mode + 'Board';
    const statusId = mode + 'GameStatus';
    const playerInfoId = mode + 'CurrentPlayer';

    gameState.board[index] = gameState.currentPlayer;

    const cell = document.querySelectorAll(`#${boardId} .cell`)[index];
    cell.textContent = gameState.currentPlayer;
    cell.classList.add(gameState.currentPlayer.toLowerCase());

    if (checkWinner()) {
        const winner = gameState.currentPlayer;
        let winnerName;
        
        if (mode === 'ai') {
            winnerName = winner === gameState.playerSymbol ? gameState.playerName : 'AI';
        } else {
            // Determine winner name for friend mode
            winnerName = winner === gameState.playerSymbol ? gameState.playerName : gameState.friendName;
        }

        document.getElementById(statusId).innerHTML =
            `<span class="winner">${winnerName} Wins!</span>`;

        gameState.gameActive = false;

        // Update statistics
        stats.totalGames++;
        
        if (mode === 'ai') {
            if (winner === gameState.playerSymbol) {
                stats.playerWins++;
            } else {
                stats.aiWins++;
            }
        } else {
            // Friend vs Friend mode
            if (winner === gameState.playerSymbol) {
                stats.playerWins++;
            } else {
                stats.friendWins++;
            }
        }
        
        saveStats();
        return;
    }

    // Check for draw
    if (gameState.board.every(cell => cell !== '')) {
        document.getElementById(statusId).innerHTML = `<span class="winner">It's a Draw!</span>`;
        gameState.gameActive = false;
        stats.totalGames++;
        stats.draws++;
        saveStats();
        return;
    }

    // Switch players
    gameState.currentPlayer = gameState.currentPlayer === 'X' ? 'O' : 'X';

    // Handle AI move or update player info
    if (mode === 'ai' && gameState.currentPlayer !== gameState.playerSymbol && gameState.gameActive) {
        document.getElementById(playerInfoId).textContent = 'AI is thinking...';
        setTimeout(() => {
            makeAIMove(mode);
        }, 500);
    } else {
        let playerName;
        if (mode === 'ai') {
            playerName = gameState.currentPlayer === gameState.playerSymbol ? gameState.playerName : 'AI';
        } else {
            // Display current player's name for friend mode
            playerName = gameState.currentPlayer === gameState.playerSymbol ? gameState.playerName : gameState.friendName;
        }
        document.getElementById(playerInfoId).textContent = playerName + "'s Turn";
    }
}

function makeAIMove(mode) {
    if (!gameState.gameActive) return;

    const aiSymbol = gameState.playerSymbol === 'X' ? 'O' : 'X';
    const bestMove = getBestMove(aiSymbol);

    if (bestMove !== -1) {
        makeMove(bestMove, mode);
    }
}

function getBestMove(aiSymbol) {
    const playerSymbol = aiSymbol === 'X' ? 'O' : 'X';

    // Try to win
    for (let i = 0; i < 9; i++) {
        if (gameState.board[i] === '') {
            gameState.board[i] = aiSymbol;
            if (checkWinnerForSymbol(aiSymbol)) {
                gameState.board[i] = '';
                return i;
            }
            gameState.board[i] = '';
        }
    }

    // Try to block player from winning
    for (let i = 0; i < 9; i++) {
        if (gameState.board[i] === '') {
            gameState.board[i] = playerSymbol;
            if (checkWinnerForSymbol(playerSymbol)) {
                gameState.board[i] = '';
                return i;
            }
            gameState.board[i] = '';
        }
    }

    // Take center if available
    if (gameState.board[4] === '') return 4;

    // Take corners
    const corners = [0, 2, 6, 8];
    const availableCorners = corners.filter(i => gameState.board[i] === '');
    if (availableCorners.length > 0) {
        return availableCorners[Math.floor(Math.random() * availableCorners.length)];
    }

    // Take any available spot
    const availableSpots = gameState.board
        .map((cell, index) => cell === '' ? index : null)
        .filter(val => val !== null);

    return availableSpots.length > 0 ?
        availableSpots[Math.floor(Math.random() * availableSpots.length)] : -1;
}

function checkWinner() {
    return checkWinnerForSymbol(gameState.currentPlayer);
}

function checkWinnerForSymbol(symbol) {
    const winPatterns = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
        [0, 4, 8], [2, 4, 6] // Diagonals
    ];

    return winPatterns.some(pattern =>
        pattern.every(index => gameState.board[index] === symbol)
    );
}

function resetGame(mode) {
    gameState.board = Array(9).fill('');
    gameState.currentPlayer = 'X';
    gameState.gameActive = true;

    const boardId = mode + 'Board';
    const statusId = mode + 'GameStatus';
    const playerInfoId = mode + 'CurrentPlayer';

    document.querySelectorAll(`#${boardId} .cell`).forEach(cell => {
        cell.textContent = '';
        cell.classList.remove('x', 'o');
    });

    document.getElementById(statusId).textContent = '';

    let playerName;
    if (mode === 'ai') {
        playerName = gameState.currentPlayer === gameState.playerSymbol ? gameState.playerName : 'AI';
    } else {
        // Display current player's name for friend mode
        playerName = gameState.currentPlayer === gameState.playerSymbol ? gameState.playerName : gameState.friendName;
    }
    document.getElementById(playerInfoId).textContent = playerName + "'s Turn";
}

function updateDashboard() {
    document.getElementById('totalGames').textContent = stats.totalGames;
    document.getElementById('playerWins').textContent = stats.playerWins;
    document.getElementById('aiWins').textContent = stats.aiWins;
    document.getElementById('draws').textContent = stats.draws;

    // Calculate win rate properly
    const winRate = stats.totalGames > 0 ?
        Math.round((stats.playerWins / stats.totalGames) * 100) : 0;
    document.getElementById('winRate').textContent = winRate + '%';
    
    // If you have a friend wins display element, update it
    const friendWinsElement = document.getElementById('friendWins');
    if (friendWinsElement) {
        friendWinsElement.textContent = stats.friendWins || 0;
    }
}

function resetStats() {
    if (confirm('Are you sure you want to reset all statistics?')) {
        stats = {
            totalGames: 0,
            playerWins: 0,
            aiWins: 0,
            draws: 0,
            friendWins: 0
        };
        saveStats();
        updateDashboard();
    }
}

document.addEventListener('DOMContentLoaded', function () {
    loadStats();
});
