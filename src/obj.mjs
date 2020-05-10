import bunyan from 'bunyan'
import consoleLog from 'console-log-level'
import { EventEmitter } from 'events'
import { env as envCore, freeze, mergeArrayOverwrite, clone } from './core.mjs'

const Event = (props = {}) => {
  const maxListeners = props.maxListeners || 0
  const emitter = new EventEmitter()

  if (maxListeners > 0) {
    emitter.setMaxListeners(maxListeners)
  } // default is 10 if not set

  function emit (eventName, ...args) {
    emitter.emit(eventName, ...args)
    return this
  }

  function on (eventName, fx) {
    emitter.on(eventName, fx)
    return this
  }

  function off (eventName, fx) {
    emitter.on(eventName, fx)
    return this
  }

  function once (eventName, fx) {
    emitter.once(eventName, fx)
    return this
  }

  function listeners (eventName) {
    return emitter.listeners(eventName)
  }

  return freeze({ emit, on, off, once, listeners })
}

// Log({ log: 'console', level: 'debug/info' })     for https://www.npmjs.com/package/console-log-level
// Log({ log: 'bunyan', level: 'debug/info' })      for https://github.com/trentm/node-bunyan
// Log({ level: 'debug/info' })                     for bunyan as default
// Log({ log: instance, level: 'debug/info' })      for any log system
// Log({ log: instance })                           for any log system that does not support log level
// prop history to true will allow to get errors history with errors()
const Log = (props = {}) => {
  function createBunyanLogger ({ env, name, level }) {
    return bunyan.createLogger({ name: env + ' ' + name, level })
  }

  function dispatchLog (log) {
    if (log) {
      if (log === 'console') {
        return consoleLog({ level })
      } else if (log === 'bunyan') {
        return createBunyanLogger({ env, name, level })
      } else { // raw log
        return log
      }
    } else { // default log
      return createBunyanLogger({ env, name, level })
    }
  }

  const env = envCore()
  const name = props.name || 'default'
  const level = props.level || 'debug'
  const history = props.history || false
  let _someError = false
  const _errors = []

  const _log = dispatchLog(props.log)

  const someError = () => _someError
  const errors = () => _errors

  function debug (...args) {
    _log.debug(...args)
    return this
  }

  function info (...args) {
    _log.info(...args)
    return this
  }

  function warn (...args) {
    _log.warn(...args)
    return this
  }

  function error (...args) {
    _someError = true
    _log.error(...args)
    if (history) _errors.push(args.join(' '))
    return this
  }

  function fatal (...args) {
    error('FATAL', ...args)
    process.exit(-1)
  }

  return freeze({
    env,
    name,
    someError,
    errors,
    debug,
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
