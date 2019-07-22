/* eslint-env jest */

import pack from '../package.json'
import SequelizeDynamo from '../dist'
import Sequelize from 'sequelize'
import Dynamo from '../dist/model'
import dynamoose from 'dynamoose'
import DynamoDbLocal from 'dynamodb-local'

require('dotenv').config()

const dynamoLocalPort = 8000
let handle

const {
  RINGCENTRAL_ENGAGE_VERIFY_TOKEN
} = process.env

function wait (time) {
  return new Promise(resolve => {
    setTimeout(resolve, time)
  })
}

jest.setTimeout(99999)

beforeEach(async () => {
  // do your tests
  handle = await DynamoDbLocal.launch(dynamoLocalPort, null, [], false, true)
  dynamoose.local()
})

afterEach(async () => {
  await DynamoDbLocal.stopChild(handle)
})

describe(pack.name, function () {
  test('model', async () => {
    const sequelize = new SequelizeDynamo(
      'sqlite://./db.sqlite',
      {
        define: {
          timestamps: true
        },
        logging: false,
        dialect: 'dynamo'
      }
    )
    let inst = sequelize.define('Ass', {
      id: { // Glip user ID
        type: Sequelize.STRING,
        primaryKey: true
      },
      name: { // glip user name
        type: Sequelize.STRING
      },
      email: { // Glip user email
        type: Sequelize.STRING
      },
      token: { // user token
        type: Sequelize.JSON
      },
      enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      signed: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      privateChatOnly: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      data: { // all other data associcated with this user
        type: Sequelize.JSON
      }
    })
    expect(inst instanceof Dynamo).toEqual(true)
    let before = await inst.findAll()
    // create
    let a1 = await inst.create({
      data: {
        a: 0,
        b: []
      }
    })
    expect(a1.enabled).toEqual(true)
    expect(a1.signed).toEqual(true)
    expect(a1.privateChatOnly).toEqual(true)
    expect(a1.data.a).toEqual(0)
    expect(a1.data.b.length).toEqual(0)
    let { id } = a1
    let after = await inst.findAll()
    // findAll
    expect(after.length).toEqual(before.length + 1)

    // findByPk
    let one = await inst.findByPk(id)
    expect(one.id).toEqual(a1.id)

    // update
    await inst.update({
      enabled: false
    }, {
      where: {
        id
      }
    })

    let a2 = await inst.findByPk(id)
    expect(a2.enabled).toEqual(false)

    // find
    await inst.create({})
    let fl = await inst.find({
      where: {
        enabled: false
      }
    })
    expect(fl.length).toEqual(1)
    expect(fl[0].id).toEqual(id)
  })
})
