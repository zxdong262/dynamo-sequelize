const AWS = require('aws-sdk')
// const dynamoose = require('dynamoose')

const {
  AWS_PROFILE
} = process.env

if (AWS_PROFILE) {
  const credentials = new AWS.SharedIniFileCredentials({
    profile: AWS_PROFILE
  })
  AWS.config.credentials = credentials
}

// dynamoose.aws.ddb.local()
