const DynamoDbLocal = require('dynamodb-local')
const dynamoLocalPort = process.env.DYNAMO_PORT || 8000

DynamoDbLocal.launch(dynamoLocalPort, null, ['-sharedDb']) // if you want to share with Javascript Shell
  .then(function () {
    console.log('dynamodb local running at', dynamoLocalPort)
  })
