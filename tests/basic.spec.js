/* eslint-env jest */

require('dotenv').config()
require('./common/init')

const pack = require('../package.json')
const Sequelize = require('../dist').default
const Dynamo = require('../dist/dynamo').default
const dynamoose = require('dynamoose')
const { Sequelize: SequelizeOrig } = require('sequelize')
const DynamoDbLocal = require('dynamodb-local')

const dynamoLocalPort = 8000
let handle

jest.setTimeout(99999)

beforeEach(async () => {
  // do your tests
  handle = await DynamoDbLocal.launch(dynamoLocalPort, null, [], false, true)
  dynamoose.aws.ddb.local()
})

afterEach(async () => {
  await DynamoDbLocal.stopChild(handle)
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
