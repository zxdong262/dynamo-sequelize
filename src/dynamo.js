import DynamoModel from './model'
import dynamoose, { Schema } from 'dynamoose'
import Sequelize from 'sequelize'
import get from 'lodash.get'

const config = {}
if (process.env.DYNAMODB_TABLE_PREFIX) {
  config.prefix = process.env.DYNAMODB_TABLE_PREFIX
  dynamoose.setDefaults(config)
}
if (process.env.DYNAMODB_LOCALHOST) {
  dynamoose.local(process.env.DYNAMODB_LOCALHOST)
}

function typeMapper(type) {
  switch (type) {
    case Sequelize.STRING:
    case Sequelize.TEXT:
      return String
    case Sequelize.JSON:
      return Object
    case Sequelize.BOOLEAN:
      return Boolean
    case Sequelize.INTEGER:
    case Sequelize.BIGINT:
    case Sequelize.FLOAT:
    case Sequelize.DECIMAL:
    case Sequelize.DOUBLE:
      return Number
    case Sequelize.DATE:
      return Date
    default:
      throw new Error(`do not support type: ${type}`)
  }
}

export function seqSchemaToDynamoSchema(seqSchema) {
  let keys = Object.keys(seqSchema)
  return keys.reduce((prev, k) => {
    let v = seqSchema[k]
    let type = typeMapper(v.type)
    let def = {
      type
    }
    if (type === Date) {
      def.get = function(v) {
        return new Date(v)
      }
      def.set = function(v) {
        return new Date(v).getTime()
      }
    }
    if (v.primaryKey || v.unique) {
      v.hashKey = true
    }
    if (v.defaultValue) {
      def.default = v.defaultValue
    }
    prev[k] = def
    return prev
  }, {})
}

export default class Dynamo {
  constructor (...args) {
    let len = args.length
    let options = args[len - 1]
    this.options = options
  }

  define(name, seqSchema) {
    let conf = seqSchemaToDynamoSchema(seqSchema)
    let sc = new Schema(conf, {
      timestamps: get(this.options, 'define.timestamps')
    })
    let model = dynamoose.model(
      name,
      sc
    )
    return new DynamoModel(model, this.options)
  }
}
