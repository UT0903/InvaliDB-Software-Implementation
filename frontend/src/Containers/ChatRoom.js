import "../App.css";
import { useState } from "react";
import { Table, Input, InputNumber, Popconfirm, Form, Typography } from 'antd';
import EditTable from "../Components/Table"
const client = new WebSocket('ws://localhost:8080')
const ChatRoom = ({ me, displayStatus }) => {
  /*const temp = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  const [data, setData] = useState(temp.map((i) => ({
    Id: i.toString(),
    key: i.toString(),
    Gender: 'male',
    Name: `Edrward ${i}`,
    Age: i.toString(),
    Married: 'no',
    Ocuppation: 'blablabla'
  })));*/
  const [data, setData] = useState();
  const [messageInput, setMessageInput] = useState("");

  client.onmessage = (byteString) => {
    const { data } = byteString

    setData(JSON.parse(data))
  }
  const modifyTableData = (newData, index) => {
    setData(newData);
    sendData({
      type: "modify",
      body: {
        id: {
          id: newData[index].Id
        },
        change: newData[index]
      }
    });
  }
  const sendData = async (data) => {
    console.log('send data:', data)
    await client.send(JSON.stringify(data))
  }


  return (
    <> <div className="App-title">
      <h1>{me}'s </h1> </div>
      <Input.Search
        value={messageInput}
        onChange={(e) =>
          setMessageInput(e.target.value)}
        enterButton="Send"
        placeholder=
        "Enter object to subscript here..."
        onSearch={(msg) => {
          try {
            console.log(msg)
            msg = JSON.parse(msg)
          }
          catch {
            displayStatus({
              type: "error",
              msg: typeof (msg),
            });
            return;
          }
          sendData({
            type: "query",
            body: messageInput
          });
          setMessageInput("");
        }}
      ></Input.Search>
      <EditTable data={data} setData={modifyTableData} />
    </>);
};
export default ChatRoom;
