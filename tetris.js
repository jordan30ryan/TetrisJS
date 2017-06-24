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

// 2d array
var play_field = [];

var current_piece = null;
var current_piece_color;

window.onload = function() {
	canvas = document.getElementById("game");
	canvas.width = window.innerWidth - WINDOW_PADDING;
	canvas.height = window.innerHeight - WINDOW_PADDING;
	
	//start_pos[0] = canvas.height / 4;
	//start_pos[1] = canvas.width / 2;
	
	// Setup play field
	// UNUSED FOR NOW
	//for (var r = 0; r < MAX_ROWS; r++) {
	//	var temparray = [];
	//	for (var c = 0; c < MAX_COLS; c++) {
	//		temparray.push(EMPTY_COLOR);
	//	}
	//	play_field.push(temparray);
	//}
	
	context = canvas.getContext("2d");
	
	drawGrid();
	
	play();
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

function play() {
	setInterval(nextTick, TICK_DELAY);	
	//drawPiece([[1,1],[1,2],[1,3],[1,4]], TETROMINOS.I)
	//colorCell(0,0,TETROMINOS.T);
}

function nextTick() {
	tick++;
	if (current_piece != null) moveActiveTetromino();
	else {		
		spawnTetromino();
	}
	drawPiece(current_piece, current_piece_color);
}

function moveActiveTetromino() {
	if ((tick+1) % 45 == 0) {
		drawPiece(current_piece, EMPTY_COLOR);
		for (k in current_piece) {
			current_piece[k] = [current_piece[k][0] + 1, current_piece[k][1]]
		}
	}
}

function spawnTetromino() {
	// TODO: random bag system
	var rand = Math.floor(Math.random() * 7)
	switch (rand) {
		case 0:
			current_piece = [[0,4], [0,5], [1,4], [1,5]];
			current_piece_color = TETROMINOS.O;
			//colorCell(0,4, TETROMINOS.O);
			//colorCell(0,5, TETROMINOS.O);
			//colorCell(1,4, TETROMINOS.O);
			//colorCell(1,5, TETROMINOS.O);
			break;
		case 1:
			current_piece = [[1,3],[1,4],[1,5],[1,6]];
			current_piece_color = TETROMINOS.I;

			//colorCell(1,3, TETROMINOS.I);
			//colorCell(1,4, TETROMINOS.I);
			//colorCell(1,5, TETROMINOS.I);
			//colorCell(1,6, TETROMINOS.I);
			break;
		case 2:
			current_piece = [[0,4],[1,3],[1,4],[1,5]];
			current_piece_color = TETROMINOS.T;
			//colorCell(0,4, TETROMINOS.T);
			//colorCell(1,3, TETROMINOS.T);
			//colorCell(1,4, TETROMINOS.T);
			//colorCell(1,5, TETROMINOS.T);
			break;
		case 3:
			current_piece = [[0,4],[0,5],[1,3],[1,4]];
			current_piece_color = TETROMINOS.S;
			//colorCell(0,4, TETROMINOS.S);
			//colorCell(0,5, TETROMINOS.S);
			//colorCell(1,3, TETROMINOS.S);
			//colorCell(1,4, TETROMINOS.S);
			break;
		case 4:
			current_piece = [[0,3],[0,4],[1,4],[1,5]];
			current_piece_color = TETROMINOS.Z;
			//colorCell(0,3, TETROMINOS.Z);		
			//colorCell(0,4, TETROMINOS.Z);
			//colorCell(1,4, TETROMINOS.Z);
			//colorCell(1,5, TETROMINOS.Z);		
			break;
		case 5:
			current_piece = [[0,3],[1,3],[1,4],[1,5]];
			current_piece_color = TETROMINOS.J;
			//colorCell(0,3, TETROMINOS.J);
			//colorCell(1,3, TETROMINOS.J);
			//colorCell(1,4, TETROMINOS.J);
			//colorCell(1,5, TETROMINOS.J);
			break;
		case 6:
			current_piece = [[0,5],[1,3],[1,4],[1,5]];
			current_piece_color = TETROMINOS.L;
			//colorCell(0,5, TETROMINOS.L);
			//colorCell(1,3, TETROMINOS.L);
			//colorCell(1,4, TETROMINOS.L);
			//colorCell(1,5, TETROMINOS.L);
			break;
	}
}

function drawPiece(arr, color) {
	for (k in arr) {
		colorCell(arr[k], color)
	}
}

function colorCell(coords, color) {
	context.fillStyle = color;
	var startRow = coords[0] * GRID_PIXEL_SIZE + start_pos[0] + 1; 
	var startCol = coords[1] * GRID_PIXEL_SIZE + start_pos[1] + 1;
	context.fillRect(startCol, startRow, GRID_PIXEL_SIZE - 2, GRID_PIXEL_SIZE - 2);
}


document.addEventListener('keydown', function(event) {
	// LEFT
    if(event.keyCode == 37) {
		drawPiece(current_piece, EMPTY_COLOR);
		for (k in current_piece) {
			current_piece[k] = [current_piece[k][0], current_piece[k][1] - 1]
		}
    }
	// RIGHT
    else if(event.keyCode == 39) {
		drawPiece(current_piece, EMPTY_COLOR);
		for (k in current_piece) {
			current_piece[k] = [current_piece[k][0], current_piece[k][1] + 1]
		}
    }
});


//function removeCell(row, col) {
//	context.fillStyle = EMPTY_COLOR;
//	var startRow = row * GRID_PIXEL_SIZE + start_pos[0] + 1; 
//	var startCol = col * GRID_PIXEL_SIZE + start_pos[1] + 1;
//	context.fillRect(startCol, startRow, GRID_PIXEL_SIZE - 2, GRID_PIXEL_SIZE - 2);
//}