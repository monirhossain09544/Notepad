import React, { useMemo } from "react";
import { Pin, Search, X, LayoutGrid, List as ListIcon, Trash2 } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./ui/select";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "./ui/alert-dialog";
import { NoteCard } from "./NoteCard";
import { EmptyList } from "./EmptyStates";
import { useApp } from "../context/AppContext";
import { SORT_OPTIONS } from "../lib/constants";

export const NoteList = ({ onNavigate }) => {
    const {
        notes,
        view,
        query,
        setQuery,
        sort,
        setSort,
        layout,
        setLayout,
        listLoading,
        activeId,
        selectNote,
        emptyTrash,
        debouncedQuery,
    } = useApp();

    const { pinned, rest } = useMemo(() => {
        if (view.type === "trash" || view.type === "pinned") {
            return { pinned: [], rest: notes };
        }
        return {
            pinned: notes.filter((n) => n.pinned),
            rest: notes.filter((n) => !n.pinned),
        };
    }, [notes, view.type]);

    const handleSelect = async (id) => {
        await selectNote(id);
        onNavigate?.();
    };

    return (
        <div className="flex h-full min-h-0 flex-col bg-[hsl(var(--surface-1))]">
            <div
                className={`border-b border-border bg-[hsl(var(--surface-1))] px-3 pt-4 pb-3 ${
                    onNavigate ? "pr-12" : ""
                }`}
            >
                <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search notes…"
                        data-testid="search-input"
                        className="h-10 rounded-[12px] border-border bg-[hsl(var(--surface-2))] pl-9 pr-9 text-sm"
                    />
                    {query && (
                        <button
                            type="button"
                            aria-label="Clear search"
                            data-testid="clear-search-btn"
                            onClick={() => setQuery("")}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors duration-150 hover:text-foreground"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>

                <div className="mt-3 flex items-center justify-between gap-2">
                    <p
                        className="truncate text-xs font-medium text-muted-foreground"
                        data-testid="list-heading"
                    >
                        {`${view.label} · ${notes.length}`}
                    </p>
                    <div className="flex items-center gap-1.5">
                        <Select value={sort} onValueChange={setSort}>
                            <SelectTrigger
                                className="h-8 w-[132px] rounded-[10px] border-border bg-[hsl(var(--surface-2))] text-xs"
                                data-testid="sort-select"
                            >
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-popover">
                                {SORT_OPTIONS.map((o) => (
                                    <SelectItem key={o.value} value={o.value} className="text-xs">
                                        {o.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <div className="flex items-center rounded-[10px] border border-border bg-[hsl(var(--surface-2))] p-0.5">
                            <button
                                type="button"
                                aria-label="List view"
                                data-testid="layout-list-btn"
                                onClick={() => setLayout("list")}
                                className={`rounded-[7px] p-1.5 transition-colors duration-150 ${
                                    layout === "list"
                                        ? "bg-[hsl(var(--surface-1))] text-foreground shadow-[var(--shadow-sm)]"
                                        : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                <ListIcon className="h-3.5 w-3.5" />
                            </button>
                            <button
                                type="button"
                                aria-label="Grid view"
                                data-testid="layout-grid-btn"
                                onClick={() => setLayout("grid")}
                                className={`rounded-[7px] p-1.5 transition-colors duration-150 ${
                                    layout === "grid"
                                        ? "bg-[hsl(var(--surface-1))] text-foreground shadow-[var(--shadow-sm)]"
                                        : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                <LayoutGrid className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </div>
                </div>

                {view.type === "trash" && notes.length > 0 && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                variant="outline"
                                data-testid="empty-trash-btn"
                                className="mt-3 h-8 w-full rounded-[10px] border-destructive/40 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                            >
                                <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Empty trash
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-popover">
                            <AlertDialogHeader>
                                <AlertDialogTitle>Empty the trash?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    {notes.length} note{notes.length === 1 ? "" : "s"} will be deleted
                                    permanently. This cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    data-testid="confirm-empty-trash-btn"
                                    onClick={emptyTrash}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                    Delete forever
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </div>

            <div className="thin-scroll min-h-0 flex-1 overflow-y-auto p-3" data-testid="note-list">
                {listLoading && notes.length === 0 ? (
                    <div className="space-y-2">
                        {[0, 1, 2, 3, 4].map((i) => (
                            <div
                                key={i}
                                className="rounded-[var(--radius-md)] border border-border bg-[hsl(var(--surface-1))] p-3"
                            >
                                <Skeleton className="h-4 w-2/3" />
                                <Skeleton className="mt-2 h-3 w-full" />
                                <Skeleton className="mt-1.5 h-3 w-4/5" />
                            </div>
                        ))}
                    </div>
                ) : notes.length === 0 ? (
                    <EmptyList view={view} query={debouncedQuery} />
                ) : (
                    <div className="space-y-4">
                        {pinned.length > 0 && (
                            <div>
                                <p className="flex items-center gap-1.5 px-1 pb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                                    <Pin className="h-3 w-3" /> Pinned
                                </p>
                                <div
                                    className={
                                        layout === "grid"
                                            ? "grid grid-cols-1 gap-2 sm:grid-cols-2"
                                            : "flex flex-col gap-2"
                                    }
                                >
                                    {pinned.map((note) => (
                                        <NoteCard
                                            key={note.id}
                                            note={note}
                                            active={note.id === activeId}
                                            query={debouncedQuery}
                                            onSelect={handleSelect}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                        {rest.length > 0 && (
                            <div>
                                {pinned.length > 0 && (
                                    <p className="px-1 pb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                                        Others
                                    </p>
                                )}
                                <div
                                    className={
                                        layout === "grid"
                                            ? "grid grid-cols-1 gap-2 sm:grid-cols-2"
                                            : "flex flex-col gap-2"
                                    }
                                >
                                    {rest.map((note) => (
                                        <NoteCard
                                            key={note.id}
                                            note={note}
                                            active={note.id === activeId}
                                            query={debouncedQuery}
                                            onSelect={handleSelect}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
