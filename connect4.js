'use-strict';
/** Connect Four - OOP Refactor
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
 * - Improve checkForWin by only checking possible wins off last move
 * - Refactor AI search functions with bind, instead of mutliple calls
 */

// Add data validation
class Player {
	constructor(color, id) {
		this.color = color;
		this.id = id;
	}
}

class Game {
	constructor(width, height, ...players) {
		this.width = width;
		this.height = height;
		this.board = Object.freeze([]);
		this.aiMode = false;
		this.isgameOver = false;
		this.players = [ ...players ];

		this.currPlayer = players[0];
	}

	addEventListeners() {
		window.addEventListener('resize', () => {
			this.resizeBoard();
		});

		document.querySelector('#game-setup').innerHTML =
			document.querySelector('#game-setup').innerHTML + '<button id="ai-btn">P2 AI: OFF</button>';

		const p1SetupBtn = document.querySelector('#p1-setup');
		const p2SetupBtn = document.querySelector('#p2-setup');

		p1SetupBtn.addEventListener('click', () => {
			p1SetupBtn.innerHTML = '<div> Choose Player 1 Color: <input id="p1-color-input" type="color"></div>';
			const p1ColorInput = document.querySelector('#p1-color-input');
			p1ColorInput.addEventListener('input', () => {
				document.body.style.setProperty('--p1-color', `${p1ColorInput.value}`);
				p1SetupBtn.innerHTML = 'Player 1 Setup';
				this.players[0].color = `${p1ColorInput.value}`;
			});
		});
		p2SetupBtn.addEventListener('click', () => {
			p2SetupBtn.innerHTML = '<div> Choose Player 2 Color: <input id="p2-color-input" type="color"></div>';
			const p2ColorInput = document.querySelector('#p2-color-input');
			p2ColorInput.addEventListener('input', () => {
				document.body.style.setProperty('--p2-color', `${p2ColorInput.value}`);
				p2SetupBtn.innerHTML = 'Player 2 Setup';
				this.players[1].color = `${p2ColorInput.value}`;
			});
		});
		const startBtn = document.querySelector('#start-btn');
		startBtn.addEventListener('click', () => {
			aiButton.remove();
			let newGame = null;
			const htmlBoard = document.querySelector('#board');
			htmlBoard.innerHTML = '';
			newGame = new Game(7, 6, p1, p2);
			newGame.startGame();
		});
		const aiButton = document.querySelector('#ai-btn');
		aiButton.addEventListener('click', () => {
			this.aiMode = this.aiMode === false ? true : false;
			aiButton.innerText = aiButton.innerText === 'P2 AI: ON' ? 'P2 AI: OFF' : 'P2 AI: ON';
		});
	}

	startGame() {
		this.makeBoard();
		this.makeHtmlBoard();
		this.resizeBoard();
		this.scalePieces();
		this.addEventListeners();
		this.updateDisplayScore();
	}

	// makeBoard: create in-JS board structure:
	// board = array of rows, each row is array of cells  (board[y][x])
	// based on this.width and this.height variables
	makeBoard() {
		this.board = [];

		for (let rowIdx = 0; rowIdx < this.height; rowIdx++) {
			this.board.push([]);
			for (let colIdx = 0; colIdx < this.width; colIdx++) {
				this.board[rowIdx].push([]);
			}
		}
	}

	// Creates HTML elements for board, indicator piece, and div to block clicks during AI moves (aiDisplayBlock)
	// adds event listeners on indicator row for click and hover
	makeHtmlBoard() {
		const htmlBoard = document.querySelector('#board');
		// Creates a table row above the game board with the id 'column-top', this.width of this.width and a click event listener. Allows user to see which column they will be selecting to play a piece.
		const topRow = document.createElement('tr');
		topRow.setAttribute('id', 'column-top');
		topRow.addEventListener('click', this.handleClick.bind(this));
		topRow.addEventListener('mouseleave', this.handleHover.bind(this)); // ? Better way to handle mouse hover?
		// aiDisplayBlock will be active when AI is on, to prevent accidental multiple clicks
		const aiDisplayBlock = document.createElement('div');
		aiDisplayBlock.classList.add('block', 'hide');
		topRow.append(aiDisplayBlock);
		topRow.style.setProperty('--indicator-color', `${this.currPlayer.color}`);

		// Indicator piece is the one shown in the top row when choosing where to place
		const indicatorPiece = document.createElement('div');
		indicatorPiece.setAttribute('id', 'indicator-piece');
		indicatorPiece.classList.add('hide', 'piece');
		topRow.append(indicatorPiece);
		//Create top row for selecting drop column
		for (let colIdx = 0; colIdx < this.width; colIdx++) {
			const headCell = document.createElement('td');
			headCell.setAttribute('id', colIdx);
			headCell.classList.add('column-top-cell');
			headCell.addEventListener('mouseenter', this.handleHover.bind(this)); //Other part of mouse hover animation
			topRow.append(headCell);
		}
		htmlBoard.append(topRow);
		// Create a HTML table row and table data elements for game board. Sets an id of 'row index - column index' for each table data element
		for (let rowIdx = 0; rowIdx < this.height; rowIdx++) {
			const row = document.createElement('tr');
			for (let colIdx = 0; colIdx < this.width; colIdx++) {
				const cell = document.createElement('td');
				cell.setAttribute('id', `${rowIdx}-${colIdx}`);
				row.append(cell);
			}
			htmlBoard.append(row);
		}
	}

