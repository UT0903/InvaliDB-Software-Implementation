import "../App.css";
import { useState } from "react";

import { Table, Input, InputNumber, Popconfirm, Form, Typography } from 'antd';
import EditTable from "../Components/Table"
const client = new WebSocket('ws://140.112.30.36:8080')

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
  const [data, setData] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  client.onmessage = (byteString) => {
    const parsed = JSON.parse(byteString.data)
    const parsedd = JSON.parse(parsed)
    console.log('recv data:', parsedd, typeof(parsedd), typeof(parsed))
    if(parsedd.type === "modify"){
      const newdata = data;
      console.log(typeof(newdata))
      for(let i = 0; i < parsedd.body.length; i++){
        console.log('body id', typeof(parsedd.body[i].Id))
        const index = newdata.findIndex((item)=>(parsedd.body[i].Id === item.id))
        console.log('modify index', index)
        if(index !== -1){
          newdata[index].Id = parsedd.body[i].id
          newdata[index].key = parsedd.body[i].id
          newdata[index].Gender = parsedd.body[i].gender
          newdata[index].Name = parsedd.body[i].name
          newdata[index].Age = parsedd.body[i].age
          newdata[index].Married = parsedd.body[i].married
          newdata[index].Ocuppation = parsedd.body[i].ocuppation
        }
      }
      console.log(newdata)
      setData(newdata)
    }
    else{
      const arr = parsedd.body.map((x) => ({
        Id: x.id,
        key: x.id,
        Gender: x.gender,
        Name: x.name,
        Age: x.age,
        Married: x.married,
        Ocuppation: x.ocuppation
      }))
      console.log('query type', typeof(arr))
      setData(arr)
    }
  }
  const modifyTableData = (newData, index) => {
    setData(newData);
    sendData({
      type: "modify",
      body: {
        id: {
          id: newData[index].Id
        },
        change: {
          id: newData[index].Id,
          gender: newData[index].Gender,
          name: newData[index].Name,
          age: newData[index].Age,
          married: newData[index].Married,
          ocuppation: newData[index].Ocuppation
        }
      }
    });
  }
  const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  const getRandomInt = () => {
    return Math.floor(Math.random() * 100000);
  }
  const sendData = async (data) => {
    console.log('send', data)
    await client.send(JSON.stringify(data))
  }
  const testQuery = async() =>{
    console.log('start testQuery')
    for(let i = 1000; i >= 0; i--){
      const randomNum = getRandomInt()
      const data = {type: "query", body: { "$expr": {"$and": [{ "$lt": [{ "$toDouble": "$id" }, randomNum + 10]}, {"$gt": [{ "$toDouble": "$id" }, randomNum] } ] } }}
      await client.send(JSON.stringify(data))
      await sleep(i)
      console.log(i, data)
    }
  }
  const testWrite = async ()=>{
    const modify = () => {
      return {
        type: "modify",
        body: {
          id: {
            id: String(getRandomInt())
          },
          change: {
            gender: (getRandomInt() % 2 === 0)?"M":"F"
          }
        }
      }
    }
    for(let i = 100000; i >= 0; i--){
      let data = modify()
      await client.send(JSON.stringify(data))
      await sleep(300)
      console.log(i, data)
    }
  }
  const testtest = () =>{
    let data = [1, 2, 3, 4, 5, 6]
    console.log(data.findIndex((item)=>(item === 4)))
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
            body: msg
          });
          setMessageInput("");
        }}
      ></Input.Search>
      <button onClick={testWrite}>test constant Write</button>
      <button onClick={testQuery}>test query</button>
      <button onClick={testtest}>test</button>
      <EditTable data={data} setData={modifyTableData} />
    </>);
};
export default ChatRoom;
