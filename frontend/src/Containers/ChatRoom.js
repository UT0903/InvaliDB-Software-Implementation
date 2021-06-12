import "../App.css";
import { useState } from "react";

import { Table, Input, InputNumber, Popconfirm, Form, Typography } from 'antd';
import EditTable from "../Components/Table"
const client = new WebSocket('ws://140.112.30.43:8080') //140.112.30.36

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
      //console.log(typeof(newdata))
      for(let i = 0; i < parsedd.body.length; i++){
        console.log('modify id:', parsedd.body[i].id)
        //console.log('body id', typeof(parsedd.body[i].Id))
        const index = newdata.findIndex((item)=>(parsedd.body[i].id === item.Id))
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
      //console.log(newdata)
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
  const sendData = async (data) => {
    console.log('send', data)
    await client.send(JSON.stringify(data))
  }
  /*
    test session start
  */
  const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  const getRandomInt = () => {
    return Math.floor(Math.random() * 100000);
  }
  const getQueryData = () => {
    const randomNum = getRandomInt()
    return {type: "query", body: { "$expr": {"$and": [{ "$lt": [{ "$toDouble": "$id" }, randomNum + 10]}, {"$gt": [{ "$toDouble": "$id" }, randomNum] } ] } }}
  }
  const getWriteData = () => {
    const newId = String(getRandomInt());
    return {
      type: "modify",
      body: {
        id: {
          id: newId
        },
        change: {
          id: newId,
          gender: (getRandomInt() % 2 === 0)?"M":"F",
        }
      }
    }
  }
  
  const mySendData = async (sleepNum, data) =>{
    await client.send(JSON.stringify(data))
    await sleep(sleepNum)
    console.log(sleepNum, data)
  }
  const testIncreaseQuery = async() =>{
    console.log('start Increase Query')
    for(let i = 1000; i >= 0; i--){
        await mySendData(i, getQueryData())
    }
  }
  const testIncreaseWrite = async () =>{
    console.log('start Increase Write')
    for(let i = 1000; i >= 0; i--){
      await mySendData(i, getWriteData())
    }
  }
  const testConstantWrite = async ()=>{
    console.log('start Constant Write')
    while(true) await mySendData(300, getWriteData())
  }
  const testConstantQuery = async () =>{
    console.log('start Constant Query')
    while(true) await mySendData(500, getQueryData())
  }
  /*
    test session end
  */
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
      <button onClick={testConstantQuery}>test constant Query</button>
      <button onClick={testConstantWrite}>test constant Write</button>
      <button onClick={testIncreaseQuery}>test increase query</button>
      <button onClick={testIncreaseWrite}>test increase write</button>
      <EditTable data={data} setData={modifyTableData} />
    </>);
};
export default ChatRoom;
