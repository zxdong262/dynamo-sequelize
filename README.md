# dynamo-sequelize

[![Build Status](https://travis-ci.org/zxdong262/dynamo-sequelize.svg?branch=release)](https://travis-ci.org/zxdong262/dynamo-sequelize)

A sequelize wrapper to support Sequelize 5 and Dynamodb.

## Use

```js
import SequelizeDynamo from 'dynamo-sequelize'

// Only when dialect === 'dynamo', will use dynamodb,
// otherwise all args passes to Sequelize
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
let inst = sequelize.define('Dog', {
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
let a1 = await inst.create({})
expect(a1.enabled).toEqual(true)
expect(a1.signed).toEqual(true)
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
```

## Supported features

- Enable dynamodb only when `dialect === 'dynamo'`
- Only support Model deinfe by `inst.define`
- Only support Model methods: `find`, `findAll`, `create`, `findByPk`, `update`.
- `find` and `findAll` only support `where` query or empty query in which case will output all results.
- `update` only support `where` query.

## Why use it

Sequelize is really easy to use, just lack dynamodb support, while for AWS Lambda user, Dynamodb ease the pain of VPS settings, more ideal for lightweight services.

## Build/test

```bash
# compile
npm run build

# test
npm run test
```

## License

MIT
