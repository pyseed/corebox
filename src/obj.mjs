import bunyan from 'bunyan'
import { EventEmitter } from 'events'
import { freeze, mergeArrayOverwrite, clone } from './core.mjs'

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
  const emit = (eventName, ...args) => _emitter.emit(eventName, ...args)
  const on = (eventName, fx) => { _emitter.on(eventName, fx) }
  const off = (eventName, fx) => { _emitter.on(eventName, fx) }
  const once = (eventName, fx) => { _emitter.once(eventName, fx) }
  const listeners = (eventName) => _emitter.listeners(eventName)

  return freeze({ maxListeners, emit, on, off, once, listeners })
}

const Env = () => {
  const _env = process.env.NODE_ENV || 'development'

  const env = () => _env

  return freeze({ env })
}

// Log({ log: console }) for console
const Log = (props) => {
  const { env } = Env()
  const _name = (props || {}).name ? env() + ' ' + props.name : env()
  const _log = (props || {}).log || bunyan.createLogger({ name: _name })
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

  return freeze({
    info,
    warn,
    error,
    fatal,
    anyError
  })
}

const State = (props) => {
  let _state = props ? clone(props) : {}

  const state = (appendState) => {
    if (appendState) {
      // pure state (freezed)
      _state = mergeArrayOverwrite(_state, appendState)
    }

    return freeze(_state)
  }
  const resetState = () => { _state = {} }

  return freeze({ state, resetState })
}

export { Event, Env, Log, State }
