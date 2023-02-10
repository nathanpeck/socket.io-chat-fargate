// Setup basic express server
import _ from 'lodash'
import crypto from 'crypto'
import express from 'express'
import compression from 'compression'
import enforce from 'express-sslify'
import config from './lib/config.js'
import http from 'http'
import { Server } from 'socket.io'
import { createAdapter } from '@socket.io/redis-adapter'
import * as Presence from './lib/presence.js'
import * as User from './lib/user.js'
import * as Message from './lib/message.js'
import client from './lib/redis.js'

// Setup the HTTP server that serves static assets
const app = express()
export const server = http.createServer(app)

app.use(compression())

// Force redirect to HTTPS if the protocol was HTTP
if (!process.env.LOCAL) {
  app.use(enforce.HTTPS({ trustProtoHeader: true }))
}

// The static paths
app.use(express.static('public'))

// A mocked up saerch endpoint
app.get('/search', (req, res) => {
  res.status(200).send([{
    score: 1,
    hit: {
      username: 'Backend system message',
      avatar: 'https://www.gravatar.com/avatar/3bf43d16dedfc155a52744d98345f57b?d=retro',
      content: {
        text: `Search endpoint not connected yet. You searched for '${req.query.q}'`
      }
    }
  }])
})

// The Socket.io features on top of the HTTP server
const io = new Server(server, {
  pingInterval: config.HEARTBEAT_INTERVAL,
  pingTimeout: config.HEARTBEAT_TIMEOUT
})

// Setup socket.io to scale horizontally using Redis pubsub
const pubClient = client.duplicate()
const subClient = client.duplicate()
await pubClient.connect()
await subClient.connect()

io.adapter(createAdapter(pubClient, subClient))

