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

	// Create a HTML table row and table data elements for game board. Sets an id of '
	for (let rowIdx = 0; rowIdx < HEIGHT; rowIdx++) {
		const row = document.createElement('tr');
		for (let colIdx = 0; colIdx < WIDTH; colIdx++) {
			const cell = document.createElement('td');
			cell.setAttribute('id', `${rowIdcolIdx}-${colIdx}`);
			row.append(cell);
		}
		htmlBoard.append(row);
	}
}

/** findSpotForCol: given column x, return top empty y (null if filled) */

function findSpotForCol(x) {
	// TODO: write the real version of this, rather than always returning 0
	return 0;
}

/** placeInTable: update DOM to place piece into HTML table of board */

function placeInTable(y, x) {
	// TODO: make a div and insert into correct table cell
}

/** endGame: announce game end */

function endGame(msg) {
	// TODO: pop up alert message
}

/** handleClick: handle click of column top to play piece */

function handleClick(evt) {
	// get x from ID of clicked cell
	var x = +evt.target.id;

	// get next spot in column (if none, ignore click)
	var y = findSpotForCol(x);
	if (y === null) {
		return;
	}

	// place piece in board and add to HTML table
	// TODO: add line to update in-memory board
	placeInTable(y, x);

	// check for win
	if (checkForWin()) {
		return endGame(`Player ${currPlayer} won!`);
	}

	// check for tie
	// TODO: check if all cells in board are filled; if so call, call endGame

	// switch players
	// TODO: switch currPlayer 1 <-> 2
}

/** checkForWin: check board cell-by-cell for "does a win start here?" */

function checkForWin() {
	function _win(cells) {
		// Check four cells to see if they're all color of current player
		//  - cells: list of four (y, x) cells
		//  - returns true if all are legal coordinates & all match currPlayer

		return cells.every(([ y, x ]) => y >= 0 && y < HEIGHT && x >= 0 && x < WIDTH && board[y][x] === currPlayer);
	}

	// TODO: read and understand this code. Add comments to help you.

	for (var y = 0; y < HEIGHT; y++) {
		for (var x = 0; x < WIDTH; x++) {
			var horiz = [ [ y, x ], [ y, x + 1 ], [ y, x + 2 ], [ y, x + 3 ] ];
			var vert = [ [ y, x ], [ y + 1, x ], [ y + 2, x ], [ y + 3, x ] ];
			var diagDR = [ [ y, x ], [ y + 1, x + 1 ], [ y + 2, x + 2 ], [ y + 3, x + 3 ] ];
			var diagDL = [ [ y, x ], [ y + 1, x - 1 ], [ y + 2, x - 2 ], [ y + 3, x - 3 ] ];

			if (_win(horiz) || _win(vert) || _win(diagDR) || _win(diagDL)) {
				return true;
			}
		}
	}
}

makeBoard();
makeHtmlBoard();
