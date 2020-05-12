import chai from 'chai'
import sinon from 'sinon'
import { Event, Log, State } from '../src/obj.mjs'

const assert = chai.assert
const expect = chai.expect

suite('obj', () => {
  teardown(() => {
    delete process.env.NODE_ENV
    sinon.restore()
  })

  suite('Event', () => {
    test('init default', async () => {
      const o = Event()

      assert.isFunction(o.emit)
      assert.isFunction(o.on)
      assert.isFunction(o.off)
      assert.isFunction(o.once)
      assert.isFunction(o.listeners)
    })

    test('on / emit', async () => {
      let message = ''

      const o = Event()
      const onRes = o.on('message', msg => { message = msg })
      assert.equal(onRes, o)

      const onEmit = await o.emit('message', 'foobar')
      assert.strictEqual(message, 'foobar')
      assert.equal(onEmit, o)
    })
  })

  suite('Log', () => {
    let FakeLog
    let customMarker = false

    suiteSetup(() => {
      FakeLog = () => {
        let _someError = false

        return {
          env: 'development',
          name: 'custom',
          someError: () => _someError,
          debug: msg => { customMarker = true },
          info: msg => {},
          warn: msg => {},
          error: msg => { _someError = true }
        }
      }
    })

    teardown(() => {
      customMarker = false
    })

    test('init default', () => {
      const o = Log()

      assert.isObject(o)
      assert.isFalse(customMarker)
      assert.isString(o.env)
      assert.isString(o.name)
      assert.isFunction(o.someError)
      assert.isFunction(o.info)
      assert.isFunction(o.warn)
      assert.isFunction(o.error)
      assert.isFunction(o.fatal)
      assert.strictEqual(o.env, 'development')
      assert.strictEqual(o.name, 'default')
      assert.strictEqual(o.someError(), false)
    })

    test('init custom log', () => {
      const o = Log({ log: FakeLog() })

      assert.isObject(o)
      assert.isFunction(o.debug)
      o.debug()
      assert.isTrue(customMarker)
    })

    test('init console-log-level', () => {
      const o = Log({ log: 'console' })

      assert.isOk(o)
      assert.isFalse(customMarker)
      assert.isFunction(o.debug)
      assert.isFunction(o.info)
    })

    test('log reveal', () => {
      const log = FakeLog()
      const infoSpy = sinon.spy(log, 'info')
      const warnSpy = sinon.spy(log, 'warn')
      const errorSpy = sinon.spy(log, 'error')

      const o = Log({ log })
      o.info('fake info')
      sinon.assert.calledWithExactly(infoSpy, 'fake info')
      o.warn('fake warn')
      sinon.assert.calledWithExactly(warnSpy, 'fake warn')
      o.error('fake error')
      sinon.assert.calledWithExactly(errorSpy, 'fake error')
    })

    test('someError()', () => {
      const o = Log({ log: FakeLog() })

      assert.strictEqual(o.someError(), false)
      o.info('fake info')
      assert.strictEqual(o.someError(), false)
      o.warn('fake warn')
      assert.strictEqual(o.someError(), false)
      o.error('fake error')
      assert.strictEqual(o.someError(), true)
    })

    test('errors()', () => {
      const o = Log({ log: FakeLog(), history: true })

      assert.deepEqual(o.errors(), [])
      o.info('fake info')
      assert.deepEqual(o.errors(), [])
      o.warn('fake warn')
      assert.deepEqual(o.errors(), [])
      o.error('fake error 1')
      assert.deepEqual(o.errors(), ['fake error 1'])
      o.error('fake error 2')
      assert.deepEqual(o.errors(), ['fake error 1', 'fake error 2'])
    })
  })

  suite('State', () => {
    test('init', () => {
      const o = State()

      assert.isObject(o)
      assert.isFunction(o.state)
      assert.isFunction(o.resetState)
    })

    test('state()', () => {
      const o = State()

      assert.deepEqual(o.state(), {})
      o.state({ one: 1 })
      assert.deepEqual(o.state(), { one: 1 })
      o.state({ two: [2] })
      assert.deepEqual(o.state(), { one: 1, two: [2] })
      o.state({ two: ['two'] })
      assert.deepEqual(o.state(), { one: 1, two: ['two'] })

      expect(() => {
        o.state().three = 3
      }).to.throw('Cannot add property three, object is not extensible')
    })

    test('resetState()', () => {
      const o = State({ three: 3 })

      assert.deepEqual(o.state(), { three: 3 })
      const resetStateRes = o.resetState()
      assert.deepEqual(o.state(), {})
      assert.equal(resetStateRes, o)
    })
  })
})
