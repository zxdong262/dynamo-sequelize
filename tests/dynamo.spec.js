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
    const User = sequelize.define('DRAKE_TEMP_TEST' + Date.now(), {
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
    User.prototype.ac = function () {
      return 'ac'
    }
    const before = await User.findAll()
    expect(before.queryCount).toEqual(1)
    // create
    const date1 = new Date()
    const a0 = await User.create({
      name: 'n1dddd',
      date: date1,
      arr: ['dd', 'yy'],
      data: {
        a: 0,
        b: []
      }
    })
    const a1 = await User.create({
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
    const after = await User.findAll()

    // findAll
    expect(after.length).toEqual(before.length + 2)

    // find with limit
    const after2 = await User.find({
      op: 'contains',
      where: {
        name: 'n'
      }
    }, 1)
    expect(after2.length).toEqual(before.length + 1)
    expect(after2.queryCount).toEqual(1)

    // batchGet
    const after3 = await User.batchGet([
      {
        id: a0.id
      },
      {
        id: a1.id
      }
    ])
    expect(after3.length).toEqual(before.length + 2)

    // getOne
    const get1 = await User.getOne({
      where: {
        name: 'n1dddd'
      }
    })
    // console.log(get1, 'gte1')
    expect(get1[0].id).toEqual(a0.id)
    expect(get1.queryCount >= 1).toEqual(true)
    // findByPk
    const one = await User.findByPk(id)
    expect(one.id).toEqual(a1.id)
    expect(one.enabled).toEqual(true)
    expect(one.ac()).toEqual('ac')

    // update
    await User.update({
      enabled: false
    }, {
      where: {
        id
      }
    })

    const a2 = await User.findByPk(id)
    expect(a2.enabled).toEqual(false)
    expect(a2.date).toEqual(date1)

    // find
    await User.create({
      id: 'xxx',
      name: 'n1'
    })
    const fl = await User.find({
      where: {
        id: 'xxx',
        enabled: true
      }
    })
    expect(fl.length).toEqual(1)
    expect(fl[0].id).toEqual('xxx')
    expect(fl[0].ac()).toEqual('ac')
    await User.findAll()
    expect(fl[0].ac()).toEqual('ac')
    expect(typeof JSON.stringify(fl)).toEqual('string')

    // findOne
    const oo = await User.findOne({
      where: {
        id
      }
    })
    expect(oo.id).toEqual(id)
    expect(oo.ac()).toEqual('ac')

    // find with sencondary index
    const all = await User.find({
      where: {
        name: 'n1'
      }
    })
    expect(all.length).toEqual(2)

    // contains query
    const all2 = await User.find({
      op: 'contains',
      where: {
        name: 'n'
      }
    })
    expect(all2.length).toEqual(3)

    // destroy
    const d1 = await User.destroy({
      where: {
        id
      }
    })
    expect(d1).toEqual(1)

    // document.destroy
    const todelId = 'todel'
    const rodo = await User.create({
      id: todelId
    })
    await rodo.destroy()
    const todel1 = await User.findByPk(todelId)
    expect(!!todel1).toEqual(false)

    // no result
    const oox = await User.findOne({
      where: {
        id: 'sdfs'
      }
    })
    expect(oox).toEqual(undefined)

    for (let iii = 0; iii < 10; iii++) {
      await User.create({
        id: iii + 'id',
        name: iii + 'name'
      })
    }
    // lastKey support in findAll
    const all1 = await User.findAll({ limit: 1 })
    expect(all1.length >= 1).toEqual(true)
    expect(all1.queryCount).toEqual(1)
    const alll2 = await User.findAll({ limit: 1, lastKey: all1.lastKey })
    expect(alll2.queryCount).toEqual(1)

    const sequelize1 = new SequelizeDynamo(
      'sss',
      {
        define: {
          saveUnknown: true,
          timestamps: true,
          jsonAsObject: true
        },
        logging: false,
        dialect: 'dynamo'
      }
    )
    const UserData = sequelize1.define('DRAKE_TEMP_TEST2' + Date.now(), {
      id: { // Glip user ID
        type: Sequelize.STRING,
        primaryKey: true,
        defaultValue: generate
      },
      name: { // glip user name
        type: Sequelize.STRING
      },
      data: { // user token
        type: Sequelize.JSON
      }
    })
    const user0 = await UserData.create({
      name: 'n1dddd',
      data: [{ a: 0 }]
    })
    const dataId = user0.id
    expect(user0.data[0].a).toEqual(0)
    user0.name = 'new save'
    await user0.save()
    const user1 = await UserData.findByPk(dataId)
    expect(user1.name).toEqual('new save')
    expect(user1.data[0].a).toEqual(0)
    user1.data = [{ a: 1 }]
    await user1.save()
    expect(user1.data[0].a).toEqual(1)
    const user2 = await UserData.findByPk(dataId)
    expect(user2.data[0].a).toEqual(1)
    const user3 = await UserData.create({
      name: 'n1dddd3',
      data: [{ a: 3 }]
    })
    const user4 = await UserData.create({
      name: 'n1dddd4',
      data: [{ a: 4 }]
    })
    await UserData.destroy({
      where: {
        id: [user3.id, user4.id]
      }
    })
    const user5 = await UserData.findByPk(user3.id)
    expect(user5).toEqual(undefined)
    const user6 = await UserData.findByPk(user4.id)
    expect(user6).toEqual(undefined)
  })
})
