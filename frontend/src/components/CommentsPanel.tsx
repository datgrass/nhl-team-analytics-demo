import { useEffect, useState, useRef } from "react";

interface Comment {
  id: number;
  game_id: number;
  event_id: number;
  event_type: string;
  event_description: string;
  comment_text: string;
  author: string;
  created_at: string;
}

interface Props {
  gameId: number | null;
  selectedEventId: number | null;
  selectedEventType: string;
  selectedEventDesc: string;
  onSelectEvent?: (eventId: number) => void;
  onCommentsChange?: (counts: Record<number, number>) => void;
}

const EVENT_ICONS: Record<string, string> = {
  goal: "\u{1F6A8}",
  "shot-on-goal": "\u{1F3AF}",
  hit: "\u{1F4A5}",
  penalty: "\u{1F6D1}",
  takeaway: "\u{1F44D}",
  giveaway: "\u{274C}",
  "blocked-shot": "\u{1F6E1}\uFE0F",
};

export default function CommentsPanel({ gameId, selectedEventId, selectedEventType, selectedEventDesc, onSelectEvent, onCommentsChange }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [input, setInput] = useState("");
  const [author, setAuthor] = useState("Coach");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const editRef = useRef<HTMLInputElement>(null);

  function buildCounts(list: Comment[]) {
    const counts: Record<number, number> = {};
    for (const c of list) {
      counts[c.event_id] = (counts[c.event_id] || 0) + 1;
    }
    return counts;
  }

  async function loadComments() {
    if (!gameId) return;
    try {
      const data = await fetch(`/api/comments/${gameId}`).then((r) => r.json());
      const list = data.comments || [];
      setComments(list);
      onCommentsChange?.(buildCounts(list));
    } catch {}
  }

  useEffect(() => {
    loadComments();
  }, [gameId]);

  useEffect(() => {
    if (!editingId) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(false), 2000);
      return () => clearTimeout(t);
    }
  }, [success]);

  useEffect(() => {
    if (editingId && editRef.current) editRef.current.focus();
  }, [editingId]);

  async function addComment() {
    if (!input.trim() || !gameId || !selectedEventId || sending) return;
    setSending(true);
    setError(null);
    try {
      const resp = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game_id: gameId,
          event_id: selectedEventId,
          event_type: selectedEventType,
          event_description: selectedEventDesc,
          comment_text: input.trim(),
          author: author || "Coach",
        }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ detail: "Unknown error" }));
        throw new Error(err.detail || `Error ${resp.status}`);
      }
      setInput("");
      setSuccess(true);
      await loadComments();
    } catch (err: any) {
      setError(err.message || "Failed to add comment");
    }
    setSending(false);
  }

  async function deleteComment(id: number) {
    try {
      await fetch(`/api/comments/${id}`, { method: "DELETE" });
      await loadComments();
    } catch {}
  }

  async function saveEdit(id: number) {
    if (!editText.trim()) return;
    try {
      const resp = await fetch(`/api/comments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment_text: editText.trim() }),
      });
      if (resp.ok) {
        setEditingId(null);
        setEditText("");
        await loadComments();
      }
    } catch {}
  }

  function startEdit(c: Comment) {
    setEditingId(c.id);
    setEditText(c.comment_text);
  }

  return (
    <div className="bg-avs-dark rounded-xl p-5 card-glow flex flex-col" style={{ maxHeight: 500 }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm text-avs-silver uppercase tracking-wider flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
          </svg>
          Coach Notes
          {comments.length > 0 && (
            <span className="text-[10px] bg-avs-burgundy/30 text-avs-burgundy px-1.5 py-0.5 rounded-full font-bold">
              {comments.length}
            </span>
          )}
        </h3>
        <span className="text-[10px] text-avs-silver/50 bg-avs-darker px-2 py-0.5 rounded-full">
          Lakebase
        </span>
      </div>

      {/* Comment list */}
      <div className="flex-1 overflow-y-auto space-y-2 mb-3 min-h-[100px]">
        {comments.length === 0 && (
          <p className="text-avs-silver/50 text-xs text-center py-6">
            Select an event and add a note.
          </p>
        )}
        {[...comments].reverse().map((c) => (
          <div
            key={c.id}
            onClick={() => onSelectEvent?.(c.event_id)}
            className={`bg-avs-darker rounded-lg px-3 py-2 group cursor-pointer transition-all hover:bg-white/5 ${
              selectedEventId === c.event_id ? "ring-1 ring-avs-burgundy/50" : ""
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs">{EVENT_ICONS[c.event_type] || "\u2022"}</span>
              <span className="text-[10px] text-avs-silver flex-1 truncate">
                {c.event_description || c.event_type}
              </span>
              <span className="text-[10px] text-avs-silver/40">
                {new Date(c.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); startEdit(c); }}
                className="opacity-0 group-hover:opacity-100 text-avs-silver/60 hover:text-white transition-all text-xs"
                title="Edit"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                </svg>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); deleteComment(c.id); }}
                className="opacity-0 group-hover:opacity-100 text-red-400/60 hover:text-red-400 transition-all text-xs"
                title="Delete"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {editingId === c.id ? (
              <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                <input
                  ref={editRef}
                  type="text"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEdit(c.id);
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  className="flex-1 bg-avs-dark text-white text-sm rounded px-2 py-1 border border-avs-burgundy focus:outline-none"
                />
                <button
                  onClick={() => saveEdit(c.id)}
                  className="text-green-400 hover:text-green-300 text-xs font-semibold px-1.5"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="text-avs-silver hover:text-white text-xs px-1"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <p className="text-sm text-white">{c.comment_text}</p>
            )}
            <div className="text-[10px] text-avs-silver/40 mt-1">{c.author}</div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Status messages */}
      {success && (
        <div className="text-green-400 text-xs text-center py-1 mb-2 bg-green-400/10 rounded-lg">
          Note added
        </div>
      )}
      {error && (
        <div className="text-red-400 text-xs text-center py-1 mb-2 bg-red-400/10 rounded-lg">
          {error}
        </div>
      )}

      {/* Input area */}
      <div className="border-t border-white/10 pt-3 space-y-2">
        {selectedEventId ? (
          <>
            <div className="text-[10px] text-avs-silver bg-avs-darker rounded px-2 py-1 truncate">
              {EVENT_ICONS[selectedEventType] || ""} {selectedEventDesc || "Selected event"}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Name"
                className="w-20 bg-avs-darker text-white text-xs rounded-lg px-2 py-2 border border-white/10 focus:border-avs-burgundy focus:outline-none"
              />
              <input
                type="text"
                value={input}
                onChange={(e) => { setInput(e.target.value); setError(null); }}
                onKeyDown={(e) => e.key === "Enter" && addComment()}
                placeholder="Add a note..."
                disabled={sending}
                className="flex-1 bg-avs-darker text-white text-xs rounded-lg px-3 py-2 border border-white/10 focus:border-avs-burgundy focus:outline-none disabled:opacity-50"
              />
              <button
                onClick={addComment}
                disabled={sending || !input.trim()}
                className="bg-avs-burgundy hover:bg-avs-burgundy/80 disabled:opacity-50 text-white text-xs rounded-lg px-3 py-2 font-semibold transition-colors"
              >
                {sending ? "..." : "Add"}
              </button>
            </div>
          </>
        ) : (
          <p className="text-avs-silver/50 text-xs text-center">Click an event to add a note</p>
        )}
      </div>
    </div>
  );
}
