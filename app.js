const tileCountEl = document.getElementById('tile-count')
let TILE_COUNT = tileCountEl.value
let COLUMNS = Math.sqrt(TILE_COUNT)
let ROWS = Math.sqrt(TILE_COUNT)
const editWrapper = document.querySelector('.image-edit-wrap')
const gameSection = document.querySelector('.game-section')
const editSection = document.querySelector('.edit-section')
const startBtn = document.querySelector('.start-game-btn')
const resizeBtn = document.querySelector('.resize')
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
let width = 400
let height = 400
let tiles = []
let correctTileLocation = []
let timer
let canvasX, canvasY = 0
let moveX, moveY = 0
let imgLeftStart, imgTopStart = 0

// update canvas width/height for small devices
// same size breakpoint as used in the CSS media query
if(window.innerWidth <= 600) {
  width = 350
  height = 350
}

// hide how to play section, show edit section
document.querySelector('.intro button').addEventListener('click', () => {
  document.querySelector('.intro').classList.add('hide-intro')
  document.querySelector('.intro').classList.remove('intro')
  document.querySelector('main').classList.add('show')
  document.querySelector('main').style.pointerEvents = 'all'
})

insertHighscoreHTML()

// change tilecount on click
tileCountEl.addEventListener('change', () => {
  changeTileCount()
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

resizeBtn.addEventListener('pointerdown', () => {
  canvasX = 0
  canvasY = 0
  canvas.width = width
  canvas.height = height
  ctx.drawImage(fileOut, canvasX, canvasY, fileOut.width, fileOut.height, 0, 0, width, height)
  fileOut.src = canvas.toDataURL()
  cropImage()
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
  resizedImg.style.display = "block"
  gameTimer()
  board.addEventListener('click', handleMouseClick)
  document.addEventListener('keypress', handleKeypress)
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
  // get default canvasX & canvasY pos for initial draw
  let imgLeft = fileOut.getBoundingClientRect().left
  let imgTop = fileOut.getBoundingClientRect().top
  let editLeft =  editWrapper.getBoundingClientRect().left
  let editTop =  editWrapper.getBoundingClientRect().top
  canvasX = editLeft - imgLeft
  canvasY = editTop - imgTop
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
  document.removeEventListener('pointermove', moveWindow)
  document.removeEventListener('pointerup', setWindow)
  editWrapper.style.cursor = 'grab'
}

function cropImage() {
  canvas.width = width
  canvas.height = height
  console.log(fileOut, canvasX ,canvasY)
  ctx.drawImage(fileOut, canvasX, canvasY, width, height, 0, 0, width, height)
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
      tile.draggable = false
      board.appendChild(tile)
    }
  })
}

function handleMouseClick(e) {
  moveTile(e.target)
}

function handleKeypress(e) {

  let blank = findBlankTile()
  let validCol = blank % COLUMNS
  let validRow = Math.floor(blank / ROWS)
  let element = 0

  // add small delay to each keypress
  const delay = setTimeout(() => {
    console.log('press')
    // W moves tile above DOWN into blank, S moves tile below UP into blank
    // A moves tile RIGHT of blank into blank, D moves tile LEFT of blank into blank
    if (e.key === "s") {
      // check if moving tile down into blank is a valid move
      if ((blank-4) % COLUMNS === validCol && (blank-4) >= 0 ) {
        element = document.querySelector(`[data-index='${blank-4}']`)
        moveTile(element)
      } else {
        console.error('invalid move')
      }
    } else if (e.key === "w") {
      // check if moving tile up into blank is a valid move
      if ((blank+4) % COLUMNS === validCol && (blank+4) <= Number(TILE_COUNT -1)) {
        element = document.querySelector(`[data-index='${blank+4}']`)
        moveTile(element)
      } else {
        console.error('invalid move')
      }
    } else if (e.key === "d") {
      // check if moving tile right into blank is a valid move
      if (Math.floor((blank-1) / ROWS) === validRow) {
        element = document.querySelector(`[data-index='${blank-1}']`)
        moveTile(element)
      } else {
        console.error('invalid move')
      }
    } else if (e.key === "a") {
      // check if moving tile left into blank is a valid move
      if (Math.floor((blank+1) / ROWS) === validRow) {
        element = document.querySelector(`[data-index='${blank+1}']`)
        moveTile(element)
      } else {
        console.error('invalid move')
      }
    }
    clearTimeout(delay)
  }, 60)

}

function moveTile(element) {

  let blank = findBlankTile()
  let validCol = blank % COLUMNS
  let validRow = Math.floor(blank / ROWS)
  let tileIndex = Number(element.dataset.index)
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
      const showWinMsgTimer = setTimeout(() => {
        winMsg.remove()
        clearTimeout(showWinMsgTimer)
      }, 3000)
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
    const wrongMoveTimer = setTimeout(() => {
      board.style.border = '20px solid white'
      clearTimeout(wrongMoveTimer)
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

  let score = getHighscoreLS()
  if (score.length === 0) return
  // compare highscores from lowest to highest
  score.sort((a,b) => (a.Time - b.Time))
  // write 10 best highscores to html
  for(let i=0; i<score.length; i++) {
    if (i > 10) return
    const span = document.createElement('span')
    const li = document.createElement('li')
    const image = document.createElement('img')
    document.getElementById('highscore-list').appendChild(span)
    span.appendChild(li)
    span.appendChild(image)
    image.src = score[i].Img
    image.style.width = "100px"
    image.style.height = "100px"
    // convert score from seconds to mins & seconds
    let seconds = score[i].Time % 60
    if (seconds == 0) seconds = '00'
    let minutes = Math.floor(score[i].Time / 60)
    if (seconds < 10 && seconds != 0) seconds = `0${seconds}`
    li.innerHTML = `Time: ${minutes}:${seconds} - Board: ${score[i].Boardsize} tiles - Image: `
  }
}

function addHighscoreLS(time) {
  // add score & board size played on to Local Storage, time saved as seconds
  const highscore = JSON.parse(localStorage.getItem('highscores')) || []
  let newStorage = { 
    'Time': time,
    'Boardsize': TILE_COUNT,
    'Img' : resizedImg.src
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