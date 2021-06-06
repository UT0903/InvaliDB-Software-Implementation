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

const validateUser = async (name) => {
  const existing = await UserModel.findOne({ name });
  if (existing) return existing;
  return new UserModel({ name }).save();
};

/*const validateChatBox = async (name, participants) => {
  let box = await ChatBoxModel.findOne({ name });
  if (!box) box = await new ChatBoxModel({ name, users: participants }).save();
  return box
    .populate('users')
    .populate({ path: 'messages', populate: 'sender' })
    .execPopulate();
};*/
const copyMongoData = (childs) => async () => {
  const datas = await UserModel.find({ Id: 0 });
  //const datas = []
  console.log('datas', datas,  Math.sqrt(childs.length))
  const row = i / Math.sqrt(childs.length);
  for (let i = 0; i < childs.length; i++) {
    childs[i].send(JSON.stringify({
      type: "init",
      data: datas.filter(
        (data, idx) => (idx % row === i / row))
    }))
  }
}
const InitForCluster = (totalNum) => {
  let childs = [];
  for (let i = 0; i < totalNum; i++) {
    const subProcess = fork(path.join(__dirname, 'child.js'), [i]);
    subProcess.on('message', (data) => {
      console.log(`父行程接收到訊息 -> ${data}`)
    })
    subProcess.on('error', (err) => {
      console.error(err)
    })
    childs.push(subProcess);
  }
  return childs;
}
const childs = InitForCluster(9);

const chatBoxes = {}; // keep track of all open AND active chat boxes

wss.on('connection', function connection(client) {
  client.id = uuid()
  client.box = ''; // keep track of client's CURRENT chat box

  client.sendEvent = (e) => client.send(JSON.stringify(e));

  client.on('message', async function incoming(message) {
    console.log('message!')
    child[0].send('new message')
    /*message = JSON.parse(message);
    // console.log(message)
    const [type, payload] = message;

    switch (type) {
      // on open chat box
      case 'CHAT': {
        const { name, to } = payload;

        const chatBoxName = makeName(name, to);

        const sender = await validateUser(name);
        const receiver = await validateUser(to);
        const chatBox = await validateChatBox(chatBoxName, [sender, receiver]);

        // if client was in a chat box, remove that.
        if (chatBoxes[client.box])
          // user was in another chat box
          chatBoxes[client.box].delete(client);

        // use set to avoid duplicates
        client.box = chatBoxName;
        if (!chatBoxes[chatBoxName]) chatBoxes[chatBoxName] = new Set(); // make new record for chatbox
        chatBoxes[chatBoxName].add(client); // add this open connection into chat box

        client.sendEvent({
          type: 'CHAT',
          body: {
            messages: chatBox.messages.map(({ sender: { name }, body }) => ({
              name,
              body,
            })),
          },
        });

        break;
      }

      case 'MESSAGE': {
        // console.log(payload)
        const {
          name, to, body
        } = payload;

        const chatBoxName = makeName(name, to);

        const sender = await validateUser(name);
        const receiver = await validateUser(to);
        const chatBox = await validateChatBox(chatBoxName, [sender, receiver]);

        const newMessage = new MessageModel({ sender, body });
        await newMessage.save();

        chatBox.messages.push(newMessage);
        await chatBox.save();

        chatBoxes[chatBoxName].forEach((client) => {
          client.sendEvent({
            type: 'MESSAGE',
            body: {
              message: {
                name,
                body,
              },
            },
          });
        });
      }
    }*/

    // disconnected
    client.once('close', () => {
      chatBoxes[client.box].delete(client);
    });
  });
});

mongo.connect();
setTimeout(copyMongoData(childs), 3000);
server.listen(8080, () => {
  console.log('Server listening at http://localhost:8080');
});
