const FILES = 'abcdefgh';

// Centipawn values used by the AI.
const VALUES = { pawn: 100, knight: 320, bishop: 330, rook: 500, queen: 900, king: 0 };

// Piece-square tables from White's point of view, row 0 = rank 8 (same layout as this.board).
// Black uses the vertically mirrored square.
const PST = {
    pawn: [
          0,   0,   0,   0,   0,   0,   0,   0,
         50,  50,  50,  50,  50,  50,  50,  50,
         10,  10,  20,  30,  30,  20,  10,  10,
          5,   5,  10,  25,  25,  10,   5,   5,
          0,   0,   0,  20,  20,   0,   0,   0,
          5,  -5, -10,   0,   0, -10,  -5,   5,
          5,  10,  10, -20, -20,  10,  10,   5,
          0,   0,   0,   0,   0,   0,   0,   0
    ],
    knight: [
        -50, -40, -30, -30, -30, -30, -40, -50,
        -40, -20,   0,   0,   0,   0, -20, -40,
        -30,   0,  10,  15,  15,  10,   0, -30,
        -30,   5,  15,  20,  20,  15,   5, -30,
        -30,   0,  15,  20,  20,  15,   0, -30,
        -30,   5,  10,  15,  15,  10,   5, -30,
        -40, -20,   0,   5,   5,   0, -20, -40,
        -50, -40, -30, -30, -30, -30, -40, -50
    ],
    bishop: [
        -20, -10, -10, -10, -10, -10, -10, -20,
        -10,   0,   0,   0,   0,   0,   0, -10,
        -10,   0,   5,  10,  10,   5,   0, -10,
        -10,   5,   5,  10,  10,   5,   5, -10,
        -10,   0,  10,  10,  10,  10,   0, -10,
        -10,  10,  10,  10,  10,  10,  10, -10,
        -10,   5,   0,   0,   0,   0,   5, -10,
        -20, -10, -10, -10, -10, -10, -10, -20
    ],
    rook: [
          0,   0,   0,   0,   0,   0,   0,   0,
          5,  10,  10,  10,  10,  10,  10,   5,
         -5,   0,   0,   0,   0,   0,   0,  -5,
         -5,   0,   0,   0,   0,   0,   0,  -5,
         -5,   0,   0,   0,   0,   0,   0,  -5,
         -5,   0,   0,   0,   0,   0,   0,  -5,
         -5,   0,   0,   0,   0,   0,   0,  -5,
          0,   0,   0,   5,   5,   0,   0,   0
    ],
    queen: [
        -20, -10, -10,  -5,  -5, -10, -10, -20,
        -10,   0,   0,   0,   0,   0,   0, -10,
        -10,   0,   5,   5,   5,   5,   0, -10,
         -5,   0,   5,   5,   5,   5,   0,  -5,
          0,   0,   5,   5,   5,   5,   0,  -5,
        -10,   5,   5,   5,   5,   5,   0, -10,
        -10,   0,   5,   0,   0,   0,   0, -10,
        -20, -10, -10,  -5,  -5, -10, -10, -20
    ],
    king: [
        -30, -40, -40, -50, -50, -40, -40, -30,
        -30, -40, -40, -50, -50, -40, -40, -30,
        -30, -40, -40, -50, -50, -40, -40, -30,
        -30, -40, -40, -50, -50, -40, -40, -30,
        -20, -30, -30, -40, -40, -30, -30, -20,
        -10, -20, -20, -20, -20, -20, -20, -10,
         20,  20,   0,   0,   0,   0,  20,  20,
         20,  30,  10,   0,   0,  10,  30,  20
    ],
    kingEndgame: [
        -50, -40, -30, -20, -20, -30, -40, -50,
        -30, -20, -10,   0,   0, -10, -20, -30,
        -30, -10,  20,  30,  30,  20, -10, -30,
        -30, -10,  30,  40,  40,  30, -10, -30,
        -30, -10,  30,  40,  40,  30, -10, -30,
        -30, -10,  20,  30,  30,  20, -10, -30,
        -30, -30,   0,   0,   0,   0, -30, -30,
        -50, -30, -30, -30, -30, -30, -30, -50
    ]
};

const KNIGHT_STEPS = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
const KING_STEPS = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
const ROOK_DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const BISHOP_DIRS = [[-1, -1], [-1, 1], [1, -1], [1, 1]];

const PROMOTION_PIECES = ['queen', 'rook', 'bishop', 'knight'];
const PROMOTION_LETTERS = { queen: 'Q', rook: 'R', bishop: 'B', knight: 'N' };

const MATE_SCORE = 100000;
const AI_THINK_MS = 1500;
const AI_MAX_DEPTH = 6;
const QUIESCENCE_DEPTH = 6;
const SEARCH_TIMEOUT = 'search-timeout';
// A player move that loses this much more than the player's best move gets a friendly warning.
const BLUNDER_MARGIN = 250;
const BLUNDER_CHECK_MS = 300;
const BLUNDER_MESSAGE = "Ilay, pay attention, this isn't the smartest move :) Tap again to play it anyway.";
const MOVE_ANIMATION_MS = 280;

