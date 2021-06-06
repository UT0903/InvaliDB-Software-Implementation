process.on('message', (msg, setHandle) => {
    console.log(`子行程接收到訊息 -> ${msg}`)
    process.send('blabla')
})
