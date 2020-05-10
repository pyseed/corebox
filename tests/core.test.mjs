import chai from 'chai'
import sinon from 'sinon'
import fs from 'fs'
import mkdirp from 'mkdirp'
import { env, isString, freeze, clone, mapobj, some, every, id, timestamp, timestampCompact, load, save, initFile, mkdir, getPathBase, ls, jsonify, sort, sortAscFn, sortDescFn } from '../src/core.mjs'

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
      const fakeEnv = 'fake env'
      process.env.NODE_ENV = fakeEnv
      assert.strictEqual(env(), fakeEnv)
    })
  })

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

  test('freeze', () => {
    const o = { one: 1 }
    const o2 = freeze(o)
    assert.deepEqual(o, { one: 1 })
    assert.deepEqual(o2, { one: 1 })
    assert.throws(() => { o.two = 2 }, 'Cannot add property two, object is not extensible')
    assert.throws(() => { o2.three = 3 }, 'Cannot add property three, object is not extensible')
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

  test('load', () => {
    const expected = ['expected']
    const fake = sinon.fake.returns(expected)
    sinon.replace(fs, 'readFileSync', fake)

    const filePath = '/tmp/fake.txt'

    const res = load(filePath)
    sinon.assert.calledWithExactly(fs.readFileSync, filePath, { encoding: 'utf-8' })
    assert.strictEqual(res, expected)

    const res2 = load(filePath, 'encoding')
    sinon.assert.calledWithExactly(fs.readFileSync, filePath, { encoding: 'encoding' })
    assert.strictEqual(res2, expected)
  })

  test('save', () => {
    const fake = sinon.fake.returns(true)
    sinon.replace(fs, 'writeFileSync', fake)

    const filePath = '/tmp/fake.txt'

    const content = 'fake file content'
    save(filePath, content)
    sinon.assert.calledWithExactly(fs.writeFileSync, filePath, content, { encoding: 'utf-8', mode: 0o755 })

    save(filePath, content, 'encoding')
    sinon.assert.calledWithExactly(fs.writeFileSync, filePath, content, { encoding: 'encoding', mode: 0o755 })

    save(filePath, content, 'encoding', 0o750)
    sinon.assert.calledWithExactly(fs.writeFileSync, filePath, content, { encoding: 'encoding', mode: 0o750 })
  })

  suite('initFile', () => {
    test('file does not exists', () => {
      const fakeExistsSync = sinon.fake.returns(false) // file does not exists
      sinon.replace(fs, 'existsSync', fakeExistsSync)
      const fakeWriteFileSync = sinon.fake.returns(true)
      sinon.replace(fs, 'writeFileSync', fakeWriteFileSync)

      const filePath = '/tmp/fake.txt'
      const content = 'fake file content'
      const res = initFile(filePath, () => content)

      sinon.assert.calledWithExactly(fs.existsSync, filePath)
      sinon.assert.calledWithExactly(fs.writeFileSync, filePath, content, { encoding: 'utf-8', mode: 0o755 })
      assert.strictEqual(res, true, 'has been initialised')
    })

    test('file does exists', () => {
      const fakeExistsSync = sinon.fake.returns(true) // file exists
      sinon.replace(fs, 'existsSync', fakeExistsSync)
      const fakeWriteFileSync = sinon.fake.returns(true)
      sinon.replace(fs, 'writeFileSync', fakeWriteFileSync)

      const filePath = '/tmp/fake.txt'
      const content = 'fake file content'
      const res = initFile(filePath, () => content)

      sinon.assert.calledWithExactly(fs.existsSync, filePath)
      sinon.assert.notCalled(fs.writeFileSync) // file exists so should not be replaced !
      assert.strictEqual(res, false, 'has not been initialised (already exists)')
    })
  })

  test('mkdir', () => {
    const fake = sinon.fake.returns(true)
    sinon.replace(mkdirp, 'sync', fake)

    const dirPath = '/tmp/tmp1'

    mkdir(dirPath)
    sinon.assert.calledWithExactly(mkdirp.sync, dirPath, { mode: 0o755 })

    mkdir(dirPath, 0o750)
    sinon.assert.calledWithExactly(mkdirp.sync, dirPath, { mode: 0o750 })
  })

  test('getPathBase', () => {
    assert.deepEqual(getPathBase('/dir1/dir2/file.ext'), 'file')
    assert.deepEqual(getPathBase('/dir1/dir2/file.ext', true), 'file.ext')
    assert.deepEqual(getPathBase('/dir1/dir2'), 'dir2')
  })

  suite('ls', () => {
    test('onlyDir and onlyFile are exclusive', () => {
      const basePath = '/tmp/tmp1'

      const fakeReaddirSync = sinon.fake.returns(['file'])
      sinon.replace(fs, 'readdirSync', fakeReaddirSync)
      const fakeStats = sinon.fake.returns(true)
      const fakeStatSync = sinon.fake.returns({ isDirectory: fakeStats })
      sinon.replace(fs, 'statSync', fakeStatSync)

      expect(() => {
        ls(basePath, { onlyDir: true, onlyFile: true })
      }).to.throw('onlyDir and onlyFile options can not be set together')
    })

    test('only directory, file is a directory', () => {
      const basePath = '/tmp/tmp1'
      const file = 'file'
      const filePath = '/tmp/tmp1/file'
      const isDirectory = true // file assumed to be a directory

      const fakeReaddirSync = sinon.fake.returns([file])
      sinon.replace(fs, 'readdirSync', fakeReaddirSync)
      const fakeStats = sinon.fake.returns(isDirectory)
      const fakeStatSync = sinon.fake.returns({ isDirectory: fakeStats })
      sinon.replace(fs, 'statSync', fakeStatSync)

      const res = ls(basePath, { onlyDir: true })
      sinon.assert.calledWithExactly(fs.readdirSync, basePath)
      sinon.assert.calledWithExactly(fs.statSync, filePath)
      assert.deepEqual(res, [filePath])
    })

    test('only directory, file is not a directory', () => {
      const basePath = '/tmp/tmp1'
      const file = 'file'
      const filePath = '/tmp/tmp1/file'
      const isDirectory = false // file assumed to not be a directory

      const fakeReaddirSync = sinon.fake.returns([file])
      sinon.replace(fs, 'readdirSync', fakeReaddirSync)
      const fakeStats = sinon.fake.returns(isDirectory)
      const fakeStatSync = sinon.fake.returns({ isDirectory: fakeStats })
      sinon.replace(fs, 'statSync', fakeStatSync)

      const res = ls(basePath, { onlyDir: true })
      sinon.assert.calledWithExactly(fs.readdirSync, basePath)
      sinon.assert.calledWithExactly(fs.statSync, filePath)
      assert.deepEqual(res, [])
    })

    test('only file, file is a file', () => {
      const basePath = '/tmp/tmp1'
      const file = 'file'
      const filePath = '/tmp/tmp1/file'
      const isDirectory = false // file assumed to be a file

      const fakeReaddirSync = sinon.fake.returns([file])
      sinon.replace(fs, 'readdirSync', fakeReaddirSync)
      const fakeStats = sinon.fake.returns(isDirectory)
      const fakeStatSync = sinon.fake.returns({ isDirectory: fakeStats })
      sinon.replace(fs, 'statSync', fakeStatSync)

      const res = ls(basePath, { onlyFile: true })
      sinon.assert.calledWithExactly(fs.readdirSync, basePath)
      sinon.assert.calledWithExactly(fs.statSync, filePath)
      assert.deepEqual(res, [filePath])
    })

    test('only file, file is not a file', () => {
      const basePath = '/tmp/tmp1'
      const file = 'file'
      const filePath = '/tmp/tmp1/file'
      const isDirectory = true // file assumed to not be a file

      const fakeReaddirSync = sinon.fake.returns([file])
      sinon.replace(fs, 'readdirSync', fakeReaddirSync)
      const fakeStats = sinon.fake.returns(isDirectory)
      const fakeStatSync = sinon.fake.returns({ isDirectory: fakeStats })
      sinon.replace(fs, 'statSync', fakeStatSync)

      const res = ls(basePath, { onlyFile: true })
      sinon.assert.calledWithExactly(fs.readdirSync, basePath)
      sinon.assert.calledWithExactly(fs.statSync, filePath)
      assert.deepEqual(res, [])
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
})
