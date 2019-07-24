
import { generate } from 'shortid'

export default function (Model, options) {
  class DynamoModel {
    constructor() {
      this.Model = DynamoModel.Model
      this.options = DynamoModel.options
    }
    static sync () {
      return
    }

    static create (inst) {
      if (!inst) {
        throw new Error('create requires instance object')
      }
      if (!inst.id) {
        inst.id = generate()
      }
      let ist = new this.Model(inst)
      return ist.save()
    }
  
    static findAll (query) {
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
  
    static (...args) {
      return this.findAll(...args)
    }
  
    static findByPk (id) {
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
  
    static update(update, query) {
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
  DynamoModel.options = options
  DynamoModel.Model = Model
  return DynamoModel
}
