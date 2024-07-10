const TILE_COUNT = 16;
let COLUMNS = Math.sqrt(TILE_COUNT);
let ROWS = Math.sqrt(TILE_COUNT);

const startBtn = document.querySelector('.start-game-btn');
const endIntroBtn = document.querySelector('.end-intro');
const timerSecs = document.getElementById('timer-secs');
const timerMins = document.getElementById('timer-mins');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const board = document.getElementById('board');
const gameWrap = document.querySelector('.game-wrap');
const showHighscoresBtn = document.querySelector('.show-btn');
const hideHighscoresBtn = document.querySelector('.hide-btn');
const blankTile = 'blank';

const easyBtn = document.getElementById('easy');
const mediumBtn = document.getElementById('medium');
const hardBtn = document.getElementById('hard');
const easySmall = document.getElementById('easy-sm');
const mediumSmall = document.getElementById('medium-sm');
const hardSmall = document.getElementById('hard-sm');

let selectedDifficulty = 1; // 1 = easy, 2 = medium, 3 = hard
let width = 400;
let height = 400;
let tiles = [];
let correctTileLocation = [];
let timer;
let canvasX, canvasY = 0;
let moveX, moveY = 0;
let imgLeftStart, imgTopStart = 0;

// update canvas width/height for small devices
// same size breakpoint as used in the CSS media query
if (window.innerWidth <= 600) {
  width = 300;
  height = 300;
};

// get existing highscores if any
insertHighscoreHTML();

endIntroBtn.addEventListener('pointerdown', () => {
  document.querySelector('.intro').style.display = 'none';
  document.querySelector('main').style.display = 'grid';
});

// show/hide highscores
showHighscoresBtn.addEventListener('pointerdown', () => {
  const highscoreEl = document.querySelector('.highscore-wrap');
  highscoreEl.classList.remove('hide');
});

hideHighscoresBtn.addEventListener('pointerdown', () => {
  const highscoreEl = document.querySelector('.highscore-wrap');
  highscoreEl.classList.add('hide');
});


easyBtn.addEventListener('pointerdown', (e) => startGame(e, 1));
mediumBtn.addEventListener('pointerdown', (e) => startGame(e, 2));
hardBtn.addEventListener('pointerdown', (e) => startGame(e, 3));
board.addEventListener('pointerdown', moveTile);

// hide difficulty selection area
function hideDifficultySection(difficulty) {
  const difficultyWrapper = document.querySelector('.difficulty');
  const selectedImage = document.querySelector('.selected-image');

  const resizeImage = document.createElement('img');
  resizeImage.height = 200;
  resizeImage.width = 200; 

  if (difficulty === 1) 
  {
    resizeImage.src = easyBtn.src;
    selectedImage.append(resizeImage);
  }
  else if (difficulty === 2) 
  {
    resizeImage.src = mediumBtn.src;
    selectedImage.append(resizeImage);
  }
  else if (difficulty === 3) 
  {
    resizeImage.src = hardBtn.src;
    selectedImage.append(resizeImage);
  }

  difficultyWrapper.remove();
}

function startGame(element, difficulty) {
  selectedDifficulty = difficulty;
  hideDifficultySection(selectedDifficulty)

  // for small devices, use small images
  if (width === 300) {
    if (difficulty === 1) drawTiles(easySmall);
    if (difficulty === 2) drawTiles(mediumSmall);
    if (difficulty === 3) drawTiles(hardSmall);
  } else {
    drawTiles(element.target);
  }

  shuffleTiles(tiles);
  insertTilesHTML();

  // hide edit section, show game section
  gameWrap.classList.add('show');
  gameTimer();
}

function stopGame() {
  timer = clearTimeout(timer);
  board.removeEventListener('pointerdown', moveTile);
}

function drawTiles(img) {
  // receives an image to split into tiles
  canvas.width = width / ROWS;
  canvas.height = height / COLUMNS;

  // split image into base 64 urls and save to array
  for (let i = 0; i < ROWS; i++) {
    for (let j = 0; j < COLUMNS; j++) {
      let tileWidth = width / ROWS;
      let tileHeight = height / COLUMNS;
      // x & y co-ordinates of each tiles corner to start drawing from
      let x = tileWidth * j;
      let y = tileHeight * i;
      // find last tile to make blank
      if (x === (tileWidth * (ROWS-1)) && y === (tileHeight*(COLUMNS-1))) {
        tiles.push(blankTile);
        correctTileLocation.push(blankTile);
      } else {
        // draw tile
        ctx.drawImage(img, x, y, tileWidth, tileHeight, 0, 0, tileWidth, tileHeight)
        // draw border of tile
        ctx.rect(x, y, tileWidth, tileHeight)
        ctx.strokeStyle = 'black'
        ctx.stroke()
        // add base 64 URL to tiles array for each tile
        tiles.push( canvas.toDataURL() )
        // keep track of correct order for win condition
        correctTileLocation.push( canvas.toDataURL() )
      }
    }
  }
}

