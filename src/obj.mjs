import consoleLog from 'console-log-level'
import { EventEmitter } from 'events'
import { env as envCore, freeze, clone } from './core.mjs'

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

// kiss ultra lite logging using console-log-level package
// props:
// name: log name
// ts: true/false show timestamp (default false)
// level: trace, debug, info, warn, error, fatal (default info)
const Log = (props = {}) => {
  const name = props.name || ''
  const ts = props.ts === true
  const level = props.level || 'info'

  const env = envCore()

  const prefix = (level) => {
    const separator = ' / '
    let prefix = ''

    if (ts) prefix += new Date().toISOString() + separator
    prefix += env + separator
    if (name) prefix += name + separator
    prefix += level.toUpperCase() + ' =>'

    return prefix
  }

  const log = consoleLog({ prefix, level })
  const { debug, info, warn, error, fatal } = log

  function fatal2 (...args) {
    fatal(...args)
    if (process) process.exit(-1)
  }

  return freeze({ name, ts, level, env, trace: (...args) => log.trace(...args), debug, info, warn, error, fatal: fatal2 })
}

const State = (props = {}) => {
  let _state = clone(props)

  function state (appendState) {
    if (appendState) {
      _state = { ..._state, ...appendState } // pure state
    }

    return freeze(_state)
  }

  function resetState () {
    _state = {}
    return this
  }

  return freeze({ state, resetState })
}

export { Event, Log, State }
