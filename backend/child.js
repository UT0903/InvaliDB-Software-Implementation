const datas = []
process.on('message', (msg, setHandle) => {
    msg = JSON.parse(msg)
    console.log(`child${process.argv[2]} get:`, msg)
    if(msg.type === "init"){
        console.log('init')
    }
    else{

    }
})

console.log(`cluster node ${process.argv[2]} start`)
