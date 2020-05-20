'use-strict';
/** Connect Four
 *
 * Player 1 and 2 alternate turns. On each turn, a piece is dropped down a
 * column until a player gets four-in-a-row (horiz, vert, or diag) or until
 * board fills (tie)
 * 
 * 
 * TODO:
 * - Have indicator piece do a flip on click to drop
 * - Have Player Wins only have border animation if it is that player's turn
 * - Save board after game to be able to see past games
 * - Switch which player goes first each game
 * - Improve AI by implementing negamax
 * - Improve AI by having an array of valid moves left, to not search through the whole board each move
 * - Fix Player 1 Wins being lost offscreen at very small sizes
 */

// Number of columns (WIDTH) and rows (HEIGHT) of game board
const WIDTH = 7;
const HEIGHT = 6;

let currPlayer = 1; // active player: 1 or 2
let board = []; // array of rows, each row is array of cells  (board[y][x])
let aiMode = false;

//set event handler for window resize to control board height/width
window.addEventListener('resize', resizeBoard);

// sets event handler for toggling AI on and off. Default set to off
const aiButton = document.querySelector('button');
aiButton.addEventListener('click', () => {
	aiMode = aiMode === false ? true : false;
	aiButton.innerText = aiButton.innerText === 'AI: ON' ? 'AI: OFF' : 'AI: ON';
});

/** makeBoard: create in-JS board structure:
 *    board = array of rows, each row is array of cells  (board[y][x])
 *    based on WIDTH and HEIGHT variables 
 */
function makeBoard() {
	for (let rowIdx = 0; rowIdx < HEIGHT; rowIdx++) {
		board.push([]);
		for (let colIdx = 0; colIdx < WIDTH; colIdx++) {
			board[rowIdx].push([]);
		}
	}
}

/** makeHtmlBoard: make HTML table and row of column tops. */

function makeHtmlBoard() {
	const htmlBoard = document.querySelector('#board');
	// Creates a table row above the game board with the id 'column-top', width of WIDTH and a click event listener. Allows user to see which column they will be selecting to play a piece.
	const topRow = document.createElement('tr');
	topRow.setAttribute('id', 'column-top');
	topRow.addEventListener('click', handleClick);
	topRow.addEventListener('mouseleave', handleHover); // ? Better way to handle mouse hover?
	// aiDisplayBlock will be active when AI is on, to prevent accidental multiple clicks
	const aiDisplayBlock = document.createElement('div');
	aiDisplayBlock.classList.add('block', 'hide');
	topRow.append(aiDisplayBlock);

	// Indicator piece is the one shown in the top row when choosing where to place
	const indicatorPiece = document.createElement('div');
	indicatorPiece.setAttribute('id', 'indicator-piece');
	indicatorPiece.classList.add('hide', 'piece');
	topRow.append(indicatorPiece);

	//Create top row for selecting drop column
	for (let colIdx = 0; colIdx < WIDTH; colIdx++) {
		const headCell = document.createElement('td');
		headCell.setAttribute('id', colIdx);
		headCell.classList.add('column-top-cell');
		headCell.addEventListener('mouseenter', handleHover); //Other part of mouse hover animation
		topRow.append(headCell);
	}
	htmlBoard.append(topRow);

	// Create a HTML table row and table data elements for game board. Sets an id of 'row index - column index' for each table data element
	for (let rowIdx = 0; rowIdx < HEIGHT; rowIdx++) {
		const row = document.createElement('tr');
		for (let colIdx = 0; colIdx < WIDTH; colIdx++) {
			const cell = document.createElement('td');
			cell.setAttribute('id', `${rowIdx}-${colIdx}`);
			row.append(cell);
		}
		htmlBoard.append(row);
	}
}

// Resizes board based on window size to keep ratio
function resizeBoard() {
	const board = document.querySelector('#board');

	if (window.innerWidth < window.innerHeight) {
		board.style.width = `${window.innerWidth * 0.75}px`;
		board.style.height = `${board.getBoundingClientRect().width}px`;
	}
	else {
		board.style.height = `${window.innerHeight * 0.75}px`;
		board.style.width = `${board.getBoundingClientRect().height}px`;
	}
	scalePieces(); // ? Bug where this doesn't fire when resizing window via drag to corner. Works with any other scaling, and resizes once you drop one due to be called in placeInTable
}

// Scales the piece size and border to match changes in cell size. Called in Resize() and placeInTable()
function scalePieces() {
	const pieces = document.querySelectorAll('.piece');
	const cell = document.querySelector('td');
	const cellHeight = cell.getBoundingClientRect().height;

	pieces.forEach((piece) => {
		piece.style.setProperty('--piece-size', `${cellHeight * 0.8}px`);
		piece.style.setProperty('--border-size', `${cellHeight * 0.8 * 0.25}px`);
	});
}

