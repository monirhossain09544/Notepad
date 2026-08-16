import React from "react";
import { FileText, Inbox, PenLine, Search, Sparkles, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { useApp } from "../context/AppContext";
import { modKey } from "../lib/format";

export const EmptyList = ({ view, query }) => {
    if (query) {
        return (
            <div className="flex flex-col items-center px-4 py-14 text-center">
                <Search className="h-7 w-7 text-muted-foreground" />
                <p className="mt-3 text-sm font-medium">No notes match “{query}”</p>
                <p className="mt-1 text-xs text-muted-foreground">
                    Try a shorter word, or search inside a different view.
                </p>
            </div>
        );
    }
    const copy = {
        trash: {
            Icon: Trash2,
            title: "Trash is empty",
            body: "Deleted notes rest here for as long as you like.",
        },
        archive: {
            Icon: Inbox,
            title: "Nothing archived",
            body: "Archive notes you want out of the way but not gone.",
        },
        pinned: {
            Icon: FileText,
            title: "No pinned notes",
            body: "Pin a note to keep it at the top of your list.",
        },
    }[view.type] || {
        Icon: FileText,
        title: "No notes here yet",
        body: "Create one and it will show up instantly.",
    };
    const { Icon, title, body } = copy;
    return (
        <div className="flex flex-col items-center px-4 py-14 text-center">
            <Icon className="h-7 w-7 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium">{title}</p>
            <p className="mt-1 text-xs text-muted-foreground">{body}</p>
        </div>
    );
};

export const EmptyEditor = () => {
    const { createNote, createWelcomeNote, notes, view } = useApp();
    const firstRun = notes.length === 0 && view.type === "all";

    return (
        <div className="paper-wash flex h-full items-center justify-center px-6">
            <div className="w-full max-w-md rounded-[var(--radius-lg)] border border-border bg-[hsl(var(--surface-1))] p-8 text-center shadow-[var(--shadow-sm)]">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-[14px] bg-[hsl(var(--surface-3))]">
                    <PenLine className="h-5 w-5 text-foreground" />
                </span>
                <h2
                    className="mt-5 text-xl font-semibold tracking-[-0.02em]"
                    style={{ fontFamily: "var(--font-editor)" }}
                >
                    {firstRun ? "A blank page, all yours" : "Nothing open"}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {firstRun
                        ? "Write freely with rich formatting, organise with folders and tags, and let the assistant help when you get stuck."
                        : "Pick a note from the list, or start something new."}
                </p>
                <div className="mt-6 flex flex-col gap-2">
                    <Button
                        onClick={() => createNote()}
                        data-testid="empty-create-note-btn"
                        className="h-10 rounded-[12px] bg-foreground text-background hover:bg-foreground/90"
                    >
                        Create your first note
                    </Button>
                    {firstRun && (
                        <Button
                            variant="outline"
                            onClick={createWelcomeNote}
                            data-testid="welcome-note-btn"
                            className="h-10 rounded-[12px] border-border"
                        >
                            <Sparkles className="mr-2 h-3.5 w-3.5" /> Add a guided welcome note
                        </Button>
                    )}
                </div>
                <p className="mt-5 text-[11px] text-muted-foreground">
                    Tip: press {modKey()}K any time to jump between notes
                </p>
            </div>
        </div>
    );
};
