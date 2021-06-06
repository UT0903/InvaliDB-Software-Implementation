import './App.css';
import {useState, useEffect} from 'react';
import SignIn from './Containers/SignIn'
import ChatRoom from './Containers/ChatRoom'
import {message} from "antd"

const LOCALSTORAGE_KEY = "save-me"; 
const App = () => {
  const savedMe = localStorage.getItem(LOCALSTORAGE_KEY);
  const displayStatus = (payload) => {
    if(payload.msg) {
      const {type, msg} = payload
      const content = {
        content: msg, duration: 0.5
      }
      switch (type) {
        case 'success':
          message.success(content)
          break
        case 'error':
        default:
          message.error(content)
        break
      }
    }
  }
  const[signedIn, setSignedIn] = useState(false)
  const[me, setMe] = useState(savedMe || "");
  useEffect(() => {
    if(signedIn) {
      localStorage.setItem(LOCALSTORAGE_KEY, me);
    }}
    , [signedIn])


  return (
    <div className="App">
      {signedIn? (<ChatRoom me={me} displayStatus={displayStatus}/> ):(<SignIn me={me} setMe={setMe} setSignedIn={setSignedIn} displayStatus={displayStatus}/>)}
    </div>
  );
};


// function App() {
//   return (
//     <div className="App">
//       <header className="App-header">
//         <img src={logo} className="App-logo" alt="logo" />
//         <p>
//           Edit <code>src/App.js</code> and save to reload.
//         </p>
//         <a
//           className="App-link"
//           href="https://reactjs.org"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           Learn React
//         </a>
//       </header>
//     </div>
//   );
// }

export default App;
