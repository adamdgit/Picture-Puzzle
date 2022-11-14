const tileCountEl = document.getElementById('tile-count')
let TILE_COUNT = tileCountEl.value
let COLUMNS = Math.sqrt(TILE_COUNT)
let ROWS = Math.sqrt(TILE_COUNT)
const editWrapper = document.querySelector('.image-edit-wrap')
const gameSection = document.querySelector('.game-section')
const editSection = document.querySelector('.edit-section')
const startBtn = document.querySelector('.start-game-btn')
const increaseBtn = document.querySelector('.increase')
const decreaseBtn = document.querySelector('.decrease')
const timerSecs = document.getElementById('timer-secs')
const timerMins = document.getElementById('timer-mins')
const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')
const fileIn = document.getElementById('imgInp')
const fileOut = document.getElementById('imgOut')
const board = document.getElementById('board')
const resizedImg = document.getElementById('resized-image')
const showHighscoresBtn = document.getElementById('show-btn')
const hideHighscoresBtn = document.getElementById('hide-btn')
const blankTile = 'blank'
const width = 400
const height = 400
let tiles = []
let correctTileLocation = []
let timer
let canvasX, canvasY = 0
let moveX, moveY = 0
let imgLeftStart, imgTopStart = 0

// hide how to play section, show game board
document.querySelector('.intro button').addEventListener('click', () => {
  document.querySelector('.intro').classList.add('hide-intro')
  document.querySelector('.intro').classList.remove('intro')
  document.querySelector('main').classList.add('show')
  document.querySelector('main').style.pointerEvents = 'all'
})

insertHighscoreHTML()

// reset & redraw game board when user changes board size
tileCountEl.addEventListener('change', () => {
  // if a file has been uploaded - redraw
  if (fileIn.files.length != 0) {
    document.removeEventListener('click', (handleMouseClick))
    changeTileCount()
    clearCanvas()
    stopGame()
    drawTiles(resizedImg)
    shuffleTiles(tiles)
    insertTilesHTML()
    startGame()
  // if no file to draw, just update tile count
  } else { 
    console.log('changed tile count - nothing uploaded')
    changeTileCount()
  }
})

// get user uploaded file and send to resize function
fileIn.addEventListener('change', () => {
  document.removeEventListener('click', (handleMouseClick))
  const reader = new FileReader()
  const selectedFile = fileIn.files[0]
  if (selectedFile) {
    reader.readAsDataURL(selectedFile)
    reader.onload = selectedFile => fileOut.src = selectedFile.target.result
    reader.onloadend = () => imageEditor()
  }
})

// show/hide highscores
showHighscoresBtn.addEventListener('pointerdown', () => {
  const highscoreEl = document.querySelector('.highscore-wrap')
  highscoreEl.classList.remove('hide')
})

hideHighscoresBtn.addEventListener('pointerdown', () => {
  const highscoreEl = document.querySelector('.highscore-wrap')
  highscoreEl.classList.add('hide')
})

decreaseBtn.addEventListener('pointerdown', () => {
  canvas.width = fileOut.width
  canvas.height = fileOut.height
  ctx.drawImage(fileOut, 0, 0, fileOut.width, fileOut.height, 0, 0, fileOut.width * 0.9, fileOut.height * 0.9)
  fileOut.src = canvas.toDataURL()
  canvas.width = 0
  canvas.height = 0
})

increaseBtn.addEventListener('pointerdown', () => {
  canvas.width = fileOut.width * 1.1
  canvas.height = fileOut.height * 1.1
  ctx.drawImage(fileOut, 0, 0, fileOut.width, fileOut.height, 0, 0, fileOut.width * 1.1, fileOut.height * 1.1)
  fileOut.src = canvas.toDataURL()
  canvas.width = 0
  canvas.height = 0
})

