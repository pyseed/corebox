import bunyan from 'bunyan'
import dmerge from 'deepmerge'
import uuidv4 from '@bundled-es-modules/uuid/v4.js'
import { EventEmitter } from 'events'

export const WithEvent = (props) => {
  const { maxListeners } = (props || {})

  const _emitter = new EventEmitter()
  if (maxListeners) {
    _emitter.setMaxListeners(maxListeners)
  } // default is 10 if not set

  // const { addListener, listeners, emit, on, off, once } = _emitter
  const emit = (eventName, ...args) => _emitter.emit(eventName, ...args)
  const on = (eventName, fx) => { _emitter.on(eventName, fx) }
  const off = (eventName, fx) => { _emitter.on(eventName, fx) }
  const once = (eventName, fx) => { _emitter.once(eventName, fx) }
  const listeners = (eventName) => _emitter.listeners(eventName)

  return Object.freeze({ emit, on, off, once, listeners })
}

export const WithId = () => {
  const id = () => uuidv4()

  return Object.freeze({ id })
}

export const WithEnv = () => {
  const _env = process.env.NODE_ENV || 'development'

  const env = () => _env

  return Object.freeze({ env })
}

// get log for WithLog
const getLog = (name) => {
  return bunyan.createLogger({ name: name || '' })
  // return console // to switch to console
}

export const WithLog = (props) => {
  const { name } = (props || {})

  const { env } = WithEnv()
  const _log = getLog(name ? env() + ' ' + name : env())
  let _anyError = false

  const info = (...args) => { _log.info(...args) }
  const warn = (...args) => { _log.warn(...args) }
  const error = (...args) => {
    _anyError = true
    _log.error(...args)
  }
  const fatal = (...args) => {
    error('FATAL', ...args)
    process.exit(-1)
  }
  const anyError = () => _anyError

  return Object.freeze({
    info,
    warn,
    error,
    fatal,
    anyError
  })
}

export const WithState = (props) => {
  // use deepmerge to merge x, y but without merging arrays (overwrite arrays versus append)
  const overwriteArrayMerge = (destinationArray, sourceArray, options) => sourceArray

  let _state = (props || {}).state ? Object.assign({}, props.state) : {}

  const state = (appendState) => {
    if (appendState) {
      // pure state (freezed)
      _state = Object.freeze(dmerge(_state, appendState, { arrayMerge: overwriteArrayMerge }))
    }

    return _state
  }
  const resetState = () => { _state = {} }

  return Object.freeze({ state, resetState })
}