// Small sounds made with Web Audio, so no sound files are needed.
class SoundFx {
    constructor() {
        this.ctx = null;
        this.enabled = localStorage.getItem('chess-sound') !== 'off';
    }
    
    // Browsers only allow audio after a user gesture, so this runs on every click/tap.
    unlock() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;
            this.ctx = new AudioCtx();
        }
        if (this.ctx.state === 'suspended') this.ctx.resume();
    }
    
    toggle() {
        this.enabled = !this.enabled;
        localStorage.setItem('chess-sound', this.enabled ? 'on' : 'off');
        if (this.enabled) this.unlock();
        return this.enabled;
    }
    
    // One soft note: quick attack, smooth fade. `slideTo` bends the pitch down for a wooden "tock".
    note(freq, delay, duration, { type = 'sine', volume = 0.2, slideTo = null } = {}) {
        const t = this.ctx.currentTime + delay;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, t);
        if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + duration);
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(volume, t + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
        osc.connect(gain).connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + duration + 0.02);
    }
    
    whoosh(delay) {
        const t = this.ctx.currentTime + delay;
        const length = 0.35;
        const buffer = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * length), this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.Q.value = 1.5;
        filter.frequency.setValueAtTime(300, t);
        filter.frequency.exponentialRampToValueAtTime(2500, t + length);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.25, t + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + length);
        source.connect(filter).connect(gain).connect(this.ctx.destination);
        source.start(t);
    }
    
    arpeggio(freqs, delay, step, duration, options) {
        freqs.forEach((f, i) => this.note(f, delay + i * step, duration, options));
    }
    
    play(name, delay = 0) {
        if (!this.enabled || !this.ctx) return;
        const wood = { type: 'triangle', volume: 0.28 };
        switch (name) {
            case 'move':
                this.note(520, delay, 0.12, { ...wood, slideTo: 340 });
                break;
            case 'capture':
                this.note(600, delay, 0.12, { ...wood, slideTo: 380 });
                this.note(990, delay + 0.07, 0.3, { volume: 0.14 });
                break;
            case 'castle':
                this.note(520, delay, 0.1, { ...wood, slideTo: 360 });
                this.note(440, delay + 0.13, 0.12, { ...wood, slideTo: 300 });
                break;
            case 'check':
                this.note(880, delay, 0.45, { volume: 0.13 });
                this.note(1320, delay, 0.35, { volume: 0.05 });
                break;
            case 'promote':
                this.arpeggio([523, 659, 784, 1047], delay, 0.08, 0.3, { volume: 0.15 });
                break;
            case 'win':
                this.arpeggio([523, 659, 784, 1047], delay, 0.12, 0.35, { volume: 0.15 });
                this.note(1319, delay + 0.5, 0.8, { volume: 0.12 });
                break;
            case 'lose':
                this.arpeggio([523, 440, 349, 262], delay, 0.2, 0.4, { type: 'triangle', volume: 0.15 });
                break;
            case 'draw':
                this.arpeggio([523, 523], delay, 0.22, 0.3, { volume: 0.14 });
                break;
            case 'ninja':
                this.whoosh(delay);
                this.note(1200, delay + 0.25, 0.25, { volume: 0.12, slideTo: 1800 });
                break;
            case 'warning':
                this.note(220, delay, 0.18, { volume: 0.16, slideTo: 170 });
                break;
        }
    }
}