startBtn.addEventListener('pointerdown', () => {
  if (!resizedImg.src) return console.error('No image selected')
  clearCanvas()
  stopGame()
  drawTiles(resizedImg)
  shuffleTiles(tiles)
  insertTilesHTML()
  startGame()
})

function startGame() {
  // hide edit section, show game section
  gameSection.style.opacity = '1'
  editSection.style.display = 'none'
  resizedImg.style.width = "400px"
  resizedImg.style.height = "400px"
  resizedImg.style.display = "block"
  gameTimer()
  board.addEventListener('click', (handleMouseClick))
}

function stopGame() {
  timer = clearTimeout(timer)
  board.removeEventListener('click', (handleMouseClick))
}

function changeTileCount() {
  TILE_COUNT = tileCountEl.value
  COLUMNS = Math.sqrt(TILE_COUNT)
  ROWS = Math.sqrt(TILE_COUNT)
  board.removeAttribute('class')
  if(TILE_COUNT == 16) board.classList.add('grid-size16')
  if(TILE_COUNT == 25) board.classList.add('grid-size25')
  if(TILE_COUNT == 36) board.classList.add('grid-size36')
}

function imageEditor() {
  cropImage()
  fileOut.addEventListener('pointerdown', (e) => {
    editWrapper.style.cursor = 'grabbing'
    moveX = e.offsetX
    moveY = e.offsetY
    document.addEventListener('pointermove', moveWindow)
    document.addEventListener('pointerup', setWindow)
  })
}

function moveWindow(e) {
  // get images left and top values before applying transform
  let imgLeft = fileOut.getBoundingClientRect().left
  let imgTop = fileOut.getBoundingClientRect().top
  let editLeft =  editWrapper.getBoundingClientRect().left
  let editTop =  editWrapper.getBoundingClientRect().top
  // calculate img location based on edit window and page offset
  fileOut.style.left = `${e.pageX - editLeft - moveX}px`
  fileOut.style.top = `${e.pageY - editTop - moveY}px`
  // x and y to use in canvas of where to start re-drawing image
  canvasX = editLeft - imgLeft
  canvasY = editTop - imgTop
}

function setWindow() {
  cropImage()
  console.log('window set')
  document.removeEventListener('pointermove', moveWindow)
  document.removeEventListener('pointerup', setWindow)
  editWrapper.style.cursor = 'grab'
}

function cropImage() {
  canvas.width = 400
  canvas.height = 400
  ctx.drawImage(fileOut, canvasX, canvasY, 400, 400, 0, 0, 400, 400)
  resizedImg.src = canvas.toDataURL()
  canvas.width = 0
  canvas.height = 0
}

