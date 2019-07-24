
import { generate } from 'shortid'

export default class DynamoModel {
  constructor(Model, options) {
    this.Model = Model
    this.options = options
    this.useTimeStamp = options.define && options.define.timestamp
  }

  sync () {
    return
  }

  create(inst) {
    if (!inst) {
      throw new Error('create requires instance object')
    }
    if (!inst.id) {
      inst.id = generate()
    }
    let ist = new this.Model(inst)
    return ist.save()
  }

  findAll (query) {
    if (!query) {
      return this.Model.scan().exec()
    }
    if (
      !query ||
      !query.where ||
      !Object.keys(query.where).length
    ) {
      throw new Error('findAll/find requires where params')
    }
    let q = Object.keys(query.where)
      .reduce((prev, k) => {
        prev[k] = {
          eq: query.where[k]
        }
        return prev
      }, {})
    return new Promise((resolve, reject) => {
      this.Model.scan(q, (err, result) => {
        if (err) {
          reject(err)
        } else {
          resolve(result)
        }
      })
    })
  }

  find(...args) {
    return this.findAll(...args)
  }

  findByPk (id) {
    return new Promise((resolve, reject) => {
      this.Model.get({ id }, (err, result) => {
        if (err) {
          reject(err)
        } else {
          resolve(result)
        }
      })
    })
  }

  update(update, query) {
    return new Promise((resolve, reject) => {
      this.Model.update(query.where, update, (err, result) => {
        if (err) {
          reject(err)
        } else {
          resolve(result)
        }
      })
    })
  }
}