class ChessGame {
    constructor() {
        this.board = this.initializeBoard();
        this.castlingRights = this.initialCastlingRights();
        // Square a pawn just skipped with a two-square move; capturable en passant for one turn.
        this.enPassant = null;
        this.currentPlayer = 'white';
        this.selectedSquare = null;
        this.moveHistory = [];
        this.flipped = false;
        this.gameOver = false;
        this.aiEnabled = true;
        this.aiTimer = null;
        this.warningTimer = null;
        this.ninjaReady = false;
        this.pendingPromotion = null;
        this.blunderWarned = null;
        this.sound = new SoundFx();
        // The last move, animated the next time the board is drawn.
        this.animatingMove = null;
        
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
    
    initialCastlingRights() {
        return {
            white: { king: true, queen: true },
            black: { king: true, queen: true }
        };
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
        this.renderCoordinates();
        
        if (this.animatingMove) {
            this.animateMove(this.animatingMove);
            this.animatingMove = null;
        }
    }
    
    // The board is already drawn in its new state: slide the piece in from its old square.
    animateMove(move) {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        
        if (move.captured) {
            const square = this.getSquareElement(move.enPassant ? move.from[0] : move.to[0], move.to[1]);
            const ghost = document.createElement('div');
            ghost.className = 'piece captured-ghost';
            ghost.textContent = this.getPieceSymbol(move.captured);
            square.appendChild(ghost);
            ghost.animate([
                { opacity: 1, transform: 'scale(1)' },
                { opacity: 0, transform: 'scale(0.3) rotate(25deg)' }
            ], { duration: MOVE_ANIMATION_MS, easing: 'ease-in' }).onfinish = () => ghost.remove();
        }
        
        this.slidePiece(move.from, move.to);
        if (move.castle) {
            const row = move.from[0];
            const [rookFrom, rookTo] = move.castle === 'king' ? [7, 5] : [0, 3];
            this.slidePiece([row, rookFrom], [row, rookTo]);
        }
    }
    
    slidePiece(from, to) {
        const fromSquare = this.getSquareElement(from[0], from[1]);
        const toSquare = this.getSquareElement(to[0], to[1]);
        const piece = toSquare && toSquare.querySelector('.piece:not(.captured-ghost)');
        if (!fromSquare || !piece) return;
        
        const a = fromSquare.getBoundingClientRect();
        const b = toSquare.getBoundingClientRect();
        const offset = `translate(${a.left - b.left}px, ${a.top - b.top}px)`;
        piece.classList.add('moving');
        piece.animate([
            { transform: `${offset} scale(1.15)` },
            { transform: 'translate(0, 0) scale(1.15)', offset: 0.8 },
            { transform: 'translate(0, 0) scale(1)' }
        ], { duration: MOVE_ANIMATION_MS, easing: 'ease-in-out' }).onfinish = () => piece.classList.remove('moving');
    }
    
    renderCoordinates() {
        const files = [];
        const ranks = [];
        for (let i = 0; i < 8; i++) {
            const index = this.flipped ? 7 - i : i;
            files.push(`<span>${FILES[index].toUpperCase()}</span>`);
            ranks.push(`<span>${8 - index}</span>`);
        }
        for (const id of ['files-top', 'files-bottom']) document.getElementById(id).innerHTML = files.join('');
        for (const id of ['ranks-left', 'ranks-right']) document.getElementById(id).innerHTML = ranks.join('');
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
    
    opponentOf(color) {
        return color === 'white' ? 'black' : 'white';
    }
    
    // The player sits at the bottom of the board; the AI plays the other color.
    humanColor() {
        return this.flipped ? 'black' : 'white';
    }
    
    aiColor() {
        return this.opponentOf(this.humanColor());
    }
    
    isAITurn() {
        return this.aiEnabled && this.currentPlayer === this.aiColor();
    }
    
    handleSquareClick(row, col) {
        if (this.gameOver || this.isAITurn() || this.pendingPromotion) return;
        
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
            
            const moves = this.getLegalMovesFrom(selectedRow, selectedCol)
                .filter(m => m.to[0] === row && m.to[1] === col);
            const move = moves[0];
            
            if (move && move.promotion) {
                this.showPromotionPicker(moves);
                return;
            }
            
            if (move) {
                const key = this.moveKey(move);
                if (move.piece.color === this.humanColor() && this.blunderWarned !== key && this.isBlunder(move)) {
                    this.blunderWarned = key;
                    this.showWarning(BLUNDER_MESSAGE);
                    return;
                }
                this.blunderWarned = null;
                this.makeMove(move);
                this.hideWarning();
                this.finishTurn();
                return;
            }
            
            if (this.isValidMove(selectedRow, selectedCol, row, col) &&
                this.wouldMovePutKingInCheck(selectedRow, selectedCol, row, col)) {
                this.showWarning("Hey my friend... pay attention to your king! This move would put your king in check!");
                return;
            }
            
            if (selectedPiece && selectedPiece.type === 'king' && row === selectedRow && Math.abs(col - selectedCol) === 2) {
                const side = col > selectedCol ? 'king' : 'queen';
                const reason = this.castleBlockReason(this.currentPlayer, side);
                if (reason) {
                    this.showWarning(`Hey my friend... you can't castle there: ${reason}`);
                    return;
                }
            }
            
            const pieceName = selectedPiece ? selectedPiece.type : 'piece';
            this.showWarning(`Hey my friend... pay attention to the ${pieceName} movement rules! This is not a valid move.`);
            this.selectedSquare = null;
            this.clearHighlights();
            this.updateDisplay();
            this.checkGameStatus();
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
        this.currentPlayer = this.opponentOf(this.currentPlayer);
        this.updateDisplay();
        this.checkGameStatus();
        this.scheduleAIMove();
    }
    
    scheduleAIMove() {
        if (this.isAITurn() && !this.gameOver) {
            document.getElementById('current-turn').textContent = 'Black is thinking... 🤔';
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
        for (const move of this.getLegalMovesFrom(row, col)) {
            const square = this.getSquareElement(move.to[0], move.to[1]);
            if (square) square.classList.add('possible-move');
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
    
    // Geometry-only check, used to explain to the player why a click was rejected.
    isValidMove(fromRow, fromCol, toRow, toCol) {
        const piece = this.board[fromRow][fromCol];
        if (!piece) return false;
        
        const targetPiece = this.board[toRow][toCol];
        if (targetPiece && targetPiece.color === piece.color) return false;
        
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
        
        if (Math.abs(toCol - fromCol) === 1 && toRow === fromRow + direction && this.isEnPassantSquare(toRow, toCol)) {
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
    
    isEnPassantSquare(row, col) {
        return !!this.enPassant && this.enPassant[0] === row && this.enPassant[1] === col;
    }
    
    // ---------- move generation ----------
    
    onBoard(row, col) {
        return row >= 0 && row < 8 && col >= 0 && col < 8;
    }
    
    // `promotion` is the piece type a pawn becomes on the last row (defaults to queen).
    createMove(fromRow, fromCol, toRow, toCol, castle = null, promotion = 'queen') {
        const piece = this.board[fromRow][fromCol];
        const enPassant = piece.type === 'pawn' && fromCol !== toCol && this.isEnPassantSquare(toRow, toCol);
        return {
            from: [fromRow, fromCol],
            to: [toRow, toCol],
            piece,
            // En passant captures the pawn beside the mover, not a piece on the target square.
            captured: enPassant ? this.board[fromRow][toCol] : this.board[toRow][toCol],
            promotion: this.isPromotion(piece, toRow) ? promotion : null,
            castle,
            enPassant
        };
    }
    
    // Moves that follow the piece rules but may still leave the own king in check.
    addPieceMoves(row, col, moves, capturesOnly = false) {
        const piece = this.board[row][col];
        const color = piece.color;
        
        const tryTarget = (r, c) => {
            if (!this.onBoard(r, c)) return false;
            const target = this.board[r][c];
            if (target && target.color === color) return false;
            if (!capturesOnly || target) moves.push(this.createMove(row, col, r, c));
            return !target;
        };
        
        switch (piece.type) {
            case 'pawn': {
                const dir = color === 'white' ? -1 : 1;
                const startRow = color === 'white' ? 6 : 1;
                const one = row + dir;
                const pushPawn = (r, c) => {
                    if (!this.isPromotion(piece, r)) {
                        moves.push(this.createMove(row, col, r, c));
                        return;
                    }
                    for (const type of PROMOTION_PIECES) moves.push(this.createMove(row, col, r, c, null, type));
                };
                if (this.onBoard(one, col) && !this.board[one][col]) {
                    if (!capturesOnly || this.isPromotion(piece, one)) pushPawn(one, col);
                    const two = row + 2 * dir;
                    if (!capturesOnly && row === startRow && !this.board[two][col]) {
                        moves.push(this.createMove(row, col, two, col));
                    }
                }
                for (const dc of [-1, 1]) {
                    const c = col + dc;
                    if (!this.onBoard(one, c)) continue;
                    const target = this.board[one][c];
                    if ((target && target.color !== color) || this.isEnPassantSquare(one, c)) pushPawn(one, c);
                }
                break;
            }
            case 'knight':
                for (const [dr, dc] of KNIGHT_STEPS) tryTarget(row + dr, col + dc);
                break;
            case 'king':
                for (const [dr, dc] of KING_STEPS) tryTarget(row + dr, col + dc);
                if (!capturesOnly) {
                    for (const side of ['king', 'queen']) {
                        if (!this.castleBlockReason(color, side)) {
                            moves.push(this.createMove(row, col, row, side === 'king' ? 6 : 2, side));
                        }
                    }
                }
                break;
            default: {
                const dirs = piece.type === 'rook' ? ROOK_DIRS
                    : piece.type === 'bishop' ? BISHOP_DIRS
                    : ROOK_DIRS.concat(BISHOP_DIRS);
                for (const [dr, dc] of dirs) {
                    let r = row + dr;
                    let c = col + dc;
                    while (tryTarget(r, c)) {
                        r += dr;
                        c += dc;
                    }
                }
            }
        }
    }
    
    generatePseudoMoves(color, capturesOnly = false) {
        const moves = [];
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.color === color) this.addPieceMoves(row, col, moves, capturesOnly);
            }
        }
        return moves;
    }
    
    isLegal(move) {
        const undo = this.applyMove(move);
        const legal = !this.isInCheck(move.piece.color);
        this.undoMove(undo);
        return legal;
    }
    
    getLegalMovesFrom(row, col) {
        const piece = this.board[row][col];
        if (!piece) return [];
        const moves = [];
        this.addPieceMoves(row, col, moves);
        return moves.filter(m => this.isLegal(m));
    }
    
    getAllPossibleMoves(color) {
        return this.generatePseudoMoves(color).filter(m => this.isLegal(m));
    }
    
    hasAnyLegalMove(color) {
        return this.generatePseudoMoves(color).some(m => this.isLegal(m));
    }
    
    // ---------- castling ----------
    
    // Returns null when castling is allowed, otherwise a friendly reason.
    castleBlockReason(color, side) {
        const homeRow = color === 'white' ? 7 : 0;
        const rookCol = side === 'king' ? 7 : 0;
        const king = this.board[homeRow][4];
        const rook = this.board[homeRow][rookCol];
        
        if (!this.castlingRights[color][side] ||
            !king || king.type !== 'king' || king.color !== color ||
            !rook || rook.type !== 'rook' || rook.color !== color) {
            return 'your king or that rook already moved.';
        }
        
        const between = side === 'king' ? [5, 6] : [1, 2, 3];
        if (between.some(c => this.board[homeRow][c])) {
            return 'there are pieces between the king and the rook.';
        }
        
        const opponent = this.opponentOf(color);
        if (this.isSquareAttacked(homeRow, 4, opponent)) {
            return 'your king is in check.';
        }
        
        const path = side === 'king' ? [5, 6] : [3, 2];
        if (path.some(c => this.isSquareAttacked(homeRow, c, opponent))) {
            return 'the king would pass through or land on an attacked square.';
        }
        
        return null;
    }
    
    // Board left/right depends on whether it's flipped.
    castleSideFor(screenSide) {
        return (screenSide === 'left') !== this.flipped ? 'queen' : 'king';
    }
    
    castle(screenSide) {
        if (this.gameOver) return;
        if (this.isAITurn()) {
            this.showWarning("Hey my friend... wait for your turn!");
            return;
        }
        if (this.ninjaReady) this.cancelNinja();
        this.cancelPromotion();
        
        const side = this.castleSideFor(screenSide);
        const reason = this.castleBlockReason(this.currentPlayer, side);
        if (reason) {
            this.showWarning(`Hey my friend... you can't castle ${screenSide} now: ${reason}`);
            return;
        }
        
        const homeRow = this.currentPlayer === 'white' ? 7 : 0;
        this.makeMove(this.createMove(homeRow, 4, homeRow, side === 'king' ? 6 : 2, side));
        this.hideWarning();
        this.finishTurn();
    }
    
    updateCastleButtons() {
        for (const screenSide of ['left', 'right']) {
            const button = document.getElementById(`castle-${screenSide}`);
            const side = this.castleSideFor(screenSide);
            const label = screenSide === 'left' ? 'Left' : 'Right';
            button.textContent = `🏰 Castle ${label} (${side === 'king' ? 'O-O' : 'O-O-O'})`;
            
            const reason = this.gameOver ? 'The game is over.'
                : this.isAITurn() ? 'Wait for your turn.'
                : this.castleBlockReason(this.currentPlayer, side);
            button.classList.toggle('unavailable', !!reason);
            button.title = reason ? `Can't castle now: ${reason}` : `Castle ${side}-side now`;
        }
    }
    
    // A move from/to a king or rook home square removes the matching castling right.
    updateCastlingRights(row, col) {
        const rights = this.castlingRights;
        if (row === 7 && col === 4) { rights.white.king = false; rights.white.queen = false; }
        if (row === 7 && col === 0) rights.white.queen = false;
        if (row === 7 && col === 7) rights.white.king = false;
        if (row === 0 && col === 4) { rights.black.king = false; rights.black.queen = false; }
        if (row === 0 && col === 0) rights.black.queen = false;
        if (row === 0 && col === 7) rights.black.king = false;
    }
    
    // ---------- applying moves ----------
    
    applyMove(move) {
        const { from, to, piece, captured } = move;
        const undo = {
            move,
            rights: {
                white: { ...this.castlingRights.white },
                black: { ...this.castlingRights.black }
            },
            enPassant: this.enPassant
        };
        
        this.board[to[0]][to[1]] = move.promotion ? { type: move.promotion, color: piece.color } : piece;
        this.board[from[0]][from[1]] = null;
        if (move.enPassant) this.board[from[0]][to[1]] = null;
        
        this.enPassant = piece.type === 'pawn' && Math.abs(to[0] - from[0]) === 2
            ? [(from[0] + to[0]) / 2, from[1]]
            : null;
        
        if (move.castle) {
            const row = from[0];
            const [rookFrom, rookTo] = move.castle === 'king' ? [7, 5] : [0, 3];
            this.board[row][rookTo] = this.board[row][rookFrom];
            this.board[row][rookFrom] = null;
        }
        
        this.updateCastlingRights(from[0], from[1]);
        this.updateCastlingRights(to[0], to[1]);
        undo.captured = captured;
        return undo;
    }
    
    undoMove(undo) {
        const { from, to, piece, castle, enPassant } = undo.move;
        this.board[from[0]][from[1]] = piece;
        if (enPassant) {
            this.board[to[0]][to[1]] = null;
            this.board[from[0]][to[1]] = undo.captured;
        } else {
            this.board[to[0]][to[1]] = undo.captured;
        }
        
        if (castle) {
            const row = from[0];
            const [rookFrom, rookTo] = castle === 'king' ? [7, 5] : [0, 3];
            this.board[row][rookFrom] = this.board[row][rookTo];
            this.board[row][rookTo] = null;
        }
        
        this.castlingRights = undo.rights;
        this.enPassant = undo.enPassant;
    }
    
    makeMove(move) {
        this.applyMove(move);
        this.animatingMove = move;
        this.playMoveSound(move);
        this.moveHistory.push(this.getMoveNotation(move));
        this.updateMoveHistory();
    }
    
    playMoveSound(move) {
        const name = move.promotion ? 'promote' : move.castle ? 'castle' : move.captured ? 'capture' : 'move';
        this.sound.play(name);
        if (this.isInCheck(this.opponentOf(move.piece.color))) this.sound.play('check', 0.12);
    }
    
    // Plays a move on the board, runs fn, then puts everything back.
    withMove(fromRow, fromCol, toRow, toCol, fn) {
        const undo = this.applyMove(this.createMove(fromRow, fromCol, toRow, toCol));
        try {
            return fn();
        } finally {
            this.undoMove(undo);
        }
    }
    
    getMoveNotation(move) {
        const { piece, from, to, captured, promotion, castle, enPassant } = move;
        const number = this.moveHistory.length + 1;
        const player = piece.color === 'white' ? 'White' : 'Black';
        
        if (castle) {
            return `${number}. ${player} castles ${castle}-side (${castle === 'king' ? 'O-O' : 'O-O-O'})`;
        }
        
        const fromSquare = FILES[from[1]] + (8 - from[0]);
        const toSquare = FILES[to[1]] + (8 - to[0]);
        const capture = captured ? 'x' : '';
        const promo = promotion ? `=${PROMOTION_LETTERS[promotion]}` : '';
        const ep = enPassant ? ' e.p.' : '';
        return `${number}. ${player} ${piece.type} ${fromSquare}${capture}${toSquare}${promo}${ep}`;
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
    
    // ---------- check detection ----------
    
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
    
    isSquareAttacked(row, col, byColor) {
        const isPiece = (r, c, ...types) => {
            if (!this.onBoard(r, c)) return false;
            const p = this.board[r][c];
            return p && p.color === byColor && types.includes(p.type);
        };
        
        // A white pawn attacks upward (row - 1), so it sits one row below the target.
        const pawnRow = byColor === 'white' ? row + 1 : row - 1;
        if (isPiece(pawnRow, col - 1, 'pawn') || isPiece(pawnRow, col + 1, 'pawn')) return true;
        
        for (const [dr, dc] of KNIGHT_STEPS) {
            if (isPiece(row + dr, col + dc, 'knight')) return true;
        }
        for (const [dr, dc] of KING_STEPS) {
            if (isPiece(row + dr, col + dc, 'king')) return true;
        }
        
        const slides = [[ROOK_DIRS, 'rook'], [BISHOP_DIRS, 'bishop']];
        for (const [dirs, slider] of slides) {
            for (const [dr, dc] of dirs) {
                let r = row + dr;
                let c = col + dc;
                while (this.onBoard(r, c)) {
                    const p = this.board[r][c];
                    if (p) {
                        if (p.color === byColor && (p.type === slider || p.type === 'queen')) return true;
                        break;
                    }
                    r += dr;
                    c += dc;
                }
            }
        }
        
        return false;
    }
    
    isInCheck(color) {
        const kingPos = this.findKing(color);
        if (!kingPos) return false;
        return this.isSquareAttacked(kingPos[0], kingPos[1], this.opponentOf(color));
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
            const justEnded = !this.gameOver;
            this.gameOver = true;
            if (inCheck) {
                const winner = this.currentPlayer === 'white' ? 'Black' : 'White';
                status.textContent = `Checkmate! ${winner} wins!`;
                const humanLost = this.aiEnabled && this.currentPlayer === this.humanColor();
                if (justEnded) this.sound.play(humanLost ? 'lose' : 'win', 0.5);
            } else {
                status.textContent = "Stalemate! It's a draw.";
                if (justEnded) this.sound.play('draw', 0.3);
            }
        } else {
            status.textContent = inCheck ? 'Check!' : '';
        }
        this.updateCastleButtons();
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
        this.sound.play('warning');
        
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
        this.updateCastleButtons();
    }
    
    // With the AI on, flipping also swaps sides: the player takes the bottom color.
    flipBoard() {
        this.flipped = !this.flipped;
        if (this.aiEnabled) {
            clearTimeout(this.aiTimer);
            this.selectedSquare = null;
            this.blunderWarned = null;
            this.cancelNinja();
            this.cancelPromotion();
            this.hideWarning();
        }
        this.updateDisplay();
        if (this.selectedSquare) this.selectSquare(...this.selectedSquare);
        if (this.ninjaReady) this.highlightNinjaTargets();
        if (this.isInCheck(this.currentPlayer)) this.checkGameStatus();
        this.scheduleAIMove();
    }
    
    resetGame() {
        clearTimeout(this.aiTimer);
        this.board = this.initializeBoard();
        this.castlingRights = this.initialCastlingRights();
        this.enPassant = null;
        this.currentPlayer = 'white';
        this.selectedSquare = null;
        this.moveHistory = [];
        this.gameOver = false;
        this.blunderWarned = null;
        this.cancelNinja();
        this.cancelPromotion();
        document.getElementById('game-status').textContent = '';
        this.hideWarning();
        this.updateDisplay();
        this.updateMoveHistory();
        this.scheduleAIMove();
    }
    
    // ---------- AI: alpha-beta search with iterative deepening ----------
    
    // Static score from `color`'s point of view: material + piece placement.
    evaluate(color) {
        let nonPawnMaterial = 0;
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const p = this.board[row][col];
                if (p && p.type !== 'pawn' && p.type !== 'king') nonPawnMaterial += VALUES[p.type];
            }
        }
        const endgame = nonPawnMaterial <= 1600;
        
        let score = 0;
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const p = this.board[row][col];
                if (!p) continue;
                const table = p.type === 'king' && endgame ? PST.kingEndgame : PST[p.type];
                const index = (p.color === 'white' ? row : 7 - row) * 8 + col;
                const value = VALUES[p.type] + table[index];
                score += p.color === 'white' ? value : -value;
            }
        }
        return color === 'white' ? score : -score;
    }
    
