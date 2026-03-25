import { useEffect, useState } from "react";

interface Injury {
  id: number;
  name: string;
  position: string;
  injury: string;
  status: string;
  timeline: string;
  updated_at?: string;
}

const STATUS_COLORS: Record<string, string> = {
  LTIR: "bg-red-500/20 text-red-400",
  IR: "bg-red-500/20 text-red-400",
  "Week-to-Week": "bg-orange-500/20 text-orange-400",
  Out: "bg-red-500/20 text-red-400",
  "Day-to-Day": "bg-yellow-500/20 text-yellow-400",
  Questionable: "bg-yellow-500/20 text-yellow-400",
};

const STATUSES = ["Day-to-Day", "IR", "LTIR", "Week-to-Week", "Out", "Questionable"];
const POSITIONS = ["C", "LW", "RW", "D", "G"];

const EMPTY_FORM = { name: "", position: "C", injury: "", status: "Day-to-Day", timeline: "" };

export default function InjuryReport() {
  const [injuries, setInjuries] = useState<Injury[]>([]);
  const [disclaimer, setDisclaimer] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [adding, setAdding] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  async function loadInjuries() {
    try {
      const data = await fetch("/api/injuries").then((r) => r.json());
      setInjuries(data.injuries || []);
      setDisclaimer(data.disclaimer || "");
    } catch {}
  }

  useEffect(() => { loadInjuries(); }, []);

  function startEdit(inj: Injury) {
    setEditingId(inj.id);
    setEditForm({ name: inj.name, position: inj.position, injury: inj.injury, status: inj.status, timeline: inj.timeline });
    setAdding(false);
  }

  async function saveEdit() {
    if (!editingId || saving) return;
    setSaving(true);
    try {
      await fetch(`/api/injuries/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      setEditingId(null);
      await loadInjuries();
    } catch {}
    setSaving(false);
  }

  async function deleteInjury(id: number) {
    try {
      await fetch(`/api/injuries/${id}`, { method: "DELETE" });
      await loadInjuries();
    } catch {}
  }

  async function addInjury() {
    if (!addForm.name || !addForm.injury || saving) return;
    setSaving(true);
    try {
      await fetch("/api/injuries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      setAdding(false);
      setAddForm(EMPTY_FORM);
      await loadInjuries();
    } catch {}
    setSaving(false);
  }

  return (
    <div className="bg-avs-dark rounded-xl p-6 card-glow">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <span className="w-1 h-6 bg-red-500 rounded-full" />
          Injury Report
        </h2>
        <div className="flex items-center gap-2">
          {!adding && (
            <button
              onClick={() => { setAdding(true); setEditingId(null); }}
              className="text-xs bg-avs-burgundy hover:bg-avs-burgundy/80 text-white px-2.5 py-1 rounded-lg font-semibold transition-colors"
            >
              + Add
            </button>
          )}
        </div>
      </div>

      {/* Add form */}
      {adding && (
        <div className="bg-avs-darker rounded-lg p-3 mb-3 space-y-2">
          <div className="grid grid-cols-5 gap-2">
            <input
              type="text" placeholder="Player Name" value={addForm.name}
              onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
              className="col-span-2 bg-avs-dark text-white text-xs rounded px-2 py-1.5 border border-white/10 focus:border-avs-burgundy focus:outline-none"
            />
            <select value={addForm.position} onChange={(e) => setAddForm({ ...addForm, position: e.target.value })}
              className="bg-avs-dark text-white text-xs rounded px-2 py-1.5 border border-white/10 focus:outline-none">
              {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <input
              type="text" placeholder="Injury" value={addForm.injury}
              onChange={(e) => setAddForm({ ...addForm, injury: e.target.value })}
              className="bg-avs-dark text-white text-xs rounded px-2 py-1.5 border border-white/10 focus:border-avs-burgundy focus:outline-none"
            />
            <select value={addForm.status} onChange={(e) => setAddForm({ ...addForm, status: e.target.value })}
              className="bg-avs-dark text-white text-xs rounded px-2 py-1.5 border border-white/10 focus:outline-none">
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex gap-2 items-center">
            <input
              type="text" placeholder="Timeline (e.g. 2-3 weeks)" value={addForm.timeline}
              onChange={(e) => setAddForm({ ...addForm, timeline: e.target.value })}
              className="flex-1 bg-avs-dark text-white text-xs rounded px-2 py-1.5 border border-white/10 focus:border-avs-burgundy focus:outline-none"
            />
            <button onClick={addInjury} disabled={saving || !addForm.name || !addForm.injury}
              className="text-xs bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white px-3 py-1.5 rounded font-semibold">
              {saving ? "..." : "Save"}
            </button>
            <button onClick={() => { setAdding(false); setAddForm(EMPTY_FORM); }}
              className="text-xs text-avs-silver hover:text-white px-2 py-1.5">Cancel</button>
          </div>
        </div>
      )}

      {/* Injury table */}
      {injuries.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-avs-silver text-xs uppercase border-b border-white/10">
                <th className="text-left py-2">Player</th>
                <th className="text-center py-2">Pos</th>
                <th className="text-left py-2">Injury</th>
                <th className="text-center py-2">Status</th>
                <th className="text-center py-2">Timeline</th>
                <th className="w-16"></th>
              </tr>
            </thead>
            <tbody>
              {injuries.map((inj) =>
                editingId === inj.id ? (
                  <tr key={inj.id} className="border-b border-white/5 bg-avs-burgundy/10">
                    <td className="py-2">
                      <input type="text" value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full bg-avs-darker text-white text-xs rounded px-2 py-1 border border-avs-burgundy focus:outline-none" />
                    </td>
                    <td className="text-center">
                      <select value={editForm.position} onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                        className="bg-avs-darker text-white text-xs rounded px-1 py-1 border border-avs-burgundy focus:outline-none">
                        {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </td>
                    <td>
                      <input type="text" value={editForm.injury}
                        onChange={(e) => setEditForm({ ...editForm, injury: e.target.value })}
                        className="w-full bg-avs-darker text-white text-xs rounded px-2 py-1 border border-avs-burgundy focus:outline-none" />
                    </td>
                    <td className="text-center">
                      <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                        className="bg-avs-darker text-white text-xs rounded px-1 py-1 border border-avs-burgundy focus:outline-none">
                        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="text-center">
                      <input type="text" value={editForm.timeline}
                        onChange={(e) => setEditForm({ ...editForm, timeline: e.target.value })}
                        className="w-full bg-avs-darker text-white text-xs rounded px-2 py-1 border border-avs-burgundy focus:outline-none" />
                    </td>
                    <td className="text-right">
                      <button onClick={saveEdit} className="text-green-400 hover:text-green-300 text-xs font-semibold mr-1">Save</button>
                      <button onClick={() => setEditingId(null)} className="text-avs-silver hover:text-white text-xs">Cancel</button>
                    </td>
                  </tr>
                ) : (
                  <tr key={inj.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                    <td className="py-2.5 font-medium">{inj.name}</td>
                    <td className="text-center text-avs-silver">{inj.position}</td>
                    <td className="text-avs-silver">{inj.injury}</td>
                    <td className="text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_COLORS[inj.status] || "bg-avs-darker text-avs-silver"}`}>
                        {inj.status}
                      </span>
                    </td>
                    <td className="text-center text-avs-silver">{inj.timeline}</td>
                    <td className="text-right">
                      <button onClick={() => startEdit(inj)}
                        className="opacity-0 group-hover:opacity-100 text-avs-silver/60 hover:text-white transition-all text-xs mr-1" title="Edit">
                        <svg className="w-3.5 h-3.5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                        </svg>
                      </button>
                      <button onClick={() => deleteInjury(inj.id)}
                        className="opacity-0 group-hover:opacity-100 text-red-400/60 hover:text-red-400 transition-all text-xs" title="Delete">
                        <svg className="w-3.5 h-3.5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-avs-silver text-sm">No injuries to report.</p>
      )}
      {disclaimer && (
        <p className="text-avs-silver/50 text-[10px] mt-3 italic">{disclaimer}</p>
      )}
    </div>
  );
}
