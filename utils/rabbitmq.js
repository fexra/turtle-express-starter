const amqp = require('amqplib')

const connect = (url = 'amqp://' + process.env.RABBITMQ_USER + ':' + process.env.RABBITMQ_PASS + '@' + process.env.RABBITMQ_HOST) => {
  return new Promise((resolve, reject) => {
    amqp.connect(url)
      .then(conn => resolve(conn))
      .catch(err => reject(err))
  })
}

const createChannel = conn => {
  return new Promise((resolve, reject) => {
    conn.createChannel()
      .then(channel => resolve(channel))
      .catch(err => reject(err))
  })
}

const channelAssertQueue = (channel, queueName) => {
  return new Promise((resolve, reject) => {
    channel.assertQueue(queueName, { durable: true})
      .then(asserted => resolve(channel))
      .catch(err => reject(err))
  })
}

const sendToQueue = (channel, queueName, buffer) => {
  channel.sendToQueue(queueName, buffer)
}

const connection = async (queueName = 'msg.*') => {
  var conn = await connect()
  var channel = await createChannel(conn)
  var assertedChannelToQueue = await channelAssertQueue(channel, queueName)
  return channel
}

module.exports = connection