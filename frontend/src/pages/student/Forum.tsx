import React, { useEffect, useState } from "react";
import forumService from "../../services/forumService";
import socket from "../../socket/socket";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";

type Thread = {
  _id: string;
  title: string;
  body: string;
  createdBy: { name?: string; _id?: string } | string;
  courseId: string;
  createdAt?: string;
  isResolved?: boolean;
};

type Reply = {
  _id: string;
  body: string;
  userId: { name?: string } | string;
  threadId: string;
  createdAt?: string;
};

export default function Forum() {
  const [courseId] = useState(() => {
    // derive courseId from route or context; replace as needed
    const params = new URLSearchParams(window.location.search);
    return params.get("courseId") || "defaultCourseId";
  });

  const [threads, setThreads] = useState<Thread[]>([]);
  const [selected, setSelected] = useState<Thread | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [replies, setReplies] = useState<Record<string, Reply[]>>({});
  const [replyBody, setReplyBody] = useState("");

  useEffect(() => {
    if (!courseId) return;
    // initial load
    forumService.listThreads({ courseId }).then((res) => setThreads(res.data || []));

    // join room and listen for real-time events
    socket.emit("join", courseId);
    socket.on("new-thread", (t: Thread) => {
      setThreads((s) => [t, ...s]);
    });
    socket.on("new-reply", (r: Reply) => {
      setReplies((prev) => {
        const list = prev[r.threadId] ? [...prev[r.threadId], r] : [r];
        return { ...prev, [r.threadId]: list };
      });
    });

    return () => {
      socket.emit("leave", courseId);
      socket.off("new-thread");
      socket.off("new-reply");
    };
  }, [courseId]);

  useEffect(() => {
    if (!selected) return;
    // load replies when opening a thread (forumService should provide endpoint)
    forumService.listReplies(selected._id).then((res) => {
      setReplies((p) => ({ ...p, [selected._id]: res.data || [] }));
    });
  }, [selected]);

  async function handleCreateThread(e?: React.FormEvent) {
    e?.preventDefault();
    if (!newTitle.trim() || !newBody.trim()) return;
    const payload = { title: newTitle, body: newBody, courseId };
    const res = await forumService.createThread(payload);
    // socket will push the new thread; still clear inputs
    setNewTitle("");
    setNewBody("");
    // optimistic add if you prefer:
    if (res?.data) setThreads((s) => [res.data, ...s]);
  }

  async function handleReply(threadId: string) {
    if (!replyBody.trim()) return;
    const res = await forumService.replyThread({ threadId, body: replyBody });
    setReplyBody("");
    if (res?.data) {
      setReplies((prev) => {
        const list = prev[threadId] ? [...prev[threadId], res.data] : [res.data];
        return { ...prev, [threadId]: list };
      });
    }
  }

  async function handleResolve(threadId: string) {
    const res = await forumService.resolveThread(threadId);
    if (res?.data) {
      setThreads((t) => t.map((x) => (x._id === threadId ? res.data : x)));
      if (selected && selected._id === threadId) setSelected(res.data);
    }
  }

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Course Forum</h2>

      <Card className="mb-6 p-4">
        <form onSubmit={handleCreateThread} className="space-y-3">
          <Input
            placeholder="Thread title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <Textarea
            placeholder="Describe your question or discussion"
            value={newBody}
            onChange={(e) => setNewBody(e.target.value)}
          />
          <div className="flex gap-2 justify-end">
            <Button type="submit">Create Thread</Button>
          </div>
        </form>
      </Card>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-1 space-y-3">
          {threads.map((thread) => (
            <Card
              key={thread._id}
              className={`p-3 cursor-pointer ${selected?._id === thread._id ? "ring-2" : ""}`}
              onClick={() => setSelected(thread)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium">{thread.title}</div>
                  <div className="text-sm text-muted-foreground">{(thread.createdBy as any)?.name || "Unknown"}</div>
                </div>
                <div className="text-xs">{thread.isResolved ? "Resolved" : "Open"}</div>
              </div>
            </Card>
          ))}
        </div>

        <div className="md:col-span-2">
          {selected ? (
            <Card className="p-4">
              <div className="mb-3">
                <div className="text-xl font-semibold">{selected.title}</div>
                <div className="text-sm text-muted-foreground mb-2">{(selected.createdBy as any)?.name}</div>
                <div className="mb-3">{selected.body}</div>
                <div className="flex gap-2">
                  {!selected.isResolved && <Button onClick={() => handleResolve(selected._id)}>Resolve</Button>}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Replies</h4>
                {(replies[selected._id] || []).map((r) => (
                  <Card key={r._id} className="p-3 mb-2">
                    <div className="text-sm text-muted-foreground">{(r.userId as any)?.name}</div>
                    <div>{r.body}</div>
                  </Card>
                ))}

                <div className="mt-3 space-y-2">
                  <Textarea value={replyBody} onChange={(e) => setReplyBody(e.target.value)} placeholder="Write a reply..." />
                  <div className="flex justify-end">
                    <Button onClick={() => handleReply(selected._id)}>Reply</Button>
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-6 text-center text-muted-foreground">Select a thread to view details</Card>
          )}
        </div>
      </div>
    </div>
  );
}