function insertTilesHTML() {
  // add img elements to html and append url from tiles array
  tiles.forEach((index, element) => {
    if (tiles[element] === blankTile) {
      let blank = document.createElement('div')
      blank.dataset.value = blankTile
      blank.dataset.index = tiles.indexOf(index)
      board.appendChild(blank)
    } else {
      let tile = document.createElement('img')
      tile.src = tiles[element]
      tile.dataset.index = tiles.indexOf(index)
      tile.draggable = false
      board.appendChild(tile)
    }
  })
}

function moveTile(e) {
  let blank = findBlankTile()
  let validCol = blank % COLUMNS
  let validRow = Math.floor(blank / ROWS)
  let tileIndex = Number(e.target.dataset.index)
  let [isValid, direction] = validMove(blank, tileIndex, validCol, validRow)

  // return true or false if a selected tile is a valid move
  if (isValid === true) {
    // swap elements and update tiles array
    swapTiles(tileIndex, blank, direction)

    // check if the puzzle has been solved
    if (checkWinCondition(tiles, correctTileLocation)) {
      const winMsg = document.createElement('div')
      document.querySelector('.page-wrap').insertAdjacentElement('beforebegin', winMsg)
      winMsg.classList.add('winMessage')
      winMsg.innerHTML = `Puzzle completed in: ${timerMins.innerHTML}:${timerSecs.innerHTML}!`

      const showWinMsgTimer = setTimeout(() => {
        winMsg.remove()
        clearTimeout(showWinMsgTimer)
      }, 3000)

      // convert time to seconds only for storage
      let finalTime = (parseInt(timerMins.innerHTML) * 60) + (parseInt(timerSecs.innerHTML))
      if (timerMins.innerHTML === 0) {
        finalTime = parseInt(timerSecs.innerHTML)
      }
      // Add to highscores and stop game
      addHighscoreLS(finalTime);
      insertHighscoreHTML();
      stopGame();
    }
  // invalid move
  } else {
    board.style.border = '20px solid red'
    const wrongMoveTimer = setTimeout(() => {
      board.style.border = '20px solid white'
      clearTimeout(wrongMoveTimer)
    }, 80)
  }
}

function validMove(blank, tileIndex, validCol, validRow) {
  let direction = ''
  // check direction
  if (tileIndex % COLUMNS === validCol && blank +ROWS === tileIndex) direction = 'up'
  if (tileIndex % COLUMNS === validCol && blank -ROWS === tileIndex) direction = 'down'
  if (Math.floor(tileIndex / ROWS) === validRow && blank +1 === tileIndex) direction = 'left'
  if (Math.floor(tileIndex / ROWS) === validRow && blank -1 === tileIndex) direction = 'right'
  // user selected tile must be in the same Col OR Row
  // AND be an adjacent tile to be a valid move
  if (((tileIndex % COLUMNS === validCol) || (Math.floor(tileIndex / ROWS) === validRow)) 
  && ((blank +1 === tileIndex) || (blank -1 === tileIndex)
  || (blank +ROWS === tileIndex) || (blank -ROWS=== tileIndex))) {
    return [true, direction] 
  } else {
    return [false, direction]
  }
}

function swapTiles(tileIndex, blank, direction) {
  let tile = document.querySelector(`[data-index='${tileIndex}'`)
  let blankTile = document.querySelector(`[data-index='${blank}'`)
  let tempTile = tile
  let temp = document.createElement('div')

  //animate tile
  tile.classList.add('animate');

  // set either x or y depending on which position we need to move the tile
  if (direction === 'left') tile.style.setProperty('--x', '-100%');
  else if (direction === 'right') tile.style.setProperty('--x', '100%');
  else if (direction === 'up') tile.style.setProperty('--y', '-100%');
  else if (direction === 'down') tile.style.setProperty('--y', '100%');

  const animateTile = setTimeout(() => {
    // reset x & y each move to prevent wierd animations
    tile.classList.remove('animate')
    tile.style.setProperty('--x', '')
    tile.style.setProperty('--y', '')
    // Swaps blank tile and selected tile using a temporary div
    blankTile.replaceWith(temp)
    tile.replaceWith(blankTile)
    temp.replaceWith(tempTile)
    blankTile.dataset.index = tileIndex
    tempTile.dataset.index = blank
    clearTimeout(animateTile)
  }, 60)

  // update tiles array with new tile index after swapping
  return [tiles[tileIndex], tiles[blank]] = 
         [tiles[blank], tiles[tileIndex]]
}

