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
if (process.env.DYNAMODB_LOCALHOST) {
    dynamoose.aws.ddb.local(process.env.DYNAMODB_LOCALHOST);
}
function typeMapper (type: string, key: string, jsonAsObject: boolean): any {
  const stringType = type.toString()
  switch (stringType) {
    case 'STRING':
    case 'TEXT':
      return String
    case 'JSONTYPE': {
      if (jsonAsObject) {
        return [Object, Array]
      }
      return String
    }
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

export function seqSchemaToDynamoSchema (seqSchema: Options, jsonAsObject: boolean): Options {
  const keys = Object.keys(seqSchema)
  return keys.reduce((prev: Options, k) => {
    const v: Options = seqSchema[k]
    const originalType = v.type.toString()
    const type = typeMapper(originalType, k, jsonAsObject)
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
    } else if (!jsonAsObject && originalType === 'JSONTYPE') {
      prev.jsonTypes[k] = 1
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
    prev.config[k] = def
    return prev
  }, {
    config: {},
    jsonTypes: {}
  })
}

export default class Dynamo {
  options: Options

  constructor (...args: []) {
    const len = args.length
    const options: Options = args[len - 1]
    this.options = options
  }

  define (name: string, seqSchema: Options) {
    const jsonAsObject = get(this.options, 'define.jsonAsObject') || false;
    const { config, jsonTypes } = seqSchemaToDynamoSchema(seqSchema, jsonAsObject)
    const sc = new Schema(config, {
      saveUnknown: get(this.options, 'define.saveUnknown') || true,
      timestamps: get(this.options, 'define.timestamps')
    })
    const model = dynamoose.model(
      name,
      sc
    )
    return DynamoModel(model, jsonTypes)
  }

  authenticate () {}
}

module.exports = Dynamo
