var GRID_PIXEL_SIZE = 40;
var WINDOW_PADDING = 20;

// Time in ms between each tick 
// 16ms - 60Hz
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

var gameLoopId;

var TETROMINOS = {
	I: "#31C7EF", 
	O: "#F7D308", 
	T: "#AD4D9C", 
	S: "#42B642", 
	Z: "#EF2029", 
	J: "#5A65AD", 
	L: "#EF7921"
};

var EMPTY_COLOR = "#FFFFFF";
var GHOST_COLOR = "#CCCCCC";

// Number of ticks before a piece moves down a row
var FALL_RATE = 10;

// 2d array representing the inactive pieces with the colors of every square
var inactive_pieces = [];

var current_piece = {
	active: false,
	coords: [],
	type: EMPTY_COLOR
}
var current_piece_ghost = null;


window.onload = function() {
	canvas = document.getElementById("game");
	canvas.width = window.innerWidth - WINDOW_PADDING;
	canvas.height = window.innerHeight - WINDOW_PADDING;
	
	//start_pos[0] = canvas.height / 4;
	//start_pos[1] = canvas.width / 2;
	
	//Setup inactive piece array
	for (var r = 0; r < MAX_ROWS; r++) {
		var temparray = [];
		for (var c = 0; c < MAX_COLS; c++) {
			temparray[c] = EMPTY_COLOR;
		}
		inactive_pieces.push(temparray);
	}
	
	context = canvas.getContext("2d");
	
	drawGrid();
	
	play();
}

function play() {
	gameLoopId = setInterval(nextTick, TICK_DELAY);
}

function nextTick() {
	tick++;
	if (current_piece.active) moveActiveTetromino();
	else {		
		spawnTetromino();
	}
	// Calculate ghost position
	//for (k in current_piece) {
	//	
	//}
	drawPiece(current_piece.type);
}

function moveActiveTetromino() {
	if ((tick+1) % FALL_RATE == 0) {
		// move tetromino down 1 row
		moveTetromino(1, 0);
	}
}

function spawnTetromino() {
	current_piece.active = true;
	// TODO: random bag system
	var rand = Math.floor(Math.random() * 7);
	switch (rand) {
		// Coordinates have the origin first
		
		case 0:
			current_piece.coords = [[0,4], [0,5], [1,4], [1,5]];
			current_piece.origin = [0.5, 4.5];
			current_piece.type = TETROMINOS.O;
			break;
		case 1:
			current_piece.coords = [[1,3],[1,4],[1,5],[1,6]];
			current_piece.origin = [1.5, 4.5];
			current_piece.type = TETROMINOS.I;
			break;
		case 2:
			current_piece.coords = [[1,4],[0,4],[1,3],[1,5]];
			current_piece.origin = [1,4];
			current_piece.type = TETROMINOS.T;
			break;
		case 3:
			current_piece.coords = [[1,4],[0,4],[0,5],[1,3]];
			current_piece.origin = [1,4];
			current_piece.type = TETROMINOS.S;
			break;
		case 4:
			current_piece.coords = [[1,4],[0,3],[0,4],[1,5]];
			current_piece.origin = [1,4];
			current_piece.type = TETROMINOS.Z;
			break;
		case 5:
			current_piece.coords = [[1,4],[0,3],[1,3],[1,5]];
			current_piece.origin = [1,4];
			current_piece.type = TETROMINOS.J;
			break;
		case 6:
			current_piece.coords = [[1,4],[0,5],[1,3],[1,5]];
			current_piece.origin = [1,4];
			current_piece.type = TETROMINOS.L;
			break;
	}
}

