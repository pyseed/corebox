import { jest } from '@jest/globals'
import { env, isString, isNumber, isArray, isObject, isObjectStrong, freeze, unfreeze, clone, cloneDeep, mapobj, some, every, id, timestamp, timestampCompact, jsonify, sort, sortAscFn, sortDescFn, Log, State } from '../src/corebox.mjs'

describe('core', () => {
  const isOdd = x => x % 2 === 0

  afterEach(() => {
    delete process.env.NODE_ENV
  })

  describe('env', () => {
    test('default', () => {
      expect(env()).toBe('test')
    })

    test('env', () => {
      const fakeEnv = 'fake_env'
      process.env.NODE_ENV = fakeEnv
      expect(env()).toBe(fakeEnv)
    })
  })

  describe('is', () => {
    test('isString', () => {
      expect(isString(undefined)).toBeFalsy()
      expect(isString(true)).toBeFalsy()
      expect(isString(1)).toBeFalsy()
      expect(isString({})).toBeFalsy()
      expect(isString([])).toBeFalsy()
      expect(isString(() => {})).toBeFalsy()

      expect(isString('')).toBeTruthy()
      expect(isString('a')).toBeTruthy()
      expect(isString(new String(''))).toBeTruthy() // eslint-disable-line
      expect(isString(new String('a'))).toBeTruthy() // eslint-disable-line
    })

    test('isNumber', () => {
      expect(isNumber(undefined)).toBeFalsy()
      expect(isNumber(true)).toBeFalsy()
      expect(isNumber({})).toBeFalsy()
      expect(isNumber([])).toBeFalsy()
      expect(isNumber(() => {})).toBeFalsy()
      expect(isNumber('a')).toBeFalsy()
      expect(isNumber(new String('a'))).toBeFalsy() // eslint-disable-line

      expect(isNumber(0)).toBeTruthy()
      expect(isNumber(1)).toBeTruthy()
    })

    test('isArray', () => {// eslint-disable-line
      expect(isArray(true)).toBeFalsy()
      expect(isArray({})).toBeFalsy()
      expect(isArray(() => {})).toBeFalsy()
      expect(isArray('a')).toBeFalsy()
      expect(isArray(new String('a'))).toBeFalsy() // eslint-disable-line

      expect(isArray([])).toBeTruthy()
      expect(isArray([1])).toBeTruthy()
    })

    test('isObject', () => {
      expect(isObject(undefined)).toBeFalsy()
      expect(isObject(true)).toBeFalsy()
      expect(isObject(() => {})).toBeFalsy()
      expect(isObject('a')).toBeFalsy()

      expect(isObject({})).toBeTruthy()
      expect(isObject({ one: 1 })).toBeTruthy()
      expect(isObject([])).toBeTruthy()
      expect(isObject(new String(''))).toBeTruthy() // eslint-disable-line
    })

    test('isObjectStrong', () => {
      expect(isObjectStrong(undefined)).toBeFalsy()
      expect(isObjectStrong(true)).toBeFalsy()
      expect(isObjectStrong(() => {})).toBeFalsy()
      expect(isObjectStrong('a')).toBeFalsy()

      expect(isObjectStrong({})).toBeTruthy()
      expect(isObjectStrong({ one: 1 })).toBeTruthy()
      expect(isObjectStrong([])).toBeFalsy()
      expect(isObjectStrong(new String(''))).toBeFalsy() // eslint-disable-line
    })
  })

  test('freeze', () => {
    const o = freeze({ one: 1 })
    expect(o).toStrictEqual({ one: 1 })
    expect(() => {
      o.two = 2
    }).toThrow('Cannot add property two, object is not extensible')
  })

  test('unfreeze', () => {
    const o = Object.freeze({ one: 1 })
    expect(() => {
      o.two = 2
    }).toThrow('Cannot add property two, object is not extensible')

    const o2 = unfreeze(o)
    o2.two = 2
    expect(o2).toStrictEqual({ one: 1, two: 2 })

    expect(o).toStrictEqual({ one: 1 })
  })

  describe('clone', () => {
    test('empty', () => {
      const source = {}
      const o = clone(source)
      expect(o).toStrictEqual({})
      o.one = 1
      expect(o).toStrictEqual({ one: 1 })
      expect(source).toStrictEqual({}) // source should be unchanged
    })

    test('legacy', () => {
      const source = { one: 1 }
      const o = clone(source)
      expect(o).toStrictEqual({ one: 1 })

      o.two = 2
      expect(o).toStrictEqual({ one: 1, two: 2 })
      expect(source).toStrictEqual({ one: 1 }) // source should be unchanged
    })

    test('subset', () => {
      const source = { one: 1, two: 2 }
      const o = clone(source, ['one'])
      expect(o).toStrictEqual({ one: 1 })

      o.three = 3
      expect(o).toStrictEqual({ one: 1, three: 3 })
      expect(source).toStrictEqual({ one: 1, two: 2 }) // source should be unchanged
    })
  })

  describe('cloneDeep', () => {
    test('empty', () => {
      const source = {}
      const o = cloneDeep(source)
      expect(o).toStrictEqual({})

      o.one = 1
      expect(o).toStrictEqual({ one: 1 })
      expect(source).toStrictEqual({}) // source should be unchanged
    })

    test('legacy', () => {
      const source = { one: 1, two: 2 }
      const o = cloneDeep(source)
      expect(o).toStrictEqual({ one: 1, two: 2 })

      delete o.two
      expect(o).toStrictEqual({ one: 1 })
      expect(source).toStrictEqual({ one: 1, two: 2 }) // source should not be impacted by delete of two in clone
    })
  })

  describe('mapobj', () => {
    test('empty', () => {
      const source = {}
      const o = mapobj(source, x => x * 2)
      expect(o).toStrictEqual({})
      o.one = 1
      expect(o).toStrictEqual({ one: 1 })
      expect(source).toStrictEqual({}) // source should be intact
    })

    test('map', () => {
      const source = { one: 1, two: 2, three: 3 }
      const o = mapobj(source, x => x * 2)
      expect(o).toStrictEqual({ one: 2, two: 4, three: 6 })
      expect(source).toStrictEqual({ one: 1, two: 2, three: 3 }) // source should be intact
    })
  })

  describe('some', () => {
    test('array', () => {
      expect(some([], isOdd)).toBeFalsy()
      expect(some([1], isOdd)).toBeFalsy()
      expect(some([1, 3], isOdd)).toBeFalsy()

      expect(some([2], isOdd)).toBeTruthy()
      expect(some([1, 2, 3], isOdd)).toBeTruthy()
    })

    test('object', () => {
      expect(some({}, isOdd)).toBeFalsy()
      expect(some({ one: 1 }, isOdd)).toBeFalsy()
      expect(some({ one: 1, three: 3 }, isOdd)).toBeFalsy()

      expect(some({ two: 2 }, isOdd)).toBeTruthy()
      expect(some({ one: 1, two: 2, three: 3 }, isOdd)).toBeTruthy()
    })
  })

  describe('every', () => {
    test('array', () => {
      expect(every([], isOdd)).toBeTruthy()
      expect(every([1], isOdd)).toBeFalsy()
      expect(every([1, 2], isOdd)).toBeFalsy()
      expect(every([2], isOdd)).toBeTruthy()
      expect(every([2, 4], isOdd)).toBeTruthy()
    })

    test('object', () => {
      expect(every({}, isOdd)).toBeTruthy()
      expect(every({ one: 1 }, isOdd)).toBeFalsy()
      expect(every({ one: 1, two: 2 }, isOdd)).toBeFalsy()
      expect(every({ two: 2 }, isOdd)).toBeTruthy()
      expect(every({ two: 2, four: 4 }, isOdd)).toBeTruthy()
    })
  })

  test('id', () => {
    expect(id().length).toBe(36)
  })

  describe('timestamp', () => {
    test('timestamp', () => {
      const ts = timestamp() // 2019-06-10T12:08:39.643Z

      expect(ts.length).toBe(24)
      expect(ts[10]).toBe('T')
      expect(ts[ts.length - 1]).toBe('Z')
    })

    test('compact timestamp', () => {
      expect(timestampCompact('2019-06-10T12:08:39.643Z')).toBe('20190610_120839_643')
    })

    test('compact timestamp, new timestamp', () => {
      const ts = timestampCompact()

      expect(ts.length).toBe(19)
      expect(ts[8]).toBe('_')
      expect(ts[15]).toBe('_')
    })
  })

  /* eslint-env jest */
  describe('jsonify', () => {
    const jsonStringifySpy = jest.spyOn(JSON, 'stringify')
    const obj = { one: 1 }

    jsonify(obj)
    expect(jsonStringifySpy).toBeCalledWith(obj, null, null)

    jsonify(obj, false)
    expect(jsonStringifySpy).toBeCalledWith(obj, null, null)

    jsonify(obj, true)
    expect(jsonStringifySpy).toBeCalledWith(obj, null, 4) // with 4 indent
  })

  describe('sort', () => {
    test('pure sort', () => {
      const arr = [2, 1, 3]
      expect(sort(arr, (a, b) => a > b ? 1 : -1)).toStrictEqual([1, 2, 3])
      expect(arr).toStrictEqual([2, 1, 3]) // passed array should not be impacted
    })

    test('sortAscFn', () => {
      const arr = [2, 1, 3]
      expect(sort(arr, sortAscFn)).toStrictEqual([1, 2, 3])
      expect(arr).toStrictEqual([2, 1, 3]) // passed array should not be impacted
    })

    test('sortDescFn', () => {
      const arr = [2, 1, 3]
      expect(sort(arr, sortDescFn)).toStrictEqual([3, 2, 1])
      expect(arr).toStrictEqual([2, 1, 3]) // passed array should not be impacted
    })
  })

  describe('Log', () => {
    test('init default', () => {
      const o = new Log()

      expect(o.name).toBe('')
      expect(o.ts).toBeFalsy()
      expect(o.level).toBe('info')
      expect(o.env).toBe('development')
    })

    test('env', () => {
      const fakenv = 'fake_env'
      process.env.NODE_ENV = fakenv
      const o = new Log()
      expect(o.env).toBe(fakenv)
    })

    test('name', () => {
      const name = 'name'
      const o = new Log({ name })
      expect(o.name).toBe(name)
    })

    test('ts', () => {
      const ts = true
      const o = new Log({ ts })
      expect(o.ts).toBeTruthy()

      const ts2 = 'wrong'
      const o2 = new Log({ ts: ts2 })
      expect(o2.ts).toBeFalsy()
    })

    test('level', () => {
      const level = 'fake_level'
      const o = new Log({ level })
      expect(o.level).toBe(level)
    })

    test('logging', () => {
      const log = (fx, msg, o) => {
        const spy = jest.spyOn(console, fx)
        o[fx](msg)
        expect(spy).toBeCalledWith(o.prefix(fx), msg)
      }

      const o = new Log({ name: 'mylog', ts: false, level: 'debug' }) // no ts to compare strictly expected and received
      const message = 'awesome log'

      log('debug', message, o)
      log('info', message, o)
      log('warn', message, o)
      log('error', message, o)
    })

    test('logging level range', () => {
      const o = new Log({ name: 'mylog-level-range', ts: true, level: 'info' })
      const message = 'awesome log'

      const spy1 = jest.spyOn(console, 'debug')
      o.debug(message)
      expect(spy1).not.toBeCalled() // level out of scope

      const spy2 = jest.spyOn(console, 'info')
      o.info(message)
      expect(spy2).toBeCalled() // scope start

      const spy3 = jest.spyOn(console, 'error')
      o.error(message)
      expect(spy3).toBeCalled()
    })
  })

  describe('State', () => {
    test('init', () => {
      const o = new State()
      expect(o._data).toStrictEqual({})
    })

    test('data()', () => {
      const o = new State()

      o.data({ one: 1 })
      expect(o._data).toStrictEqual({ one: 1 })
      expect(o.data()).toStrictEqual({ one: 1 })
      o.data({ two: [2] })
      expect(o._data).toStrictEqual({ one: 1, two: [2] })
      o.data({ two: ['two'] })
      expect(o._data).toStrictEqual({ one: 1, two: ['two'] })

      expect(() => {
        o.data().three = 3
      }).toThrow('Cannot add property three, object is not extensible')
    })

    test('reset()', () => {
      const o = new State({ three: 3 })

      expect(o._data).toStrictEqual({ three: 3 })
      o.reset()
      expect(o._data).toStrictEqual({})
    })
  })
})
