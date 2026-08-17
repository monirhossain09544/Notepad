import React from "react";
import { BarChart3, Keyboard } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "./ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { useApp } from "../context/AppContext";
import { modKey } from "../lib/format";

const Kbd = ({ children }) => (
    <kbd className="rounded-[6px] border border-border bg-[hsl(var(--surface-2))] px-1.5 py-0.5 font-mono text-[11px] font-medium text-foreground">
        {children}
    </kbd>
);

export const ShortcutsDialog = () => {
    const { shortcutsOpen, setShortcutsOpen } = useApp();
    const mod = modKey();
    const groups = [
        {
            title: "Everywhere",
            items: [
                { keys: [mod, "K"], label: "Command palette / quick find" },
                { keys: [mod, "⇧", "N"], label: "New note" },
                { keys: [mod, "S"], label: "Save right now" },
                { keys: [mod, "E"], label: "Toggle the assistant" },
                { keys: [mod, "⇧", "F"], label: "Focus mode" },
                { keys: [mod, "/"], label: "This shortcut list" },
                { keys: ["Esc"], label: "Leave focus mode" },
            ],
        },
        {
            title: "While writing",
            items: [
                { keys: [mod, "B"], label: "Bold" },
                { keys: [mod, "I"], label: "Italic" },
                { keys: [mod, "U"], label: "Underline" },
                { keys: [mod, "⇧", "X"], label: "Strikethrough" },
                { keys: [mod, "Z"], label: "Undo" },
                { keys: ["#", "Space"], label: "Heading (## for H2)" },
                { keys: ["-", "Space"], label: "Bullet list" },
                { keys: ["1.", "Space"], label: "Numbered list" },
                { keys: [">", "Space"], label: "Quote" },
                { keys: ["```"], label: "Code block" },
            ],
        },
    ];

    return (
        <Dialog open={shortcutsOpen} onOpenChange={setShortcutsOpen}>
            <DialogContent className="max-w-lg bg-popover" data-testid="shortcuts-dialog">
                <DialogHeader>
                    <DialogTitle className="text-sm font-medium">Keyboard shortcuts</DialogTitle>
                    <DialogDescription className="text-xs">
                        Everything you need to stay on the keyboard.
                    </DialogDescription>
                </DialogHeader>
                <div className="thin-scroll max-h-[60vh] space-y-5 overflow-y-auto pr-1">
                    {groups.map((group) => (
                        <div key={group.title}>
                            <p className="pb-1 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                                {group.title}
                            </p>
                            <div>
                                {group.items.map((item, i) => (
                                    <div
                                        key={item.label}
                                        className={`flex items-center justify-between gap-3 py-2 ${
                                            i > 0 ? "border-t border-border" : ""
                                        }`}
                                    >
                                        <span className="text-sm">{item.label}</span>
                                        <span className="flex shrink-0 items-center gap-1">
                                            {item.keys.map((k, ki) => (
                                                <Kbd key={ki}>{k}</Kbd>
                                            ))}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export const ShortcutsButton = () => {
    const { setShortcutsOpen } = useApp();
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <button
                    type="button"
                    aria-label="Keyboard shortcuts"
                    data-testid="open-shortcuts-btn"
                    onClick={() => setShortcutsOpen(true)}
                    className="grid h-8 w-8 place-items-center rounded-[9px] text-muted-foreground transition-colors duration-150 hover:bg-[hsl(var(--surface-2))] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--surface-1))]"
                >
                    <Keyboard className="h-4 w-4" />
                </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
                Keyboard shortcuts
            </TooltipContent>
        </Tooltip>
    );
};

const StatRow = ({ label, value, muted, first }) => (
    <div
        className={`flex items-center justify-between py-2 ${
            first ? "" : "border-t border-border"
        }`}
    >
        <span className="text-sm text-foreground">{label}</span>
        <span
            className={`text-sm font-medium tabular-nums ${
                muted ? "text-muted-foreground" : "text-foreground"
            }`}
        >
            {value}
        </span>
    </div>
);

export const StatsPopover = () => {
    const { statsOpen, setStatsOpen, stats, folders, tags } = useApp();

    const words = stats.words || 0;
    const minutes = Math.max(1, Math.round(words / 200));
    const active = stats.all || 0;
    const archived = stats.archive || 0;
    const trashed = stats.trash || 0;
    const totalForBar = active + archived + trashed;
    const pct = (n) => (totalForBar ? `${(n / totalForBar) * 100}%` : "0%");

    return (
        <Popover open={statsOpen} onOpenChange={setStatsOpen}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                        <button
                            type="button"
                            aria-label="Writing stats"
                            data-testid="open-stats-btn"
                            className="grid h-8 w-8 place-items-center rounded-[9px] text-muted-foreground transition-colors duration-150 hover:bg-[hsl(var(--surface-2))] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--surface-1))] data-[state=open]:bg-[hsl(var(--surface-2))] data-[state=open]:text-foreground"
                        >
                            <BarChart3 className="h-4 w-4" />
                        </button>
                    </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                    Writing stats
                </TooltipContent>
            </Tooltip>

            <PopoverContent
                side="top"
                align="start"
                sideOffset={10}
                data-testid="stats-dialog"
                className="w-[320px] rounded-[var(--radius-lg)] border-border bg-popover p-4 shadow-[var(--shadow-md)]"
            >
                <p className="text-sm font-medium">Your writing</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                    A quick look at this workspace.
                </p>

                <div className="mt-3.5 rounded-[var(--radius-md)] bg-[hsl(var(--surface-2))] px-4 py-3">
                    <p
                        className="text-[40px] font-semibold leading-none tracking-[-0.02em] tabular-nums"
                        style={{ fontFamily: "var(--font-editor)" }}
                        data-testid="stats-words"
                    >
                        {words.toLocaleString()}
                    </p>
                    <p className="mt-1.5 text-xs text-muted-foreground">Words written</p>
                    <div className="mt-2.5 flex items-center justify-between border-t border-border pt-2 text-xs text-muted-foreground">
                        <span>Roughly</span>
                        <span className="tabular-nums">{minutes} min of reading</span>
                    </div>
                </div>

                <div className="mt-3.5">
                    <StatRow first label="Active notes" value={active} />
                    <StatRow label="Pinned" value={stats.pinned || 0} muted={!stats.pinned} />
                    <StatRow label="Archived" value={archived} muted={!archived} />
                    <StatRow label="In trash" value={trashed} muted={!trashed} />
                    <StatRow label="Folders" value={folders.length} muted={!folders.length} />
                    <StatRow label="Tags" value={tags.length} muted={!tags.length} />
                </div>

                {totalForBar > 0 && (
                    <div className="mt-3.5">
                        <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-[hsl(var(--surface-3))]">
                            <span
                                className="h-full bg-[hsl(var(--accent)/0.75)]"
                                style={{ width: pct(active) }}
                            />
                            <span
                                className="h-full bg-[hsl(var(--muted-foreground)/0.35)]"
                                style={{ width: pct(archived) }}
                            />
                            <span
                                className="h-full bg-[hsl(var(--destructive)/0.45)]"
                                style={{ width: pct(trashed) }}
                            />
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                            <span className="inline-flex items-center gap-1.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--accent)/0.75)]" />
                                Active
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--muted-foreground)/0.35)]" />
                                Archived
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--destructive)/0.45)]" />
                                Trash
                            </span>
                        </div>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
};