    orderMoves(moves) {
        const rank = m => (m.captured ? 10 * VALUES[m.captured.type] - VALUES[m.piece.type] + 10000 : 0) +
                          (m.promotion ? 8000 + VALUES[m.promotion] : 0) +
                          (m.castle ? 50 : 0);
        return moves.sort((a, b) => rank(b) - rank(a));
    }
    
    tick() {
        if ((++this.searchNodes & 1023) === 0 && Date.now() > this.searchDeadline) {
            throw SEARCH_TIMEOUT;
        }
    }
    
    // Only follow captures at the end of the search so the AI doesn't stop mid-trade.
    quiesce(alpha, beta, color, depth) {
        this.tick();
        const standPat = this.evaluate(color);
        if (standPat >= beta) return beta;
        if (standPat > alpha) alpha = standPat;
        if (depth === 0) return alpha;
        
        for (const move of this.orderMoves(this.generatePseudoMoves(color, true))) {
            const undo = this.applyMove(move);
            let score;
            try {
                if (this.isInCheck(color)) continue;
                score = -this.quiesce(-beta, -alpha, this.opponentOf(color), depth - 1);
            } finally {
                this.undoMove(undo);
            }
            if (score >= beta) return beta;
            if (score > alpha) alpha = score;
        }
        return alpha;
    }
    
