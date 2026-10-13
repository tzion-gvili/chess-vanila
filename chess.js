const PIECE_VALUES = { pawn: 1, knight: 3, bishop: 3, rook: 5, queen: 9, king: 0 };
const FILES = 'abcdefgh';
const CHEAT_CODE = 'ninja';

class ChessGame {
    constructor() {
        this.board = this.initializeBoard();
        this.currentPlayer = 'white';
        this.selectedSquare = null;
        this.moveHistory = [];
        this.flipped = false;
        this.gameOver = false;
        this.aiEnabled = true;
        this.aiTimer = null;
        this.warningTimer = null;
        this.ninjaReady = false;
        this.cheatBuffer = '';
        
        this.createBoard();
        this.updateDisplay();
        this.setupEventListeners();
    }
    
    initializeBoard() {
        const board = Array(8).fill(null).map(() => Array(8).fill(null));
        
        // Place pawns
        for (let col = 0; col < 8; col++) {
            board[1][col] = { type: 'pawn', color: 'black' };
            board[6][col] = { type: 'pawn', color: 'white' };
        }
        
        // Place other pieces
        const pieces = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
        for (let col = 0; col < 8; col++) {
            board[0][col] = { type: pieces[col], color: 'black' };
            board[7][col] = { type: pieces[col], color: 'white' };
        }
        
        return board;
    }
    
    createBoard() {
        const boardElement = document.getElementById('chessboard');
        boardElement.innerHTML = '';
        
        for (let displayRow = 0; displayRow < 8; displayRow++) {
            for (let displayCol = 0; displayCol < 8; displayCol++) {
                const row = this.flipped ? 7 - displayRow : displayRow;
                const col = this.flipped ? 7 - displayCol : displayCol;
                
                const square = document.createElement('div');
                square.className = 'square';
                square.classList.add((row + col) % 2 === 0 ? 'light' : 'dark');
                square.dataset.row = row;
                square.dataset.col = col;
                
                const piece = this.board[row][col];
                if (piece) {
                    const pieceElement = document.createElement('div');
                    pieceElement.className = 'piece';
                    pieceElement.textContent = this.getPieceSymbol(piece);
                    square.appendChild(pieceElement);
                }
                
                square.addEventListener('click', () => this.handleSquareClick(row, col));
                boardElement.appendChild(square);
            }
        }
    }
    
    getPieceSymbol(piece) {
        const symbols = {
            white: {
                king: '♔',
                queen: '♕',
                rook: '♖',
                bishop: '♗',
                knight: '♘',
                pawn: '♙'
            },
            black: {
                king: '♚',
                queen: '♛',
                rook: '♜',
                bishop: '♝',
                knight: '♞',
                pawn: '♟'
            }
        };
        return symbols[piece.color][piece.type];
    }
    
    isAITurn() {
        return this.aiEnabled && this.currentPlayer === 'black';
    }
    
    handleSquareClick(row, col) {
        if (this.gameOver || this.isAITurn()) return;
        
        const piece = this.board[row][col];
        
        if (this.ninjaReady) {
            this.handleNinjaClick(row, col, piece);
            return;
        }
        
        // If a square is already selected
        if (this.selectedSquare) {
            const [selectedRow, selectedCol] = this.selectedSquare;
            const selectedPiece = this.board[selectedRow][selectedCol];
            
            // If clicking on own piece, change selection
            if (piece && piece.color === this.currentPlayer) {
                this.selectSquare(row, col);
                this.hideWarning();
                return;
            }
            
            // Try to make a move
            if (this.isValidMove(selectedRow, selectedCol, row, col)) {
                // Check if move would put king in check
                if (this.wouldMovePutKingInCheck(selectedRow, selectedCol, row, col)) {
                    this.showWarning("Hey my friend... pay attention to your king! This move would put your king in check!");
                    return;
                }
                
                this.makeMove(selectedRow, selectedCol, row, col);
                this.hideWarning();
                this.finishTurn();
            } else {
                // Invalid move, show warning
                const pieceName = selectedPiece ? selectedPiece.type : 'piece';
                this.showWarning(`Hey my friend... pay attention to the ${pieceName} movement rules! This is not a valid move.`);
                this.selectedSquare = null;
                this.clearHighlights();
                this.updateDisplay();
                this.checkGameStatus();
            }
        } else {
            // Select a piece if it belongs to current player
            if (piece && piece.color === this.currentPlayer) {
                this.selectSquare(row, col);
                this.hideWarning();
            } else if (piece) {
                // Clicking on opponent's piece without selection
                this.showWarning("Hey my friend... pay attention to the turn! It's not your piece to move.");
            } else {
                // Clicking on empty square without selection
                this.showWarning("Hey my friend... pay attention to the board! Please select a piece first.");
            }
        }
    }
    
