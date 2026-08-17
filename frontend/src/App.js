import React, { useEffect } from "react";
import { ThemeProvider } from "next-themes";
import { Menu, NotebookPen, PanelLeft, Plus, Sparkles, X } from "lucide-react";
import { Toaster } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { Sheet, SheetContent, SheetTitle } from "./components/ui/sheet";
import { Button } from "./components/ui/button";
import { AppProvider, useApp } from "./context/AppContext";
import { Sidebar } from "./components/Sidebar";
import { NoteList } from "./components/NoteList";
import { NoteEditor } from "./components/NoteEditor";
import { AIPanel } from "./components/AIPanel";
import { CommandPalette } from "./components/CommandPalette";
import { ShortcutsDialog } from "./components/Dialogs";
import "./App.css";

function Workspace() {
    const {
        focusMode,
        setFocusMode,
        aiOpen,
        setAiOpen,
        setPaletteOpen,
        setShortcutsOpen,
        createNote,
        flushSave,
        activeId,
        activeNote,
        notes,
        navOpen,
        setNavOpen,
        listOpen,
        setListOpen,
    } = useApp();

    useEffect(() => {
        const onKeyDown = (event) => {
            const mod = event.metaKey || event.ctrlKey;
            const key = (event.key || "").toLowerCase();
            if (mod && key === "k") {
                event.preventDefault();
                setPaletteOpen((open) => !open);
            } else if (mod && key === "s") {
                event.preventDefault();
                flushSave();
            } else if (mod && event.shiftKey && key === "n") {
                event.preventDefault();
                createNote();
            } else if (mod && key === "e") {
                event.preventDefault();
                if (activeId) setAiOpen((open) => !open);
            } else if (mod && event.shiftKey && key === "f") {
                event.preventDefault();
                setFocusMode((value) => !value);
            } else if (mod && key === "/") {
                event.preventDefault();
                setShortcutsOpen((open) => !open);
            } else if (key === "escape") {
                setFocusMode(false);
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [setPaletteOpen, flushSave, createNote, setAiOpen, setFocusMode, setShortcutsOpen, activeId]);

    useEffect(() => {
        const beforeUnload = () => flushSave();
        window.addEventListener("beforeunload", beforeUnload);
        return () => window.removeEventListener("beforeunload", beforeUnload);
    }, [flushSave]);

    return (
        <div className="grain relative flex h-dvh w-full overflow-hidden bg-background text-foreground">
            {!focusMode && (
                <aside className="relative z-[1] hidden h-dvh w-[268px] shrink-0 border-r border-border lg:block">
                    <Sidebar />
                </aside>
            )}

            {!focusMode && (
                <div className="relative z-[1] hidden h-dvh w-[336px] shrink-0 border-r border-border md:block">
                    <NoteList />
                </div>
            )}

            <main className="relative z-[1] flex min-h-0 min-w-0 flex-1 flex-col">
                <div className="flex items-center justify-between gap-2 border-b border-border bg-background px-3 py-2 md:hidden">
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Open menu"
                            data-testid="mobile-menu-btn"
                            onClick={() => setNavOpen(true)}
                            className="h-9 w-9 rounded-[10px]"
                        >
                            <Menu className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Open notes list"
                            data-testid="mobile-list-btn"
                            onClick={() => setListOpen(true)}
                            className="h-9 w-9 rounded-[10px]"
                        >
                            <PanelLeft className="h-4 w-4" />
                        </Button>
                    </div>
                    <span className="flex items-center gap-1.5 text-sm font-semibold">
                        <NotebookPen className="h-4 w-4" /> Notepad
                    </span>
                    <div className="flex items-center gap-1">
                        {activeNote && (
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Open assistant"
                                onClick={() => setAiOpen(true)}
                                className="h-9 w-9 rounded-[10px] text-[hsl(var(--accent))]"
                            >
                                <Sparkles className="h-4 w-4" />
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            aria-label="New note"
                            data-testid="mobile-new-note-btn"
                            onClick={() => createNote()}
                            className="h-9 w-9 rounded-[10px]"
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {focusMode && (
                    <button
                        type="button"
                        onClick={() => setFocusMode(false)}
                        data-testid="exit-focus-btn"
                        className="absolute right-4 top-4 z-20 flex items-center gap-1.5 rounded-full border border-border bg-[hsl(var(--surface-1))] px-3 py-1.5 text-xs text-muted-foreground shadow-[var(--shadow-sm)] transition-colors duration-150 hover:text-foreground"
                    >
                        <X className="h-3 w-3" /> Leave focus mode
                    </button>
                )}

                <div className="min-h-0 flex-1">
                    <NoteEditor />
                </div>
            </main>

            <Sheet open={navOpen} onOpenChange={setNavOpen}>
                <SheetContent side="left" className="w-[300px] border-border p-0">
                    <SheetTitle className="sr-only">Navigation</SheetTitle>
                    <Sidebar onNavigate={() => setNavOpen(false)} />
                </SheetContent>
            </Sheet>

            <Sheet open={listOpen} onOpenChange={setListOpen}>
                <SheetContent side="left" className="w-[340px] border-border p-0">
                    <SheetTitle className="sr-only">Notes ({notes.length})</SheetTitle>
                    <NoteList onNavigate={() => setListOpen(false)} />
                </SheetContent>
            </Sheet>

            <Sheet open={aiOpen} onOpenChange={setAiOpen}>
                <SheetContent
                    side="right"
                    className="w-full border-border bg-popover p-0 sm:w-[440px] sm:max-w-[440px]"
                >
                    <SheetTitle className="sr-only">AI assistant</SheetTitle>
                    <AIPanel />
                </SheetContent>
            </Sheet>

            <CommandPalette />
            <ShortcutsDialog />
        </div>
    );
}

export default function App() {
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            storageKey="np:theme"
            disableTransitionOnChange
        >
            <TooltipProvider delayDuration={280}>
                <AppProvider>
                    <div className="App">
                        <Workspace />
                    </div>
                    <Toaster position="bottom-right" closeButton />
                </AppProvider>
            </TooltipProvider>
        </ThemeProvider>
    );
}
