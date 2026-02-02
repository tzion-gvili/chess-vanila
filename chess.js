class ChessGame {
    constructor() {
        this.board = this.initializeBoard();
        this.currentPlayer = 'white';
        this.selectedSquare = null;
        this.moveHistory = [];
        this.flipped = false;
        this.gameOver = false;
        this.aiEnabled = true;
        
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
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
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
    
    handleSquareClick(row, col) {
        if (this.gameOver) return;
        
        const piece = this.board[row][col];
        
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
                this.selectedSquare = null;
                this.clearHighlights();
                this.hideWarning();
                this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
                this.updateDisplay();
                this.checkGameStatus();
                
                // If AI is enabled and it's black's turn, make AI move
                if (this.aiEnabled && this.currentPlayer === 'black' && !this.gameOver) {
                    setTimeout(() => {
                        this.makeAIMove();
                    }, 500);
                }
            } else {
                // Invalid move, show warning
                const pieceName = selectedPiece ? selectedPiece.type : 'piece';
                this.showWarning(`Hey my friend... pay attention to the ${pieceName} movement rules! This is not a valid move.`);
                this.selectedSquare = null;
                this.clearHighlights();
                this.updateDisplay();
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
                if (this.isValidMove(row, col, r, c)) {
                    const square = this.getSquareElement(r, c);
                    if (square) square.classList.add('possible-move');
                }
            }
        }
    }
    
    clearHighlights() {
        document.querySelectorAll('.square').forEach(square => {
            square.classList.remove('selected', 'possible-move', 'in-check');
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
    
    makeMove(fromRow, fromCol, toRow, toCol) {
        const piece = this.board[fromRow][fromCol];
        const captured = this.board[toRow][toCol];
        
        this.board[toRow][toCol] = piece;
        this.board[fromRow][fromCol] = null;
        
        // Record move
        const moveNotation = this.getMoveNotation(piece, fromRow, fromCol, toRow, toCol, captured);
        this.moveHistory.push(moveNotation);
        this.updateMoveHistory();
    }
    
    getMoveNotation(piece, fromRow, fromCol, toRow, toCol, captured) {
        const files = 'abcdefgh';
        const fromSquare = files[fromCol] + (8 - fromRow);
        const toSquare = files[toCol] + (8 - toRow);
        const capture = captured ? 'x' : '';
        return `${this.moveHistory.length + 1}. ${piece.color === 'white' ? 'White' : 'Black'} ${piece.type} ${fromSquare}${capture}${toSquare}`;
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
    
    checkGameStatus() {
        const inCheck = this.isInCheck(this.currentPlayer);
        if (inCheck) {
            const kingPos = this.findKing(this.currentPlayer);
            if (kingPos) {
                const [row, col] = kingPos;
                const square = this.getSquareElement(row, col);
                if (square) square.classList.add('in-check');
            }
            
            // Check for checkmate (simplified - just check if any move is possible)
            let hasValidMove = false;
            for (let r = 0; r < 8 && !hasValidMove; r++) {
                for (let c = 0; c < 8 && !hasValidMove; c++) {
                    const piece = this.board[r][c];
                    if (piece && piece.color === this.currentPlayer) {
                        for (let tr = 0; tr < 8 && !hasValidMove; tr++) {
                            for (let tc = 0; tc < 8 && !hasValidMove; tc++) {
                                if (this.isValidMove(r, c, tr, tc)) {
                                    hasValidMove = true;
                                }
                            }
                        }
                    }
                }
            }
            
            if (!hasValidMove) {
                this.gameOver = true;
                const winner = this.currentPlayer === 'white' ? 'Black' : 'White';
                document.getElementById('game-status').textContent = `Checkmate! ${winner} wins!`;
            } else {
                document.getElementById('game-status').textContent = 'Check!';
            }
        } else {
            document.getElementById('game-status').textContent = '';
        }
    }
    
    wouldMovePutKingInCheck(fromRow, fromCol, toRow, toCol) {
        // Make a temporary move
        const piece = this.board[fromRow][fromCol];
        const captured = this.board[toRow][toCol];
        
        this.board[toRow][toCol] = piece;
        this.board[fromRow][fromCol] = null;
        
        // Check if king is in check
        const inCheck = this.isInCheck(this.currentPlayer);
        
        // Undo the move
        this.board[fromRow][fromCol] = piece;
        this.board[toRow][toCol] = captured;
        
        return inCheck;
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
        setTimeout(() => {
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
        // This is a simplified flip - in a full implementation, you'd rotate the board
        this.updateDisplay();
    }
    
    resetGame() {
        this.board = this.initializeBoard();
        this.currentPlayer = 'white';
        this.selectedSquare = null;
        this.moveHistory = [];
        this.gameOver = false;
        document.getElementById('game-status').textContent = '';
        this.hideWarning();
        this.updateDisplay();
        
        // If AI is enabled and it's black's turn after reset, make AI move
        // (This won't happen on reset, but keeping for consistency)
    }
    
    getAllPossibleMoves(color) {
        const moves = [];
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.color === color) {
                    for (let toRow = 0; toRow < 8; toRow++) {
                        for (let toCol = 0; toCol < 8; toCol++) {
                            if (this.isValidMove(row, col, toRow, toCol)) {
                                // Check if this move would put king in check
                                if (!this.wouldMovePutKingInCheck(row, col, toRow, toCol)) {
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
        }
        return moves;
    }
    
    evaluateMove(move) {
        let score = 0;
        const { captured, piece, to, from } = move;
        
        // Prefer capturing pieces
        if (captured) {
            const pieceValues = {
                pawn: 1,
                knight: 3,
                bishop: 3,
                rook: 5,
                queen: 9,
                king: 100
            };
            score += pieceValues[captured.type] || 0;
        }
        
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
        if (this.gameOver || this.currentPlayer !== 'black' || !this.aiEnabled) {
            return;
        }
        
        const possibleMoves = this.getAllPossibleMoves('black');
        
        if (possibleMoves.length === 0) {
            // No moves available - checkmate or stalemate
            return;
        }
        
        // Evaluate all moves and pick the best one
        let bestMove = possibleMoves[0];
        let bestScore = this.evaluateMove(bestMove);
        
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
        this.currentPlayer = 'white';
        this.updateDisplay();
        this.checkGameStatus();
        
        // Clear any selection
        this.selectedSquare = null;
        this.clearHighlights();
    }
    
    toggleAI() {
        this.aiEnabled = !this.aiEnabled;
        const aiButton = document.getElementById('ai-toggle');
        aiButton.textContent = this.aiEnabled ? 'AI: ON' : 'AI: OFF';
        aiButton.style.background = this.aiEnabled ? '#667eea' : '#999';
    }
    
    setupEventListeners() {
        document.getElementById('reset-btn').addEventListener('click', () => this.resetGame());
        document.getElementById('flip-board').addEventListener('click', () => this.flipBoard());
        document.getElementById('ai-toggle').addEventListener('click', () => this.toggleAI());
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new ChessGame();
});

