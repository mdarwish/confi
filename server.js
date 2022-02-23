/* eslint-disable no-template-curly-in-string */
const express = require('express')

const io = require('socket.io') ({
    path: '/confi'
})

const app = express()
const port = 8080

app.get('/', (req, res) => res.send('Hello, WebRTC!!'))

const server = app.listen(port, () => {
    console.log('WebRTC App is listening on port', port)
})

io.listen(server)

const confiWebRTCNamespace = io.of('/webRTCPeers')

confiWebRTCNamespace.on('connection', socket => {
    console.log(socket.id, 'connected')
    
    socket.emit('connection-success', {
        status: 'connection-success',
        socketId: socket.id,
    })
    
    socket.on('disconnect', () => {
        console.log(socket.id, 'has disconnected')
    })
    
    socket.on('sdp', data => {
        console.log(data)
        socket.broadcast.emit('sdp', data)
    })
    
    socket.on('candidate', candidate => {
        console.log(candidate)
        socket.broadcast.emit('candidate', candidate)
    })
})
