/*Canvas Variables------------------------------------------------------------*/

let canvas;
let context;

let MAX_ROWS = 22;
let MAX_COLS = 10;

// BUFFER_SIZE of the rows are invisible to the player 
let BUFFER_SIZE = 2;
// Row,col of top left of board
let start_pos = [0,0];

let GRID_PIXEL_SIZE = 40;
let WINDOW_PADDING = 20;
let boardHeight = start_pos[0] + GRID_PIXEL_SIZE * (MAX_ROWS - BUFFER_SIZE);
let boardWidth = start_pos[1] + GRID_PIXEL_SIZE * MAX_COLS;

/*Game Variables--------------------------------------------------------------*/

// Period in ms between each tick 
// 16.66ms - 60Hz
const TICK_DELAY = 16.66;
let tick = 1;

let gameLoopId;

// coords - where to spawn a new piece
// origin - coordinates about which the piece rotates
// next_coords - where to draw the piece when it's in the next piece box
const TETROMINOES = [
    {name: "I", color: "#31C7EF", coords: [[1,3],[1,4],[1,5],[1,6]], 
        origin: [1.5, 4.5], next_coords: [[3,11],[3,12],[3,13],[3,14]]},
    {name: "O", color: "#F7D308", coords: [[0,4],[0,5],[1,4],[1,5]], 
        origin: [0.5, 4.5], next_coords: [[2,12],[2,13],[3,12],[3,13]]},
    {name: "T", color: "#AD4D9C", coords: [[1,4],[0,4],[1,3],[1,5]], 
        origin: [1,4], next_coords: [[3,11],[3,12],[3,13],[2,12]]},
    {name: "S", color: "#42B642", coords: [[1,4],[0,4],[0,5],[1,3]], 
        origin: [1,4], next_coords: [[3,12],[2,13],[2,14],[3,13]]}, 
    {name: "Z", color: "#EF2029", coords: [[1,4],[0,3],[0,4],[1,5]], 
        origin: [1,4], next_coords: [[3,12],[2,11],[2,12],[3,13]]},
    {name: "J", color: "#5A65AD", coords: [[1,4],[0,3],[1,3],[1,5]], 
        origin: [1,4], next_coords: [[3,12],[2,11],[3,11],[3,13]]},
    {name: "L", color: "#EF7921", coords: [[1,4],[0,5],[1,3],[1,5]], 
        origin: [1,4], next_coords: [[3,12],[2,13],[3,11],[3,13]]}
];

const EMPTY = "#FFFFFF"
const GHOST_COLOR = "#CCCCCC";

// Number of ticks before a piece moves down a row
const DEFAULT_FALL_RATE = 60;
const SOFT_FALL_RATE = 3;

// Number of ticks before moving to the left or right when holding down
const MOVE_HOLD_INITIAL_DELAY = 9;
// Number of ticks before moving to the left or right multiple times when holding down
//  (After the MOVE_HOLD_INITIAL_DELAY is over) 
const MOVE_HOLD_DELAY = 2;

const HOLD_POS_ROW_OFFSET = 20;
const HOLD_POS_COL_OFFSET = 8;

// 2d array representing the inactive pieces with the colors of every square
let inactive_pieces = [];

let current_piece = {
    name: "",
    active: false,
    clearing: false,
    coords: [],
    origin: [],
    ghost_coords: [],
    color: EMPTY,
}

let hold_piece_type = "";
let hold_piece_used = false;
let hold_piece_preview = [];

// Queue of pieces to be drawn or removed on the next tick
// Formatted as coords [[][][][]] followed by the color to draw or EMPTY to clear
let draw_queue = [];

// Array of rows that were previously cleared
let cleared_rows = [];
// The tick at which the next clear will happen
let next_clear_tick = -1;
// The number of ticks between a line clear and the visual movement
let CLEAR_TICK_DELAY = 10;

// Bag of pieces to be used
let piece_bag = [];

let time_elapsed = 0;	// ms

let score = {
    lines_cleared: 0
};

let key_hold_state = {
    soft_drop: false,
    hard_drop: false,
    left: false,
    left_delay: 0,
    right: false,
    right_delay: 0
};

/*Page Functions--------------------------------------------------------------*/

