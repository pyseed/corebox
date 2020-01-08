import bunyan from 'bunyan'
import { EventEmitter } from 'events'
import { env as envCore, freeze, mergeArrayOverwrite, clone } from './core.mjs'

const Event = (props) => {
  let _maxListeners = (props || {}).maxListeners

  const _emitter = new EventEmitter()
  if (_maxListeners) {
    _emitter.setMaxListeners(_maxListeners)
  } // default is 10 if not set

  const maxListeners = (max) => {
    if (max) {
      _maxListeners = max
      _emitter.setMaxListeners(_maxListeners)
    }

    return _maxListeners
  }
  const emit = function (eventName, ...args) {
    _emitter.emit(eventName, ...args)
    return this
  }
  const on = function (eventName, fx) {
    _emitter.on(eventName, fx)
    return this
  }
  const off = function (eventName, fx) {
    _emitter.on(eventName, fx)
    return this
  }
  const once = function (eventName, fx) {
    _emitter.once(eventName, fx)
    return this
  }
  const listeners = (eventName) => _emitter.listeners(eventName)

  return freeze({ maxListeners, emit, on, off, once, listeners })
}

// Log({ log: console }) for console
const Log = (props) => {
  props = props || {}

  const env = envCore()
  const name = props.name || 'default'
  let _anyError = false
  const _log = props.log || bunyan.createLogger({ name: env + ' ' + name })

  const anyError = () => _anyError

  const info = function (...args) {
    _log.info(...args)
    return this
  }
  const warn = function (...args) {
    _log.warn(...args)
    return this
  }
  const error = function (...args) {
    _anyError = true
    _log.error(...args)
    return this
  }
  const fatal = (...args) => {
    error('FATAL', ...args)
    process.exit(-1)
  }

  return freeze({
    env,
    name,
    anyError,
    info,
    warn,
    error,
    fatal
  })
}

const State = (props) => {
  let _state = props ? clone(props) : {}

  const state = (appendState) => {
    if (appendState) {
      _state = mergeArrayOverwrite(_state, appendState) // pure state
    }

    return freeze(_state)
  }
  const resetState = function () {
    _state = {}
    return this
  }

  return freeze({ state, resetState })
}

export { Event, Log, State }
