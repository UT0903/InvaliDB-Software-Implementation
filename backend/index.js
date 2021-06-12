import mongoose from 'mongoose'
import http from 'http'
import WebSocket from 'ws'
import express from 'express'
import path from 'path'
import { v4 as uuid } from 'uuid'
// import uuid from "uuid"
import mongo from './mongo.js'
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { fork } from 'child_process'
import { time } from 'console'
import { start } from 'repl'
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


const app = express();

/* -------------------------------------------------------------------------- */
/*                               MONGOOSE MODELS                              */
/* -------------------------------------------------------------------------- */
const { Schema } = mongoose;

const userSchema = new Schema({
  id: { type: String, ref: "id" },
  name: { type: String, required: true, ref: "name" },
  gender: { type: String, ref: "gender" },
  age: { type: Number, ref: "age" },
  married: { type: String, ref: "married" },
  occupation: { type: String, ref: "ocuppation" }
});

/*const messageSchema = new Schema({
  chatBox: { type: mongoose.Types.ObjectId, ref: 'ChatBox' },
  sender: { type: mongoose.Types.ObjectId, ref: 'User' },
  body: { type: String, required: true },
});

const chatBoxSchema = new Schema({
  name: { type: String, required: true },
  users: [{ type: mongoose.Types.ObjectId, ref: 'User' }],
  messages: [{ type: mongoose.Types.ObjectId, ref: 'Message' }],
});*/
const UserModel = mongoose.model('population_data', userSchema, "Test");

/*const ChatBoxModel = mongoose.model('ChatBox', chatBoxSchema);
const MessageModel = mongoose.model('Message', messageSchema);*/

/* -------------------------------------------------------------------------- */
/*                                  UTILITIES                                 */
/* -------------------------------------------------------------------------- */
const makeName = (name, to) => {
  return [name, to].sort().join('_');
};

/* -------------------------------------------------------------------------- */
/*                            SERVER INITIALIZATION                           */
/* -------------------------------------------------------------------------- */
const server = http.createServer(app);

const wss = new WebSocket.Server({
  server,
});

app.use(express.static(path.join(__dirname, 'public')));


const getInitData = async (body) => {
  console.log("Start finding data.");
  const datas = await UserModel.find(body);
  console.log("Finish.");
  return datas
};

// [
//   {
//     user: {
//         id: 1,
//       name: "Eason",
//       gender: "F",
//       age: 17,
//       married: 0,
//       occupation: student
//     },
//     clients: [1, 2, 3]
//   }
// ]

const InitForCluster = (totalNum) => {
  let childs = [];
  for (let i = 0; i < totalNum; i++) {
    const subProcess = fork(path.join(__dirname, 'child.js'), [i]);
    subProcess.on('message', (data) => {
      data = JSON.parse(data)
        // console.log(data)
        // console.log(Clients)
        const dirtyClients = {}
        const changedData = {}

        data.map(obj => obj.clients.map(client => {
          dirtyClients[client] = 1
          if(!(`client_${client}` in changedData)){
              changedData[`client_${client}`] = []
          }
          changedData[`client_${client}`].push(obj.change)
        }
      ))
        Object.keys(dirtyClients).forEach(clientId => {
          // console.log(`clientId: ${clientId} has to know modified data.`)
          let client = Clients[`client_${clientId}`]
          // console.log(client.data);
          if(client.status === "sub") {
            client.sendEvent(JSON.stringify({type: "modify", body: changedData[`client_${clientId}`]}), "modify")
          }
        })
    })

    subProcess.on('error', (err) => {
      console.error(err)
    })

    childs.push(subProcess);
  }
  return childs;
}
const total_num = 9 // 9
const childs = InitForCluster(total_num);
let query_cnt = 0
let modify_cnt = 0
let query_cnt_end = 0
let modify_cnt_end = 0

const Clients = {}; // keep track of all open AND active chat boxes
let id = 0;
wss.on('connection', async function connection(client) {
  client.id = id
  id += 1
  client.count = 0
  client.status = "unsub"
  client.data = []; // keep track of client's CURRENT chat box
  client.sendEvent = async (e, type) => {
    if (type === "modify") {
      console.log(`modify-${modify_cnt_end} ends at time: ${Date.now()}`);
      modify_cnt_end += 1;
    } else { // type === "query"
      console.log(`query-${query_cnt_end} ends at time : ${Date.now()}`);
      query_cnt_end += 1;
    }
    // console.log("aaaaa");
    await client.send(JSON.stringify(e))
  };

  client.on('message', async function incoming(message) {
    const start_time = Date.now();
    // console.log('server receive message!')
    message = JSON.parse(message);
    // console.log(message)
    const {type, body} = message;

    const runMongo = async (id, change) => {
      // console.log("Start modify.")
      await UserModel.findOneAndUpdate(id, change);
      // console.log("End modify.")
    }

    switch (type) {
      // on open chat box
      case 'query': {
        // console.log("count: ", client.count)
        console.log(`query-${query_cnt} starts at time : ${start_time}`);
        query_cnt += 1;
        client.status = "sub"
        const data = await getInitData(body)
        // console.log(data.length)
        client.data = data
        client.sendEvent(JSON.stringify({type:"query", body:client.data}), "query")
        for(let i = 0; i < Math.sqrt(total_num); i++) {
          childs[Math.sqrt(total_num) * Math.floor(((client.id + client.count) % Math.sqrt(total_num)) / Math.sqrt(total_num)) + i].send(JSON.stringify({
              type:'subscription',
              clientId:client.id,
              ids: data.filter(x => parseInt(x.id) % Math.sqrt(total_num) == i)
          }))
        }
        if(client.count != 0) {
            for(let i = 0; i < Math.sqrt(total_num); i++) {
                childs[Math.sqrt(total_num) * Math.floor(((client.id + client.count - 1) % Math.sqrt(total_num)) / Math.sqrt(total_num)) + i].send(JSON.stringify({
                type: 'unsubscription',
                clientId: client.id
                }))
            }
        }
        client.count = (client.count + 1)
        break
      }
      case 'modify': {
        console.log(`modify-${modify_cnt} starts at time: ${start_time}`);
        modify_cnt += 1;
        const {id, change} = body
        runMongo(id, change);
        for(let i = 0; i < total_num; i++) {
          if(id.id % Math.sqrt(total_num) != i % Math.sqrt(total_num)){
            continue
          }
          // console.log("into modify")
          childs[i].send(JSON.stringify({
              type: 'modify',
              modify: {id, change}
          }))
        }
        break
      }
    }
       
    // disconnected
    client.once('close', () => {
      // console.log("fuck you too")
      if(client.count != 0) {
        for(let i = 0; i < Math.sqrt(total_num); i++) {
            childs[Math.sqrt(total_num) * Math.floor(((client.id + client.count - 1) % Math.sqrt(total_num)) / Math.sqrt(total_num)) + i].send(JSON.stringify({
            type: 'unsubscription',
              clientId: client.id
            }))
        }
      }
      delete Clients[`client_${client.id}`]
    });

    Clients[`client_${client.id}`] = client
  });
});

mongo.connect();
// setTimeout(copyMongoData(childs), 3000);
server.listen(8080, () => {
  console.log('Server listening at http://localhost:8000');
});
