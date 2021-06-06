import "../App.css";
import { useState } from "react";
import { Tabs, Input, Tag } from "antd";
import useChat from "../useChat"
import ChatModal from "../Components/ChatModal"



const { TabPane } = Tabs;
const ChatRoom = ({ me, displayStatus }) => {
  const [chatBoxes, setChatBoxes] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [activeKey, setActiveKey] = useState("")
  const addChatBox = () => { setModalVisible(true); }
  const loadMessages = (data) => {
      const newChatBoxes = [...chatBoxes]
      let {messages} = data
      let index = newChatBoxes.findIndex(x => x.key == activeKey)
      newChatBoxes[index].chatLog = messages
      setChatBoxes(newChatBoxes)
      displayStatus({
        type: "success",
        msg: "Message loaded",
      });
  }
  const addMessages = (data) => {
      const newChatBoxes = [...chatBoxes]
      let {message} = data
      let index = newChatBoxes.findIndex(x => x.key == activeKey)
      newChatBoxes[index].chatLog.push(message)
      setChatBoxes(newChatBoxes)
      displayStatus({
        type: "success",
        msg: "Message Sent",
      });
  }
  const {sendMessage, sendNewChat} = useChat(loadMessages, addMessages)
  const createChatBox = (friend) => {
    const newKey = me <= friend ?
          `${me}_${friend}` : `${friend}_${me}`;
    if (chatBoxes.some(({ key }) => key === newKey)) {
      throw new Error(friend +
                      "'s chat box has already opened.");
    }
    sendNewChat({name:me, to:friend})
    const newChatBoxes = [...chatBoxes];
    const chatLog = [];
    newChatBoxes.push({ friend, key: newKey, chatLog });
    setChatBoxes(newChatBoxes);
    setActiveKey(newKey);
  };
  const removeChatBox = (targetKey) => {
    let newActiveKey = activeKey;
    let lastIndex;
    chatBoxes.forEach(({ key }, i) => {
      if (key === targetKey) { lastIndex = i - 1; }});
    const newChatBoxes = chatBoxes.filter(
      (chatBox) => chatBox.key !== targetKey);
    if (newChatBoxes.length) {
      if (newActiveKey === targetKey) {
        if (lastIndex >= 0) {
          newActiveKey = newChatBoxes[lastIndex].key;
        } else { newActiveKey = newChatBoxes[0].key; }
      }
    } else newActiveKey = ""; // No chatBox left
    setChatBoxes(newChatBoxes);
    setActiveKey(newActiveKey);
  };


  return (
    <> <div className="App-title">
         <h1>{me}'s Chat Room</h1> </div>
      <div className="App-messages">
        <Tabs type="editable-card" 
              activeKey={activeKey}
              onChange={key => {setActiveKey(key)}}
              onEdit={(targetKey, action) => {
                  if(action === "add") addChatBox()
                  else if(action === "remove") removeChatBox(targetKey);
              }}>
          {chatBoxes.map((
            { friend, key, chatLog }) => {
                return (
                    <TabPane tab={friend} 
                      key={key} closable={true}>
                      <p>{friend}'s chatbox.</p>
                    </TabPane>
                );})}
             </Tabs>
        <ChatModal
          visible={modalVisible}
          onCreate={({ name }) => {
            createChatBox(name);
            setModalVisible(false);
          }}
          onCancel={() => {
            setModalVisible(false);
          }}
        />
        {chatBoxes.filter(x => x.key == activeKey).map(chatBox => (
            chatBox.chatLog.map(({name, body}, i) => {
                let style = {}
                if(name == me) {
                    style.position = "relative"
                    style.right = '300px'
                    style.textAlign = 'right'
                    style.fontSize = "16px"
                    return (
                        <p className="App-message" key={i} style={style}>
                            <Tag color="#DCDCDC" style={{fontSize:"16px", color:"#696969"}}>{body}</Tag>  {name}
                        </p>
                    )
                }
                else{
                    style.position = "relative"
                    style.right = "-300px"
                    style.textAlign = 'left'
                    style.fontSize = "16px"
                    return (
                        <p className="App-message" key={i} style={style}>
                            {name} <Tag style={{fontSize:"16px", color:"#696969"}}color="#DCDCDC" >{body}</Tag> 
                        </p>
                    )
                }
            })
        ))}
            </div>
            <Input.Search
              value={messageInput}
              onChange={(e) => 
                setMessageInput(e.target.value)}
              enterButton="Send"
              placeholder=
                "Enter message here..."
              onSearch={(msg) => 
                { 
                    if (!msg) {
                        displayStatus({
                          type: "error",
                          msg: "Please enter message.",
                        });
                        return;
                      } else if (activeKey === "") {
                        displayStatus({
                          type: "error",
                          msg: "Please add a chatbox first.",
                        });
                        setMessageInput("");
                        return;
                      }
                      sendMessage({ name: me, to: me == activeKey.split('_')[0]?activeKey.split('_')[1]:activeKey.split('_')[0], body: msg });
                      setMessageInput("");
            
                 }}
            ></Input.Search> 
        </>);
      };
export default ChatRoom;
      