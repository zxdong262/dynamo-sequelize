/* eslint-env jest */

require('dotenv').config()
require('./common/init')

const pack = require('../package.json')
const Sequelize = require('../dist')
const Dynamo = require('../dist/dynamo')
const dynamoose = require('dynamoose')
const { Sequelize: SequelizeOrig } = require('sequelize')
const DynamoDbLocal = require('dynamodb-local')

const dynamoLocalPort = process.env.DYNAMODB_LOCALPORT || 8000
let handle

jest.setTimeout(20000)

beforeEach(async () => {
  // do your tests
  if (process.env.DYNAMODB_LOCALHOST) {
    console.log('start local dynamo')
    handle = await DynamoDbLocal.launch(dynamoLocalPort, null, [], false, true)
    dynamoose.aws.ddb.local(process.env.DYNAMODB_LOCALHOST)
  }
})

afterEach(async () => {
  if (process.env.DYNAMODB_LOCALHOST) {
    await DynamoDbLocal.stopChild(handle)
  }
})

describe(pack.name, function () {
  test('dialect != dynamo', async () => {
    const sequelize = new Sequelize('sqlite://./db.sqlite', {
      define: {
        timestamps: true
      },
      logging: false
    })
    expect(sequelize instanceof SequelizeOrig).toEqual(true)
  })
  test('dialect == dynamo', async () => {
    const sequelize = new Sequelize(
      'sqlite://./db.sqlite',
      {
        define: {
          timestamps: true
        },
        logging: false,
        dialect: 'dynamo'
      }
    )
    expect(sequelize instanceof Dynamo).toEqual(true)
  })
})