    finishTurn() {
        this.selectedSquare = null;
        this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
        this.updateDisplay();
        this.checkGameStatus();
        this.scheduleAIMove();
    }
    
    scheduleAIMove() {
        if (this.isAITurn() && !this.gameOver) {
            clearTimeout(this.aiTimer);
            this.aiTimer = setTimeout(() => this.makeAIMove(), 500);
        }
    }
    
    selectSquare(row, col) {
        this.selectedSquare = [row, col];
        this.clearHighlights();
        this.highlightSquare(row, col);
        this.highlightPossibleMoves(row, col);
    }
    
    highlightSquare(row, col) {
        const square = this.getSquareElement(row, col);
        if (square) square.classList.add('selected');
    }
    
    highlightPossibleMoves(row, col) {
        const piece = this.board[row][col];
        if (!piece) return;
        
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (this.isLegalMove(row, col, r, c)) {
                    const square = this.getSquareElement(r, c);
                    if (square) square.classList.add('possible-move');
                }
            }
        }
    }
    
    clearHighlights() {
        document.querySelectorAll('.square').forEach(square => {
            square.classList.remove('selected', 'possible-move', 'ninja-target');
        });
    }
    
    getSquareElement(row, col) {
        return document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    }
    
    isValidMove(fromRow, fromCol, toRow, toCol) {
        const piece = this.board[fromRow][fromCol];
        if (!piece) return false;
        
        const targetPiece = this.board[toRow][toCol];
        if (targetPiece && targetPiece.color === piece.color) return false;
        
        // Basic move validation
        switch (piece.type) {
            case 'pawn':
                return this.isValidPawnMove(fromRow, fromCol, toRow, toCol, piece.color);
            case 'rook':
                return this.isValidRookMove(fromRow, fromCol, toRow, toCol);
            case 'knight':
                return this.isValidKnightMove(fromRow, fromCol, toRow, toCol);
            case 'bishop':
                return this.isValidBishopMove(fromRow, fromCol, toRow, toCol);
            case 'queen':
                return this.isValidRookMove(fromRow, fromCol, toRow, toCol) || 
                       this.isValidBishopMove(fromRow, fromCol, toRow, toCol);
            case 'king':
                return this.isValidKingMove(fromRow, fromCol, toRow, toCol);
            default:
                return false;
        }
    }
    
    // A valid move that also keeps the mover's own king safe.
    isLegalMove(fromRow, fromCol, toRow, toCol) {
        return this.isValidMove(fromRow, fromCol, toRow, toCol) &&
               !this.wouldMovePutKingInCheck(fromRow, fromCol, toRow, toCol);
    }
    
    isValidPawnMove(fromRow, fromCol, toRow, toCol, color) {
        const direction = color === 'white' ? -1 : 1;
        const startRow = color === 'white' ? 6 : 1;
        
        // Move forward one square
        if (toCol === fromCol && toRow === fromRow + direction && !this.board[toRow][toCol]) {
            return true;
        }
        
        // Move forward two squares from starting position
        if (toCol === fromCol && fromRow === startRow && 
            toRow === fromRow + 2 * direction && !this.board[toRow][toCol] && 
            !this.board[fromRow + direction][fromCol]) {
            return true;
        }
        
        // Capture diagonally
        if (Math.abs(toCol - fromCol) === 1 && toRow === fromRow + direction && 
            this.board[toRow][toCol] && this.board[toRow][toCol].color !== color) {
            return true;
        }
        
        return false;
    }
    
    isValidRookMove(fromRow, fromCol, toRow, toCol) {
        if (fromRow !== toRow && fromCol !== toCol) return false;
        
        const rowStep = fromRow === toRow ? 0 : (toRow > fromRow ? 1 : -1);
        const colStep = fromCol === toCol ? 0 : (toCol > fromCol ? 1 : -1);
        
        let r = fromRow + rowStep;
        let c = fromCol + colStep;
        
        while (r !== toRow || c !== toCol) {
            if (this.board[r][c]) return false;
            r += rowStep;
            c += colStep;
        }
        
        return true;
    }
    
    isValidKnightMove(fromRow, fromCol, toRow, toCol) {
        const rowDiff = Math.abs(toRow - fromRow);
        const colDiff = Math.abs(toCol - fromCol);
        return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
    }
    
    isValidBishopMove(fromRow, fromCol, toRow, toCol) {
        if (Math.abs(toRow - fromRow) !== Math.abs(toCol - fromCol)) return false;
        
        const rowStep = toRow > fromRow ? 1 : -1;
        const colStep = toCol > fromCol ? 1 : -1;
        
        let r = fromRow + rowStep;
        let c = fromCol + colStep;
        
        while (r !== toRow || c !== toCol) {
            if (this.board[r][c]) return false;
            r += rowStep;
            c += colStep;
        }
        
        return true;
    }
    
    isValidKingMove(fromRow, fromCol, toRow, toCol) {
        const rowDiff = Math.abs(toRow - fromRow);
        const colDiff = Math.abs(toCol - fromCol);
        return rowDiff <= 1 && colDiff <= 1 && (rowDiff > 0 || colDiff > 0);
    }
    
    isPromotion(piece, toRow) {
        return piece.type === 'pawn' && (toRow === 0 || toRow === 7);
    }
    
    makeMove(fromRow, fromCol, toRow, toCol) {
        const piece = this.board[fromRow][fromCol];
        const captured = this.board[toRow][toCol];
        const promoted = this.isPromotion(piece, toRow);
        
        this.board[toRow][toCol] = promoted ? { type: 'queen', color: piece.color } : piece;
        this.board[fromRow][fromCol] = null;
        
        // Record move
        const moveNotation = this.getMoveNotation(piece, fromRow, fromCol, toRow, toCol, captured, promoted);
        this.moveHistory.push(moveNotation);
        this.updateMoveHistory();
    }
    
    // Plays a move on the board, runs fn, then puts everything back.
    withMove(fromRow, fromCol, toRow, toCol, fn) {
        const piece = this.board[fromRow][fromCol];
        const captured = this.board[toRow][toCol];
        
        this.board[toRow][toCol] = this.isPromotion(piece, toRow) ? { type: 'queen', color: piece.color } : piece;
        this.board[fromRow][fromCol] = null;
        try {
            return fn();
        } finally {
            this.board[fromRow][fromCol] = piece;
            this.board[toRow][toCol] = captured;
        }
    }
    
    getMoveNotation(piece, fromRow, fromCol, toRow, toCol, captured, promoted) {
        const fromSquare = FILES[fromCol] + (8 - fromRow);
        const toSquare = FILES[toCol] + (8 - toRow);
        const capture = captured ? 'x' : '';
        const promotion = promoted ? '=Q' : '';
        return `${this.moveHistory.length + 1}. ${piece.color === 'white' ? 'White' : 'Black'} ${piece.type} ${fromSquare}${capture}${toSquare}${promotion}`;
    }
    
    updateMoveHistory() {
        const moveList = document.getElementById('move-list');
        moveList.innerHTML = '';
        this.moveHistory.forEach(move => {
            const moveItem = document.createElement('div');
            moveItem.className = 'move-item';
            moveItem.textContent = move;
            moveList.appendChild(moveItem);
        });
        moveList.scrollTop = moveList.scrollHeight;
    }
    
    findKing(color) {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.type === 'king' && piece.color === color) {
                    return [row, col];
                }
            }
        }
        return null;
    }
    
    isInCheck(color) {
        const kingPos = this.findKing(color);
        if (!kingPos) return false;
        
        const [kingRow, kingCol] = kingPos;
        const opponentColor = color === 'white' ? 'black' : 'white';
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.color === opponentColor) {
                    if (this.isValidMove(row, col, kingRow, kingCol)) {
                        return true;
                    }
                }
            }
        }
        
        return false;
    }
    
    hasAnyLegalMove(color) {
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = this.board[r][c];
                if (!piece || piece.color !== color) continue;
                for (let tr = 0; tr < 8; tr++) {
                    for (let tc = 0; tc < 8; tc++) {
                        if (this.isLegalMove(r, c, tr, tc)) return true;
                    }
                }
            }
        }
        return false;
    }
    
    checkGameStatus() {
        const status = document.getElementById('game-status');
        const inCheck = this.isInCheck(this.currentPlayer);
        
        if (inCheck) {
            const kingPos = this.findKing(this.currentPlayer);
            if (kingPos) {
                const [row, col] = kingPos;
                const square = this.getSquareElement(row, col);
                if (square) square.classList.add('in-check');
            }
        }
        
        if (!this.hasAnyLegalMove(this.currentPlayer)) {
            this.gameOver = true;
            if (inCheck) {
                const winner = this.currentPlayer === 'white' ? 'Black' : 'White';
                status.textContent = `Checkmate! ${winner} wins!`;
            } else {
                status.textContent = "Stalemate! It's a draw.";
            }
        } else {
            status.textContent = inCheck ? 'Check!' : '';
        }
    }
    
    wouldMovePutKingInCheck(fromRow, fromCol, toRow, toCol) {
        const color = this.board[fromRow][fromCol].color;
        return this.withMove(fromRow, fromCol, toRow, toCol, () => this.isInCheck(color));
    }
    
    getGreeting() {
        // 10% chance to use "ilay", 90% chance to use "my friend"
        return Math.random() < 0.1 ? "ilay" : "my friend";
    }
    
    showWarning(message) {
        const warningElement = document.getElementById('warning-message');
        // Replace "my friend" with random greeting
        const greeting = this.getGreeting();
        const finalMessage = message.replace("my friend", greeting);
        warningElement.textContent = finalMessage;
        warningElement.classList.add('show');
        
        // Auto-hide after 4 seconds
        clearTimeout(this.warningTimer);
        this.warningTimer = setTimeout(() => {
            this.hideWarning();
        }, 4000);
    }
    
    hideWarning() {
        const warningElement = document.getElementById('warning-message');
        warningElement.classList.remove('show');
    }
    
    updateDisplay() {
        this.createBoard();
        const turnIndicator = document.getElementById('current-turn');
        turnIndicator.textContent = `${this.currentPlayer.charAt(0).toUpperCase() + this.currentPlayer.slice(1)}'s Turn`;
        turnIndicator.parentElement.className = `turn-indicator ${this.currentPlayer}-turn`;
    }
    
    flipBoard() {
        this.flipped = !this.flipped;
        this.updateDisplay();
        if (this.selectedSquare) this.selectSquare(...this.selectedSquare);
        if (this.ninjaReady) this.highlightNinjaTargets();
        if (this.isInCheck(this.currentPlayer)) this.checkGameStatus();
    }
    
    resetGame() {
        clearTimeout(this.aiTimer);
        this.board = this.initializeBoard();
        this.currentPlayer = 'white';
        this.selectedSquare = null;
        this.moveHistory = [];
        this.gameOver = false;
        this.cancelNinja();
        document.getElementById('game-status').textContent = '';
        this.hideWarning();
        this.updateDisplay();
        this.updateMoveHistory();
    }
    
    getAllPossibleMoves(color) {
        const moves = [];
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.color === color) {
                    for (let toRow = 0; toRow < 8; toRow++) {
                        for (let toCol = 0; toCol < 8; toCol++) {
                            if (this.isLegalMove(row, col, toRow, toCol)) {
                                moves.push({
                                    from: [row, col],
                                    to: [toRow, toCol],
                                    piece: piece,
                                    captured: this.board[toRow][toCol]
                                });
                            }
                        }
                    }
                }
            }
        }
        return moves;
    }
    
    // Value of the best piece `color` could capture right now.
    bestCaptureValue(color) {
        let best = 0;
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (!piece || piece.color !== color) continue;
                for (let toRow = 0; toRow < 8; toRow++) {
                    for (let toCol = 0; toCol < 8; toCol++) {
                        const target = this.board[toRow][toCol];
                        if (target && target.color !== color && PIECE_VALUES[target.type] > best &&
                            this.isValidMove(row, col, toRow, toCol)) {
                            best = PIECE_VALUES[target.type];
                        }
                    }
                }
            }
        }
        return best;
    }
    
    evaluateMove(move) {
        const { captured, piece, to, from } = move;
        const opponent = piece.color === 'white' ? 'black' : 'white';
        let score = captured ? PIECE_VALUES[captured.type] : 0;
        
        if (this.isPromotion(piece, to[0])) score += 8;
        
        // Look one reply ahead, so the AI does not leave pieces hanging.
        this.withMove(from[0], from[1], to[0], to[1], () => {
            if (!this.hasAnyLegalMove(opponent)) {
                score += this.isInCheck(opponent) ? 1000 : -50;
            }
            score -= this.bestCaptureValue(opponent);
        });
        
        // Prefer moving pieces forward (for pawns)
        if (piece.type === 'pawn' && piece.color === 'black') {
            score += (to[0] - from[0]) * 0.1; // Moving forward is good (down the board)
        }
        
        // Prefer center control
        const centerDistance = Math.abs(to[0] - 3.5) + Math.abs(to[1] - 3.5);
        score += (4 - centerDistance) * 0.1;
        
        // Random factor to make it less predictable
        score += Math.random() * 0.5;
        
        return score;
    }
    
    makeAIMove() {
        if (this.gameOver || !this.isAITurn()) {
            return;
        }
        
        const possibleMoves = this.getAllPossibleMoves('black');
        
        if (possibleMoves.length === 0) {
            // No moves available - checkmate or stalemate
            return;
        }
        
        // Evaluate all moves and pick the best one
        let bestMove = possibleMoves[0];
        let bestScore = -Infinity;
        
        for (let move of possibleMoves) {
            const score = this.evaluateMove(move);
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }
        
        // Make the move
        const [fromRow, fromCol] = bestMove.from;
        const [toRow, toCol] = bestMove.to;
        
        this.makeMove(fromRow, fromCol, toRow, toCol);
        this.finishTurn();
    }
    
    toggleAI() {
        this.aiEnabled = !this.aiEnabled;
        const aiButton = document.getElementById('ai-toggle');
        aiButton.textContent = this.aiEnabled ? 'AI: ON' : 'AI: OFF';
        aiButton.style.background = this.aiEnabled ? '#667eea' : '#999';
        
        if (this.aiEnabled) {
            this.selectedSquare = null;
            this.cancelNinja();
            this.clearHighlights();
            this.scheduleAIMove();
        } else {
            clearTimeout(this.aiTimer);
        }
    }
    
    // ---------- ninja cheat: type "ninja", then click any enemy piece ----------
    
    handleKey(e) {
        if (e.key === 'Escape' && this.ninjaReady) {
            this.cancelNinja();
            return;
        }
        if (e.key.length !== 1) return;
        
        this.cheatBuffer = (this.cheatBuffer + e.key.toLowerCase()).slice(-CHEAT_CODE.length);
        if (this.cheatBuffer === CHEAT_CODE) {
            this.cheatBuffer = '';
            this.activateNinja();
        }
    }
    
    activateNinja() {
        if (this.gameOver || this.isAITurn()) return;
        
        this.ninjaReady = true;
        this.selectedSquare = null;
        this.clearHighlights();
        this.hideWarning();
        this.highlightNinjaTargets();
        
        const ninjaMessage = document.getElementById('ninja-message');
        ninjaMessage.textContent = '🥷 Ninja is here! Click any enemy piece and he eats it. (Esc to cancel)';
        ninjaMessage.classList.add('show');
    }
    
    cancelNinja() {
        this.ninjaReady = false;
        document.getElementById('ninja-message').classList.remove('show');
        document.querySelectorAll('.ninja-target').forEach(square => square.classList.remove('ninja-target'));
    }
    
    highlightNinjaTargets() {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.color !== this.currentPlayer && piece.type !== 'king') {
                    const square = this.getSquareElement(row, col);
                    if (square) square.classList.add('ninja-target');
                }
            }
        }
    }
    
    handleNinjaClick(row, col, piece) {
        if (!piece || piece.color === this.currentPlayer) {
            this.showWarning("Hey my friend... the ninja only eats enemy pieces!");
            return;
        }
        if (piece.type === 'king') {
            this.showWarning("Hey my friend... even a ninja can't eat the king!");
            return;
        }
        
        this.board[row][col] = null;
        const player = this.currentPlayer === 'white' ? 'White' : 'Black';
        this.moveHistory.push(`${this.moveHistory.length + 1}. ${player} 🥷 ninja ate ${piece.color} ${piece.type} on ${FILES[col]}${8 - row}`);
        this.updateMoveHistory();
        
        this.cancelNinja();
        this.finishTurn();
        this.showNinjaStrike(row, col);
    }
    
    showNinjaStrike(row, col) {
        const square = this.getSquareElement(row, col);
        if (!square) return;
        
        const ninja = document.createElement('div');
        ninja.className = 'piece ninja-strike';
        ninja.textContent = '🥷';
        square.appendChild(ninja);
        setTimeout(() => ninja.remove(), 900);
    }
    
    setupEventListeners() {
        document.getElementById('reset-btn').addEventListener('click', () => this.resetGame());
        document.getElementById('flip-board').addEventListener('click', () => this.flipBoard());
        document.getElementById('ai-toggle').addEventListener('click', () => this.toggleAI());
        document.addEventListener('keydown', (e) => this.handleKey(e));
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new ChessGame();
});
