import { Event, Id, Env, Log, State } from './src/corebox.mjs'

console.log('demo')

const Jam = () => {
  const { emit, on } = Event({ maxListeners: 20 })

  const { id } = Id()

  const { env } = Env()

  const { info, warn, error, fatal, anyError } = Log()

  const { state, resetState } = State()

  return Object.freeze({
    id,
    on,
    emit,
    env,
    info,
    warn,
    error,
    fatal,
    anyError,
    state,
    resetState
  })
}

const jam = Jam()

jam.on('hello', (message) => {
  console.log('event hello', message)
})

jam.emit('hello', 'world')

console.log('id', jam.id())
console.log('env', jam.env())

jam.info('info message')
jam.warn('warning message')
console.log('anyError()', jam.anyError())
jam.error('error message')
console.log('anyError()', jam.anyError())

console.log('state empty', jam.state())
jam.state({ counter: 0 })
console.log('state { counter: 0 }', jam.state())
jam.state({ counter: 1 })
console.log('state { counter: 1 }', jam.state())
jam.state({ name: 'foobar' })
console.log('state { counter: 0, name: "foobar" }', jam.state())
jam.resetState()
console.log('state was reset', jam.state())

jam.fatal('fake fatal error that exit process -1')
console.log('should not be displayed due to above fatal()')