window.onload = function() {
    canvas = document.getElementById("game");
    canvas.width = window.innerWidth - WINDOW_PADDING;
    canvas.height = window.innerHeight - WINDOW_PADDING;
    while (boardHeight > canvas.height) {
        GRID_PIXEL_SIZE -= 2;
        boardHeight = start_pos[0] + GRID_PIXEL_SIZE * (MAX_ROWS - BUFFER_SIZE);
        boardWidth = start_pos[1] + GRID_PIXEL_SIZE * MAX_COLS;
    }

    //start_pos[0] = canvas.height / 4;
    //start_pos[1] = canvas.width / 2;

    //Setup inactive piece array
    for (let r = 0; r < MAX_ROWS; r++) {
        let temparray = [];
        for (let c = 0; c < MAX_COLS; c++) {
            temparray[c] = EMPTY;
        }
        inactive_pieces.push(temparray);
    }

    context = canvas.getContext("2d");

    drawGrid();
    //drawSidePanels();

    play();
}

document.addEventListener('keydown', function(event) {
    // block input if in the middle of clearing 
    //if (current_piece.clearing) return;
    switch (event.keyCode) {
        case 32:
            // Space (Hold)
            hold(current_piece);
            break;
        case 40:
            // Down (Soft Drop)
            key_hold_state.soft_drop = true;
            break;
        case 38:
            // UP
            if (!key_hold_state.hard_drop) {
                hardDrop();
                key_hold_state.hard_drop = true;
            }
            break;
        case 37:
            //LEFT
            if (!key_hold_state.left) {
                console.log("LEFT DOWN");
                moveTetromino(0, -1);
                key_hold_state.left = true;
                key_hold_state.right = false;
                key_hold_state.left_delay = MOVE_HOLD_INITIAL_DELAY;
            }
            else console.log("LEFT ALREADY HELD");
            break;
        case 39:
            //RIGHT
            if (!key_hold_state.right) {
                console.log("RIGHT DOWN");
                moveTetromino(0,1);
                key_hold_state.right = true;
                key_hold_state.left = false;
                key_hold_state.right_delay = MOVE_HOLD_INITIAL_DELAY;
            }
            else console.log("RIGHT ALREADY HELD");
            break;
        case 90:
            // Z
            // Rotate left
            rotate(1, true);
            break;
        case 88:
            // X
            // Rotate right
            rotate(-1, true);
            break;
    }
});

document.addEventListener('keyup', function(event) {
    switch (event.keyCode) {
        case 40:
            // DOWN
            key_hold_state.soft_drop = false;
            break;
        case 38:
            // UP
            key_hold_state.hard_drop = false;
            break;
        case 37:
            // LEFT
            console.log("LEFT UP");
            key_hold_state.left = false;
            key_hold_state.left_delay = 0;

            break;
        case 39:
            // RIGHT
            console.log("RIGHT UP");
            key_hold_state.right = false;
            key_hold_state.right_delay = 0;
            break;
    }
});

/*Game Functions--------------------------------------------------------------*/

function play() {
    gameLoopId = setInterval(nextTick, TICK_DELAY);
}

function nextTick() {
    tick++;

    // Decrement movement hold delays
    if (key_hold_state.left) key_hold_state.left_delay--;
    else if (key_hold_state.right) key_hold_state.right_delay--;

    // Draw according to draw_queue
    drawPieces();

    // TODO: Improve performance of drawing text/numbers
    drawScore();
    drawTimer();

    // If there are lines to shift down and it's at least the tick
    //	at which lines drop
    if (cleared_rows.length > 0 && tick >= next_clear_tick) {
        moveDownRows();
        current_piece.clearing = false;
    }
    // If rows are being cleared, wait for the tick at which the line
    //  clear animation finishes
    else if (current_piece.clearing) {
        return;
    }
    else if (current_piece.active) {
        moveActiveTetromino();
    }
    else {
        spawnTetromino();
    }
}

