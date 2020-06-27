import chai from 'chai'
import sinon from 'sinon'
import { env, isString, isNumber, isArray, isObject, isObjectStrong, freeze, unfreeze, clone, mapobj, some, every, id, timestamp, timestampCompact, jsonify, sort, sortAscFn, sortDescFn, Log, State } from '../src/corebox.mjs'

const assert = chai.assert
const expect = chai.expect

suite('core', () => {
  const isOdd = x => x % 2 === 0

  teardown(() => {
    delete process.env.NODE_ENV
    sinon.restore()
  })

  suite('Env', () => {
    test('default', () => {
      assert.strictEqual(env(), 'development')
    })

    test('env', () => {
      const fakeEnv = 'fake_env'
      process.env.NODE_ENV = fakeEnv
      assert.strictEqual(env(), fakeEnv)
    })
  })

  suite('is', () => {
    test('isString', () => {
      assert.strictEqual(isString(undefined), false)
      assert.strictEqual(isString(true), false)
      assert.strictEqual(isString(1), false)
      assert.strictEqual(isString({}), false)
      assert.strictEqual(isString([]), false)
      assert.strictEqual(isString(() => {}), false)

      assert.strictEqual(isString(''), true)
      assert.strictEqual(isString('a'), true)
      assert.strictEqual(isString(new String('')), true) // eslint-disable-line
      assert.strictEqual(isString(new String('a')), true) // eslint-disable-line
    })

    test('isNumber', () => {
      assert.strictEqual(isNumber(undefined), false)
      assert.strictEqual(isNumber(true), false)
      assert.strictEqual(isNumber({}), false)
      assert.strictEqual(isNumber([]), false)
      assert.strictEqual(isNumber(() => {}), false)
      assert.strictEqual(isNumber('a'), false)
      assert.strictEqual(isNumber(new String('a')), false) // eslint-disable-line

      assert.strictEqual(isNumber(0), true)
      assert.strictEqual(isNumber(1), true)
    })

    test('isArray', () => {
      assert.strictEqual(isArray(undefined), false)
      assert.strictEqual(isArray(true), false)
      assert.strictEqual(isArray({}), false)
      assert.strictEqual(isArray(() => {}), false)
      assert.strictEqual(isArray('a'), false)
      assert.strictEqual(isArray(new String('a')), false) // eslint-disable-line

      assert.strictEqual(isArray([]), true)
      assert.strictEqual(isArray([1]), true)
    })

    test('isObject', () => {
      assert.strictEqual(isObject(undefined), false)
      assert.strictEqual(isObject(true), false)
      assert.strictEqual(isObject(() => {}), false)
      assert.strictEqual(isObject('a'), false)

      assert.strictEqual(isObject({}), true)
      assert.strictEqual(isObject({ one: 1 }), true)
      assert.strictEqual(isObject([]), true)
      assert.strictEqual(isObject(new String('')), true) // eslint-disable-line
    })

    test('isObjectStrong', () => {
      assert.strictEqual(isObjectStrong(undefined), false)
      assert.strictEqual(isObjectStrong(true), false)
      assert.strictEqual(isObjectStrong(() => {}), false)
      assert.strictEqual(isObjectStrong('a'), false)

      assert.strictEqual(isObjectStrong({}), true)
      assert.strictEqual(isObjectStrong({ one: 1 }), true)
      assert.strictEqual(isObjectStrong([]), false)
      assert.strictEqual(isObjectStrong(new String('')), false) // eslint-disable-line
    })
  })

  test('freeze', () => {
    const o = freeze({ one: 1 })
    assert.deepEqual(o, { one: 1 })
    expect(() => {
      o.two = 2
    }).to.throw('Cannot add property two, object is not extensible')
  })

  test('unfreeze', () => {
    const o = Object.freeze({ one: 1 })
    expect(() => {
      o.two = 2
    }).to.throw('Cannot add property two, object is not extensible')

    const o2 = unfreeze(o)
    o2.two = 2
    assert.deepEqual(o2, { one: 1, two: 2 })

    assert.deepEqual(o, { one: 1 })
  })

  suite('clone', () => {
    test('empty', () => {
      const source = {}
      const o = clone(source)
      assert.deepEqual(o, {})
      o.one = 1
      assert.deepEqual(o, { one: 1 })
      assert.deepEqual(source, {}, 'source should be intact')
    })

    test('legacy', () => {
      const source = { one: 1 }
      const o = clone(source)
      assert.deepEqual(o, { one: 1 })

      o.two = 2
      assert.deepEqual(o, { one: 1, two: 2 })
      assert.deepEqual(source, { one: 1 }, 'source should be intact')
    })

    test('subset', () => {
      const source = { one: 1, two: 2 }
      const o = clone(source, ['one'])
      assert.deepEqual(o, { one: 1 })

      o.three = 3
      assert.deepEqual(o, { one: 1, three: 3 })
      assert.deepEqual(source, { one: 1, two: 2 }, 'source should be intact')
    })
  })

  suite('mapobj', () => {
    test('empty', () => {
      const source = {}
      const o = mapobj(source, x => x * 2)
      assert.deepEqual(o, {})
      o.one = 1
      assert.deepEqual(o, { one: 1 })
      assert.deepEqual(source, {}, 'source should be intact')
    })

    test('map', () => {
      const source = { one: 1, two: 2, three: 3 }
      const o = mapobj(source, x => x * 2)
      assert.deepEqual(o, { one: 2, two: 4, three: 6 })
      assert.deepEqual(source, { one: 1, two: 2, three: 3 }, 'source should be intact')
    })
  })

  suite('some', () => {
    test('array', () => {
      assert.strictEqual(some([], isOdd), false)
      assert.strictEqual(some([1], isOdd), false)
      assert.strictEqual(some([1, 3], isOdd), false)
      assert.strictEqual(some([2], isOdd), true)
      assert.strictEqual(some([1, 2, 3], isOdd), true)
    })

    test('object', () => {
      assert.strictEqual(some({}, isOdd), false)
      assert.strictEqual(some({ one: 1 }, isOdd), false)
      assert.strictEqual(some({ one: 1, three: 3 }, isOdd), false)
      assert.strictEqual(some({ two: 2 }, isOdd), true)
      assert.strictEqual(some({ one: 1, two: 2, three: 3 }, isOdd), true)
    })
  })

  suite('every', () => {
    test('array', () => {
      assert.strictEqual(every([], isOdd), true)
      assert.strictEqual(every([1], isOdd), false)
      assert.strictEqual(every([1, 2], isOdd), false)
      assert.strictEqual(every([2], isOdd), true)
      assert.strictEqual(every([2, 4], isOdd), true)
    })

    test('object', () => {
      assert.strictEqual(every({}, isOdd), true)
      assert.strictEqual(every({ one: 1 }, isOdd), false)
      assert.strictEqual(every({ one: 1, two: 2 }, isOdd), false)
      assert.strictEqual(every({ two: 2 }, isOdd), true)
      assert.strictEqual(every({ two: 2, four: 4 }, isOdd), true)
    })
  })

  test('id', () => {
    assert.strictEqual(id().length, 36)
  })

  suite('timestamp', () => {
    test('timestamp', () => {
      const ts = timestamp() // 2019-06-10T12:08:39.643Z

      assert.deepEqual(ts.length, 24)
      assert.deepEqual(ts[10], 'T')
      assert.deepEqual(ts[ts.length - 1], 'Z')
    })

    test('compact timestamp', () => {
      assert.deepEqual(timestampCompact('2019-06-10T12:08:39.643Z'), '20190610_120839_643')
    })

    test('compact timestamp, new timestamp', () => {
      const ts = timestampCompact()

      assert.deepEqual(ts.length, 19)
      assert.deepEqual(ts[8], '_')
      assert.deepEqual(ts[15], '_')
    })
  })

  test('jsonify', () => {
    const fake = sinon.fake.returns(true)
    sinon.replace(JSON, 'stringify', fake)

    const obj = { one: 1 }

    jsonify(obj)
    sinon.assert.calledWithExactly(JSON.stringify, obj, null, null)

    jsonify(obj, false)
    sinon.assert.calledWithExactly(JSON.stringify, obj, null, null)

    jsonify(obj, true)
    sinon.assert.calledWithExactly(JSON.stringify, obj, null, 4) // with 4 indent
  })

  suite('sort', () => {
    test('pure sort', () => {
      const arr = [2, 1, 3]
      assert.deepEqual(sort(arr, (a, b) => a > b ? 1 : -1), [1, 2, 3])
      assert.deepEqual(arr, [2, 1, 3], 'passed array should not be impacted')
    })

    test('sortAscFn', () => {
      const arr = [2, 1, 3]
      assert.deepEqual(sort(arr, sortAscFn), [1, 2, 3])
      assert.deepEqual(arr, [2, 1, 3], 'passed array should not be impacted')
    })

    test('sortDescFn', () => {
      const arr = [2, 1, 3]
      assert.deepEqual(sort(arr, sortDescFn), [3, 2, 1])
      assert.deepEqual(arr, [2, 1, 3], 'passed array should not be impacted')
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
      const log = (fx, msg) => {
        const spy = sinon.spy(console, fx)
        o[fx](msg)
        sinon.assert.calledWithExactly(spy, o.prefix(fx), msg)
        spy.restore()
      }

      const o = Log({ name: 'mylog', ts: true, level: 'debug' })
      const message = 'awesome log'

      log('debug', message)
      log('info', message)
      log('warn', message)
      log('error', message)
    })

    test('logging level range', () => {
      const o = Log({ name: 'mylog', ts: true, level: 'info' })
      const message = 'awesome log'
      let fx
      let spy

      fx = 'debug'
      spy = sinon.spy(console, fx)
      o[fx](message)
      sinon.assert.notCalled(spy) // out of scope
      spy.restore()

      fx = 'info'
      spy = sinon.spy(console, fx)
      o[fx](message)
      sinon.assert.called(spy) // scope start
      spy.restore()

      fx = 'error'
      spy = sinon.spy(console, fx)
      o[fx](message)
      sinon.assert.called(spy) // scope start
      spy.restore()
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
      o.resetState()
      assert.deepEqual(o.state(), {})
    })
  })
})
