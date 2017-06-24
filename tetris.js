var GRID_PIXEL_SIZE = 30;
var WINDOW_PADDING = 20;

var TETROMINOS = {I: "#31C7EF", O: "#F7D308", T: "#AD4D9C", S: "#42B642", Z: "#EF2029", J: "#5A65AD", L: "#EF7921"};
var EMPTY_COLOR = "#FFFFFF";

//	Time in ms between each tick 
var TICK_DELAY = 16;
var tick = 0;

var canvas;
var context;


var MAX_ROWS = 22;
var MAX_COLS = 10;

// BUFFER_SIZE of the rows are invisible to the player 
var BUFFER_SIZE = 2;
// Row,col of top left of board
var start_pos = [0,0];

// 2d array representing the playing field
// Each spot of the array contains [bool, color]
//	where bool indicates whether the spot is an active piece
//	and color indicates the color of the spot
var play_field = [];

var current_piece = null;
var current_piece_type;

window.onload = function() {
	canvas = document.getElementById("game");
	canvas.width = window.innerWidth - WINDOW_PADDING;
	canvas.height = window.innerHeight - WINDOW_PADDING;
	
	//start_pos[0] = canvas.height / 4;
	//start_pos[1] = canvas.width / 2;
	
	//Setup play field
	for (var r = 0; r < MAX_ROWS; r++) {
		var temparray = [];
		for (var c = 0; c < MAX_COLS; c++) {
			temparray[c] = new Object;
			temparray[c].active = false;
			temparray[c].color = EMPTY_COLOR;
		}
		play_field.push(temparray);
	}
	
	context = canvas.getContext("2d");
	
	drawGrid();
	
	play();
}

function play() {
	setInterval(nextTick, TICK_DELAY);
}

function nextTick() {
	tick++;
	if (current_piece != null) moveActiveTetromino();
	else {		
		spawnTetromino();
	}
	drawPiece(current_piece, current_piece_type);
}

function moveActiveTetromino() {
	if ((tick+1) % 10 == 0) {
		// move tetromino down 1 row
		moveTetromino(1, 0);
	}
}

function spawnTetromino() {
	// TODO: random bag system
	var rand = Math.floor(Math.random() * 7);
	switch (rand) {
		// Coordinates have the origin first
		case 0:
			current_piece = [[0,4], [0,5], [1,4], [1,5]];
			current_piece_type = TETROMINOS.O;
			break;
		case 1:
			current_piece = [[1,3],[1,4],[1,5],[1,6]];
			//current_piece = [[6,3],[6,4],[6,5],[6,6]];
			current_piece_type = TETROMINOS.I;
			break;
		case 2:
			current_piece = [[1,4],[0,4],[1,3],[1,5]];
			current_piece_type = TETROMINOS.T;
			break;
		case 3:
			current_piece = [[1,4],[0,4],[0,5],[1,3]];
			current_piece_type = TETROMINOS.S;
			break;
		case 4:
			current_piece = [[1,4],[0,3],[0,4],[1,5]];
			current_piece_type = TETROMINOS.Z;
			break;
		case 5:
			current_piece = [[1,4],[0,3],[1,3],[1,5]];
			current_piece_type = TETROMINOS.J;
			break;
		case 6:
			current_piece = [[1,4],[0,5],[1,3],[1,5]];
			current_piece_type = TETROMINOS.L;
			break;
	}
}

document.addEventListener('keydown', function(event) {
	// LEFT
    if(event.keyCode == 37) {
		//drawPiece(current_piece, EMPTY_COLOR);
		moveTetromino(0, -1);
    }
	// RIGHT
    else if(event.keyCode == 39) {
		//drawPiece(current_piece, EMPTY_COLOR);
		moveTetromino(0,1);
    }
	// ROTATE L
	else if (event.keyCode == 90) {
		rotateLeft();
	}
	// ROTATE R
	else if (event.keyCode == 88) {
		rotateRight();
	}
});


function rotateLeft() {
	if (current_piece_type == TETROMINOS.O) return;
	var origin = current_piece[0];

	var moved_piece = [];
	for (var k in current_piece) {
		var temp = []
		temp[0] = current_piece[k][0] - origin[0];
		temp[1] = current_piece[k][1] - origin[1];
		// 90 degree rotation matrix
		//[0 -1]
		//[1  0]
		var row = -1 * temp[1] + origin[0];
		var col = temp[0] + origin[1];
		// Collision checks
		if (row < 0 || row > MAX_ROWS
				|| col < 0 || col > MAX_COLS) {
			// Disallow rotation
			return;
		}
		moved_piece[k] = [Math.floor(row), Math.floor(col)];
	}
	
	// Remove current piece to redraw
	// TODO: Optimize by keeping spaces that are removed then added?
	drawPiece(current_piece, EMPTY_COLOR);
	current_piece = moved_piece;
}

