const tileCountEl = document.getElementById('tile-count')
let TILE_COUNT = tileCountEl.value
let COLUMNS = Math.sqrt(TILE_COUNT)
let ROWS = Math.sqrt(TILE_COUNT)
const timerSecs = document.getElementById('timer-secs')
const timerMins = document.getElementById('timer-mins')
const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')
const fileIn = document.getElementById('imgInp')
const fileOut = document.getElementById('imgOut')
const board = document.getElementById('board')
const resizedImg = document.getElementById('resized-image')
const highscoreBtn = document.getElementById('highscore')
const blankTile = 'blank'
let width = 500
let height = 500
let tiles = []
let correctTileLocation = []
let timer

insertHighscoreHTML()

// reset & redraw game board when user changes board size
tileCountEl.addEventListener('change', () => {
  // if a file has been uploaded - redraw
  if (fileIn.files.length != 0) {
    changeTileCount()
    clearCanvas()
    stopGame()
    drawTiles(resizedImg)
    shuffleTiles(tiles)
    insertTilesHTML()
    startGame()
  // if no file to draw, just update tile count
  } else { 
    changeTileCount()
  }
})

// get user uploaded file and send to resize function
fileIn.addEventListener('change', () => {
  const reader = new FileReader()
  const selectedFile = fileIn.files[0]
  if (selectedFile) {
    reader.readAsDataURL(selectedFile)
    reader.onload = selectedFile => fileOut.src = selectedFile.target.result
    reader.onloadend = () => resizeImage(fileOut)
  }
})

// show/hide highscores
highscoreBtn.addEventListener('click', () => {
  const highscoreEl = document.querySelector('.highscore-wrap')
  if (highscoreEl.classList.contains('hide')) {
    highscoreEl.classList.remove('hide')
    highscoreBtn.innerHTML = 'Hide Highscores'
  } else {
    highscoreEl.classList.add('hide')
    highscoreBtn.innerHTML = 'Show Highscores'
  }
})

function changeTileCount() {
  TILE_COUNT = tileCountEl.value
  COLUMNS = Math.sqrt(TILE_COUNT)
  ROWS = Math.sqrt(TILE_COUNT)
  board.removeAttribute('class')
  if(TILE_COUNT == 16) board.classList.add('grid-size16')
  if(TILE_COUNT == 25) board.classList.add('grid-size25')
  if(TILE_COUNT == 36) board.classList.add('grid-size36')
}

function resizeImage(img) {
  img.onload = () => {
    canvas.width = width
    canvas.height = height
    // resize user uploaded image to 500x500px
    ctx.drawImage(img,0,0,width,height)
    resizedImg.src = canvas.toDataURL()
    // must wait for image to load before sending to drawTiles()
    resizedImg.addEventListener('load', () => {
      clearCanvas()
      stopGame()
      drawTiles(resizedImg)
      shuffleTiles(tiles)
      insertTilesHTML()
      startGame()
    })
  }
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

function startGame() {
  gameTimer()
  board.addEventListener('click', (handleMouseClick))
}

function stopGame() {
  timer = clearTimeout(timer)
  board.removeEventListener('click', (handleMouseClick))
}

function handleMouseClick(e) {
  moveTile(e.target)
}

function moveTile(element) {

  let blank = findBlankTile()
  let validCol = blank % COLUMNS
  let validRow = Math.floor(blank / ROWS)
  let tileIndex = +element.dataset.index

  // return true or false if a selected tile is a valid move
  if (validMove(blank, tileIndex, validCol, validRow)) {
    // swap elements and update tiles array
    swapTiles(tileIndex, blank)
    // check if the puzzle has been solved
    if (checkWinCondition(tiles, correctTileLocation)) {
      alert(`Puzzle completed in: ${timerMins.innerHTML}:${timerSecs.innerHTML}!`)
      // save time in seconds to local storage
      let finalTime = (+timerMins.innerHTML * 60) + (+timerSecs.innerHTML)
      if (timerMins.innerHTML == 0) {
        finalTime = +timerSecs.innerHTML
      }
      // add score to local storage
      addHighscoreLS(finalTime)
      stopGame()
    }
  } else {
    console.log('invalid move')
  }
}

function validMove(blank, tileIndex, validCol, validRow) {
  // user selected tile must be in the same Col OR Row
  // AND be an adjacent tile to be a valid move
  if (((tileIndex % COLUMNS === validCol) || (Math.floor(tileIndex / ROWS) === validRow)) 
  && ((blank +1 === tileIndex) || (blank -1 === tileIndex)
  || (blank +ROWS === tileIndex) || (blank -ROWS=== tileIndex))) {
    return true
  } else {
    return false
  }
}

function swapTiles(tileIndex, blank) {
  let tile = document.querySelector(`[data-index='${tileIndex}'`)
  let blankTile = document.querySelector(`[data-index='${blank}'`)
  let tempTile = tile
  let tempBlank = blankTile
  let temp = document.createElement('div')

  // replaces blank tile with an empty placeholder div
  // selected tile is then replaced with blank tile
  // placehodler div is then replaced with the selected tile
  // effectively swapping the selected tile & blank tile
  blankTile.replaceWith(temp)
  tile.replaceWith(tempBlank)
  tempBlank.dataset.index = tileIndex
  temp.replaceWith(tempTile)
  tempTile.dataset.index = blank

  // update tiles array with new tile index after swapping
  let temp2 = tiles[tileIndex]
  tiles[tileIndex] = tiles[blank]
  tiles[blank] = temp2

  return tiles
}

function checkWinCondition(a, b) {
  // if both arrays are equal return true - user wins
  return JSON.stringify(a)==JSON.stringify(b);
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
  let randomIndex = blank -1;
  let validMove = []

  // make 1000 random valid moves to shuffle the board
  // moves must be valid otherwise puzzle can be unsolvable
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

  // get highscores from local storage
  let score = getHighscoreLS()
  score.sort((a,b) => (a.Time - b.Time))

  for(let i=0; i<score.length; i++) {
    const li = document.createElement('li')
    document.getElementById('highscore-list').appendChild(li)
    // time saved in LS as seconds, gets converted into mins + secs
    let seconds = score[i].Time % 60
    if (seconds == 0) seconds = '00' 
    let minutes = Math.floor(score[i].Time / 60)
    li.innerHTML = `Time: ${minutes}:${seconds} - Boardsize: ${score[i].Boardsize} tiles`
  }
}

function addHighscoreLS(time) {
  // add score & board size played on to Local Storage
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