/** findSpotForCol: given column x, return top empty y (null if filled) */
function findSpotForCol(x) {
	for (let y = HEIGHT - 1; y >= 0; y--) {
		if (board[y][x].length === 0) {
			return y;
		}
	}
	return null;
}

/** placeInTable: update DOM to place piece into HTML table of board */
function placeInTable(y, x) {
	const piece = document.createElement('div');
	const indicatorRow = document.querySelector('#column-top');
	const cell = document.querySelector(`#\\3${y}-${x}`); // ? Why does this selector not work with just the id? It required the \3 before the x.

	piece.classList.add('piece', `p${currPlayer}`, 'drop');
	indicatorRow.append(piece);

	scalePieces();

	if (currPlayer === 1) {
		piece.style.borderColor = 'cyan';
	}
	else {
		piece.style.borderColor = 'magenta';
	}

	dropPiece(piece, cell, indicatorRow, x, y);
}

// Handles the animation for the dropping piece by calculating distances based on current board size
function dropPiece(piece, cell, indicatorRow, x, y) {
	// Sets drop piece's starting location for animation, based on board size
	piece.style.setProperty(
		'--drop-start',
		`${x * (indicatorRow.getBoundingClientRect().width / WIDTH) +
			indicatorRow.getBoundingClientRect().width * 0.012}px`
	);
	// Sets drop piece's end location for animation, based on board size
	piece.style.setProperty(
		'--drop-end',
		`${(y + 1) * cell.getBoundingClientRect().height + cell.getBoundingClientRect().height * 0.1}px`
	);
	// Sets drop piece's bounce height, based on board size
	piece.style.setProperty(
		'--drop-bounce',
		`${(y + 1) * cell.getBoundingClientRect().height +
			cell.getBoundingClientRect().height * 0.1 -
			cell.getBoundingClientRect().height * 0.25}px`
	);
	// Sets animation duration based on how much space is left in column
	piece.style.setProperty('--drop-time', `${1000 * ((y + 1) / HEIGHT)}ms`);
	// Wait animation duration and then change piece to be set in board
	setTimeout(() => {
		piece.classList.remove('drop');
		piece.classList.add('on-board');
		cell.append(piece);
		resizeBoard();
	}, 1000 * ((y + 1) / HEIGHT) + 100);
}

/** endGame: announce game end */
function endGame(msg, winner) {
	updateSessionScore(winner);
	updateDisplayScore();
	endGameReset(msg);
}

// Displays who won and resets gameboard for next match
function endGameReset(msg) {
	const fixedSplash = document.createElement('div');
	document.body.append(fixedSplash);
	fixedSplash.innerText = msg;
	fixedSplash.classList.add('endgame');
	// After timeout the splash screen is removed, board and player are reset, a new board is created both for HTML and game state, and styles are updated
	setTimeout(() => {
		fixedSplash.remove();
		board = [];
		currPlayer = 1;
		makeBoard();
		document.querySelector('#board').innerHTML = '';
		makeHtmlBoard();
		resizeBoard();
		toggleGameBoardStyle;
		updateDisplayScore();
	}, 4000);
}

// Update sessionStorage with the number of wins for each player. Check sessionStorage for existing score or initilizatizes to 0 - 0
function updateSessionScore(winner) {
	const winTracker = JSON.parse(sessionStorage.getItem('wins')) || { p1: 0, p2: 0 };
	winTracker[`p${winner}`] += 1;

	sessionStorage.setItem('wins', JSON.stringify(winTracker));
}
// Updates score display from sessionStorage
function updateDisplayScore() {
	const p1Score = document.querySelector('#p1-score');
	const p2Score = document.querySelector('#p2-score');

	p1Score.innerText = JSON.parse(sessionStorage.getItem('wins')).p1;
	p2Score.innerText = JSON.parse(sessionStorage.getItem('wins')).p2;
}

/** handleClick: handle click of column top to play piece */
function handleClick(evt) {
	// get x coor from ID of clicked cell and convert to number
	if (evt.target.classList.value === 'block') return;
	const x = +evt.target.id;

	// get next spot in column (if none, ignore click)
	const y = findSpotForCol(x);
	if (y === null) {
		return;
	}

	// place piece in board as value of currPlayer and add to HTML table
	board[y][x] = currPlayer;
	placeInTable(y, x);

	// check for win
	if (checkForWin(board, currPlayer)) {
		return endGame(`Player ${currPlayer} won!`, currPlayer);
	}

	// check for tie
	if (board.every((row) => row.every((cell) => cell.length !== 0))) {
		endGame('The game has ended in a tie!');
	}

	// switch players after move
	currPlayer = currPlayer === 1 ? 2 : 1;

	// Sets the style of the board depending on the current player
	toggleGameBoardStyle();

	// If AI Mode is active, locks the player out of board and takes AI's turn
	if (aiMode === true && currPlayer === 2) {
		document.querySelector('#indicator-piece').classList.add('hide');
		const aiDisplayBlock = document.querySelector('.block');
		aiDisplayBlock.classList.remove('hide');

		setTimeout(() => {
			aiDisplayBlock.classList.add('hide');
			document.querySelector('#indicator-piece').classList.remove('hide');

			aiPlayer();
		}, 1250);
	}
}