function rotateRight() {
	if (current_piece_type == TETROMINOS.O) return;
	
	var moved_piece = [];
	var origin = current_piece[0];
	for (var k in current_piece) {
		var temp = []
		temp[0] = current_piece[k][0] - origin[0];
		temp[1] = current_piece[k][1] - origin[1];
		// -90 degree rotation matrix
		//[0  1]
		//[-1 0]
		var row = temp[1] + origin[0];
		var col = -1 * temp[0] + origin[1];
		// Collision checks
		if (row < 0 || row > MAX_ROWS
				|| col < 0 || col > MAX_COLS) {
			// Disallow rotation
			return;
		}
		moved_piece[k] = [row, col];
	}
	
	// Remove current piece to redraw
	// TODO: Optimize by keeping spaces that are removed then added?
	drawPiece(current_piece, EMPTY_COLOR);
	current_piece = moved_piece;
}

//// -90 degree rotation matrix
////[0  1]
////[-1 0]
//function rotateRight() {
//	if (current_piece_type == TETROMINOS.O) return;
//	for (var k in current_piece) {
//		current_piece[k][0] = current_piece[k][1];
//		current_piece[k][1] = -1 * current_piece[k][0];
//	}
//}

function moveTetromino(roffset, coffset) {
	var moved_piece = [];
	
	for (k in current_piece) {
		var row = current_piece[k][0] + roffset;
		var col = current_piece[k][1] + coffset;
		// Collision checks
		if (col < 0 || col >= MAX_COLS) {
			// Hitting matrix edges
			return;
		}
		if (row >= MAX_ROWS - BUFFER_SIZE) {
			// Current piece hits bottom
			deactivatePiece();
			return;
		}
		if (play_field[row][col].color != EMPTY_COLOR
				&&	play_field[row][col].active == false) {
			// Current piece collides with inactive piece to the side
			if (roffset == 0) return;
			// Current piece collides with inactive piece below
			deactivatePiece();
			return;
		}
		
		moved_piece[k] = [row, col];
	}
	// Remove current piece to redraw
	// TODO: Optimize by keeping spaces that are removed then added?
	drawPiece(current_piece, EMPTY_COLOR);

	current_piece = moved_piece;
}

// Makes current piece inactive
function deactivatePiece() {
	for (k in current_piece) {
		play_field[current_piece[k][0]][current_piece[k][1]].active = false;
	}
	current_piece = null;
}


// Canvas functions

function drawPiece(arr, color) {
	for (k in arr) {
		colorCell(arr[k], color);
	}
}

function colorCell(coords, color) {
	// Activate this cell in play_field and set its color
	play_field[coords[0]][coords[1]].active = true;
	play_field[coords[0]][coords[1]].color = color;
	context.fillStyle = color;
	var startRow = coords[0] * GRID_PIXEL_SIZE + start_pos[0] + 1; 
	var startCol = coords[1] * GRID_PIXEL_SIZE + start_pos[1] + 1;
	context.fillRect(startCol, startRow, GRID_PIXEL_SIZE - 2, GRID_PIXEL_SIZE - 2);
}


function drawGrid() {
	var rowCount = 0;
	var colCount = 0;
	var boardHeight = start_pos[0] + GRID_PIXEL_SIZE * (MAX_ROWS - BUFFER_SIZE);
	var boardWidth = start_pos[1] + GRID_PIXEL_SIZE * MAX_COLS;
	
	// Draw horizontals
	for (var pixrow = start_pos[0]; 
			rowCount <= MAX_ROWS - BUFFER_SIZE; 
			pixrow += GRID_PIXEL_SIZE, rowCount++) {
				
		context.moveTo(start_pos[1], pixrow);
		context.lineTo(boardWidth, pixrow);
	}	

	// Draw verticals
	for (var pixcol = start_pos[1]; 
			colCount <= MAX_COLS; 
			pixcol += GRID_PIXEL_SIZE, colCount++) {
				
		context.moveTo(pixcol, start_pos[0]);
		context.lineTo(pixcol, boardHeight);
	}
	
	context.strokeStyle = "#BBBBBB";
	context.stroke();
}
