import { Sequelize } from 'sequelize'
import Dynamo from './dynamo'
import { Options } from './types'

export default class DynamoWrapper {
  constructor (...args: []) {
    const len = args.length
    const options: Options = args[len - 1]
    if (
      options &&
      (options.dialect === 'dynamo' || options.dialect === 'dynamodb')
    ) {
      return new Dynamo(...args)
    }
    return new Sequelize(...args)
  }
}

module.exports = DynamoWrapper
