/* eslint-env jest */
require('dotenv').config()
require('./common/init')

const pack = require('../package.json')
const { DataTypes: Sequelize } = require('sequelize')
const SequelizeDynamo = require('../dist')
const dynamoose = require('dynamoose')
const DynamoDbLocal = require('dynamodb-local')
const { nanoid } = require('nanoid')

function generate () {
  return nanoid(7)
}

const dynamoLocalPort = process.env.DYNAMODB_LOCALPORT || 8000
let handle

jest.setTimeout(50000)

beforeEach(async () => {
  // do your tests
  if (process.env.DYNAMODB_LOCALHOST) {
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
  test('model', async () => {
    const sequelize = new SequelizeDynamo(
      'sss',
      {
        define: {
          saveUnknown: true,
          timestamps: true
        },
        logging: false,
        dialect: 'dynamo'
      }
    )
    const inst = sequelize.define('DRAKE_TEMP_TEST', {
      id: { // Glip user ID
        type: Sequelize.STRING,
        primaryKey: true,
        defaultValue: generate
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
      },
      arr: { // all other data associcated with this user
        type: Sequelize.JSON
      },
      date: {
        type: Sequelize.DATE
      }
    })
    inst.prototype.ac = function () {
      return 'ac'
    }
    const before = await inst.findAll()
    expect(before.queryCount).toEqual(1)
    // create
    const date1 = new Date()
    const a0 = await inst.create({
      name: 'n1dddd',
      date: date1,
      arr: ['dd', 'yy'],
      data: {
        a: 0,
        b: []
      }
    })
    const a1 = await inst.create({
      name: 'n1',
      date: date1,
      data: {
        a: 0,
        b: []
      }
    })
    expect(new Date(a1.date)).toEqual(date1)
    expect(a1.enabled).toEqual(true)
    expect(a1.signed).toEqual(true)
    expect(a0.arr[0]).toEqual('dd')
    expect(a1.privateChatOnly).toEqual(true)
    expect(a1.data.a).toEqual(0)
    expect(a1.data.b.length).toEqual(0)
    expect(a1.ac()).toEqual('ac')
    const { id } = a1
    const after = await inst.findAll()

    // findAll
    expect(after.length).toEqual(before.length + 2)

    // find with limit
    const after2 = await inst.find({
      op: 'contains',
      where: {
        name: 'n'
      }
    }, 1)
    expect(after2.length).toEqual(before.length + 1)
    expect(after2.queryCount).toEqual(1)

    // batchGet
    const after3 = await inst.batchGet([
      {
        id: a0.id
      },
      {
        id: a1.id
      }
    ])
    expect(after3.length).toEqual(before.length + 2)

    // getOne
    const get1 = await inst.getOne({
      where: {
        name: 'n1dddd'
      }
    })
    // console.log(get1, 'gte1')
    expect(get1[0].id).toEqual(a0.id)
    expect(get1.queryCount >= 1).toEqual(true)
    // findByPk
    const one = await inst.findByPk(id)
    expect(one.id).toEqual(a1.id)
    expect(one.enabled).toEqual(true)
    expect(one.ac()).toEqual('ac')

    // update
    await inst.update({
      enabled: false
    }, {
      where: {
        id
      }
    })

    const a2 = await inst.findByPk(id)
    expect(a2.enabled).toEqual(false)
    expect(a2.date).toEqual(date1)

    // find
    await inst.create({
      id: 'xxx',
      name: 'n1'
    })
    const fl = await inst.find({
      where: {
        id: 'xxx',
        enabled: true
      }
    })
    expect(fl.length).toEqual(1)
    expect(fl[0].id).toEqual('xxx')
    expect(fl[0].ac()).toEqual('ac')
    await inst.findAll()
    expect(fl[0].ac()).toEqual('ac')
    expect(typeof JSON.stringify(fl)).toEqual('string')

    // findOne
    const oo = await inst.findOne({
      where: {
        id
      }
    })
    expect(oo.id).toEqual(id)
    expect(oo.ac()).toEqual('ac')

    // find with sencondary index
    const all = await inst.find({
      where: {
        name: 'n1'
      }
    })
    expect(all.length).toEqual(2)

    // contains query
    const all2 = await inst.find({
      op: 'contains',
      where: {
        name: 'n'
      }
    })
    expect(all2.length).toEqual(3)

    // destroy
    const d1 = await inst.destroy({
      where: {
        id
      }
    })
    expect(d1).toEqual(1)

    // no result
    const oox = await inst.findOne({
      where: {
        id: 'sdfs'
      }
    })
    expect(oox).toEqual(undefined)

    for (let iii = 0; iii < 10; iii++) {
      await inst.create({
        id: iii + 'id',
        name: iii + 'name'
      })
    }
    // lastKey support in findAll
    const all1 = await inst.findAll({ limit: 1 })
    expect(all1.length >= 1).toEqual(true)
    expect(all1.queryCount).toEqual(1)
    const alll2 = await inst.findAll({ limit: 1, lastKey: all1.lastKey })
    expect(alll2.queryCount).toEqual(1)
  })
})
