/* eslint-env jest */

import pack from '../package.json'
import Sequelize from '../dist'
import SequelizeOrig from 'sequelize'

jest.setTimeout(99999)

describe(pack.name, function () {
  test('dialect != dynamo', async () => {
    const sequelize = new Sequelize(
      'sqlite://./db.sqlite',
      {
        define: {
          timestamps: true
        },
        logging: false
      }
    )
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
    expect(sequelize instanceof SequelizeOrig).toEqual(false)
    expect(typeof sequelize.define).toEqual('function')
  })
})
