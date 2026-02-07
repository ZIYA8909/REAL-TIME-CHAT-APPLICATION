import React, { useState, useEffect, useRef } from "react";
import { socket } from "./socket"; 
import { motion, AnimatePresence } from "framer-motion";
import { Send, Hash, User, MessageSquare, Image as ImageIcon, LogOut } from "lucide-react";
import "./index.css";

function App() {
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("General");
  const [showChat, setShowChat] = useState(false);
  const [currentMessage, setCurrentMessage] = useState("");
  const [messageList, setMessageList] = useState([]);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messageList]);

  useEffect(() => {
    socket.on("load_history", (history) => setMessageList(history));
    socket.on("receive_message", (data) => setMessageList((list) => [...list, data]));
    return () => socket.off();
  }, []);

  const joinRoom = () => {
    if (username.trim() !== "") {
      socket.emit("join_room", room);
      setShowChat(true);
    }
  };

  const sendImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const messageData = {
          room, author: username, message: "", image: reader.result,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        socket.emit("send_message", messageData);
        setMessageList((list) => [...list, messageData]);
      };
      reader.readAsDataURL(file);
    }
  };

  const sendMessage = async () => {
    if (currentMessage.trim() !== "") {
      const messageData = {
        room, author: username, message: currentMessage, image: null,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      await socket.emit("send_message", messageData);
      setMessageList((list) => [...list, messageData]);
      setCurrentMessage("");
    }
  };

  return (
    <div className="app-container">
      {/* 🚀 External Background Link with Dark Overlay */}
      <div 
        className="animated-bg" 
        style={{ 
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.7)), url("https://i.pinimg.com/736x/6d/97/48/6d97480f8cc3a6fc907459154ebf308b.jpg")` 
        }}
      ></div>
      
      {!showChat ? (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="join-card">
          <div className="icon-circle"><MessageSquare size={30} color="white" /></div>
          <h2 className="elegant-title">MESSENGER PRO</h2>
          
          <div className="input-group">
            <span className="input-label">Identity</span>
            <User size={18} className="input-icon" />
            <input type="text" placeholder="Username" onChange={(e) => setUsername(e.target.value)} onKeyPress={(e) => e.key === "Enter" && joinRoom()} />
          </div>

          <div className="input-group">
            <span className="input-label">Channel</span>
            <Hash size={18} className="input-icon" />
            <input type="text" placeholder="Room Name" value={room} onChange={(e) => setRoom(e.target.value)} onKeyPress={(e) => e.key === "Enter" && joinRoom()} />
          </div>

          <button onClick={joinRoom} className="join-btn">ENTER ROOM</button>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="chat-window">
          <div className="chat-header">
            <p style={{ margin: 0, fontWeight: 'bold', color: 'white' }}>#{room}</p>
            <button onClick={() => setShowChat(false)} className="leave-btn"><LogOut size={20}/></button>
          </div>

          <div className="chat-body">
            {messageList.map((msg, index) => (
              <div key={index} className={`message-wrapper ${username === msg.author ? "you" : "other"}`}>
                <div className="msg-bubble">
                  {msg.image && <img src={msg.image} alt="sent" className="sent-image" />}
                  {msg.message && <p style={{ margin: 0 }}>{msg.message}</p>}
                </div>
                <p className="msg-author">{msg.author}</p>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div className="chat-footer">
            {/* 📸 Image Option Button */}
            <label className="image-upload-btn">
              <ImageIcon size={24} color="#94A3B8" />
              <input type="file" accept="image/*" onChange={sendImage} style={{ display: 'none' }} />
            </label>
            <input type="text" value={currentMessage} placeholder="Message..." onChange={(e) => setCurrentMessage(e.target.value)} onKeyPress={(e) => e.key === "Enter" && sendMessage()} />
            <button onClick={sendMessage} className="send-btn"><Send size={18} /></button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default App;