function checkWinCondition(a, b) {
  // if both arrays are equal return true - user wins
  return JSON.stringify(a) == JSON.stringify(b);
}

function findBlankTile() {
  for (let i=0; i<tiles.length; i++) {
    if (tiles[i] === blankTile) return i;
  }
}

function shuffleTiles(array) {
  let blank = array.length -1
  let validCol = blank % COLUMNS
  let validRow = Math.floor(blank / ROWS)
  let randomIndex = blank -1; // first move not random
  let validMove = []

  // make 1000 random valid moves to shuffle the board
  // moves must be valid otherwise puzzle can become unsolvable
  for (let i=0; i<1500; i++) {
    // empty valid moves each loop to find new valid moves
    validMove = []
    // swap random tile with blank tile
    if (true) {
      [array[blank], array[randomIndex]] = 
      [array[randomIndex], array[blank]]
      blank = array.indexOf(array[randomIndex])
      validCol = blank % COLUMNS
      validRow = Math.floor(blank / ROWS)
    }
    // find each possible valid move based on blank tile index
    let a, b, c, d
    a = blank +1,
    b = blank -1
    c = blank +ROWS
    d = blank -ROWS
    // check if move is valid, insert into validMove array
    if ((a <= array.length-1) && (Math.floor(a / ROWS) === validRow)) { validMove.push(a) } else {}
    if ((b >= 0) && (Math.floor(b / ROWS) === validRow)) { validMove.push(b) } else {}
    if ((c <= array.length-1) && (c % COLUMNS === validCol)) { validMove.push(c) } else {}
    if ((d >= 0) && (d % COLUMNS === validCol)) { validMove.push(d) } else {}
    // select a random move from all valid moves
    randomIndex = validMove[Math.floor(Math.random() * validMove.length)]
  }
  return array;
}

function insertHighscoreHTML() {
  let score = getHighscoreLS();
  if (score.length === 0) return;

  // compare highscores from lowest to highest
  score.sort((a,b) => (a.Time - b.Time));

  // clear existing highscores, to re-populate
  const highscoresList = document.querySelector('.highscore-list');
  highscoresList.innerHTML = '';

  // write 10 best highscores to html
  for (let i = 0; i < score.length; i++) {
    if (i > 10) return

    const span = document.createElement('span')
    const li = document.createElement('li')
    const image = document.createElement('img')
    highscoresList.appendChild(li)
    li.appendChild(span)
    li.appendChild(image)
    image.src = score[i].Img
    image.style.width = "100px"
    image.style.height = "100px"

    // convert score from seconds to mins & seconds
    let seconds = score[i].Time % 60
    if (seconds == 0) seconds = '00'
    let minutes = Math.floor(score[i].Time / 60)
    if (seconds < 10 && seconds != 0) seconds = `0${seconds}`
    span.innerHTML = `Time: ${minutes}:${seconds} - `
  }
}

// add new time to highscores
function addHighscoreLS(time) {
  const highscore = getHighscoreLS();
  // remove slowest time, only keep 10 scores
  if (highscore.length > 10) {
    highscore.sort((a,b) => (a.Time - b.Time));
    highscore.pop();
  }

  let newStorage = { 
    'Time': time,
    'Img' : selectedDifficulty === 1 ? easyBtn.src 
    : selectedDifficulty === 2 ? mediumBtn.src 
    : hardBtn.src
  }
  highscore.push(newStorage)
  localStorage.setItem('highscores', JSON.stringify(highscore))
}

// get highscores as JSON from local storage
function getHighscoreLS() {
  const highscore = JSON.parse(localStorage.getItem('highscores'));
  return highscore === null ? [] : highscore;
}

// simple timer for highscores, max time of 59mins 59secs
function gameTimer() {
  let mins = 0;
  let secs = 0;
  // reset timer
  timerSecs.innerHTML = '00'
  timerMins.innerHTML = '00'

  timer = setInterval(() => {
    secs++
    timerSecs.innerHTML = `0${secs}`
    if (secs > 9) {
      timerSecs.innerHTML = secs
    }
    if (secs > 59) {
      secs = 0
      mins++
      timerMins.innerHTML = `0${mins}`
      if (mins > 59) {
        mins = 0
      }
    }
    if (mins > 9) {
      timerMins.innerHTML = mins
    }
  },1000) 
}