	// Resizes board based on window size to keep ratio
	resizeBoard() {
		const boardDiv = document.querySelector('#board');

		if (window.innerWidth < window.innerHeight) {
			boardDiv.style.width = `${window.innerWidth * 0.75}px`;
			boardDiv.style.height = `${boardDiv.getBoundingClientRect().width}px`;
		}
		else {
			boardDiv.style.height = `${window.innerHeight * 0.75}px`;
			boardDiv.style.width = `${boardDiv.getBoundingClientRect().height}px`;
		}
		this.scalePieces();
	}

	scalePieces() {
		// ? Bug where this doesn't fire when resizing window via drag to corner. Works with any other scaling, and resizes once you drop one due to be called in placeInTable
		//--Refactor to resizing in CSS by resizing on precent of container. check @media
		const pieces = document.querySelectorAll('.piece');
		const cell = document.querySelector('td');
		const cellHeight = cell.getBoundingClientRect().height;

		pieces.forEach((piece) => {
			piece.style.setProperty('--piece-size', `${cellHeight * 0.8}px`);
			piece.style.setProperty('--border-size', `${cellHeight * 0.8 * 0.25}px`);
		});
	}
	handleClick(evt) {
		// get x coor from ID of clicked cell and convert to number
		if (evt.target.classList.value === 'block') return;
		if (this.isgameOver) return;

		const x = +evt.target.id;

		// get next spot in column (if none, ignore click)
		const y = this.findSpotForCol(x);
		if (y === null) {
			return;
		}

		// place piece in board as value of currPlayer and add to HTML table
		this.board[y][x] = this.currPlayer.id;

		this.placeInTable(y, x);

		const lastPlayed = [ y, x ];

		// check for win
		if (this.checkForWin(this.board, this.currPlayer.id, lastPlayed)) {
			this.isgameOver = true;
			return this.endGame(`Player ${this.currPlayer.id} won!`, this.currPlayer.id);
		}

		// check for tie
		if (this.board.every((row) => row.every((cell) => cell.length !== 0))) {
			this.endGame('The game has ended in a tie!');
		}

		// switch players after move
		this.currPlayer = this.currPlayer === this.players[0] ? this.players[1] : this.players[0];

		// Sets the style of the board depending on the current player
		const indicatorPiece = document.querySelector('#indicator-piece');
		indicatorPiece.style.setProperty('--indicator-color', `${this.currPlayer.color}`);

		// If AI Mode is active, locks the player out of board and takes AI's turn
		if (this.aiMode === true && this.currPlayer.id === 2) {
			document.querySelector('#indicator-piece').classList.add('hide');
			const aiDisplayBlock = document.querySelector('.block');
			aiDisplayBlock.classList.remove('hide');

			setTimeout(() => {
				aiDisplayBlock.classList.add('hide');
				document.querySelector('#indicator-piece').classList.remove('hide');

				this.aiPlayer();
			}, 1250);
		}
	}
	handleHover(evt) {
		const indicatorPiece = document.querySelector('#indicator-piece');

		if (evt.type === 'mouseenter') {
			const id = parseInt(evt.target.getAttribute('id'));
			const width = evt.target.getBoundingClientRect().width;
			const pieceHeight = indicatorPiece.getBoundingClientRect().height;

			indicatorPiece.style.setProperty('--indicator-color', `${this.currPlayer.color}`);

			indicatorPiece.style.left = `${id * width}px`;
			indicatorPiece.style.setProperty('--piece-width', `${pieceHeight}px`);
			indicatorPiece.classList.remove('hide');
		}
		else {
			indicatorPiece.classList.add('hide');
		}
	}
	/** findSpotForCol: given column x, return top empty y (null if filled) */
	findSpotForCol(x) {
		for (let y = this.height - 1; y >= 0; y--) {
			if (this.board[y][x].length === 0) {
				return y;
			}
		}
		return null;
	}
	/** placeInTable: update DOM to place piece into HTML table of board */
	placeInTable(y, x) {
		const piece = document.createElement('div');
		const indicatorRow = document.querySelector('#column-top');
		const cell = document.querySelector(`#\\3${y}-${x}`); // ? Why does this selector not work with just the id? It required the \3 before the x.

		piece.classList.add('piece', `p${this.currPlayer.id}`, 'drop');
		indicatorRow.append(piece);

		this.scalePieces();
		this.dropPiece(piece, cell, indicatorRow, x, y);
	}