function drawTiles(img) {
  // receives an image to split into tiles
  canvas.width = width / ROWS
  canvas.height = height / COLUMNS

  // split image into base 64 urls and save to array
  for(let i=0; i<ROWS; i++) {
    for(let j=0; j<COLUMNS; j++) {
      let tileWidth = width / ROWS
      let tileHeight = height / COLUMNS
      // x & y co-ordinates of each tiles corner to start drawing from
      let x = (tileWidth * j)
      let y = (tileHeight * i)
      // find last tile to make blank
      if(x === (tileWidth * (ROWS-1)) && y === (tileHeight*(COLUMNS-1))) {
        tiles.push(blankTile)
        correctTileLocation.push(blankTile)
      } else {
        // draw tile
        ctx.drawImage(img, x, y, tileWidth, tileHeight, 0, 0, tileWidth, tileHeight)
        // draw border of tile
        ctx.rect(x,y,tileWidth,tileHeight)
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
    if(tiles[element] === blankTile) {
      let blank = document.createElement('div')
      blank.dataset.value = 'blank'
      blank.dataset.index = tiles.indexOf(index)
      board.appendChild(blank)
    } else {
      let tile = document.createElement('img')
      tile.src = tiles[element]
      tile.dataset.index = tiles.indexOf(index)
      board.appendChild(tile)
    }
  })
}

function handleMouseClick(e) {
  moveTile(e.target)
}

function moveTile(element) {

  let blank = findBlankTile()
  let validCol = blank % COLUMNS
  let validRow = Math.floor(blank / ROWS)
  let tileIndex = +element.dataset.index
  let [bool, direction] = validMove(blank, tileIndex, validCol, validRow)
  // return true or false if a selected tile is a valid move
  if (bool === true) {
    // swap elements and update tiles array
    swapTiles(tileIndex, blank, direction)
    // check if the puzzle has been solved
    if (checkWinCondition(tiles, correctTileLocation)) {
      const winMsg = document.createElement('div')
      document.querySelector('.page-wrap').insertAdjacentElement('beforebegin', winMsg)
      winMsg.classList.add('winMessage')
      winMsg.innerHTML = `Puzzle completed in: ${timerMins.innerHTML}:${timerSecs.innerHTML}!`
      // convert time to seconds only for storage
      let finalTime = (parseInt(timerMins.innerHTML) * 60) + (parseInt(timerSecs.innerHTML))
      if (timerMins.innerHTML == 0) {
        finalTime = parseInt(timerSecs.innerHTML)
      }
      // add score to local storage
      addHighscoreLS(finalTime)
      stopGame()
    }
  } else {
    console.log('invalid move')
    board.style.border = '20px solid red'
    setTimeout(() => {
      board.style.border = '20px solid white'
    }, 100)
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
  tile.classList.add('animate')
  // set either x or y depending on which position we need to move the tile
  switch (direction) {
    case 'left':
      tile.style.setProperty('--x', '-100%')
      break;
   case 'right':
      tile.style.setProperty('--x', '100%')
      break;
    case 'up':
      tile.style.setProperty('--y', '-100%')
      break;
    case 'down':
      tile.style.setProperty('--y', '100%')
      break; 
  }

  const waitForAnimation = setTimeout(() => {
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
    clearTimeout(waitForAnimation)
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

function clearCanvas() {
  // empty canvas
  ctx.clearRect(0,0,width,height)
  // empty tiles array
  tiles = []
  correctTileLocation = []
  // empty html gameboard
  document.getElementById('board').innerHTML = ''
}

function shuffleTiles(array) {

  let blank = array.length -1
  let validCol = blank % COLUMNS
  let validRow = Math.floor(blank / ROWS)
  let randomIndex = blank -1; // first move not random
  let validMove = []

  // make 1000 random valid moves to shuffle the board
  // moves must be valid otherwise puzzle can become unsolvable
  for (let i=0; i<1000; i++) {
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

  let score = getHighscoreLS()
  // compare highscores from lowest to highest
  score.sort((a,b) => (a.Time - b.Time))
  // write highscores to html
  for(let i=0; i<score.length; i++) {
    const li = document.createElement('li')
    document.getElementById('highscore-list').appendChild(li)
    // convert score from seconds to mins & seconds
    let seconds = score[i].Time % 60
    if (seconds == 0) seconds = '00'
    let minutes = Math.floor(score[i].Time / 60)
    if (seconds < 10 && seconds != 0) seconds = `0${seconds}`
    li.innerHTML = `Time: ${minutes}:${seconds} - Boardsize: ${score[i].Boardsize} tiles`
  }
}

function addHighscoreLS(time) {
  // add score & board size played on to Local Storage, time saved as seconds
  const highscore = JSON.parse(localStorage.getItem('highscores')) || []
  let newStorage = { 
    'Time': time,
    'Boardsize': TILE_COUNT
  }
  highscore.push(newStorage)
  localStorage.setItem('highscores', JSON.stringify(highscore))
}

function getHighscoreLS() {
  const highscore = JSON.parse(localStorage.getItem('highscores'));
  return highscore === null ? [] : highscore;
}

function gameTimer() {

  // simple timer for highscores, max time of 59mins 59secs
  let mins = 0
  let secs = 0
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