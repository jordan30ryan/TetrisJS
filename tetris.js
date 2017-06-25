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


var EMPTY = "#FFFFFF"
var GHOST_COLOR = "#CCCCCC";

// Number of ticks before a piece moves down a row
var FALL_RATE = 30;

// 2d array representing the inactive pieces with the colors of every square
var inactive_pieces = [];

var current_piece = {
	active: false,
    clearing: false,
	coords: [],
    ghost_coords: [],
	type: EMPTY
}

var cleared_rows = [];
// The tick at which the next clear will happen
var next_clear_tick = -1;
// The number of ticks between a line clear and the visual movement
var CLEAR_TICK_DELAY = 10;

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
			temparray[c] = EMPTY;
		}
		inactive_pieces.push(temparray);
	}
	
	context = canvas.getContext("2d");
	
	drawGrid();
	
	play();
}

document.addEventListener('keydown', function(event) {
    // block input if in the middle of clearing 
    if (current_piece.clearing) return;
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

function play() {
	gameLoopId = setInterval(nextTick, TICK_DELAY);
}

function nextTick() {
	tick++;
    if (tick == next_clear_tick) {
        moveDownRows();
        current_piece.clearing = false;
    }
    // If rows are being cleared
    else if (current_piece.clearing) {
        return;
    }
	else if (current_piece.active) {
        moveActiveTetromino();
    }
	else {		
		spawnTetromino();
	}

    calculateCurrentPieceGhost();

	if (current_piece.active) { 
        drawPiece(); 
    }
}

// Calculate ghost position
function calculateCurrentPieceGhost() {
    // Largest downward shift the current piece can make without moving 
    var largest_shift = MAX_ROWS;
    // Calculate the largest shift
	for (var cell in current_piece.coords) {
        var highest_available_position = MAX_ROWS - 1;
        for (var row = highest_available_position; row > current_piece.coords[cell][0]; row--) {
            if (inactive_pieces[row][current_piece.coords[cell][1]] != EMPTY) {
                highest_available_position = row - 1;
            }
        }
        var shift = highest_available_position - current_piece.coords[cell][0];
        if (shift < largest_shift) largest_shift = shift;
	}
    // Apply largest shift to the current coords and set those as the ghost coords
    current_piece.ghost_coords = [];
    for (cell in current_piece.coords) {
        current_piece.ghost_coords.push([current_piece.coords[cell][0] + largest_shift,
                                        current_piece.coords[cell][1]]);
    }
}

function hardDrop() {
    clearPiece();
    current_piece.coords = current_piece.ghost_coords;
    deactivatePiece();
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
		if (inactive_pieces[row][col] != EMPTY) {
			// Rotation would collide with inactive piece
			return;
		}
		moved_piece[k] = [Math.floor(row), Math.floor(col)];
	}
	
	// Remove current piece to redraw
	// TODO: Optimize by keeping spaces that are removed then added?
	clearPiece();
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
		if (inactive_pieces[row][col] != EMPTY) {
			// Rotation would collide with inactive piece
			return;
		}
		moved_piece[k] = [row, col];
	}
	
	// Remove current piece to redraw
	// TODO: Optimize by keeping spaces that are removed then added?
	clearPiece();
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
		if (inactive_pieces[row][col] != EMPTY) {
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
	clearPiece();

	current_piece.coords = moved_piece;
}

// Makes current piece inactive
function deactivatePiece() {
	var game_over = true;
	// Array of unique row numbers that the resting spot of the 
	//	piece will occupy
	var unique_rows = [];
	for (var k in current_piece.coords) {
		inactive_pieces[current_piece.coords[k][0]][current_piece.coords[k][1]] = current_piece.type;
		// Ensure piece visibility
		drawPiece();
		// Game is only ended if the piece is deactivated 
		//	above the buffer; that is, no cells of the piece
		//	are below the buffer
		if (current_piece.coords[k][0] >= BUFFER_SIZE) game_over = false;
		if (!unique_rows.includes(current_piece.coords[k][0])) {
			unique_rows.push(current_piece.coords[k][0]);
		}
	}
	
	current_piece.active = false;

	checkRows(unique_rows);

	if (game_over) {
		clearInterval(gameLoopId);
		alert("Game Over");
	}
}

// TODO: Optimize row clearing
// Check for cleared rows
function checkRows(unique_rows) {
    unique_rows.sort();
    cleared_rows = [];
	for (var r in unique_rows) {
		var row = unique_rows[r];
		var row_cleared = true;
		for (var c = 0; c < MAX_COLS; c++) {
			if (inactive_pieces[row][c] == EMPTY) {
                console.log("row " + row + " not cleared, col " + c + " empty");
				row_cleared = false;
				break;
			}
		}
		if (row_cleared) {
            cleared_rows.push(row);
			clearRow(row);
		}
	}
    if (cleared_rows.length > 0) {
        current_piece.clearing = true; 
        next_clear_tick = tick + CLEAR_TICK_DELAY;
    }
}

// Uses global variable cleared_rows and pushes down
//  the blocks above those rows.
function moveDownRows() {
    for (var r in cleared_rows) {
        var cleared_row = cleared_rows[r];
        // Iterate up the rows that get shifted down
	    for (var row = cleared_row; row > 1; row--) {
	    	for (var col = 0; col < MAX_COLS; col++) {
	    		inactive_pieces[row][col] = inactive_pieces[row-1][col];
	    		if (inactive_pieces[row][col] == EMPTY) {
	    			clearCell([row, col]);
	    		} else {
	    			colorCell([row, col], inactive_pieces[row][col]);
	    		}
	    	}
	    }
    }
}

function clearRow(cleared_row) {
	console.log("clearing row" + cleared_row);
	for (var col = 0; col < MAX_COLS; col++) {
		inactive_pieces[cleared_row][col] = EMPTY;
		clearCell([cleared_row, col]);
	}
}


// Canvas functions


function drawPiece() {
    drawGhostPiece();
	for (cell in current_piece.coords) {
		colorCell(current_piece.coords[cell], current_piece.type);
	}
}

function drawGhostPiece() {
	for (cell in current_piece.ghost_coords) {
		colorCell(current_piece.ghost_coords[cell], GHOST_COLOR);
	}
}

function clearPiece() {
	for (cell in current_piece.coords) {
		clearCell(current_piece.coords[cell]);
	}
    clearGhostPiece();
}

function clearGhostPiece() {
    for (cell in current_piece.ghost_coords) {
		clearCell(current_piece.ghost_coords[cell]);
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

function clearCell(coords) {
	var rowCoord = coords[0] - BUFFER_SIZE;
	if (rowCoord < 0) return; // Don't draw if in buffer zone
	var startRow = rowCoord * GRID_PIXEL_SIZE + start_pos[0] + 1; 
	var startCol = coords[1] * GRID_PIXEL_SIZE + start_pos[1] + 1;
	context.clearRect(startCol, startRow, GRID_PIXEL_SIZE - 2, GRID_PIXEL_SIZE - 2);
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