// Calculate ghost position
function calculateCurrentPieceGhost() {
    // Largest downward shift the current piece can make without moving 
    let largest_shift = MAX_ROWS;
    // Calculate the largest shift
    for (let cell in current_piece.coords) {
        let highest_available_position = MAX_ROWS - 1;
        for (let row = highest_available_position; row > current_piece.coords[cell][0]; row--) {
            if (inactive_pieces[row][current_piece.coords[cell][1]] != EMPTY) {
                highest_available_position = row - 1;
            }
        }
        let shift = highest_available_position - current_piece.coords[cell][0];
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
    if (current_piece.active && !current_piece.clearing) {
        queueCurrentPieceClear();
        current_piece.coords = current_piece.ghost_coords;
        deactivatePiece();
    }
}

function moveActiveTetromino() {
    if (tick % (key_hold_state.soft_drop ? SOFT_FALL_RATE : DEFAULT_FALL_RATE) == 0) {
        // move tetromino down 1 row
        moveTetromino(1, 0);
    }
    // Move if delay is < 0, decrement delay
    // Reset hold delay to the delay between movements (MOVE_HOLD_DELAY)
    if (key_hold_state.left && key_hold_state.left_delay < 0) {
        moveTetromino(0, -1);
        key_hold_state.left_delay = MOVE_HOLD_DELAY;
    }
    else if (key_hold_state.right && key_hold_state.right_delay < 0) {
        moveTetromino(0, 1);
        key_hold_state.right_delay = MOVE_HOLD_DELAY;
    }
}

function spawnTetromino() {
    // One use for the hold function because this is a new piece
    hold_piece_used = false;
    
    if (piece_bag.length < 2) extendBag();

    //clear_queue.push(TETROMINOES[piece_bag[0]].next_coords);
    // TODO: Make draw queue not require two functions
    draw_queue.push(TETROMINOES[piece_bag[0]].next_coords);
    draw_queue.push(EMPTY);

    //next_piece_index = Math.floor(Math.random() * 7);
    let this_piece_index = piece_bag.shift();
    let next_piece_index = piece_bag[0];

    // Draw next piece preview
    draw_queue.push(TETROMINOES[next_piece_index].next_coords);
    draw_queue.push(TETROMINOES[next_piece_index].color);

    // Set current piece properties based on which tetromino is being spawned
    let tetromino = TETROMINOES[this_piece_index];
    setCurrentPiece(tetromino);

    //current_piece.coords = tetromino.coords;
    //current_piece.origin = new Array(tetromino.origin[0], tetromino.origin[1]);
    //current_piece.color = tetromino.color;
    //current_piece.type = tetromino.name;
    //current_piece.active = true;

    calculateCurrentPieceGhost()

    queueCurrentPieceDraw();
}

function setCurrentPiece(tetromino) {
    current_piece.coords = tetromino.coords;
    // TODO: what to use here?
    current_piece.origin = new Array(tetromino.origin[0], tetromino.origin[1]);
    current_piece.color = tetromino.color;
    current_piece.type = tetromino.name;
    current_piece.active = true;
}

function extendBag() {
    let new_bag = [0,1,2,3,4,5,6];
    // Permutations of the new bag
    for (let k = 0; k < new_bag.length; k++) {
        let swap = k + Math.floor(Math.random() * (new_bag.length - k));
        let temp = new_bag[k];
        new_bag[k] = new_bag[swap];
        new_bag[swap] = temp;
    }
    piece_bag = piece_bag.concat(new_bag);
}

// Rotation of piece about piece's origin. 
// Direction: 1 for right, -1 for left
// attemptWallKick: true if should try wall kick, false otherwise
// returns: true if rotation was successful, false otherwise
function rotate(direction, attemptWallKick) {
    // O block does not rotate, don't bother with calculations
    if (current_piece.type == "O") return;
    let origin = current_piece.origin;

    let moved_piece = [];
    for (let k in current_piece.coords) {
        let temp = [];
        temp[0] = current_piece.coords[k][0] - origin[0];
        temp[1] = current_piece.coords[k][1] - origin[1];
        // 90 degree rotation matrix
        //[0 -1]
        //[1  0]
        // -90 degree rotation matrix
        //[0  1]
        //[-1 0]
        // if left (direction=1), temp[1] is mult. by -1 and temp[0] is mult. by 1
        // if right (direction=-1), temp[1] is mult. by 1 and temp[0] is mult. by -1
        let row = (-1 * direction) * temp[1] + origin[0];
        let col = (direction) * temp[0] + origin[1];
        // Collision checks
        if (row < 0 || row > MAX_ROWS
                || col < 0 || col > MAX_COLS 
                || inactive_pieces[row][col] != EMPTY) {

            // Rotation would colide with walls
            // Or would collide with inactive piece

            if (attemptWallKick) {
                // Move to right one and retry
                moveTetromino(0, 1);
                if (!rotate(direction, false)) {
                    // If that doesn't work, move to left one and retry
                    moveTetromino(0, -1);
                    return rotate(direction, false);
                } else return true; 
            } else {
                return false;
            }
        }
        //if (inactive_pieces[row][col] != EMPTY) {
        //    // Rotation would collide with inactive piece
        //    return;
        //}
        moved_piece[k] = [Math.floor(row), Math.floor(col)];
    }

    queueCurrentPieceClear();

    current_piece.coords = moved_piece;
    calculateCurrentPieceGhost();
    queueCurrentPieceDraw();

    return true;
}

function moveTetromino(roffset, coffset) {
    if (!current_piece.active) return;

    let moved_piece = [];

    for (k in current_piece.coords) {
        let row = current_piece.coords[k][0] + roffset;
        let col = current_piece.coords[k][1] + coffset;
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

    // TODO: Optimize by keeping spaces that are removed then added?
    queueCurrentPieceClear();

    current_piece.coords = moved_piece;
    calculateCurrentPieceGhost();
    queueCurrentPieceDraw();
}

function hold(piece) {
    // Already held a piece; can't hold again until next piece spawn
    if (hold_piece_used) return;
    
    // Clear old current piece and its ghost
    queueCurrentPieceClear();

    // Clear old hold piece preview 
    queueHoldPieceClear();

    if (hold_piece_type == "") {
        // No hold piece; hold and spawn new piece
        hold_piece_type = current_piece.type;
        spawnTetromino();
    }
    else {
        // Existing hold piece; hold and get the held piece type to spawn
        let tetromino = TETROMINOES.filter(function(obj){return obj.name == hold_piece_type;})[0];
        hold_piece_type = current_piece.type;
        setCurrentPiece(tetromino);
    }

    // Draw current piece and its ghost
    calculateCurrentPieceGhost()
    queueCurrentPieceDraw();

    // Draw hold piece preview
    hold_piece_preview = [];
    held_tetromino = TETROMINOES.filter(function(obj){return obj.name == hold_piece_type;})[0];
    for (k in held_tetromino.next_coords) {
        hold_piece_preview.push([held_tetromino.coords[k][0] + HOLD_POS_ROW_OFFSET, 
                          held_tetromino.coords[k][1] + HOLD_POS_COL_OFFSET]);
    }
    queueHoldPieceDraw();

    hold_piece_used = true;
}

// Makes current piece inactive
function deactivatePiece() {
    // Assume true until set to false
    let game_over = true;
    // Array of unique row numbers that the resting spot of the 
    //	piece will occupy
    let unique_rows = [];
    for (let k in current_piece.coords) {
        inactive_pieces[current_piece.coords[k][0]][current_piece.coords[k][1]] 
                = current_piece.color;
        
        // Game is only ended if the piece is deactivated 
        //	above the buffer; that is, no cells of the piece
        //	are below the buffer
        if (current_piece.coords[k][0] >= BUFFER_SIZE) game_over = false;
        if (!unique_rows.includes(current_piece.coords[k][0])) {
            unique_rows.push(current_piece.coords[k][0]);
        }
    }

    // Ensure piece visibility
    queueCurrentPieceDraw();

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
    //unique_rows.sort();
    // sort numerically instead of lexographically
    unique_rows.sort(function(a,b){return a - b;});
    cleared_rows = [];
    for (let r in unique_rows) {
        let row = unique_rows[r];
        let row_cleared = true;
        for (let c = 0; c < MAX_COLS; c++) {
            if (inactive_pieces[row][c] == EMPTY) {
                //console.log("row " + row + " not cleared, col " + c + " empty");
                row_cleared = false;
                break;
            }
        }
        if (row_cleared) {
            score.lines_cleared++;
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

// Uses global letiable cleared_rows and pushes down
//  the blocks above those rows.
function moveDownRows() {
    for (let r in cleared_rows) {
        let cleared_row = cleared_rows[r];
        console.log("Moving down rows above " + cleared_row);
        // Iterate up the rows that get shifted down
        for (let row = cleared_row; row > 1; row--) {
            for (let col = 0; col < MAX_COLS; col++) {
                //console.log("r"+row+"_c"+col+"_status"+inactive_pieces[row][col]);
                inactive_pieces[row][col] = inactive_pieces[row-1][col];
                //console.log("r"+row+"_c"+col+"_status"+inactive_pieces[row][col]);
                if (inactive_pieces[row][col] == EMPTY) {
                    // TODO: Simplify this code
                    draw_queue.push([[row, col]])
                    draw_queue.push(EMPTY);
                } 
                else {
                    draw_queue.push([[row, col]])
                    draw_queue.push(inactive_pieces[row][col]);
                }
            }
        }
    }
    cleared_rows = [];
}

function clearRow(cleared_row) {
    console.log("clearing row" + cleared_row);
    for (let col = 0; col < MAX_COLS; col++) {
        inactive_pieces[cleared_row][col] = EMPTY;
        draw_queue.push([[cleared_row, col]])
        draw_queue.push(EMPTY);
        //clearCell([cleared_row, col]);
    }
}

/*Canvas functions------------------------------------------------------------*/

function drawPieces() {
    let next;
    while ((next = draw_queue.shift()) != undefined) {
        let color = draw_queue.shift();
        if (color == EMPTY) clearPiece(next);
        else drawPiece(next, color);
    }
}

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

function queueCurrentPieceDraw() {
    // Draw ghost first, then draw current piece on top
    // TODO: Skip overlap
    draw_queue.push(current_piece.ghost_coords); 
    draw_queue.push(GHOST_COLOR);
    draw_queue.push(current_piece.coords); 
    draw_queue.push(current_piece.color);
}

function queueCurrentPieceClear() {
    draw_queue.push(current_piece.coords);
    draw_queue.push(EMPTY);
    draw_queue.push(current_piece.ghost_coords);
    draw_queue.push(EMPTY);
}

function queueHoldPieceDraw() {
    draw_queue.push(hold_piece_preview);
    let color = TETROMINOES.filter(function(obj){return obj.name == hold_piece_type;})[0].color;
    draw_queue.push(color);
}

function queueHoldPieceClear() {
    draw_queue.push(hold_piece_preview);
    draw_queue.push(EMPTY);
}

function colorCell(coords, color) {
    context.beginPath();
    context.fillStyle = color;
    context.strokeStyle = color;

    let rowCoord = coords[0] - BUFFER_SIZE;
    if (rowCoord < 0) return; // Don't draw if in buffer zone
    let startRow = rowCoord * GRID_PIXEL_SIZE + start_pos[0] + 1; 
    let startCol = coords[1] * GRID_PIXEL_SIZE + start_pos[1] + 1;
    context.fillRect(startCol, startRow, GRID_PIXEL_SIZE - 2, GRID_PIXEL_SIZE - 2);
    //context.rect(startCol, startRow, GRID_PIXEL_SIZE - 2, GRID_PIXEL_SIZE - 2);
    //context.stroke();
}

function clearCell(coords) {
    let rowCoord = coords[0] - BUFFER_SIZE;
    if (rowCoord < 0) return; // Don't draw if in buffer zone
    let startRow = rowCoord * GRID_PIXEL_SIZE + start_pos[0] + 1; 
    let startCol = coords[1] * GRID_PIXEL_SIZE + start_pos[1] + 1;
    context.clearRect(startCol, startRow, GRID_PIXEL_SIZE - 2, GRID_PIXEL_SIZE - 2);
}


function drawScore() {
    text = "Lines Cleared: " + score.lines_cleared;
    context.fillStyle = "#000000";
    context.font = "30px Arial";
    context.clearRect(0, GRID_PIXEL_SIZE * MAX_ROWS - 30, GRID_PIXEL_SIZE * MAX_COLS, 30);
    context.fillText(text, 0, GRID_PIXEL_SIZE * MAX_ROWS);
    //context.fillText(text, 0, 880);

}

function drawTimer() {
    time_elapsed += TICK_DELAY;
    let seconds = (time_elapsed / 1000) % 60;
    let minutes = Math.floor((time_elapsed / 1000) / 60);
    //console.log(minutes + ":" + (seconds > 10 ? "" : "0") + seconds.toFixed(2));
    let text = minutes + ":" + (seconds > 10 ? "" : "0") + seconds.toFixed(2);
    context.fillStyle = "#000000";
    context.font = "30px Arial";
    context.clearRect(0, GRID_PIXEL_SIZE * MAX_ROWS - 60, GRID_PIXEL_SIZE * MAX_COLS, 30);
    context.fillText(text, 0, GRID_PIXEL_SIZE * MAX_ROWS - 30);
}

function drawGrid() {
    let rowCount = 0;
    let colCount = 0;
    boardHeight = start_pos[0] + GRID_PIXEL_SIZE * (MAX_ROWS - BUFFER_SIZE);
    boardWidth = start_pos[1] + GRID_PIXEL_SIZE * MAX_COLS;

    // Draw horizontals
    for (let pixrow = start_pos[0]; 
            rowCount <= MAX_ROWS - BUFFER_SIZE; 
            pixrow += GRID_PIXEL_SIZE, rowCount++) {

        context.moveTo(start_pos[1], pixrow);
        context.lineTo(boardWidth, pixrow);
    }

    // Draw verticals
    for (let pixcol = start_pos[1]; 
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

