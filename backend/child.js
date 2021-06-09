let datas = [];
let subscriptions = {};

process.on('message', (msg, setHandle) => {
    msg = JSON.parse(msg)
    console.log("child${process.argv[2]} get:", msg)
    if(msg.type === "init") {
        datas = msg.data;
        datas.forEach(data => {
            subscriptions[data.id] = [];
        });
        console.log(subscriptions)
    } else if (msg.type === "subscription") {
        const { clientId, ids } = msg;
        console.log("${process.argv[2]} get into subscription");
        ids.forEach(id => {
            subscriptions[id].push(clientId);
        });
        console.log(subscriptions);
    } else if (msg.type === "modify") {
        const { id, change } = msg.modify; // id = { id: id } change = { key: value }
        const clientId = Object.values(id)[0]
        datas = datas.filter(id => id != clientId);
        datas.push(change)
        process.send(JSON.stringify([{
            change,
            clients: subscriptions[clientId]
        }]));
        console.log(datas);
    } else if (msg.type === "unsubscription"){
        const { clientId } = msg;
        Object.entries(subscriptions).forEach(([key, value]) => {
            subscriptions[key] = value.filter(id => id != clientId);
        });
    }
})

console.log("cluster node ${process.argv[2]} start")