// Handles hovering mouse over possible drop spots by displaying indicator piece and moving it based on column
function handleHover(evt) {
	const indicatorPiece = document.querySelector('#indicator-piece');

	if (evt.type === 'mouseenter') {
		const id = parseInt(evt.target.getAttribute('id'));
		const width = evt.target.getBoundingClientRect().width;
		const pieceHeight = indicatorPiece.getBoundingClientRect().height;

		indicatorPiece.style.left = `${id * width}px`;
		indicatorPiece.style.setProperty('--piece-width', `${pieceHeight}px`);
		indicatorPiece.classList.remove('hide');
	}
	else {
		indicatorPiece.classList.add('hide');
	}
}

//switch game board styling based on player. Currently only changes indicator piece color
function toggleGameBoardStyle() {
	const topRow = document.querySelector('#column-top');
	if (currPlayer === 1) topRow.style.setProperty('--indicator-piece-color', 'rgba(0,255,255,1)');
	if (currPlayer === 2) topRow.style.setProperty('--indicator-piece-color', 'rgba(255,0,255,1)');
}

/** checkForWin: check board cell-by-cell for "does a win start here?" */
function checkForWin(gameBoard, player) {
	function _win(cells) {
		// ? What does the underscore prefix indicate? Naming standard for functions in functions?
		// Check four cells to see if they're all color of current player
		//  - cells: list of four (y, x) cells
		//  - returns true if all are legal coordinates & all match currPlayer

		return cells.every(([ y, x ]) => y >= 0 && y < HEIGHT && x >= 0 && x < WIDTH && gameBoard[y][x] === player);
	}

	// Loop through each row
	for (let y = 0; y < HEIGHT; y++) {
		//Loop through each column cell within the row
		for (let x = 0; x < WIDTH; x++) {
			// Sets possible win conditions to variables for clarity and ease of use
			const horiz = [ [ y, x ], [ y, x + 1 ], [ y, x + 2 ], [ y, x + 3 ] ];
			const vert = [ [ y, x ], [ y + 1, x ], [ y + 2, x ], [ y + 3, x ] ];
			const diagDR = [ [ y, x ], [ y + 1, x + 1 ], [ y + 2, x + 2 ], [ y + 3, x + 3 ] ];
			const diagDL = [ [ y, x ], [ y + 1, x - 1 ], [ y + 2, x - 2 ], [ y + 3, x - 3 ] ];

			// Check all possible win conditions from every cell on the board by checking all the cells within the win condition's range to see if they are all the same player and legal moves.
			if (_win(horiz) || _win(vert) || _win(diagDR) || _win(diagDL)) {
				return true;
			}
		}
	}
}