    negamax(depth, alpha, beta, color, ply) {
        this.tick();
        if (depth === 0) return this.quiesce(alpha, beta, color, QUIESCENCE_DEPTH);
        
        let legalMoves = 0;
        for (const move of this.orderMoves(this.generatePseudoMoves(color))) {
            const undo = this.applyMove(move);
            let score;
            try {
                if (this.isInCheck(color)) continue;
                legalMoves++;
                score = -this.negamax(depth - 1, -beta, -alpha, this.opponentOf(color), ply + 1);
            } finally {
                this.undoMove(undo);
            }
            if (score >= beta) return beta;
            if (score > alpha) alpha = score;
        }
        
        if (legalMoves === 0) {
            // Prefer faster mates, and slower losses.
            return this.isInCheck(color) ? -MATE_SCORE + ply : 0;
        }
        return alpha;
    }
    
    searchRoot(moves, depth, color) {
        let alpha = -Infinity;
        let bestMove = moves[0];
        for (const move of moves) {
            const undo = this.applyMove(move);
            let score;
            try {
                score = -this.negamax(depth - 1, -Infinity, -alpha, this.opponentOf(color), 1);
            } finally {
                this.undoMove(undo);
            }
            if (score > alpha) {
                alpha = score;
                bestMove = move;
            }
        }
        return { move: bestMove, score: alpha };
    }
    
