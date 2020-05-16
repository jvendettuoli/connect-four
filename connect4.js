/** Connect Four
 *
 * Player 1 and 2 alternate turns. On each turn, a piece is dropped down a
 * column until a player gets four-in-a-row (horiz, vert, or diag) or until
 * board fills (tie)
 */

// Number of columns (WIDTH) and rows (HEIGHT) of game board
const WIDTH = 7;
const HEIGHT = 6;

let currPlayer = 1; // active player: 1 or 2
const board = []; // array of rows, each row is array of cells  (board[y][x])

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

	for (let colIdx = 0; colIdx < WIDTH; colIdx++) {
		const headCell = document.createElement('td');
		headCell.setAttribute('id', colIdx);
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
	// TODO: make a div and insert into correct table cell
	const piece = document.createElement('div');
	piece.classList.add('piece', `p${currPlayer}`);
	const cell = document.querySelector(`#\\3${y}-${x}`); // ? Why does this selector not work with just the id? It required the \3 before the x.
	cell.append(piece);
}

/** endGame: announce game end */

function endGame(msg) {
	alert(msg);
}

/** handleClick: handle click of column top to play piece */

function handleClick(evt) {
	// get x coor from ID of clicked cell and convert to number
	const x = +evt.target.id;
	// console.log(x,typeof x);

	// get next spot in column (if none, ignore click)
	const y = findSpotForCol(x);
	if (y === null) {
		return;
	}

	// place piece in board as value of currPlayer and add to HTML table
	board[y][x] = currPlayer;
	placeInTable(y, x);

	// check for win
	if (checkForWin()) {
		return endGame(`Player ${currPlayer} won!`);
	}

	// check for tie
	if (board.every((row) => row.every((cell) => cell.length !== 0))) {
		endGame('The game has ended in a tie!');
	}

	// switch players
	currPlayer = currPlayer === 1 ? 2 : 1;
}

/** checkForWin: check board cell-by-cell for "does a win start here?" */

function checkForWin() {
	function _win(cells) {
		// ? What does the underscore prefix indicate? Naming standard for functions in functions?
		// Check four cells to see if they're all color of current player
		//  - cells: list of four (y, x) cells
		//  - returns true if all are legal coordinates & all match currPlayer

		return cells.every(([ y, x ]) => y >= 0 && y < HEIGHT && x >= 0 && x < WIDTH && board[y][x] === currPlayer);
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

			// Check all possible win conditions from every cell on the board by checking all the cells within the win condition's range to see if they are all the same player.
			if (_win(horiz) || _win(vert) || _win(diagDR) || _win(diagDL)) {
				return true;
			}
		}
	}
}

makeBoard();
makeHtmlBoard();
