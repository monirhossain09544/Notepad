import React from "react";
import { Archive, FileText, Pin, Trash2, Type } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { useApp } from "../context/AppContext";
import { modKey } from "../lib/format";

const Kbd = ({ children }) => (
    <kbd className="rounded-[6px] border border-border bg-[hsl(var(--surface-2))] px-1.5 py-0.5 text-[11px] font-medium text-foreground">
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
                { keys: [mod, "E"], label: "Toggle AI assistant" },
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
                    <DialogTitle>Keyboard shortcuts</DialogTitle>
                    <DialogDescription>Everything you need to stay on the keyboard.</DialogDescription>
                </DialogHeader>
                <div className="thin-scroll max-h-[60vh] space-y-5 overflow-y-auto pr-1">
                    {groups.map((group) => (
                        <div key={group.title}>
                            <p className="pb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                                {group.title}
                            </p>
                            <div className="space-y-1.5">
                                {group.items.map((item) => (
                                    <div
                                        key={item.label}
                                        className="flex items-center justify-between gap-3 rounded-[10px] px-2 py-1.5 hover:bg-[hsl(var(--surface-2))]"
                                    >
                                        <span className="text-sm">{item.label}</span>
                                        <span className="flex shrink-0 items-center gap-1">
                                            {item.keys.map((k, i) => (
                                                <Kbd key={i}>{k}</Kbd>
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

const StatCard = ({ Icon, label, value }) => (
    <div className="rounded-[var(--radius-md)] border border-border bg-[hsl(var(--surface-1))] p-3">
        <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
            <Icon className="h-3.5 w-3.5" /> {label}
        </p>
        <p className="mt-1.5 text-2xl font-semibold tracking-[-0.02em]">{value}</p>
    </div>
);

export const StatsDialog = () => {
    const { statsOpen, setStatsOpen, stats, folders, tags } = useApp();
    return (
        <Dialog open={statsOpen} onOpenChange={setStatsOpen}>
            <DialogContent className="max-w-md bg-popover" data-testid="stats-dialog">
                <DialogHeader>
                    <DialogTitle>Your writing</DialogTitle>
                    <DialogDescription>A quick look at everything in this notepad.</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-2">
                    <StatCard Icon={Type} label="Words written" value={stats.words.toLocaleString()} />
                    <StatCard Icon={FileText} label="Active notes" value={stats.all} />
                    <StatCard Icon={Pin} label="Pinned" value={stats.pinned} />
                    <StatCard Icon={Archive} label="Archived" value={stats.archive} />
                    <StatCard Icon={Trash2} label="In trash" value={stats.trash} />
                    <StatCard
                        Icon={FileText}
                        label="Folders / tags"
                        value={`${folders.length} / ${tags.length}`}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
};