	// Handles the animation for the dropping piece by calculating distances based on current board size
	dropPiece(piece, cell, indicatorRow, x, y) {
		// Sets drop piece's starting location for animation, based on board size
		piece.style.setProperty(
			'--drop-start',
			`${x * (indicatorRow.getBoundingClientRect().width / this.width) +
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
		piece.style.setProperty('--drop-time', `${1000 * ((y + 1) / this.height)}ms`);
		// Wait animation duration and then change piece to be set in board
		setTimeout(() => {
			piece.classList.remove('drop');
			piece.classList.add('on-board');
			cell.append(piece);
			this.resizeBoard();
		}, 1000 * ((y + 1) / this.height) + 100);
	}

	/** checkForWin: check board cell-by-cell for "does a win start here?" */
	checkForWin(gameBoard, player, lastPlayed) {
		function _win(cells) {
			// ? What does the underscore prefix indicate? Naming standard for functions in functions?
			// Check four cells to see if they're all color of current player
			//  - cells: list of four (y, x) cells
			//  - returns true if all are legal coordinates & all match currPlayer

			return cells.every(
				([ y, x ]) => y >= 0 && y < this.height && x >= 0 && x < this.width && gameBoard[y][x] === player
			);
		}
		// Loop through each row
		for (let y = 0; y < this.height; y++) {
			//Loop through each column cell within the row
			for (let x = 0; x < this.width; x++) {
				// Sets possible win conditions to variables for clarity and ease of use
				const horiz = [ [ y, x ], [ y, x + 1 ], [ y, x + 2 ], [ y, x + 3 ] ];
				const vert = [ [ y, x ], [ y + 1, x ], [ y + 2, x ], [ y + 3, x ] ];
				const diagDR = [ [ y, x ], [ y + 1, x + 1 ], [ y + 2, x + 2 ], [ y + 3, x + 3 ] ];
				const diagDL = [ [ y, x ], [ y + 1, x - 1 ], [ y + 2, x - 2 ], [ y + 3, x - 3 ] ];

				// Check all possible win conditions from last played position on the board by checking all the cells within the win condition's range to see if they are all the same player and legal moves.
				if (
					_win.call(this, horiz) ||
					_win.call(this, vert) ||
					_win.call(this, diagDR) ||
					_win.call(this, diagDL)
				) {
					return true;
				}
			}
		}
	}

	/** endGame: announce game end */
	endGame(msg, winner) {
		this.updateSessionScore(winner);
		this.updateDisplayScore();
		this.endGameReset(msg);
	}

	// Displays who won and resets gameboard for next match
	endGameReset(msg) {
		const fixedSplash = document.createElement('div');
		document.body.append(fixedSplash);
		fixedSplash.innerText = msg;
		fixedSplash.classList.add('endgame');
		// After timeout the splash screen is removed
		setTimeout(() => {
			fixedSplash.remove();
		}, 4000);
	}

	// Update sessionStorage with the number of wins for each player. Check sessionStorage for existing score or initilizatizes to 0 - 0
	updateSessionScore(winner) {
		const winTracker = JSON.parse(sessionStorage.getItem('wins')) || { p1: 0, p2: 0 };
		winTracker[`p${winner}`] += 1;

		sessionStorage.setItem('wins', JSON.stringify(winTracker));
	}
	// Updates score display from sessionStorage
	updateDisplayScore() {
		const p1Score = document.querySelector('#p1-score');
		const p2Score = document.querySelector('#p2-score');

		p1Score.innerText = JSON.parse(sessionStorage.getItem('wins')).p1;
		p2Score.innerText = JSON.parse(sessionStorage.getItem('wins')).p2;
	}

	aiPlayer() {
		const indicatorRow = document.querySelector('#column-top');
		const boardCopy = this.copyBoard(this.board);

		// Checks if the cell is playable, in that there is a piece or base level right below it
		const _isPlayable = function(y, x) {
			if (y === this.height - 1) return true;
			else if (Array.isArray(boardCopy[y + 1][x])) {
				return false;
			}
			return true;
		};

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
			if (this.checkForWin(boardCopy, player)) {
				boardCopy[y - 1][x] = [];

				return true;
			}
			boardCopy[y - 1][x] = [];

			return false;
		}

		// Checks if a given player has a winning move next turn
		function _checkForWinOrBlock(y, x, player) {
			boardCopy[y][x] = player;

			if (this.checkForWin(boardCopy, player)) {
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
			if (horizLeftBound.every(([ y, x ]) => y >= 0 && y < this.height && x >= 0 && x < this.width)) {
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
			if (horizRightBound.every(([ y, x ]) => y >= 0 && y < this.height && x >= 0 && x < this.width)) {
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
		for (let y = 0; y < this.height; y++) {
			for (let x = 0; x < this.width; x++) {
				if (!_isPlayable.call(this, y, x)) continue;
				// if (!_isPlayable(y, x)) continue;
				if (_isFilled.call(this, y, x)) continue;
				if (_checkForWinOrBlock.call(this, y, x, 2)) return;
			}
		}
		//Second checks if it needs to block a winning move from the other player
		for (let y = 0; y < this.height; y++) {
			for (let x = 0; x < this.width; x++) {
				if (!_isPlayable.call(this, y, x)) continue;
				if (_isFilled.call(this, y, x)) continue;
				if (_checkForWinOrBlock.call(this, y, x, 1)) return;
			}
		}
		// Third tries to block any traps being set by player (three pieces with open spots on either side)
		for (let y = 0; y < this.height; y++) {
			for (let x = 0; x < this.width; x++) {
				if (!_isPlayable.call(this, y, x)) continue;
				if (_isFilled.call(this, y, x)) continue;
				if (_allowsAccidentalWin.call(this, y, x, 1)) continue;
				if (_checkforTrap.call(this, y, x, 1)) return;
			}
		}

		//Fourth it plays the center, while still not allowing accidental win setups
		for (let y = 0; y < this.height; y++) {
			let x = 3;

			if (!_isPlayable.call(this, y, x)) continue;
			if (_isFilled.call(this, y, x)) continue;
			if (_allowsAccidentalWin.call(this, y, x, 1)) break;
			indicatorRow.childNodes[5].click();
			return;
		}

		//Fifth it plays the top most it can from left to right, while still not allowing accidental win setups
		for (let y = 0; y < this.height; y++) {
			for (let x = 0; x < this.width; x++) {
				if (!_isPlayable.call(this, y, x)) continue;
				if (_isFilled.call(this, y, x)) continue;
				if (_allowsAccidentalWin.call(this, y, x, 1)) continue;

				indicatorRow.childNodes[x + 2].click();
				return;
			}
		}
		// Finally it will play wherever as long as it is legal
		for (let y = 0; y < this.height; y++) {
			for (let x = 0; x < this.width; x++) {
				if (!_isPlayable.call(this, y, x)) continue;
				if (_isFilled.call(this, y, x)) continue;
				indicatorRow.childNodes[x + 2].click();
				return;
			}
		}
	}

	copyBoard(currentBoard) {
		return currentBoard.map((inner) => inner.slice());
	}
}

const startBtn = document.querySelector('#start-btn');
const p1SetupBtn = document.querySelector('#p1-setup');
const p2SetupBtn = document.querySelector('#p2-setup');
let p1 = new Player('cyan', 1);
let p2 = new Player('magenta', 2);

p1SetupBtn.addEventListener('click', () => {
	p1SetupBtn.innerHTML = '<div> Choose Player 1 Color: <input id="p1-color-input" type="color"></div>';
	const p1ColorInput = document.querySelector('#p1-color-input');
	p1ColorInput.addEventListener('input', () => {
		document.body.style.setProperty('--p1-color', `${p1ColorInput.value}`);
		p1SetupBtn.innerHTML = 'Player 1 Setup';
		p1 = new Player(`${p1ColorInput.value}`, 1);
	});
});
p2SetupBtn.addEventListener('click', () => {
	p2SetupBtn.innerHTML = '<div> Choose Player 2 Color: <input id="p2-color-input" type="color"></div>';
	const p2ColorInput = document.querySelector('#p2-color-input');
	p2ColorInput.addEventListener('input', () => {
		document.body.style.setProperty('--p2-color', `${p2ColorInput.value}`);
		p2SetupBtn.innerHTML = 'Player 2 Setup';

		p2 = new Player(`${p2ColorInput.value}`, 2);
	});
});

startBtn.addEventListener('click', () => {
	let newGame = null;
	const htmlBoard = document.querySelector('#board');
	htmlBoard.innerHTML = '';
	newGame = new Game(7, 6, p1, p2);
	newGame.startGame();
	window.newGame = newGame;
});
