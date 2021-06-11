let subscriptions = {};
let subscruption_list = {};

process.on('message', (msg, setHandle) => {
    msg = JSON.parse(msg)
    // console.log(`child${process.argv[2]} get:`, msg)
    if (msg.type === "subscription") {
        const { clientId, ids } = msg;
        const data_ids = ids.map(data => data.id);
        subscruption_list[clientId] = data_ids;
        ids.forEach(data => {
            const index = data.id;
            if (subscriptions.hasOwnProperty(`${index}`)) { // data already in it
                subscriptions[index].subscribers.push(clientId);
            } else {
                subscriptions[index] = {};
                subscriptions[index].data = data;
                subscriptions[index].subscribers = [clientId];
            }
        });
        // console.log(subscriptions);
    } else if (msg.type === "modify") {
        const { id, change } = msg.modify; // id = { id: id } change = { key: value }
        const index = Object.values(id)[0];
        subscriptions[index].data = change;
        process.send(JSON.stringify([{
            change,
            clients: subscriptions[index].subscribers
        }]));
    } else if (msg.type === "unsubscription"){
        const { clientId } = msg;
        const data_ids = subscruption_list[clientId];
        data_ids.forEach(index => {
            const remaining_subscribers = subscriptions[index].subscribers.filter(id => id != clientId);
            if (remaining_subscribers.length > 0) {
                subscriptions[index].subscribers = remaining_subscribers;
            } else { // no one is subscribing
                delete subscriptions[index];
            }
        });
    }
})

console.log(`cluster node ${process.argv[2]} start`)