document.addEventListener('keydown', function(event) {
	// UP
	if(event.keyCode == 38) {
		hardDrop();
	}
	// LEFT
	if(event.keyCode == 37) {
		moveTetromino(0, -1);
	}
	// RIGHT
	else if(event.keyCode == 39) {
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
	if (current_piece.type == TETROMINOS.O) return;
	var origin = current_piece.origin;

	var moved_piece = [];
	for (var k in current_piece.coords) {
		var temp = []
		temp[0] = current_piece.coords[k][0] - origin[0];
		temp[1] = current_piece.coords[k][1] - origin[1];
		// 90 degree rotation matrix
		//[0 -1]
		//[1  0]
		var row = -1 * temp[1] + origin[0];
		var col = temp[0] + origin[1];
		// Collision checks
		if (row < 0 || row > MAX_ROWS
				|| col < 0 || col > MAX_COLS) {
			// Rotation would colide with walls
			return;
		}
		if (inactive_pieces[row][col] != EMPTY_COLOR) {
			// Rotation would collide with inactive piece
			return;
		}
		moved_piece[k] = [Math.floor(row), Math.floor(col)];
	}
	
	// Remove current piece to redraw
	// TODO: Optimize by keeping spaces that are removed then added?
	drawPiece(EMPTY_COLOR);
	current_piece.coords = moved_piece;
}

function rotateRight() {
	if (current_piece.type == TETROMINOS.O) return;
	var origin = current_piece.origin;

	var moved_piece = [];
	for (var k in current_piece.coords) {
		var temp = []
		temp[0] = current_piece.coords[k][0] - origin[0];
		temp[1] = current_piece.coords[k][1] - origin[1];
		// -90 degree rotation matrix
		//[0  1]
		//[-1 0]
		var row = temp[1] + origin[0];
		var col = -1 * temp[0] + origin[1];
		// Collision checks
		if (row < 0 || row > MAX_ROWS
				|| col < 0 || col > MAX_COLS) {
			// Rotation would colide with walls
			return;
		}
		if (inactive_pieces[row][col] != EMPTY_COLOR) {
			// Rotation would collide with inactive piece
			return;
		}
		moved_piece[k] = [row, col];
	}
	
	// Remove current piece to redraw
	// TODO: Optimize by keeping spaces that are removed then added?
	drawPiece(EMPTY_COLOR);
	current_piece.coords = moved_piece;
}

function moveTetromino(roffset, coffset) {
	if (!current_piece.active) return;
	
	var moved_piece = [];
	
	for (k in current_piece.coords) {
		var row = current_piece.coords[k][0] + roffset;
		var col = current_piece.coords[k][1] + coffset;
		// Collision checks
		if (col < 0 || col >= MAX_COLS) {
			// Hitting matrix edges
			return;
		}
		if (row >= MAX_ROWS) {
			// Current piece hits bottom
			deactivatePiece();
			return;
		}
		if (inactive_pieces[row][col] != EMPTY_COLOR) {
			// Current piece collides with inactive piece to the side
			if (roffset == 0) return;
			// Current piece collides with inactive piece below
			deactivatePiece();
			return;
		}
		
		moved_piece[k] = [row, col];
	}
	current_piece.origin[0] += roffset;
	current_piece.origin[1] += coffset;
	// Remove current piece to redraw
	// TODO: Optimize by keeping spaces that are removed then added?
	drawPiece(EMPTY_COLOR);

	current_piece.coords = moved_piece;
}

function hardDrop() {
	// TODO
	
}

// Makes current piece inactive
function deactivatePiece() {
	var game_over = true;
	for (k in current_piece.coords) {
		inactive_pieces[current_piece.coords[k][0]][current_piece.coords[k][1]] = current_piece.type;
		// Ensure piece visibility
		drawPiece(current_piece.type);
		// Game is only ended if the piece is deactivated 
		//	above the buffer; that is, no cells of the piece
		//	are below the buffer
		if (current_piece.coords[k][0] >= BUFFER_SIZE) game_over = false;
	}
	current_piece.active = false;
	if (game_over) {
		clearInterval(gameLoopId);
		alert("Game Over");
	}
}


// Canvas functions

function drawPiece(color) {
	for (k in current_piece.coords) {
		colorCell(current_piece.coords[k], color);
	}
}

function colorCell(coords, color) {
	context.fillStyle = color;
	var rowCoord = coords[0] - BUFFER_SIZE;
	if (rowCoord < 0) return; // Don't draw if in buffer zone
	var startRow = rowCoord * GRID_PIXEL_SIZE + start_pos[0] + 1; 
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
