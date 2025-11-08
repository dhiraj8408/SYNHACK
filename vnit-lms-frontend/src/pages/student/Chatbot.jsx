import { useState } from "react";
import apiClient from "../../services/apiClient";
import { useAuth } from "../../context/AuthContext";

export default function Chatbot() {
  const { token } = useAuth();
  const [chat, setChat] = useState([]);
  const [input, setInput] = useState("");

  const askBot = async () => {
    const res = await apiClient.post(
      "/chatbot/ask",
      { message: input },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setChat([...chat, { from: "user", text: input }]);
    setChat((prev) => [...prev, { from: "bot", text: res.data.answer }]);
    setInput("");
  };

  return (
    <div style={{ padding: 30 }}>
      <h2>AI Chatbot 🤖</h2>

      <div style={{ height: 300, border: "1px solid #aaa", padding: 10, overflowY: "scroll" }}>
        {chat.map((msg, index) => (
          <p key={index}><b>{msg.from}:</b> {msg.text}</p>
        ))}
      </div>

      <input
        style={{ marginTop: 10 }}
        placeholder="Ask something..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <button onClick={askBot}>Send</button>
    </div>
  );
}
