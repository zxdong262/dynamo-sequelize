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

function typeMapper (type, key, v) {
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
      console.log(typeof type)
      throw new Error(`do not support type: ${type} for key: ${key}, define: ${JSON.stringify(v)}`)
  }
}

export function seqSchemaToDynamoSchema (seqSchema) {
  const keys = Object.keys(seqSchema)
  return keys.reduce((prev, k) => {
    const v = seqSchema[k]
    const type = typeMapper(v.type, k, v)
    const def = {
      type
    }
    if (type === Date) {
      def.get = function (v) {
        return new Date(v)
      }
      def.set = function (v) {
        return new Date(v).getTime()
      }
    }
    if (v.primaryKey) {
      v.hashKey = true
    }
    if (v.required) {
      v.required = true
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
    const len = args.length
    const options = args[len - 1]
    this.options = options
  }

  define (name, seqSchema) {
    const conf = seqSchemaToDynamoSchema(seqSchema)
    const sc = new Schema(conf, {
      timestamps: get(this.options, 'define.timestamps')
    })
    const model = dynamoose.model(
      name,
      sc
    )
    return new DynamoModel(model, this.options)
  }

  authenticate () {}
}