    findBestMove(color) {
        const moves = this.getAllPossibleMoves(color);
        if (moves.length <= 1) return moves[0] || null;
        
        // Shuffle before the (stable) ordering so equal moves vary from game to game.
        for (let i = moves.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [moves[i], moves[j]] = [moves[j], moves[i]];
        }
        this.orderMoves(moves);
        
        this.searchNodes = 0;
        this.searchDeadline = Date.now() + AI_THINK_MS;
        let best = moves[0];
        
        for (let depth = 1; depth <= AI_MAX_DEPTH; depth++) {
            try {
                const result = this.searchRoot(moves, depth, color);
                best = result.move;
                // Search the best move first next time; it makes pruning much faster.
                moves.splice(moves.indexOf(best), 1);
                moves.unshift(best);
                if (result.score >= MATE_SCORE - 100) break;
            } catch (e) {
                if (e !== SEARCH_TIMEOUT) throw e;
                break;
            }
        }
        return best;
    }
    
    // ---------- blunder tip: warn the player once, a second tap on the same move plays it ----------
    
    moveKey(move) {
        return `${move.from.join(',')}-${move.to.join(',')}`;
    }
    
    // The mover's score after the opponent's best answer that only uses captures.
    scoreAfterCaptures(move) {
        const opponent = this.opponentOf(move.piece.color);
        const undo = this.applyMove(move);
        try {
            return -this.quiesce(-Infinity, Infinity, opponent, QUIESCENCE_DEPTH);
        } finally {
            this.undoMove(undo);
        }
    }
    
