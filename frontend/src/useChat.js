import { useState } from "react";  


const client = new WebSocket('ws://localhost:8080')
const useChat = (loadMessages, addMessages) => {
  client.onmessage = (byteString) => {
      const { data } = byteString
    //   console.log(JSON.parse(data))
      const {type, body} = JSON.parse(data)
      switch(type){
        case "CHAT":{
            loadMessages(body)
            break
        }
        case "MESSAGE": {
            addMessages(body)
            break
        }
      }
  }
  const sendData = async (data) => {
    await client.send(JSON.stringify(data))
  }
  const [status, setStatus] = useState({}); // { type, msg }
  const sendMessage = (payload) => {
    sendData(["MESSAGE", payload])
  }; // { key, msg }
  const sendNewChat = (payload) => {
    sendData(["CHAT", payload])
  }

  return { status, sendMessage, sendNewChat };
};
export default useChat;