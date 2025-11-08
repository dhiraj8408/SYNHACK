import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { socket } from "../../socket/socket";
import {
  createThread,
  listReplies,
  listThreads,
  resolveThread,
  sendReply,
} from "../../services/forumService";

export default function ForumTab({ courseId }) {
  const { token, user } = useAuth();
  const [threads, setThreads] = useState([]);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [active, setActive] = useState(null);
  const [replies, setReplies] = useState([]);
  const [replyText, setReplyText] = useState("");

  const canPost = ["student", "professor", "admin"].includes(user.role);
  const canResolve = user.role === "professor" || user.role === "admin";

  const loadThreads = async () => {
    const t = await listThreads(token, courseId);
    // newest first
    setThreads([...t].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)));
  };

  const loadReplies = async (threadId) => {
    const r = await listReplies(token, threadId);
    setReplies(r);
  };

  useEffect(() => {
    // join room and listen to live events
    socket.emit("join-room", courseId);

    const onNewThread = (t) => {
      if (String(t.courseId) === String(courseId)) {
        setThreads((prev) => [t, ...prev]);
      }
    };

    const onNewReply = (r) => {
      if (active && String(r.threadId) === String(active._id)) {
        setReplies((prev) => [...prev, r]);
      }
    };

    socket.on("new-thread", onNewThread);
    socket.on("new-reply", onNewReply);

    loadThreads();

    return () => {
      socket.off("new-thread", onNewThread);
      socket.off("new-reply", onNewReply);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, active?._id]); // reattach reply listener when active changes

  const postThread = async () => {
    if (!title.trim() || !text.trim()) return;
    await createThread(token, { courseId, title: title.trim(), message: text.trim() });
    setTitle("");
    setText("");
    // list will update via socket too, but refresh to be safe
    await loadThreads();
  };

  const openThread = async (t) => {
    setActive(t);
    await loadReplies(t._id);
  };

  const send = async () => {
    if (!replyText.trim() || !active) return;
    await sendReply(token, { threadId: active._id, message: replyText.trim() });
    setReplyText("");
    // replies will also append via socket if you're viewing the same thread,
    // but refresh to keep ordering consistent.
    await loadReplies(active._id);
  };

  const markResolved = async () => {
    if (!active) return;
    await resolveThread(token, active._id);
    setActive((a) => (a ? { ...a, isResolved: true } : a));
    await loadThreads();
  };

  return (
    <div className="grid grid-2">
      {/* Left: Thread list + composer */}
      <div className="card">
        <h3>Threads</h3>

        {canPost && (
          <>
            <div className="form-row">
              <input
                placeholder="Thread title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <button className="btn btn-primary" onClick={postThread}>
                Post
              </button>
            </div>
            <textarea
              rows="3"
              placeholder="Describe your doubt..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </>
        )}

        <ul className="list mt-3">
          {threads.map((t) => (
            <li
              key={t._id}
              className="list-item"
              onClick={() => openThread(t)}
              style={{
                cursor: "pointer",
                borderColor: active && active._id === t._id ? "var(--primary)" : "var(--border)",
              }}
            >
              <div>
                <strong>{t.title}</strong>{" "}
                {t.isResolved ? (
                  <span className="badge" style={{ background: "#dcfce7", border: "1px solid #bbf7d0" }}>
                    Resolved
                  </span>
                ) : (
                  <span className="badge">Open</span>
                )}
                <p className="mb-0">{t.message}</p>
              </div>
              <span style={{ fontSize: 12, color: "var(--muted)" }}>
                {new Date(t.createdAt).toLocaleString()}
              </span>
            </li>
          ))}

          {threads.length === 0 && <p className="mt-3">No threads yet. Be the first to ask!</p>}
        </ul>
      </div>

      {/* Right: Active thread + replies */}
      <div className="card">
        <h3>Conversation</h3>

        {!active && <p>Select a thread from the left to view replies.</p>}

        {active && (
          <>
            <div className="flex justify-between items-center">
              <div>
                <strong>{active.title}</strong>{" "}
                {active.isResolved ? (
                  <span className="badge" style={{ background: "#dcfce7", border: "1px solid #bbf7d0" }}>
                    Resolved
                  </span>
                ) : (
                  <span className="badge">Open</span>
                )}
                <p className="mb-0" style={{ marginTop: 6 }}>{active.message}</p>
              </div>

              {canResolve && !active.isResolved && (
                <button className="btn btn-success" onClick={markResolved}>
                  Mark Resolved
                </button>
              )}
            </div>

            <div className="chat-window mt-3">
              {replies.map((r) => (
                <div key={r._id} className="chat-row">
                  <div
                    className={`chat-bubble ${
                      String(r.userId) === String(user.id) || r.userId?._id === user.id ? "user" : "bot"
                    }`}
                  >
                    {r.message}
                    <div style={{ fontSize: 11, opacity: 0.7, marginTop: 6 }}>
                      {new Date(r.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}

              {replies.length === 0 && <p>No replies yet.</p>}
            </div>

            {canPost && !active.isResolved && (
              <div className="mt-3">
                <div className="form-row">
                  <input
                    placeholder="Write a reply…"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                  />
                  <button className="btn btn-primary" onClick={send}>
                    Send
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
