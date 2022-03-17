/* eslint no-useless-constructor: 0 */

import { Options, Result } from './types'
import _ from 'lodash'

export default function model (Model: any, jsonTypes: Options): any {
  class DynamoModel extends Model {
    constructor (inst: any) {
      super(inst)
    }

    static sync () {

    }

    static jsonTypes = jsonTypes

    static parser (obj: Options) {
      const keys = Object.keys(DynamoModel.jsonTypes)
      for (const k of keys) {
        if (typeof obj[k] !== 'undefined') {
          obj[k] = JSON.stringify(obj[k])
        }
      }
      return obj
    }

    static jsonFy (obj: Options) {
      const keys = Object.keys(DynamoModel.jsonTypes)
      for (const k of keys) {
        if (typeof obj[k] !== 'undefined') {
          obj[k] = JSON.parse(obj[k])
        }
      }
      return obj
    }

    static async create (inst: DynamoModel) {
      if (!inst) {
        throw new Error('create requires instance object')
      }
      const obj = DynamoModel.parser(inst)
      const ist = new this(obj)
      const r = await ist.save()
      return DynamoModel.jsonFy(new this(r))
    }

    static async findAll (q: Options | undefined) {
      const result: Result<any> = []
      if ((q != null) && q.lastKey) {
        result.lastKey = q.lastKey
      }
      result.queryCount = 0
      const limit = (q != null) && q.limit ? q.limit : 0
      let ok = false
      do {
        const scan = DynamoModel
          .Model.scan()
        if (result.lastKey) {
          scan.startAt(result.lastKey)
        }
        if ((q != null) && q.limit) {
          scan.limit(q.limit)
        }
        await scan.exec()
          .then((r: Result<any>) => {
            result.push.apply(result, r.map(x => DynamoModel.jsonFy(new this(x))))
            result.queryCount++
            if (limit && result.length >= limit) {
              ok = true
            }
            result.lastKey = r.lastKey
          })
      } while (!ok && result.lastKey)
      return result
    }

    static async find (query: Options, _limit: Number) {
      if (
        !query ||
        !query.where ||
        (Object.keys(query.where).length === 0)
      ) {
        throw new Error('find requires where params')
      }
      const { op = 'eq' } = query
      const q = Object.keys(query.where)
        .reduce((prev: Options, k: string) => {
          prev[k] = {
            [op]: query.where[k]
          }
          return prev
        }, {})
      const result: Result<any> = []
      result.queryCount = 0
      const limit = query.limit || _limit
      do {
        const scan = DynamoModel
          .Model.scan(q)
        if (result.lastKey) {
          scan.startAt(result.lastKey)
        }
        if (limit) {
          scan.limit(limit)
        }
        await scan.exec()
          .then((r: Result<any>) => {
            result.push.apply(result, r.map(x => DynamoModel.jsonFy(new this(x))))
            result.queryCount++
            if (limit && result.length >= limit) {
              result.lastKey = undefined
            } else {
              result.lastKey = r.lastKey
            }
          })
      } while (
        result.lastKey
      )
      return result
    }

    static async getOne (query: Object) {
      return await DynamoModel.find(query, 1)
    }

    static async findOne (query: Options) {
      return await new Promise((resolve, reject) => {
        DynamoModel.Model.get(query.where, (err: Error, result: Options) => {
          if (err) {
            reject(err)
          } else {
            resolve(result ? DynamoModel.jsonFy(new this(result)) : result)
          }
        })
      })
    }

    static async findByPk (id: string | number) {
      return DynamoModel.findOne({
        where: {
          id
        }
      })
    }

    static async batchGet (querys: Options[]) {
      return await new Promise((resolve, reject) => {
        DynamoModel.Model.batchGet(querys, (err: Error, results: Options[]) => {
          if (err) {
            reject(err)
          } else {
            resolve(results.map(x => DynamoModel.jsonFy(new this(x))))
          }
        })
      })
    }

    static async update (update: Options, query: Options) {
      return await new Promise((resolve, reject) => {
        DynamoModel.Model.update(query.where, DynamoModel.parser(update), (err: Error, result: any) => {
          if (err) {
            reject(err)
          } else {
            resolve(result)
          }
        })
      })
    }

    static async destroy (query: Options) {
      return await new Promise((resolve, reject) => {
        DynamoModel.Model.delete(query.where, (err: Error, result: any) => {
          if (err) {
            reject(err)
          } else {
            resolve(result || 1)
          }
        })
      })
    }

    destroy () {
      return this.delete()
    }

    toJSON () {
      return Object.keys(this).filter(k => {
        return typeof this[k] !== 'function' &&
          'value' in (Object.getOwnPropertyDescriptor(this, k) || {}) != null &&
          k !== '$__'
      }).reduce((prev, k) => {
        return {
          ...prev,
          [k]: this[k]
        }
      }, {})
    }

    async save(...args: []) {
      const jsonAsStringKeys = Object.keys(DynamoModel.jsonTypes);
      if (jsonAsStringKeys.length === 0) {
        return super.save(...args);
      }
      let shouldJSONStringify = false;
      for (const key of jsonAsStringKeys) {
        if (typeof this[key] === 'object') {
          shouldJSONStringify = true;
          break;
        }
      }
      if (!shouldJSONStringify) {
        return super.save(...args);
      }
      DynamoModel.parser(this);
      await super.save(...args);
      DynamoModel.jsonFy(this);
    }
  }
  DynamoModel.Model = Model
  return DynamoModel
}
