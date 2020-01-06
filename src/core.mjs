import dmerge from 'deepmerge'
import fs from 'fs'
import glob from 'simple-glob'
import mkdirp from 'mkdirp'
import path from 'path'
import uuidv4 from '@bundled-es-modules/uuid/v4.js'

const isString = (str) => typeof str === 'string' || str instanceof String

/**
 * use deepmerge to merge x, y
 */
const merge = (x, y) => dmerge(x, y)

/**
 * use deepmerge to merge x, y but without merging arrays (overwrite versus append)
 */
const mergeArrayOverwrite = (x, y) => {
  const overwriteMerge = (destinationArray, sourceArray, options) => sourceArray // overwrite arrays
  return dmerge(x, y, { arrayMerge: overwriteMerge })
}

// freeze object
const freeze = (obj) => {
  return Object.freeze(obj)
}

/**
 * pure clone of given object
 * optionaly set it immutable (freeze)
 * to set a subset of obj, specify the selected keys
 * @param {*} obj
 * @param {bool} freeze true to freeze the clone
 * @param {Array} keys keys to select for a subset (default no subset)
 */
const purify = (obj, freezeIt, keys) => {
  let source

  if (keys !== undefined) {
    source = {}
    for (const key of keys) {
      source[key] = obj[key]
    }
  } else {
    source = obj
  }

  const newObj = merge({}, source)
  if (freezeIt) freeze(newObj)

  return newObj
}

// map to new object (original is kept as it)
// ctx: context for fx
const mapobj = (obj, fx, ctx) => {
  ctx = ctx || this

  const newObj = {}
  for (const key of Object.keys(obj)) {
    newObj[key] = fx.call(ctx, obj[key])
  }
  return newObj
}

// apply function to each object or array value
const apply = (objOrArr, fx, ctx) => {
  ctx = ctx || this

  if (Array.isArray(objOrArr)) {
    for (const item of objOrArr) {
      fx.call(ctx, item)
    }
  } else {
    for (const key of Object.keys(objOrArr)) {
      fx.call(ctx, objOrArr[key])
    }
  }
}

const any = (objOrArr, fx, ctx) => {
  ctx = ctx || this

  if (Array.isArray(objOrArr)) {
    for (const item of objOrArr) {
      if (fx.call(ctx, item)) {
        return true
      }
    }
  } else {
    for (const key of Object.keys(objOrArr)) {
      if (fx.call(ctx, objOrArr[key])) {
        return true
      }
    }
  }

  return false
}

const all = (objOrArr, fx, ctx) => {
  ctx = ctx || this

  if (Array.isArray(objOrArr)) {
    for (const item of objOrArr) {
      if (!fx.call(ctx, item)) {
        return false
      }
    }

    return objOrArr.length > 0
  } else {
    const keys = Object.keys(objOrArr)
    for (const key of keys) {
      if (!fx.call(ctx, objOrArr[key])) {
        return false
      }
    }

    return keys.length > 0
  }
}

/**
 * get uuid
 */
// export const id = () => uuidv4()
// FIXME
const id = () => uuidv4()

/**
 * string timestamp 2019-06-10T12:08:39.643Z
 */
const timestamp = () => new Date().toISOString()

/**
 * compact timestamp
 * 2019-06-10T12:08:39.643Z => 20190610_120839_643
 * if ts not provided, timestamp is generated
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

const load = (filePath, encoding) => fs.readFileSync(filePath, { encoding: encoding || 'utf-8' })

const save = (filePath, content, encoding, mode) => fs.writeFileSync(filePath, content, { encoding: encoding || 'utf-8', mode: mode || 0o755 })

// if filePath does not exists, apply (save) content returned by contentFn function
// contentFn is typically an arrow function with this set from external of the function
const initFile = (filePath, contentFn) => {
  if (!fs.existsSync(filePath)) {
    save(filePath, contentFn.call())
    return true
  }

  return false
}

const mkdir = (dirPath, mode) => {
  mkdirp.sync(dirPath, { mode: mode || 0o755 })
}

const globify = (...selectors) => glob(selectors)

const getPathBase = (fullPath, withExtention) => {
  const extension = withExtention ? undefined : path.extname(fullPath)
  return path.basename(fullPath, extension)
}

/* options: {onlyDir: true/false, onlyFile: true/false} */
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

const jsonify = (obj, human) => JSON.stringify(obj, null, human ? 4 : null)

/**
 * pure sort array using given sort function
 * fn: sort function (a, b) => { } that returns -1, 1
 * return a new array, original is unchanged
 *
 * examples:
 * sort([2, 3, 1], sortAscFn) = [1, 2, 3]
 * sort([{ id: 2 }, { id: 3 }, { id: 1 }], (a, b) => a.id > b.id ? 1 : -1) = [{ id: 1 }, { id: 2 }, { id: 3 }]
 */
const sort = (arr, fn) => {
  const sorted = [...arr]
  sorted.sort(fn)
  return sorted
}

// sorting functions
const sortAscFn = (a, b) => a > b ? 1 : -1
const sortDescFn = (a, b) => a > b ? -1 : 1

export { isString, merge, mergeArrayOverwrite, freeze, purify, mapobj, apply, any, all, id, timestamp, timestampCompact, load, save, initFile, mkdir, globify, getPathBase, ls, jsonify, sort, sortAscFn, sortDescFn }