function aiPlayer() {
	const indicatorRow = document.querySelector('#column-top');
	const boardCopy = copyBoard(board);

	// Checks if the cell is playable, in that there is a piece or base level right below it
	function _isPlayable(y, x) {
		if (y === HEIGHT - 1) return true;
		else if (Array.isArray(boardCopy[y + 1][x])) {
			return false;
		}
		return true;
	}

	// Checks if cell has a played piece and returns true is so
	function _isFilled(y, x) {
		if (boardCopy[y][x].length !== 0) {
			return true;
		}
		return false;
	}

	// Checks if placing a piece would setup an otherwise preventable win for opponent on next turn
	function _allowsAccidentalWin(y, x, player) {
		if (y === 0) return false;
		boardCopy[y - 1][x] = player;
		if (checkForWin(boardCopy, player)) {
			boardCopy[y - 1][x] = [];

			return true;
		}
		return false;
	}

	// Checks if a given player has a winning move next turn
	function _checkForWinOrBlock(y, x, player) {
		boardCopy[y][x] = player;

		if (checkForWin(boardCopy, player)) {
			indicatorRow.childNodes[x + 2].click();
			return true;
		}
		boardCopy[y][x] = [];
	}

	//Checks if there are two opponent pieces adjacent that could create a trap
	function _checkforTrap(y, x, player) {
		// Checks cells that have the pattern of two open spots, two opponent player pieces, and one open spot
		const horizLeftBound = [ [ y, x - 1 ], [ y, x ], [ y, x + 1 ], [ y, x + 2 ], [ y, x + 3 ] ];
		// Checks all spots are legal
		if (horizLeftBound.every(([ y, x ]) => y >= 0 && y < HEIGHT && x >= 0 && x < WIDTH)) {
			// Checks if the opponent has two pieces adjacent
			if (boardCopy[y][x + 1] === player && boardCopy[y][x + 2] === player) {
				// Checks the adjacent spots are empty
				if (
					Array.isArray(boardCopy[y][x - 1]) &&
					Array.isArray(boardCopy[y][x]) &&
					Array.isArray(boardCopy[y][x + 3])
				) {
					// Places in the left most spot to block trap
					indicatorRow.childNodes[x + 2].click();
					return true;
				}
			}
		}
		//Repeats check but for rows that only have one open spot on the left
		const horizRightBound = [ [ y, x ], [ y, x + 1 ], [ y, x + 2 ], [ y, x + 3 ], [ y, x + 4 ] ];
		if (horizRightBound.every(([ y, x ]) => y >= 0 && y < HEIGHT && x >= 0 && x < WIDTH)) {
			if (boardCopy[y][x + 1] === player && boardCopy[y][x + 2] === player) {
				if (
					Array.isArray(boardCopy[y][x]) &&
					Array.isArray(boardCopy[y][x + 3]) &&
					Array.isArray(boardCopy[y][x + 4])
				) {
					indicatorRow.childNodes[x + 2].click();
					return true;
				}
			}
			else if (boardCopy[y][x + 1] === player && boardCopy[y][x + 3] === player) {
				// Checks to see if player is trying to get three pieces each apart by one to then create unbeatable trap
				if (
					Array.isArray(boardCopy[y][x]) &&
					Array.isArray(boardCopy[y][x + 2]) &&
					Array.isArray(boardCopy[y][x + 4])
				) {
					indicatorRow.childNodes[x + 4].click();
					return true;
				}
			}
		}
	}

	// AI's move prioritization
	//First checks if it has a winning move and plays it.
	for (let y = 0; y < HEIGHT; y++) {
		for (let x = 0; x < WIDTH; x++) {
			if (!_isPlayable(y, x)) continue;
			if (_isFilled(y, x)) continue;
			if (_checkForWinOrBlock(y, x, 2)) return;
		}
	}
	//Second checks if it needs to block a winning move from the other player
	for (let y = 0; y < HEIGHT; y++) {
		for (let x = 0; x < WIDTH; x++) {
			if (!_isPlayable(y, x)) continue;
			if (_isFilled(y, x)) continue;
			if (_checkForWinOrBlock(y, x, 1)) return;
		}
	}
	// Third tries to block any traps being set by player (three pieces with open spots on either side)
	for (let y = 0; y < HEIGHT; y++) {
		for (let x = 0; x < WIDTH; x++) {
			if (!_isPlayable(y, x)) continue;
			if (_isFilled(y, x)) continue;
			if (_allowsAccidentalWin(y, x, 1)) continue;
			if (_checkforTrap(y, x, 1)) return;
		}
	}

	//Fourth it plays the center, while still not allowing accidental win setups
	for (let y = 0; y < HEIGHT; y++) {
		let x = 3;
		if (!_isPlayable(y, x)) continue;
		if (_isFilled(y, x)) break;
		if (_allowsAccidentalWin(y, x, 1)) break;
		indicatorRow.childNodes[5].click();
		return;
	}

	//Fifth it plays the top most it can from left to right, while still not allowing accidental win setups
	for (let y = 0; y < HEIGHT; y++) {
		for (let x = 0; x < WIDTH; x++) {
			if (!_isPlayable(y, x)) continue;
			if (_isFilled(y, x)) continue;
			if (_allowsAccidentalWin(y, x, 1)) continue;
			indicatorRow.childNodes[x + 2].click();
			return;
		}
	}
	// Finally it will play wherever as long as it is legal
	for (let y = 0; y < HEIGHT; y++) {
		for (let x = 0; x < WIDTH; x++) {
			if (!_isPlayable(y, x)) continue;
			if (_isFilled(y, x)) continue;
			indicatorRow.childNodes[x + 2].click();
			return;
		}
	}
}

// Copies game board for use in projecting outcomes for AI moves
function copyBoard(currentBoard) {
	return currentBoard.map((inner) => inner.slice());
}

// Starts game by creating games state board, HTML board, scaling board and pieces, and updating scores if present in sessionStorage.
makeBoard();
makeHtmlBoard();
resizeBoard();
updateDisplayScore();
