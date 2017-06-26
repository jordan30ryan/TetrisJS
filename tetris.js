/*Canvas Variables------------------------------------------------------------*/
var canvas;
var context;

var MAX_ROWS = 22;
var MAX_COLS = 10;

// BUFFER_SIZE of the rows are invisible to the player 
var BUFFER_SIZE = 2;
// Row,col of top left of board
var start_pos = [0,0];

var boardHeight = start_pos[0] + GRID_PIXEL_SIZE * (MAX_ROWS - BUFFER_SIZE);
var boardWidth = start_pos[1] + GRID_PIXEL_SIZE * MAX_COLS;
var GRID_PIXEL_SIZE = 40;
var WINDOW_PADDING = 20;

/*Game Variables--------------------------------------------------------------*/

// Time in ms between each tick 
// 16ms - 60Hz
var TICK_DELAY = 16;
var tick = 0;

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
    has_moved: false,
    origin: [],
    ghost_coords: [],
    type: EMPTY,
}

// Array of rows that were previously cleared
var cleared_rows = [];
// The tick at which the next clear will happen
var next_clear_tick = -1;
// The number of ticks between a line clear and the visual movement
var CLEAR_TICK_DELAY = 10;

var next_piece_index = -1;
var next_piece_coords = [];

/*Page Functions--------------------------------------------------------------*/

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
    drawSidePanels();

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

/*Game Functions--------------------------------------------------------------*/

function play() {
    gameLoopId = setInterval(nextTick, TICK_DELAY);
}

