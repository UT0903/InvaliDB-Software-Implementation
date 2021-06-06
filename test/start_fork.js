const { fork } = require('child_process')
const path = require('path')
let child = fork('./child.js')
child.on('message', (data) => {
    console.log(`父行程接收到訊息 -> ${data}`)
})
child.on('error', (err) => {
    console.error(err)
})
child.send('hello world')