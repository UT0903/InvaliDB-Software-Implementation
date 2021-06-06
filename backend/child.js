let datas = [];
let subscriptions = {};

process.on('message', (msg, setHandle) => {
    msg = JSON.parse(msg)
    // console.log(`child${process.argv[2]} get:`, msg)
    if(msg.type === "init") {
        datas = msg.data;
        datas.forEach(data => {
            subscriptions[data.Id] = [];
        });
    } else if (msg.type === "subscribe") {
        const { clientId, ids } = msg;
        ids.forEach(id => {
            subscriptions[id].push(clientId);
        });
    } else if (msg.type === "write") {
        const { id, change } = msg.modify; // id = { id: id } change = { key: value }
        const clientId = Object.values(id)[0]
        let user = datas.find(data => data.id === clientId);
        user[Object.keys(change)[0]] = Object.values(change)[0];
        process.send(JSON.stringify([{
            user,
            clients: subscriptions[clientId]
        }]));
    } else if (msg.type === "unsubscription"){
        const { clientId } = msg;
        Object.entries(subscriptions).forEach(([key, value]) => {
            subscriptions[key] = value.filter(id => id != clientId);
        });
    }
})

console.log(`cluster node ${process.argv[2]} start`)
