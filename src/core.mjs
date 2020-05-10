import dmerge from 'deepmerge'
import fs from 'fs'
import glob from 'simple-glob'
import mkdirp from 'mkdirp'
import path from 'path'
import uuidv4 from '@bundled-es-modules/uuid/v4.js'

const env = () => process.env.NODE_ENV || 'development'

const isString = (str) => typeof str === 'string' || str instanceof String

/**
 * use deepmerge to merge x, y
 * @param {Object} x
 * @param {Object} y
 * @return merge object
 */
const merge = (x, y) => dmerge(x, y)

/**
 * use deepmerge to merge x, y but without merging arrays (overwrite versus append)
 * @param {Object} x
 * @param {Object} y
 * @return merge object
 */
const mergeArrayOverwrite = (x, y) => {
  const overwriteMerge = (destinationArray, sourceArray, options) => sourceArray // overwrite arrays
  return dmerge(x, y, { arrayMerge: overwriteMerge })
}

/**
 * freeze object
 * @param {Object} obj
 * @return freezed object
 */
const freeze = (obj) => {
  return Object.freeze(obj)
}

/**
 * pure clone of given object
 * to set a subset of obj, specify the selected keys
 * @param {Object}  obj    source object
 * @param {Array}   keys   keys to select for a subset (default no subset)
 * @return clone object
 */
const clone = (obj, keys) => {
  let source = keys === undefined ? obj : {}

  if (keys !== undefined) {
    source = {}
    keys.forEach(key => { source[key] = obj[key] })
  }

  return merge({}, source)
}

/**
 * map to new object (original is kept as it)
 * @param {Object}    obj    source object
 * @param {Function}  fx     function to apply fx(x, key)
 * @return mapped object
 */
const mapobj = (obj, fx) => {
  const newObj = {}

  Object.keys(obj).forEach(key => { newObj[key] = fx(obj[key], key) })

  return newObj
}

/**
 * some to object or array
 * @param {Object/Array}    objOrArr    source object/array
 * @param {Function}        fx          function to apply
 * @return (bool) true if at least one mapped function fx return true
 */
const some = (objOrArr, fx) => {
  if (Array.isArray(objOrArr)) {
    return objOrArr.some(fx)
  }

  for (const key of Object.keys(objOrArr)) {
    if (fx(objOrArr[key])) {
      return true
    }
  }

  return false
}

/**
 * every to object or array
 * @param {Object/Array}    objOrArr    source object/array
 * @param {Function}        fx          function to apply
 * @return (bool) true if at all mapped function fx return true
 */
const every = (objOrArr, fx) => {
  if (Array.isArray(objOrArr)) {
    return objOrArr.every(fx)
  }

  const keys = Object.keys(objOrArr)
  for (const key of keys) {
    if (!fx(objOrArr[key])) {
      return false
    }
  }

  return true
}

/**
 * get uuid
 * @return uuid
 */
const id = () => uuidv4()

/**
 * get timestamp string
 * @return {String} '2019-06-10T12:08:39.643Z'
 */
const timestamp = () => new Date().toISOString()

/**
 * get compact timestamp
 * 2019-06-10T12:08:39.643Z => 20190610_120839_643
 * @param {DateTime} ts   timestamp: if ts not provided, timestamp is generated
 * @return 20190610_120839_643 '20190610_120839_643'
 */
const timestampCompact = (ts) => {
  if (ts === undefined) ts = timestamp()

  return ts
    .replace('-', '').replace('-', '')
    .replace('T', '_')
    .replace(':', '').replace(':', '')
    .replace('.', '_')
    .replace('Z', '')
}

/**
 * load text file
 * @param {String}  filePath  path file
 * @param {String}  encoding  encoding (default is utf-8)
 * @return {String} loaded content
 */
const load = (filePath, encoding) => fs.readFileSync(filePath, { encoding: encoding || 'utf-8' })

/**
 * save text file
 * @param {String}  filePath  path file
 * @param {String}  content   file content
 * @param {String}  encoding  encoding (default is utf-8)
 * @param {String}  mode      write mode (default is 0o755)
 */
const save = (filePath, content, encoding, mode) => fs.writeFileSync(filePath, content, { encoding: encoding || 'utf-8', mode: mode || 0o755 })

/**
 * init text file
 * if file does not exists, apply contentFx function to create file
 * @param {String}  filePath    path file
 * @param {String}  contentFx   function () => { return 'content' }
 * @return {String/bool} created content of false if file already exists
 */
const initFile = (filePath, contentFx) => {
  if (!fs.existsSync(filePath)) {
    save(filePath, contentFx())
    return true
  }

  return false
}

/**
 * save text file
 * @param {String}  dirPath  path to create
 * @param {String}  mode     default 0o755
 */
const mkdir = (dirPath, mode) => {
  mkdirp.sync(dirPath, { mode: mode || 0o755 })
}

/**
 * globify using selectors (see simple-glob package)
 * {Array} selectors
 * @return {Array} array of full path
 */
const globify = (...selectors) => glob(selectors)

/**
 * get file name from path
 * @param {String}  fullPath        file path
 * @param {bool}    withExtention   get extension
 * @return {String} file name
 */
const getPathBase = (fullPath, withExtention) => {
  const extension = withExtention ? undefined : path.extname(fullPath)
  return path.basename(fullPath, extension)
}

/**
 * list dir
 * @param {String}  dirPath  path to list
 * @param {Object}  options  { onlyDir: true/false, onlyFile: true/false }
 * @return {Array} array of full path
 */
const ls = (dirPath, options) => {
  if (options.onlyDir && options.onlyFile) {
    throw new Error('onlyDir and onlyFile options can not be set together')
  }

  const res = []

  const files = fs.readdirSync(dirPath)
  for (const file of files) {
    const filePath = path.join(dirPath, file)
    const stats = fs.statSync(filePath)

    let select = false
    const isDir = stats.isDirectory()
    if (options) {
      if (options.onlyDir) {
        select = isDir
      } else if (options.onlyFile) {
        select = !isDir
      }
    } else {
      select = true
    }

    if (select) {
      res.push(filePath)
    }
  }

  return res
}

/**
 * jsonify object
 * @param {Object}  obj
 * @param {bool}    human   indent for readability
 * @return {String} jsonified object
 */
const jsonify = (obj, human) => JSON.stringify(obj, null, human ? 4 : null)

/**
 * pure sort array using given sort function
 *
 * examples:
 * sort([2, 3, 1], sortAscFn) = [1, 2, 3]
 * sort([{ id: 2 }, { id: 3 }, { id: 1 }], (a, b) => a.id > b.id ? 1 : -1) = [{ id: 1 }, { id: 2 }, { id: 3 }]
 *
 * @param {Array}   arr     source array
 * @param {Function}   fn      sort function sort function (a, b) => { } that returns -1, 1
 * @return {Array} return a new array, original is unchanged
 */
const sort = (arr, fn) => {
  const sorted = [...arr]
  sorted.sort(fn)
  return sorted
}
// sorting functions
const sortAscFn = (a, b) => a > b ? 1 : -1
const sortDescFn = (a, b) => a > b ? -1 : 1

export { env, isString, merge, mergeArrayOverwrite, freeze, clone, mapobj, some, every, id, timestamp, timestampCompact, load, save, initFile, mkdir, globify, getPathBase, ls, jsonify, sort, sortAscFn, sortDescFn }