// Handler for socket.io connections
io.on('connection', async function (socket) {
  // Initially the socket starts out as not authenticated
  socket.authenticated = false

  const users = await Presence.list()

  // Tell the socket how many users are present.
  io.to(socket.id).emit('presence', {
    numUsers: users.length
  })

  // when the client emits 'new message', this listens and executes
  socket.on('new message', async function (data, callback) {
    if (!socket.authenticated) {
      // Don't allow people not authenticated to send a message
      return callback('Can\'t send a message until you are authenticated')
    }

    if (!data.room || !_.isString(data.room)) {
      return callback('Must pass a parameter `room` which is a string')
    }

    if (!data.message || !_.isString(data.message)) {
      return callback('Must pass a parameter `message` which is a string')
    }

    const messageBody = {
      room: data.room,
      time: Date.now(),
      content: {
        text: data.message
      },
      username: socket.username,
      avatar: socket.avatar
    }

    // Store the messages in DynamoDB
    messageBody.message = await Message.add(messageBody)

    socket.broadcast.emit('new message', messageBody)

    return callback(null, messageBody)
  })

  socket.on('message list', async function (from, callback) {
    let messages

    if (!from.room || !_.isString(from.room)) {
      return callback('Must pass a parameter `from.room` which is a string')
    }

    try {
      messages = await Message.listFromRoom(from)
    } catch (e) {
      return callback(e)
    }

    return callback(null, messages)
  })

  socket.conn.on('heartbeat', function () {
    if (!socket.authenticated) {
      // Don't start counting as present until they authenticate.
      return
    }

    Presence.upsert(socket.id, {
      username: socket.username
    })
  })

  // Client wants a list of rooms
  socket.on('room list', function (callback) {
    if (!_.isFunction(callback)) {
      return
    }

    return callback(null, [
      {
        id: 'general',
        name: 'Serverless is Awesome',
        preview: 'General serverless talk',
        image: '/static/images/serverless.svg',
        status: 'none',
        onlineCount: 0
      },
      {
        id: 'fargate',
        name: 'AWS Fargate',
        preview: 'Serverless containers',
        image: '/static/images/fargate.svg',
        status: 'none',
        onlineCount: 0
      },
      {
        id: 'lambda',
        name: 'AWS Lambda',
        preview: 'Serverless functions',
        image: '/static/images/lambda.svg',
        status: 'none',
        onlineCount: 0
      },
      {
        id: 'ecs',
        name: 'Amazon Elastic Container Service',
        preview: 'Orchestrate serverless containers',
        image: '/static/images/ecs.svg',
        status: 'none',
        onlineCount: 0
      }
    ])
  })

  // Client wants to create a new account
  socket.on('create user', async function (details, callback) {
    if (!_.isFunction(callback)) {
      return
    }

    if (socket.authenticated) {
      return callback('User already has a logged in identity')
    }

    if (!details.username || !_.isString(details.username)) {
      return callback('Must pass a parameter `username` which is a string')
    }

    if (!details.email || !_.isString(details.email)) {
      return callback('Must pass a parameter `email` which is a string')
    }

    if (!details.password || !_.isString(details.password)) {
      return callback('Must pass a parameter `password` which is a string')
    }

    details.password = details.password.trim().toLowerCase()
    details.username = details.username.trim().toLowerCase()
    details.email = details.email.trim().toLowerCase()

    try {
      await User.create({
        username: details.username,
        email: details.email,
        password: details.password
      })
    } catch (e) {
      return callback(e.toString())
    }

    // Set details on the socket.
    socket.authenticated = true
    socket.username = details.username
    socket.email = details.email
    socket.avatar = 'https://www.gravatar.com/avatar/' + crypto.createHash('md5').update(socket.email).digest('hex')

    // Set the user as present.
    Presence.upsert(socket.id, {
      username: socket.username
    })
    socket.present = true

    const users = await Presence.list()

    socket.emit('login', {
      numUsers: users.length
    })

    // echo globally (all clients) that a person has connected
    io.emit('user joined', {
      username: socket.username,
      avatar: socket.avatar,
      numUsers: users.length
    })

    return callback(null, {
      username: socket.username,
      avatar: socket.avatar
    })
  })

  // Client wants to authenticate a user
  socket.on('authenticate user', async function (details, callback) {
    if (!_.isFunction(callback)) {
      return
    }

    if (socket.authenticated) {
      return callback('User already has a logged in identity')
    }

    if (!details.username || !_.isString(details.username)) {
      return callback('Must pass a parameter `username` which is a string')
    }

    if (!details.password || !_.isString(details.password)) {
      return callback('Must pass a parameter `password` which is a string')
    }

    details.password = details.password.trim().toLowerCase()
    details.username = details.username.trim().toLowerCase()

    let result

    try {
      result = await User.authenticate({
        username: details.username,
        password: details.password
      })
    } catch (e) {
      return callback(e.toString())
    }

    if (!result) {
      return callback('No matching account found')
    }

    // Set the details on the socket.
    socket.authenticated = true
    socket.username = result.username
    socket.email = result.email
    socket.avatar = 'https://www.gravatar.com/avatar/' + crypto.createHash('md5').update(socket.email).digest('hex')

    // Set the user as present.
    Presence.upsert(socket.id, {
      username: socket.username
    })
    socket.present = true

    const users = await Presence.list()

    socket.emit('login', {
      numUsers: users.length
    })

    // echo globally (all clients) that a person has connected
    io.emit('user joined', {
      username: socket.username,
      avatar: socket.avatar,
      numUsers: users.length
    })

    return callback(null, {
      username: socket.username,
      avatar: socket.avatar
    })
  })

  socket.on('anonymous user', async function (callback) {
    if (!_.isFunction(callback)) {
      return
    }

    socket.authenticated = true
    socket.username = 'anonymous_' + crypto.randomBytes(3).toString('hex')
    socket.avatar = 'https://www.gravatar.com/avatar/' + crypto.createHash('md5').update(socket.username).digest('hex') + '?d=retro'

    // Set the user as present.
    Presence.upsert(socket.id, {
      username: socket.username
    })
    socket.present = true

    const users = await Presence.list()

    socket.emit('login', {
      numUsers: users.length
    })

    // echo globally (all clients) that a person has connected
    io.emit('user joined', {
      username: socket.username,
      avatar: socket.avatar,
      numUsers: users.length
    })

    return callback(null, {
      username: socket.username,
      avatar: socket.avatar
    })
  })

  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', function (room) {
    if (!socket.authenticated) {
      return
    }

    socket.broadcast.emit('typing', {
      room,
      username: socket.username,
      avatar: socket.avatar
    })
  })

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', function (room) {
    if (!socket.authenticated) {
      return
    }

    socket.broadcast.emit('stop typing', {
      room,
      username: socket.username
    })
  })

  // when the user disconnects.. perform this
  socket.on('disconnect', async function () {
    if (socket.authenticated) {
      Presence.remove(socket.id)

      const users = await Presence.list()

      // echo globally (all clients) that a person has left
      socket.broadcast.emit('user left', {
        username: socket.username,
        avatar: socket.avatar,
        numUsers: users.length
      })
    }
  })
})