function nextTick() {
    tick++;
    // If there's something to shift down and it's at least the tick
    //	at which lines drop
    if (cleared_rows.length > 0 && tick >= next_clear_tick) {
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

    if (current_piece.has_moved && current_piece.active) { 
        drawCurrentPiece(); 
        current_piece.has_moved = false;
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
    clearCurrentPiece();
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
    var this_piece_index;
    // If there is no next piece yet
    if (next_piece_index == -1) {
        this_piece_index = Math.floor(Math.random() * 7);
        next_piece_index = Math.floor(Math.random() * 7);
    } 
    else {
        this_piece_index = next_piece_index;
        next_piece_index = Math.floor(Math.random() * 7);
    }
    // TODO: do this differently?
    if (next_piece_coords.length > 0) {
        clearPiece(next_piece_coords);
    }
    switch (next_piece_index) {
        case 0:
            next_piece_coords = [[2,11],[2,12],[3,11],[3,12]];
            drawPiece(next_piece_coords, TETROMINOS.O);
            break;
        case 1:
            next_piece_coords = [[3,10],[3,11],[3,12],[3,13]];
            drawPiece(next_piece_coords, TETROMINOS.I);
            break;
        case 2:
            next_piece_coords = [[3,10],[3,11],[3,12],[2,11]];
            drawPiece(next_piece_coords, TETROMINOS.T);
            break;
        case 3:
            next_piece_coords = [[3,11],[2,11],[2,12],[3,10]];
            drawPiece(next_piece_coords, TETROMINOS.S);
            break;
        case 4:
            next_piece_coords = [[3,11],[2,10],[2,11],[3,12]];
            drawPiece(next_piece_coords, TETROMINOS.Z);
            break;
        case 5:
            next_piece_coords = [[3,11],[2,10],[3,10],[3,12]];
            drawPiece(next_piece_coords, TETROMINOS.J);
            break;
        case 6:
            next_piece_coords = [[3,11],[2,12],[3,10],[3,12]];
            drawPiece(next_piece_coords, TETROMINOS.L);
            break;
    }
    switch (this_piece_index) {
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
    current_piece.has_moved = true;
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
    clearCurrentPiece();
    current_piece.coords = moved_piece;
    current_piece.has_moved = true;
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
    clearCurrentPiece();
    current_piece.coords = moved_piece;
    current_piece.has_moved = true;
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
    clearCurrentPiece();

    current_piece.coords = moved_piece;
    current_piece.has_moved = true;
}

// Makes current piece inactive
function deactivatePiece() {
    // Assume true until set to false
    var game_over = true;
    // Array of unique row numbers that the resting spot of the 
    //	piece will occupy
    var unique_rows = [];
    for (var k in current_piece.coords) {
        inactive_pieces[current_piece.coords[k][0]][current_piece.coords[k][1]] 
                = current_piece.type;
        // Ensure piece visibility
        drawCurrentPiece();
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
                //console.log("row " + row + " not cleared, col " + c + " empty");
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
        // Set the tick at which the line clear animation will happen.
        // All ticks between now and the clear will be a pass 
        //	because current piece is set to clearing
        next_clear_tick = tick + CLEAR_TICK_DELAY;
        current_piece.clearing = true; 
    }
}

// Uses global variable cleared_rows and pushes down
//  the blocks above those rows.
function moveDownRows() {
    for (var r in cleared_rows) {
        var cleared_row = cleared_rows[r];
        console.log("Moving down rows above " + cleared_row);
        // Iterate up the rows that get shifted down
        for (var row = cleared_row; row > 1; row--) {
            for (var col = 0; col < MAX_COLS; col++) {
                inactive_pieces[row][col] = inactive_pieces[row-1][col];
                if (inactive_pieces[row][col] == EMPTY) {
                    clearCell([row, col]);
                } 
                else {
                    colorCell([row, col], inactive_pieces[row][col]);
                }
            }
        }
    }
    cleared_rows = [];
}

function clearRow(cleared_row) {
    console.log("clearing row" + cleared_row);
    for (var col = 0; col < MAX_COLS; col++) {
        inactive_pieces[cleared_row][col] = EMPTY;
        clearCell([cleared_row, col]);
    }
}

/*Canvas functions------------------------------------------------------------*/

// coords are the 4 coordinates of the blocks that make up the piece
//  [[r,c],[],[],[]]
// type is the type of block (string with color as in "#FFFFFF")
function drawPiece(coords, type) {
    for (cell in coords) {
        colorCell(coords[cell], type);
    }
}

function clearPiece(coords) {
    for (cell in coords) {
        clearCell(coords[cell]);
    }
}

function drawCurrentPiece() {
    // Draw ghost first, then draw current piece on top
    drawPiece(current_piece.ghost_coords, GHOST_COLOR);
    drawPiece(current_piece.coords, current_piece.type);
}

function clearCurrentPiece() {
    clearPiece(current_piece.coords);
    clearPiece(current_piece.ghost_coords);
}

function colorCell(coords, color) {
    context.beginPath();
    context.fillStyle = color;
    context.strokeStyle = color;

    var rowCoord = coords[0] - BUFFER_SIZE;
    if (rowCoord < 0) return; // Don't draw if in buffer zone
    var startRow = rowCoord * GRID_PIXEL_SIZE + start_pos[0] + 1; 
    var startCol = coords[1] * GRID_PIXEL_SIZE + start_pos[1] + 1;
    context.fillRect(startCol, startRow, GRID_PIXEL_SIZE - 2, GRID_PIXEL_SIZE - 2);
    //context.rect(startCol, startRow, GRID_PIXEL_SIZE - 2, GRID_PIXEL_SIZE - 2);
    //context.stroke();
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
    boardHeight = start_pos[0] + GRID_PIXEL_SIZE * (MAX_ROWS - BUFFER_SIZE);
    boardWidth = start_pos[1] + GRID_PIXEL_SIZE * MAX_COLS;

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

    // TODO: format the UI color
    context.strokeStyle = "#BBBBBB";
    context.stroke();
}

function drawSidePanels() {
    // Start drawing a new path as to not overwrite old path
    context.beginPath();
    startPointX= boardWidth;
    startPointY = start_pos[0];
    context.rect(startPointX, startPointY, GRID_PIXEL_SIZE * 4, GRID_PIXEL_SIZE * 4);
    // TODO: UI color
    context.strokeStyle="#BBBBBB";
    context.stroke();
}

