let subscriptions = {};
let subscruption_list = {};

process.on('message', (msg) => {
    msg = JSON.parse(msg)
    // console.log(`child${process.argv[2]} get:`, msg)
    if (msg.type === "subscription") {
        const { clientId, ids } = msg;
        // console.log(`child${process.argv[2]} got client ${clientId}`)
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
        // console.log(`I am child${process.argv[2]}, I get into "modify"`)
        const { id, change } = msg.modify; // id = { id: id } change = { key: value }
        const index = Object.values(id)[0];
        if (subscriptions.hasOwnProperty(`${index}`)) { // data is in it
            // console.log(`I am child${process.argv[2]}, I am ready to send"`)
            Object.entries(change).forEach(([key, value]) => {
                subscriptions[index].data[key] = value;
            });
            process.send(JSON.stringify([{
                change: subscriptions[index].data,
                clients: subscriptions[index].subscribers
            }]));
        }
        // else {
        //     console.log(`I am child${process.argv[2]}, sorry I don't have data: ${index}.`)
        // }
    } else if (msg.type === "unsubscription"){
        // console.log(`child${process.argv[2]} unsub get:`, msg)
        const { clientId } = msg;
        const data_ids = subscruption_list[clientId];
        data_ids.forEach(index => {
            if (subscriptions.hasOwnProperty(`${index}`)) {
                const remaining_subscribers = subscriptions[index].subscribers.filter(id => id != clientId);
                if (remaining_subscribers.length > 0) {
                    subscriptions[index].subscribers = remaining_subscribers;
                } else { // no one is subscribing
                    delete subscriptions[index];
                }
            }
        });
    }
})

console.log(`cluster node ${process.argv[2]} start`)
