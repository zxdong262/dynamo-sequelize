import DynamoModel from './model'
import dynamoose, { Schema } from 'dynamoose'
import get from 'lodash.get'
import { Options } from './types'

const config: Options = {
  throughput: {
    read: 1,
    write: 1
  }
}

if (process.env.DYNAMODB_TABLE_PREFIX !== undefined) {
  config.prefix = process.env.DYNAMODB_TABLE_PREFIX
}
if (process.env.DYNAMODB_READ !== undefined) {
  config.throughput.read = process.env.DYNAMODB_READ
}
if (process.env.DYNAMODB_WRITE !== undefined) {
  config.throughput.write = process.env.DYNAMODB_WRITE
}
dynamoose.model.defaults.set(config)

if (process.env.DYNAMODB_LOCALHOST !== undefined) {
  dynamoose.aws.ddb.local(process.env.DYNAMODB_LOCALHOST)
}

function typeMapper (type: string, key: string): any {
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
      throw new Error(`do not support type ${type} for key: ${key}`)
  }
}

export function seqSchemaToDynamoSchema (seqSchema: Options): Options {
  const keys = Object.keys(seqSchema)
  return keys.reduce((prev: Options, k) => {
    const v: Options = seqSchema[k]
    const type = typeMapper(v.type, k)
    const def: Options = {
      type
    }
    if (type === Date) {
      def.get = function (v: any): Date {
        return new Date(v)
      }
      def.set = function (v: any): Number {
        return new Date(v).getTime()
      }
    }
    if (v.primaryKey) {
      v.hashKey = true
    }
    if (v.required) {
      v.required = true
    }
    if (v.defaultValue !== undefined) {
      def.default = v.defaultValue
    }
    prev[k] = def
    return prev
  }, {})
}

export default class Dynamo {
  options: Options

  constructor (...args: []) {
    const len = args.length
    const options: Options = args[len - 1]
    this.options = options
  }

  define (name: string, seqSchema: Options) {
    const conf = seqSchemaToDynamoSchema(seqSchema)
    const sc = new Schema(conf, {
      saveUnknown: get(this.options, 'define.saveUnknown') || true,
      timestamps: get(this.options, 'define.timestamps')
    })
    const model = dynamoose.model(
      name,
      sc
    )
    return DynamoModel(model, this.options)
  }

  authenticate () {}
}

module.exports = Dynamo