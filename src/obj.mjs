import bunyan from 'bunyan'
import { EventEmitter } from 'events'
import { freeze, id, mergeArrayOverwrite, purify } from './core.mjs'

const Event = (props) => {
  const { maxListeners } = (props || {})

  const _emitter = new EventEmitter()
  if (maxListeners) {
    _emitter.setMaxListeners(maxListeners)
  } // default is 10 if not set

  const emit = (eventName, ...args) => _emitter.emit(eventName, ...args)
  const on = (eventName, fx) => { _emitter.on(eventName, fx) }
  const off = (eventName, fx) => { _emitter.on(eventName, fx) }
  const once = (eventName, fx) => { _emitter.once(eventName, fx) }
  const listeners = (eventName) => _emitter.listeners(eventName)

  return freeze({ emit, on, off, once, listeners })
}

const Id = () => {
  return Object.freeze({ id })
}

const Env = () => {
  const _env = process.env.NODE_ENV || 'development'

  const env = () => _env

  return freeze({ env })
}

// get log for WithLog
const getLog = (name) => {
  return bunyan.createLogger({ name: name || '' })
  // return console // to switch to console
}

const Log = (props) => {
  const { name } = (props || {})

  const { env } = Env()
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

  return freeze({
    info,
    warn,
    error,
    fatal,
    anyError
  })
}

const State = (props) => {
  let _state = purify((props || {}).state || {})

  const state = (appendState) => {
    if (appendState) {
      // pure state (freezed)
      _state = freeze(mergeArrayOverwrite(_state, appendState))
    }

    return _state
  }
  const resetState = () => { _state = {} }

  return freeze({ state, resetState })
}

export { Event, Id, Env, Log, State }
