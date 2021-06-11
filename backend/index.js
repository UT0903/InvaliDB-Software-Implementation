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
        for(let clientId in Object.keys(dirtyClients)) {
          // console.log(${clientId} has:);
          let client = Clients[`client_${clientId}`]
          // console.log(client.data);
          if(client.status == "sub"){
            client.sendEvent(JSON.stringify({type: "modify", body: changedData[`client_${clientId}`]}))
          }
        }
    })

    subProcess.on('error', (err) => {
      console.error(err)
    })

    childs.push(subProcess);
  }
  return childs;
}
const total_num = 9
const childs = InitForCluster(total_num);

const Clients = {}; // keep track of all open AND active chat boxes
let id = 0;

wss.on('connection', async function connection(client) {
  client.id = id
  id += 1
  client.status = "unsub"
  client.data = []; // keep track of client's CURRENT chat box
  client.sendEvent = async (e) => {
    await client.send(JSON.stringify(e))
    console.log(`End time: ${Date.now()}`);
  };

  client.on('message', async function incoming(message) {
    console.log(`Start time: ${Date.now()}`);
    // console.log('server receive message!')
    message = JSON.parse(message);
    // console.log(message)
    const {type, body} = message;

    const runMongo = async (id, change) => {
      console.log("Start modify.")
      await UserModel.findOneAndUpdate(id, change);
      console.log("End modify.")
    }

    switch (type) {
      // on open chat box
      case 'query': {
        client.status = "sub"
        const data = await getInitData(body)
        // console.log(data.length)
        client.data = data
        client.sendEvent(JSON.stringify({type:"query", body:client.data}))
        for(let i = 0; i < Math.sqrt(total_num); i++) {
          childs[Math.floor(client.id / Math.sqrt(total_num) + i)].send(JSON.stringify({
              type:'subscription',
              clientId:client.id,
              ids: data.filter(x => parseInt(x.id) % Math.sqrt(total_num) == i)
          }))
        }
        break
      }
      case 'modify': {
        const {id, change} = body
        runMongo(id, change);
        for(let i = 0; i < Math.sqrt(total_num); i++) {
          if(id.id % Math.sqrt(total_num) != i){
            continue
          }
          childs[Math.floor(client.id / Math.sqrt(total_num) + i)].send(JSON.stringify({
              type: 'modify',
              modify: {id, change}
          }))
        }
        break
      }
      case 'unsubscription': {
        client.status = "unsub"
        childs[Math.floor(client.id / Math.sqrt(total_num) + i)].send(JSON.stringify({
          type: 'unsubscription',
          clientId: client.id
        }))
        break
      }
    }
       
    // disconnected
    client.once('close', () => {
      for(let i = 0; i < Math.sqrt(total_num); i++) {
        childs[Math.floor(client.id / Math.sqrt(total_num) + i)].send(JSON.stringify({
          type: 'unsubscription',
          clientId: client.id
        }))
      }
      delete Clients[`client_${client.id}`]
    });

    Clients[`client_${client.id}`] = client
  });
});

mongo.connect();
// setTimeout(copyMongoData(childs), 3000);
server.listen(8080, () => {
  console.log('Server listening at http://localhost:8080');
});
