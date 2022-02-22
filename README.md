# dynamo-sequelize

[![Build Status](https://img.shields.io/endpoint.svg?url=https%3A%2F%2Factions-badge.atrox.dev%2Fatrox%2Fsync-dotenv%2Fbadge)](https://github.com/zxdong262/dynamo-sequelize/actions)
[![Coverage Status](https://coveralls.io/repos/github/zxdong262/dynamo-sequelize/badge.svg?branch=release)](https://coveralls.io/github/zxdong262/dynamo-sequelize?branch=release)

A sequelize wrapper to support Sequelize and Dynamodb(limited).

## Use

```js
import Sequelize from 'sequelize'
import SequelizeDynamo from 'dynamo-sequelize'
// or const SequelizeDynamo = require('dynamo-sequelize')

// Only when dialect === 'dynamo', will use dynamodb,
// otherwise all args passes to Sequelize
const sequelize = new SequelizeDynamo(
  'sqlite://./db.sqlite',
  {
    define: {
      saveUnknown: false,
      timestamps: true
    },
    logging: false,
    dialect: 'dynamo'
  }
)
let inst = sequelize.define('User', {
  id: {
    type: Sequelize.STRING,
    primaryKey: true,
    defaultValue: generate
  },
  name: {
    type: Sequelize.STRING
  },
  email: {
    type: Sequelize.STRING
  },
  data: {
    type: Sequelize.JSON
  },
  date: {
    type: Sequelize.DATE
  }
})
inst.prototype.ac = function() {
  return 'ac'
}
let before = await inst.findAll()
```

## Class methods

```js
inst.find({
  limit: 1, // optional
  op: 'eq', //optional, could be 'contains'
  where: {
    name: 'x'
  }
})
inst.findAll()
inst.getOne({
  where: {
    name: 'xxx'
  }
})
inst.findOne({
  where: {
    id: 'xxx'
  }
})
inst.findByPk('xxx')
inst.create({
  id: 'xxx'
  name: 'yyyy'
})
inst.update({
  name: 'gggg'
}, {
  where: {
    id: 'xxx'
  }
})
inst.destroy({
  where: {
    id: 'xxx'
  }
})
inst.batchGet([
  {
    id: 'xxx'
  },
  {
    id: 'yyy'
  }
])
```

check more from [tests/dynamo.spec.js](tests/dynamo.spec.js)

## Supported features && limitations

-
- Enable dynamodb only when `dialect === 'dynamo'`
- Only support Model deinfe by `inst.define`
- Only support Model methods: `find`, `findAll`, `findOne`, `create`, `findByPk`, `update`, `destroy`, `batchGet`, `getOne`.
- `find`, `findOne`, `getOne`, `findAll`, `update` and `destroy` only support `where` query.
- All `where` query keys must have non empty value.
- Set envs through .env file, check [.env.sample](.env.sample) for detail.
- Supported data types:

```js
function typeMapper(type) {
  switch (type) {
    case Sequelize.STRING:
    case Sequelize.TEXT:
      return String
    case Sequelize.JSON:
      return Object
    case Sequelize.BOOLEAN:
      return Boolean
    case Sequelize.INTEGER:
    case Sequelize.BIGINT:
    case Sequelize.FLOAT:
    case Sequelize.DECIMAL:
    case Sequelize.DOUBLE:
      return Number
    case Sequelize.DATE:
      return Date
    default:
      throw new Error(`do not support type: ${type}`)
  }
}
```

## User tip about performance

- Model methods: `find`, `findAll`, `getOne` use dynamodb scan, so be careful, in big dataset, this may cost unacceptable time.

## Upgrade guide

- model created by sequelize.define can not be extended (since v2.x)

```js

// do this
const User = sequelize.define('User', {
  id: {
    type: Sequelize.STRING,
    primaryKey: true,
    defaultValue: generate
  },
  name: {
    type: Sequelize.STRING
  }
})

User.prototype.act = () => 'act'
export default User

// DO NOT do this
const User = sequelize.define('User', {
  id: {
    type: Sequelize.STRING,
    primaryKey: true,
    defaultValue: generate
  },
  name: {
    type: Sequelize.STRING
  }
})

class SubUser extends User

SubUser.prototype.act = () => 'act'

export default SubUser

```

## Why/when to use it

Sequelize is really easy to use, just lack dynamodb support, while for AWS Lambda user, Dynamodb ease the pain of VPS settings, ideal for lightweight services. With this module you may migrate to Dynamodb easily.

## Build/test

```bash
# compile
npm run build

# test
npm run jest
```

## License

MIT
