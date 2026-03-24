import type { Page } from "../App";

interface Props {
  page: Page;
  setPage: (p: Page) => void;
  open: boolean;
  setOpen: (o: boolean) => void;
}

const NAV_ITEMS: { id: Page; label: string; icon: string }[] = [
  { id: "main", label: "Overview", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { id: "roster", label: "Roster", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
  { id: "contracts", label: "Contracts & Cap", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  { id: "video", label: "Video Review", icon: "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" },
  { id: "ai", label: "AI Assistant", icon: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" },
];

export default function Sidebar({ page, setPage, open, setOpen }: Props) {
  return (
    <div
      className={`fixed top-0 left-0 h-full bg-avs-dark border-r border-white/10 z-50 transition-all duration-300 flex flex-col ${
        open ? "w-56" : "w-16"
      }`}
    >
      {/* Toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="p-4 hover:bg-white/5 transition-colors flex items-center gap-3"
      >
        <svg className="w-6 h-6 text-avs-silver shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d={open ? "M11 19l-7-7 7-7m8 14l-7-7 7-7" : "M13 5l7 7-7 7M5 5l7 7-7 7"} />
        </svg>
        {open && <span className="text-avs-silver text-sm font-medium">Collapse</span>}
      </button>

      {/* Logo area */}
      <div className={`px-4 py-3 border-b border-white/10 ${open ? "" : "px-3"}`}>
        {open ? (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-avs-burgundy rounded-lg flex items-center justify-center text-white font-bold text-sm">
              COL
            </div>
            <div>
              <div className="text-sm font-bold text-white">Team Analytics</div>
              <div className="text-[10px] text-avs-silver">Colorado Avalanche</div>
            </div>
          </div>
        ) : (
          <div className="w-10 h-8 bg-avs-burgundy rounded-lg flex items-center justify-center text-white font-bold text-[10px] mx-auto">
            COL
          </div>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-4 space-y-1 px-2">
        {NAV_ITEMS.map((item) => {
          const active = page === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                active
                  ? "bg-avs-burgundy text-white shadow-lg shadow-avs-burgundy/20"
                  : "text-avs-silver hover:bg-white/5 hover:text-white"
              }`}
              title={!open ? item.label : undefined}
            >
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
              </svg>
              {open && <span className="text-sm font-medium">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Powered by */}
      {open && (
        <div className="px-4 py-3 border-t border-white/10">
          <div className="text-[10px] text-avs-silver leading-relaxed">
            Powered by <span className="text-red-500 font-semibold">Databricks</span> &middot; Data from NHL Edge API &amp; Puck Pedia
          </div>
        </div>
      )}
    </div>
  );
}
