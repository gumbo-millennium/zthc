/**
 * Plasma effect, as class
 *
 * Effect by Kevin Roast
 * Code modifications by Roelof
 */

import { debounce } from 'debounce'

const sin = Math.sin
const sqrt = Math.sqrt
const rgb = (red, green, blue) => `rgb(${red}, ${green}, ${blue})`

const buildPalette = () => {
  const palettes = []

  let subPalette = []
  for (var i = 0; i < 256; i++) {
    subPalette.push(rgb(i, i, i))
  }
  palettes.push(subPalette)

  subPalette = []
  for (let i = 0; i < 128; i++) {
    subPalette.push(rgb(i * 2, i * 2, i * 2))
  }
  for (let i = 0; i < 128; i++) {
    subPalette.push(rgb(255 - (i * 2), 255 - (i * 2), 255 - (i * 2)))
  }
  palettes.push(subPalette)

  subPalette = new Array(256)
  for (let i = 0; i < 64; i++) {
    subPalette[i] = rgb(i << 2, 255 - ((i << 2) + 1), 64)
    subPalette[i + 64] = rgb(255, (i << 2) + 1, 128)
    subPalette[i + 128] = rgb(255 - ((i << 2) + 1), 255 - ((i << 2) + 1), 192)
    subPalette[i + 192] = rgb(0, (i << 2) + 1, 255)
  }
  palettes.push(subPalette)

  subPalette = [].concat(subPalette)
  subPalette.sort((a, b) => Math.random() * 2 - 1)
  palettes.push(subPalette)

  return palettes
}

const fontSize = 16
const offsetTop = 16
const offsetLeft = 16
const boxWidth = 3 * fontSize + offsetLeft
const drawFps = (canvas, tick) => {
  var ctx = canvas.getContext('2d')
  ctx.save()

  ctx.globalAlpha = 1
  ctx.fillStyle = '#000'
  ctx.fillRect(offsetLeft, offsetTop, boxWidth, fontSize * 1.5)

  ctx.font = `${fontSize}pt sans-serif`
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'center'
  ctx.fillText(`${Math.round(1000 / tick)}`, offsetLeft + boxWidth / 2, offsetTop + fontSize * 1.25)

  ctx.restore()
}

const drawEffect = (canvas, config, palettes, paletteoffset) => {
  // init context and img data buffer
  const ctx = canvas.getContext('2d')

  // canvas width and height
  const w = canvas.width
  const h = canvas.height
  const pw = config.PlasmaDensity
  const ph = (pw * (h / w)) // plasma source width and height
  const palette = palettes[config.PaletteIndex]

  // scale the plasma source to the canvas width/height
  const vpx = (w / pw)
  const vpy = (h / ph)

  var dist = function dist (a, b, c, d) {
    return sqrt((a - c) * (a - c) + (b - d) * (b - d))
  }

  const time = Date.now() / config.TimeFunction

  let colour
  if (config.PlasmaFunction === 1) {
    colour = (x, y) => (
      128 + (128 * sin(x * 0.0625)) +
      128 + (128 * sin(y * 0.03125)) +
      128 + (128 * sin(dist(x + time, y - time, w, h) * 0.125)) +
      128 + (128 * sin(sqrt(x * x + y * y) * 0.125))
    ) * 0.25
  } else {
    colour = (x, y) => ((
      sin(dist(x + time, y, 128.0, 128.0) / 8.0) +
        sin(dist(x - time, y, 64.0, 64.0) / 8.0) +
        sin(dist(x, y + time / 7, 192.0, 64) / 7.0) +
        sin(dist(x, y, 192.0, 100.0) / 8.0)
    ) + 4) * 32
  }

  ctx.save()
  ctx.globalAlpha = config.Alpha
  var jitter = config.Jitter ? (-config.Jitter + (Math.random() * config.Jitter * 2)) : 0
  for (var y = 0, x; y < ph; y++) {
    for (x = 0; x < pw; x++) {
      // map plasma pixels to canvas pixels using the virtual pixel size
      ctx.fillStyle = palette[(~~colour(x, y) + paletteoffset) % 256]
      ctx.fillRect(x * vpx + jitter, y * vpy + jitter, vpx, vpy)
    }
  }
  ctx.restore()
}

export class Plasma {
  get canvas () {
    return this._canvas
  }

  get palettes () {
    return this._palettes
  }

  get config () {
    return this._config
  }

  constructor (selector, config) {
    if (!selector) {
      throw Error('Target selector is missing')
    }

    const canvas = document.querySelector(selector)
    if (!canvas) {
      throw Error(`Cannot find canvas with selector "${selector}"`)
    }

    // Init read-only properties
    this._canvas = canvas
    this._palettes = buildPalette()

    // Init customizable properties
    this._config = Object.assign({}, {
      CycleSpeed: 1,
      ShowFPS: false,
      PlasmaDensity: 64,
      TimeFunction: 512,
      PlasmaFunction: 0,
      Jitter: 8,
      Alpha: 0.1,
      PaletteIndex: 2
    }, config || {})

    // Init private properties
    this._paletteOffset = 0
    this._running = false
    this._dimensions = [window.innerWidth, window.innerHeight]
    this._lastFrame = Date.now()
    this._nextFactor = 1

    // Bind to resize
    window.addEventListener('resize', debounce(() => this.resize(), 150), { passive: true })
    this.resize()
  }

  resize () {
    if (!this._canvas) {
      return
    }

    this._canvas.width = window.innerWidth
    this._canvas.height = window.innerHeight
    this._dimensions = [window.innerWidth, window.innerHeight]
  }

  start () {
    this._running = true
    requestAnimationFrame(() => this.frame())
  }

  stop () {
    this._running = false
  }

  frame () {
    // Stop if no longer running
    if (!this._running) {
      console.log('Cancelling run, %o is false. %o', this._running, this)
      return
    }

    // Get frame time
    const frameTime = new Date()

    // Scale according to device framerate
    const scale = Math.floor(this.config.CycleSpeed * this._nextFactor)
    const paletteOffset = (this._paletteOffset += scale)

    // Render effect
    drawEffect(this.canvas, this.config, this.palettes, paletteOffset)

    // Render FPS
    if (this.config.ShowFPS) {
      drawFps(this.canvas, frameTime - this._lastFrame)
    }

    // Determine scale using framerate
    this._nextFactor = 1 + Math.max(0, (frameTime - this._lastFrame) / 300)

    // Store time
    this._lastFrame = new Date()

    // Schedule next frame
    requestAnimationFrame(() => this.frame())
  }
}