    allowsMateInOne(move) {
        const color = move.piece.color;
        const undo = this.applyMove(move);
        try {
            return this.getAllPossibleMoves(this.opponentOf(color)).some(reply => {
                const replyUndo = this.applyMove(reply);
                try {
                    return this.isInCheck(color) && !this.hasAnyLegalMove(color);
                } finally {
                    this.undoMove(replyUndo);
                }
            });
        } finally {
            this.undoMove(undo);
        }
    }
    
    // Bad only if another move is clearly better, so a lost position doesn't warn on every move.
    isBlunder(move) {
        this.searchNodes = 0;
        this.searchDeadline = Date.now() + BLUNDER_CHECK_MS;
        try {
            const others = this.getAllPossibleMoves(move.piece.color);
            if (this.allowsMateInOne(move)) return others.some(m => !this.allowsMateInOne(m));
            const played = this.scoreAfterCaptures(move);
            return others.some(m => this.scoreAfterCaptures(m) - played >= BLUNDER_MARGIN);
        } catch (e) {
            if (e !== SEARCH_TIMEOUT) throw e;
            return false;
        }
    }
    
    makeAIMove() {
        if (this.gameOver || !this.isAITurn()) {
            return;
        }
        
        const bestMove = this.findBestMove(this.aiColor());
        if (!bestMove) return;
        
        this.makeMove(bestMove);
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
            this.cancelPromotion();
            this.clearHighlights();
            this.scheduleAIMove();
        } else {
            clearTimeout(this.aiTimer);
            this.updateDisplay();
        }
        this.updateCastleButtons();
    }
    
    // ---------- ninja: press the Ninja button, then click any enemy piece ----------
    
    toggleNinja() {
        if (this.ninjaReady) {
            this.cancelNinja();
        } else {
            this.activateNinja();
        }
    }
    
    activateNinja() {
        if (this.gameOver || this.isAITurn()) return;
        this.cancelPromotion();
        
        this.ninjaReady = true;
        this.selectedSquare = null;
        this.clearHighlights();
        this.hideWarning();
        this.highlightNinjaTargets();
        
        const ninjaMessage = document.getElementById('ninja-message');
        ninjaMessage.textContent = '🥷 Ninja is here! Click any enemy piece and he eats it. (Click Ninja again or Esc to cancel)';
        ninjaMessage.classList.add('show');
        document.getElementById('ninja-btn').classList.add('armed');
    }
    
    cancelNinja() {
        this.ninjaReady = false;
        document.getElementById('ninja-message').classList.remove('show');
        document.getElementById('ninja-btn').classList.remove('armed');
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
        this.updateCastlingRights(row, col);
        this.enPassant = null;
        const player = this.currentPlayer === 'white' ? 'White' : 'Black';
        this.moveHistory.push(`${this.moveHistory.length + 1}. ${player} 🥷 ninja ate ${piece.color} ${piece.type} on ${FILES[col]}${8 - row}`);
        this.updateMoveHistory();
        
        this.cancelNinja();
        this.finishTurn();
        this.showNinjaStrike(row, col);
        this.sound.play('ninja');
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
        document.getElementById('ninja-btn').addEventListener('click', () => this.toggleNinja());
        document.getElementById('castle-left').addEventListener('click', () => this.castle('left'));
        document.getElementById('castle-right').addEventListener('click', () => this.castle('right'));
        document.getElementById('sound-btn').addEventListener('click', () => this.toggleSound());
        this.updateSoundButton();
        for (const type of ['pointerdown', 'keydown']) {
            document.addEventListener(type, () => this.sound.unlock());
        }
        document.getElementById('promotion-overlay').addEventListener('click', (e) => {
            if (e.target.id === 'promotion-overlay') this.cancelPromotion();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key !== 'Escape') return;
            if (this.pendingPromotion) this.cancelPromotion();
            else if (this.ninjaReady) this.cancelNinja();
        });
    }
    
    toggleSound() {
        this.sound.toggle();
        this.updateSoundButton();
        this.sound.play('move');
    }
    
    updateSoundButton() {
        const button = document.getElementById('sound-btn');
        button.textContent = this.sound.enabled ? '🔊 Sound: ON' : '🔇 Sound: OFF';
        button.classList.toggle('muted', !this.sound.enabled);
    }
    
    // ---------- promotion: the pawn reached the last row, the player picks his new piece ----------
    
    showPromotionPicker(moves) {
        this.pendingPromotion = moves;
        const color = moves[0].piece.color;
        const choices = document.getElementById('promotion-choices');
        choices.innerHTML = '';
        
        for (const type of PROMOTION_PIECES) {
            const button = document.createElement('button');
            button.className = 'promotion-choice';
            button.title = type.charAt(0).toUpperCase() + type.slice(1);
            button.innerHTML = `<span class="promotion-symbol">${this.getPieceSymbol({ type, color })}</span><span>${button.title}</span>`;
            button.addEventListener('click', () => this.choosePromotion(type));
            choices.appendChild(button);
        }
        document.getElementById('promotion-overlay').classList.add('show');
    }
    
    choosePromotion(type) {
        const move = this.pendingPromotion && this.pendingPromotion.find(m => m.promotion === type);
        this.cancelPromotion();
        if (!move) return;
        
        this.makeMove(move);
        this.hideWarning();
        this.finishTurn();
    }
    
    cancelPromotion() {
        this.pendingPromotion = null;
        document.getElementById('promotion-overlay').classList.remove('show');
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new ChessGame();
});
