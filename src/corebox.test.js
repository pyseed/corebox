import { env, isString, isNumber, isArray, isObject, isObjectStrong, freeze, unfreeze, clone, cloneDeep, mapobj, some, every, id, timestamp, timestampCompact, jsonify, sort, sortAscFn, sortDescFn, Log, State } from '../src/corebox.mjs'

jest.mock('JSON')

suite('core', () => {
  const isOdd = x => x % 2 === 0

  afterEach(() => {
    delete process.env.NODE_ENV
  })

  suite('Env', () => {
    test('default', () => {
      expect(env()).toBe('development')
    })

    test('env', () => {
      const fakeEnv = 'fake_env'
      process.env.NODE_ENV = fakeEnv
      expect(env()).toBe(fakeEnv)
    })
  })

  suite('is', () => {
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
      expect(isString(new String('a'))).toBeTruthy()  // eslint-disable-line
    })

    test('isNumber', () => {
      expect(isNumber(undefined)).toBeFalsy()
      expect(isNumber(true)).toBeFalsy()
      expect(isNumber(1)).toBeFalsy()
      expect(isNumber({})).toBeFalsy()
      expect(isNumber([])).toBeFalsy()
      expect(isNumber(() => {})).toBeFalsy()
      expect(isNumber('a')).toBeFalsy()
      expect(isNumber(new String('a'))).toBeFalsy()


      expect(isNumber(0)).toBeTruthy()
      expect(isNumber(1)).toBeTruthy()
    })

    test('isArray', () => {
      expect(isArray(undefined)).toBeFalsy()
      expect(isArray(true)).toBeFalsy()
      expect(isArray({})).toBeFalsy()
      expect(isArray(() => {})).toBeFalsy()
      expect(isArray('a')).toBeFalsy()
      expect(isArray(new String('a'))).toBeFalsy()

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
      expect(isObject(new String('')).toBeTruthy() // eslint-disable-line
    })

    test('isObjectStrong', () => {
      expect(isObjectStrong(undefined)).toBeFalsy()
      expect(isObjectStrong(true)).toBeFalsy()
      expect(isObjectStrong(() => {})).toBeFalsy()
      expect(isObjectStrong('a')).toBeFalsy()

      expect(isObject({})).toBeTruthy()
      expect(isObject({ one: 1 })).toBeTruthy()
      expect(isObject([])).toBeFalsy()
      expect(isObject(new String('')).toBeFalsy() // eslint-disable-line
    })
  })

  test('freeze', () => {
    const o = freeze({ one: 1 })
    expect(o).toBe({ one: 1 })
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
    expect(o2).toBe({ one: 1, two: 2 })

    expect(o).toBe({ one: 1 })
  })

  suite('clone', () => {
    test('empty', () => {
      const source = {}
      const o = clone(source)
      expect(o).toBe({})
      o.one = 1
      expect(o).toBe({ one: 1 })
      expect(source).toBe({}) // source should be unchanged
    })

    test('legacy', () => {
      const source = { one: 1 }
      const o = clone(source)
      expect(o).toBe({ one: 1 })

      o.two = 2
      expect(o).toBe({ one: 1, two: 2 })
      expect(source).toBe({ one: 1 }) // source should be unchanged
    })

    test('subset', () => {
      const source = { one: 1, two: 2 }
      const o = clone(source, ['one'])
      expect(o).toBe({ one: 1 })

      o.three = 3
      expect(o).toBe({ one: 1, three: 3 })
      expect(source).toBe({ one: 1, two: 2 } // source should be unchanged
    })
  })

  suite('cloneDeep', () => {
    test('empty', () => {
      const source = {}
      const o = cloneDeep(source)
      expect(o).toBe({})

      o.one = 1
      expect(o).toBe({ one: 1 })
      expect(source).toBe({}) // source should be unchanged
    })

    test('legacy', () => {
      const source = { one: 1, two: 2 }
      const o = cloneDeep(source)
      expect(o).toBe({ one: 1, two: 2 })

      delete o.two
      expect(o).toBe({ one: 1 })
      expect(source).toBe({ one: 1, two: 2 }) // source should not be impacted by delete of two in clone
    })
  })

  suite('mapobj', () => {
    test('empty', () => {
      const source = {}
      const o = mapobj(source, x => x * 2)
      expect(o).toBe({})
      o.one = 1
      expect(o).toBe({ one: 1 })
      expect(source).toBe({} // source should be intact
    })

    test('map', () => {
      const source = { one: 1, two: 2, three: 3 }
      const o = mapobj(source, x => x * 2)
      expect(o).toBe({ one: 2, two: 4, three: 6 })
      expect(source).toBe({ one: 1, two: 2, three: 3 } // source should be intact
    })
  })

  suite('some', () => {
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

  suite('every', () => {
    test('array', () => {
      expect(every([], isOdd)).toBeTruthy()
      expect(every([1], isOdd)).toBeFalsy()
      expect(every([1, 2], isOdd)).toBeFalsy()
      expect(every([2], isOdd)) .toBeTruthy()
      expect(every([2, 4], isOdd)).toBeTruthy()
    })

    test('object', () => {
      expect(every({}, isOdd), true).toBeTruthy()
      expect(every({ one: 1 }, isOdd)).toBeFalsy()
      expect(every({ one: 1, two: 2 }), false).toBeFalsy()
      expect(every({ two: 2 }, isOdd)).toBeTruthy()
      expect(every({ two: 2, four: 4 }, isOdd), true).toBeTruthy()
    })
  })

  test('id', () => {
    expect(id().length).toBe(36)
  })

  suite('timestamp', () => {
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

      assert.deepEqual(ts.length, 19)
      assert.deepEqual(ts[8], '_')
      assert.deepEqual(ts[15], '_')
      expect(ts.length).toBe(19)
      expect(ts[8]).toBe('_')
      expect(ts[15]).toBe('_')
    })
  })

  test('jsonify', () => {
    JSON.stringify.mockResolvedValue('fake')

    const obj = { one: 1 }

    jsonify(obj)
    expect(JSON.stringify).toBeCalledWith(obj, null, null)

    jsonify(obj, false)
    expect(JSON.stringify).toBeCalledWith(obj, null, null)

    jsonify(obj, true)
    expect(JSON.stringify).toBeCalledWith(obj, null, 4) // with 4 indent
  })

  suite('sort', () => {
    test('pure sort', () => {
      const arr = [2, 1, 3]
      expect(sort(arr, (a, b) => a > b ? 1 : -1)).toBe([1, 2, 3])
      expect(arr).toBe([2, 1, 3]) // passed array should not be impacted
    })

    test('sortAscFn', () => {
      const arr = [2, 1, 3]
      expect(sort(arr, sortAscFn)).toBe([1, 2, 3])
      expect(arr).toBe([2, 1, 3]) // passed array should not be impacted
    })

    test('sortDescFn', () => {
      const arr = [2, 1, 3]
      expect(sort(arr, sortDescFn)).toBe([3, 2, 1])
      expect(arr).toBe([2, 1, 3]) // passed array should not be impacted
    })
  })

  suite('Log', () => {
    test('init default', () => {
      const o = new Log()

      expect(o.name).toBe('')
      expect(o.ts).toBeFalsy()
      expect(o.level).toBe('info')
      expect(o.env).toBe('test')
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
      expect(o.ts).toBeTruely()

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
        o[fx](msg)
        expect(console[fx]).toBeCalledWith(o.prefix(fx), msg)
      }

      const o = new Log({ name: 'mylog', ts: true, level: 'debug' })
      const message = 'awesome log'

      log('debug', message, o)
      log('info', message, o)
      log('warn', message, o)
      log('error', message, o)
    })

    test('logging level range', () => {
      const o = new Log({ name: 'mylog', ts: true, level: 'info' })
      const message = 'awesome log'
      let fx

      fx = 'debug'
      o[fx](message)
      expect(console[fx]).toBeNotCalled() // level out of scope

      fx = 'info'
      o[fx](message)
      expect(console[fx]).toBeCalled() // scope start

      fx = 'error'
      o[fx](message)
      expect(console[fx]).toBeCalled() // scope start // scope start
    })
  })

  suite('State', () => {
    test('init', () => {
      const o = new State()
      expect(o._data).toBe({})
    })

    test('data()', () => {
      const o = new State()

      o.data({ one: 1 })
      expect(o._data).toBe({ one: 1 })
      expect(o.data()).toBe({ one: 1 })
      o.data({ two: [2] })
      expect(o._data).toBe({ one: 1, two: [2] })
      o.data({ two: ['two'] })
      expect(o._data).toBe({ one: 1, two: ['two'] })

      expect(() => {
        o.data().three = 3
      }).toThrow('Cannot add property three, object is not extensible')
    })

    test('reset()', () => {
      const o = new State({ three: 3 })

      expect(o._data).toBe({ three: 3 })
      o.reset()
      expect(o._data).toBe({})
    })
  })
})
