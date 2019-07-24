
import { generate } from 'shortid'

export default function (Model, options) {
  class DynamoModel {

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
      let ist = new DynamoModel.Model(inst)
      return ist.save().then(res => {
        return {
          ...res,
          ...this
        }
      })
    }
  
    static findAll (query) {
      if (!query) {
        return DynamoModel.Model.scan().exec()
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
        DynamoModel.Model.scan(q, (err, result) => {
          if (err) {
            reject(err)
          } else {
            resolve(result)
          }
        })
      })
    }
  
    static find (...args) {
      return DynamoModel.findAll(...args)
    }

    static findOne (query) {
      return new Promise((resolve, reject) => {
        DynamoModel.Model.get(query.where, (err, result) => {
          if (err) {
            reject(err)
          } else {
            resolve(result)
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
            resolve(result)
          }
        })
      })
    }
  
    static update(update, query) {
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
  }
  DynamoModel.options = options
  DynamoModel.Model = Model
  return DynamoModel
}
