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

function typeMapper (type, key) {
  const stringType = type.toString()
  switch (stringType) {
    case 'STRING':
    case 'TEXT':
      return String
    case 'JSONTYPE':
      return Object
    case 'BOOLEAN':
      return Boolean
    case 'INTEGER':
    case 'BIGINT':
    case 'FLOAT':
    case 'DECIMAL':
    case 'DOUBLE':
      return Number
    case 'DATE':
      return Date
    default:
      throw new Error(`do not support type: ${type} for key: ${key}`)
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
