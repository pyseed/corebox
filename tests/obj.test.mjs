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
    test('init default', () => {
      const o = Log()

      assert.isObject(o)
      assert.isString(o.name)
      assert.isBoolean(o.ts)
      assert.isString(o.level)
      assert.isFunction(o.trace)
      assert.isFunction(o.debug)
      assert.isFunction(o.info)
      assert.isFunction(o.warn)
      assert.isFunction(o.error)
      assert.isFunction(o.fatal)
      assert.strictEqual(o.name, '')
      assert.isFalse(o.ts)
      assert.strictEqual(o.level, 'info')
      assert.strictEqual(o.env, 'development')
    })

    test('env', () => {
      const fakenv = 'fake_env'
      process.env.NODE_ENV = fakenv
      const o = Log()
      assert.strictEqual(o.env, fakenv)
    })

    test('name', () => {
      const name = 'name'
      const o = Log({ name })
      assert.strictEqual(o.name, name)
    })

    test('ts', () => {
      const ts = true
      const o = Log({ ts })
      assert.isBoolean(o.ts)
      assert.isTrue(o.ts)

      const ts2 = 'wrong'
      const o2 = Log({ ts: ts2 })
      assert.isBoolean(o2.ts)
      assert.isFalse(o2.ts)
    })

    test('level', () => {
      const level = 'fake_level'
      const o = Log({ level })
      assert.strictEqual(o.level, level)
    })

    test('logging', () => {
      const o = { ...Log({ name: 'mylog', ts: true, level: 'trace' }) } // unfreeze to use sinon.spy

      const traceSpy = sinon.spy(o, 'trace')
      const debugSpy = sinon.spy(o, 'debug')
      const infoSpy = sinon.spy(o, 'info')
      const warnSpy = sinon.spy(o, 'warn')
      const errorSpy = sinon.spy(o, 'error')

      o.trace('fake trace')
      sinon.assert.calledWithExactly(traceSpy, 'fake trace')
      o.debug('fake debug')
      sinon.assert.calledWithExactly(debugSpy, 'fake debug')
      o.info('fake info')
      sinon.assert.calledWithExactly(infoSpy, 'fake info')
      o.warn('fake warn')
      sinon.assert.calledWithExactly(warnSpy, 'fake warn')
      o.error('fake error')
      sinon.assert.calledWithExactly(errorSpy, 'fake error')
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
