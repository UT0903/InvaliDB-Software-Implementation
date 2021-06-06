import { createContext, useContext, useState } from "react"; 

export interface info {
    friend: "",
    key: "",
    chatLog : []
}

const ChatBoxContext = createContext({
        chatBoxes: [{
            friend: "",
            key: "",
            chatLog : []
    }],
  
    createChatBox: () => {},
    removeChatBox: () => {},
  });


const ChatBoxProvider = (props) => {
    const [chatBoxes, setChatBoxes] = useState([
        {friend: "Mary", key: "MaryChatbox", chatLog : []},
        {friend: "Peter", key: "PeterChatbox", chatLog : []}
    ]);

    const createChatBox = (friend, me) => { 
        console.log("AAAAA")
        const newKey = me <= friend ?
        `${me}_${friend}` : `${friend}_${me}`;
        if (chatBoxes.some(({ key }) => key === newKey)) {
        throw new Error(friend +
                        "'s chat box has already opened.");
        }
        const newChatBoxes = [...chatBoxes];
        const chatLog = [];
        newChatBoxes.push({ friend, key: newKey, chatLog });
        setChatBoxes(newChatBoxes);
        return newKey
    };
    const removeChatBox = (targetKey, activeKey) => {
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
        return newActiveKey
    };
    return (
        <ChatBoxContext.Provider
          value={{
            chatBoxes:chatBoxes,
            createChatBox: createChatBox,
            removeChatBox:removeChatBox,
          }}
          {...props}
        />
    );
};

function useChatBox() {
    return useContext(ChatBoxContext);
}

export { ChatBoxProvider, useChatBox }