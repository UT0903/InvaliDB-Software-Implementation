console.log("进程 "+ " 执行。" );
process.on('message', (msg, setHandle) => {
    console.log(`子行程接收到訊息 -> ${msg}`)
    process.send(msg)
})