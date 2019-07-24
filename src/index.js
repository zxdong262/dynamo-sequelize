import Sequelize from 'sequelize'
import Dynamo from './dynamo'

export default class DynamoWrapper {
  constructor (...args) {
    let len = args.length
    let options = args[len - 1]
    if (options && options.dialect === 'dynamo' || options.dialect === 'dynamodb') {
      return new Dynamo(...args)
    }
    return new Sequelize(...args)
  }
}
