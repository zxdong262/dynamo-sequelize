
export default function (Model, options) {
  class DynamoModel extends Model {
    static sync () {

    }

    static create (inst) {
      if (!inst) {
        throw new Error('create requires instance object')
      }
      const ist = new this(inst)
      return ist.save()
    }

    static async findAll (q) {
      const result = []
      if (q && q.lastKey) {
        result.lastKey = q.lastKey
      }
      result.queryCount = 0
      const limit = q && q.limit ? q.limit : 0
      let ok = false
      do {
        const scan = DynamoModel
          .Model.scan()
        if (result.lastKey) {
          scan.startAt(result.lastKey)
        }
        if (q && q.limit) {
          scan.limit(q.limit)
        }
        await scan.exec()
          .then(r => {
            result.push.apply(result, r.map(x => new this(x)))
            result.queryCount++
            if (limit && result.length >= limit) {
              ok = true
            }
            result.lastKey = r.lastKey
          })
      } while (!ok && result.lastKey)
      return result
    }

    static async find (query, _limit) {
      if (
        !query ||
        !query.where ||
        !Object.keys(query.where).length
      ) {
        throw new Error('find requires where params')
      }
      const { op = 'eq' } = query
      const q = Object.keys(query.where)
        .reduce((prev, k) => {
          prev[k] = {
            [op]: query.where[k]
          }
          return prev
        }, {})
      const result = []
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
          .then(r => {
            result.push.apply(result, r.map(x => new this(x)))
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

    static async getOne (query) {
      return DynamoModel.find(query, 1)
    }

    static findOne (query) {
      return new Promise((resolve, reject) => {
        DynamoModel.Model.get(query.where, (err, result) => {
          if (err) {
            reject(err)
          } else {
            resolve(result ? new this(result) : result)
          }
        })
      })
    }

    static findByPk (id) {
      return new Promise((resolve, reject) => {
        DynamoModel.Model.get({ id }, (err, result) => {
          if (err) {
            reject(err)
          } else {
            resolve(result ? new this(result) : result)
          }
        })
      })
    }

    static batchGet (querys) {
      return new Promise((resolve, reject) => {
        DynamoModel.Model.batchGet(querys, (err, results) => {
          if (err) {
            reject(err)
          } else {
            resolve(results.map(x => new this(x)))
          }
        })
      })
    }

    static update (update, query) {
      return new Promise((resolve, reject) => {
        DynamoModel.Model.update(query.where, update, (err, result) => {
          if (err) {
            reject(err)
          } else {
            resolve(result)
          }
        })
      })
    }

    static destroy (query) {
      return new Promise((resolve, reject) => {
        DynamoModel.Model.delete(query.where, (err, result) => {
          if (err) {
            reject(err)
          } else {
            resolve(result || 1)
          }
        })
      })
    }

    toJSON () {
      return Object.keys(this).filter(k => {
        return typeof this[k] !== 'function' &&
          'value' in Object.getOwnPropertyDescriptor(this, k) &&
          k !== '$__'
      }).reduce((prev, k) => {
        return {
          ...prev,
          [k]: this[k]
        }
      }, {})
    }
  }
  // DynamoModel.options = options
  DynamoModel.Model = Model
  return DynamoModel
}
