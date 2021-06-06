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
  id: { type: String, ref: "Id" },
  name: { type: String, required: true, ref: "Name" },
  gender: { type: String, ref: "Gender" },
  age: { type: Number, ref: "Age" },
  married: { type: String, ref: "Married" },
  occupation: { type: String, ref: "Ocuppation" }
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
const UserModel = mongoose.model('population_data', userSchema);

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
  let data = await UserModel.find(body);
  console.log(data)
  return data
};

const copyMongoData = (childs) => async () => {
  const datas = await UserModel.find({Id: { $lte: 10} });
  //const datas = []
  console.log('datas', datas,  Math.sqrt(childs.length))
  const row = Math.sqrt(childs.length);
  for (let i = 0; i < childs.length; i++) {
    childs[i].send(JSON.stringify({
      type: "init",
      data: datas.filter(
        (data, idx) => (idx % row === i % row))
    }))
  }
}

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
        console.log(data)
        const dirtyClients = []
        data.map(obj => obj.clients.map(client => {
            dirtyClients.push(client)
            Clients[`client_${client}`].data.map(x => {
              if(x.id == obj.user.id){
                return obj.user.id
              }
              return x
            })
          }
        ))
        for(let clientId in dirtyClients) {
          let client = Clients[`client_${clientId}`]
          if(client.status == "sub"){
              client.sendEvent(JSON.stringify(client.data))
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
const id = 0
wss.on('connection', function connection(client) {
  client.id = id
  id += 1
  client.status = "unsub"
  client.data = []; // keep track of client's CURRENT chat box
  client.sendEvent = (e) => client.send(JSON.stringify(e));

  client.on('message', async function incoming(message) {
    console.log('server receive message!')
    
    message = JSON.parse(message);
    // console.log(message)
    const [type, body] = message;

    switch (type) {
      // on open chat box
      case 'subscription': {
        client.status = "sub"
        const data = getInitData(body)
        client.data = data
        for(let i = 0; i < Math.sqrt(total_num); i++) {
          childs[Math.floor(client.id / Math.sqrt(total_num) + i)].send(JSON.stringify({
              type:'subscription',
              clientId:client.id,
              ids: data.filter(x => x.id % Math.sqrt(total_num) == i).map(user => user.id)
          }))
        }
        break
      }
      case 'write': {
        const {id, change} = body
        //{id:{id:id}, change:{key:value}}
        UserModel.where(id).update(change)
        for(let i = 0; i < Math.sqrt(total_num); i++) {
          if(id.id % Math.sqrt(total_num) != i){
            continue
          }
          childs[Math.floor(client.id / Math.sqrt(total_num) + i)].send(JSON.stringify({
              type: 'write',
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
      childs[Math.floor(client.id / Math.sqrt(total_num) + i)].send(JSON.stringify({
        type: 'unsubscription',
        clientId: client.id
      }))
      delete Clients[`client_${client.id}`]
    });

    Clients[`client_${client.id}`] = client
  });
});

mongo.connect();
setTimeout(copyMongoData(childs), 3000);
server.listen(8080, () => {
  console.log('Server listening at http://localhost:8080');
});
