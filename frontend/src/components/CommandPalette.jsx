import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
    Archive,
    BarChart3,
    FileText,
    Keyboard,
    Maximize2,
    Moon,
    Pin,
    Plus,
    Sparkles,
    Sun,
    Trash2,
} from "lucide-react";
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut,
} from "./ui/command";
import { useApp } from "../context/AppContext";
import { api } from "../lib/api";
import { modKey, noteTitle, relativeTime } from "../lib/format";

export const CommandPalette = () => {
    const {
        paletteOpen,
        setPaletteOpen,
        selectNote,
        createNote,
        setView,
        setFocusMode,
        focusMode,
        setShortcutsOpen,
        revealStats,
        setAiOpen,
        activeId,
    } = useApp();
    const { theme, setTheme } = useTheme();
    const [allNotes, setAllNotes] = useState([]);

    useEffect(() => {
        if (!paletteOpen) return undefined;
        let cancelled = false;
        (async () => {
            try {
                const data = await api.notes.list({ view: "all", sort: "updated" });
                if (!cancelled) setAllNotes(data);
            } catch {
                /* ignore */
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [paletteOpen]);

    const run = (fn) => () => {
        setPaletteOpen(false);
        setTimeout(fn, 60);
    };

    return (
        <CommandDialog open={paletteOpen} onOpenChange={setPaletteOpen}>
            <CommandInput placeholder="Search notes or run a command…" data-testid="palette-input" />
            <CommandList className="max-h-[420px]">
                <CommandEmpty>Nothing found.</CommandEmpty>

                <CommandGroup heading="Actions">
                    <CommandItem onSelect={run(() => createNote())} data-testid="palette-new-note">
                        <Plus className="mr-2 h-4 w-4" /> New note
                        <CommandShortcut>{modKey()}⇧N</CommandShortcut>
                    </CommandItem>
                    {activeId && (
                        <CommandItem onSelect={run(() => setAiOpen(true))}>
                            <Sparkles className="mr-2 h-4 w-4" /> Open AI assistant
                            <CommandShortcut>{modKey()}E</CommandShortcut>
                        </CommandItem>
                    )}
                    <CommandItem onSelect={run(() => setFocusMode(!focusMode))}>
                        <Maximize2 className="mr-2 h-4 w-4" />
                        {focusMode ? "Leave focus mode" : "Enter focus mode"}
                    </CommandItem>
                    <CommandItem
                        onSelect={run(() => setTheme(theme === "dark" ? "light" : "dark"))}
                        data-testid="palette-toggle-theme"
                    >
                        {theme === "dark" ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                        Switch to {theme === "dark" ? "light" : "dark"} mode
                    </CommandItem>
                    <CommandItem onSelect={run(revealStats)} data-testid="palette-stats">
                        <BarChart3 className="mr-2 h-4 w-4" /> Writing stats
                    </CommandItem>
                    <CommandItem onSelect={run(() => setShortcutsOpen(true))}>
                        <Keyboard className="mr-2 h-4 w-4" /> Keyboard shortcuts
                    </CommandItem>
                </CommandGroup>

                <CommandSeparator />

                <CommandGroup heading="Go to">
                    <CommandItem onSelect={run(() => setView({ type: "all", id: null, label: "All notes" }))}>
                        <FileText className="mr-2 h-4 w-4" /> All notes
                    </CommandItem>
                    <CommandItem onSelect={run(() => setView({ type: "pinned", id: null, label: "Pinned" }))}>
                        <Pin className="mr-2 h-4 w-4" /> Pinned
                    </CommandItem>
                    <CommandItem onSelect={run(() => setView({ type: "archive", id: null, label: "Archive" }))}>
                        <Archive className="mr-2 h-4 w-4" /> Archive
                    </CommandItem>
                    <CommandItem onSelect={run(() => setView({ type: "trash", id: null, label: "Trash" }))}>
                        <Trash2 className="mr-2 h-4 w-4" /> Trash
                    </CommandItem>
                </CommandGroup>

                {allNotes.length > 0 && (
                    <>
                        <CommandSeparator />
                        <CommandGroup heading="Notes">
                            {allNotes.slice(0, 40).map((note) => (
                                <CommandItem
                                    key={note.id}
                                    value={`${noteTitle(note)} ${note.snippet || ""}`}
                                    onSelect={run(() => selectNote(note.id))}
                                    data-testid={`palette-note-${note.id}`}
                                >
                                    <FileText className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                                    <span className="truncate">{noteTitle(note)}</span>
                                    <CommandShortcut>{relativeTime(note.updated_at)}</CommandShortcut>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </>
                )}
            </CommandList>
        </CommandDialog>
    );
};
