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
      timestamps: true,
      jsonAsObject: true // set false only if you upgrade from old db to be compatible with old db
    },
    logging: false,
    dialect: 'dynamo'
  }
)
const User = sequelize.define('User', {
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
User.prototype.ac = function() {
  return 'ac'
}
let before = await User.findAll()
```

## Class methods

```js
User.find({
  limit: 1, // optional
  op: 'eq', //optional, could be 'contains'
  where: {
    name: 'x'
  }
})
User.findAll()
User.getOne({
  where: {
    name: 'xxx'
  }
})
User.findOne({
  where: {
    id: 'xxx'
  }
})
User.findByPk('xxx')
User.create({
  id: 'xxx'
  name: 'yyyy'
})
User.update({
  name: 'gggg'
}, {
  where: {
    id: 'xxx'
  }
})
User.destroy({
  where: {
    id: 'xxx'
  }
})
User.destroy({
  where: {
    id: ['xxx', 'yyy'],
  }
})
User.batchGet([
  {
    id: 'xxx'
  },
  {
    id: 'yyy'
  }
])
```

## JSON type with Object

By default, it will save JSON object as String in dynamodb. To save JSON object as Object in dynamodb:

```js
const sequelize = new SequelizeDynamo(
  '...',
  {
    define: {
      saveUnknown: true,
      timestamps: true,
      jsonAsObject: true,
    },
    logging: false,
    dialect: 'dynamo'
  }
)
```

## Instance methods

```js
const user = User.create({id : 'xx'})
await user.destroy()
user.name = 'yyy'
await user.save()
```

check more from [tests/dynamo.spec.js](tests/dynamo.spec.js)

## Supported features && limitations

- Enable dynamodb only when `dialect === 'dynamo'`
- Only support Model deinfe by `User.define`
- Only support Model methods: `find`, `findAll`, `findOne`, `create`, `findByPk`, `update`, `destroy`, `batchGet`, `getOne`.
- Only support instance/document methods: `destroy`, `save`.
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

## Use guide

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
