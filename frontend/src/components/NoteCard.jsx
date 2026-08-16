import React from "react";
import {
    Archive,
    ArchiveRestore,
    Copy,
    Download,
    Pin,
    PinOff,
    RotateCcw,
    Trash2,
} from "lucide-react";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuTrigger,
} from "./ui/context-menu";
import { useApp } from "../context/AppContext";
import { colorHsl } from "../lib/constants";
import { highlightHtml, matchExcerpt, noteTitle, relativeTime } from "../lib/format";

export const NoteCard = ({ note, active, query, onSelect }) => {
    const {
        tags,
        togglePin,
        toggleArchive,
        trashNote,
        restoreNote,
        deleteNote,
        duplicateNote,
        exportNote,
    } = useApp();

    const accent = colorHsl(note.color);
    const noteTags = (note.tag_ids || [])
        .map((id) => tags.find((t) => t.id === id))
        .filter(Boolean);

    return (
        <ContextMenu>
            <ContextMenuTrigger asChild>
                <button
                    type="button"
                    onClick={() => onSelect(note.id)}
                    data-testid={`note-card-${note.id}`}
                    className={`group relative w-full overflow-hidden rounded-[var(--radius-md)] border p-3 text-left transition-colors duration-200 ${
                        active
                            ? "border-[hsl(var(--ring))] bg-[hsl(var(--surface-2))]"
                            : "border-border bg-[hsl(var(--surface-1))] hover:bg-[hsl(var(--surface-2))]"
                    }`}
                >
                    {accent && (
                        <span
                            className="absolute inset-y-0 left-0 w-[3px]"
                            style={{ backgroundColor: `hsl(${accent})` }}
                        />
                    )}
                    <div className="flex items-start justify-between gap-2">
                        <p
                            className="line-clamp-1 text-sm font-semibold tracking-[-0.01em] text-foreground"
                            dangerouslySetInnerHTML={{
                                __html: highlightHtml(noteTitle(note), query),
                            }}
                        />
                        {note.pinned && (
                            <Pin className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
                        )}
                    </div>
                    <p
                        className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground"
                        dangerouslySetInnerHTML={{
                            __html:
                                highlightHtml(
                                    query
                                        ? matchExcerpt(note.plain_text, query)
                                        : note.snippet || "",
                                    query,
                                ) || "<span class='italic opacity-70'>Empty note</span>",
                        }}
                    />
                    <div className="mt-2.5 flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-1.5">
                            {noteTags.slice(0, 2).map((tag) => (
                                <span
                                    key={tag.id}
                                    className="inline-flex max-w-[92px] items-center gap-1 rounded-full bg-[hsl(var(--muted))] px-2 py-0.5 text-[10px] font-medium text-foreground"
                                >
                                    <span
                                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                                        style={{ backgroundColor: `hsl(${tag.color})` }}
                                    />
                                    <span className="truncate">{tag.name}</span>
                                </span>
                            ))}
                            {noteTags.length > 2 && (
                                <span className="text-[10px] text-muted-foreground">
                                    +{noteTags.length - 2}
                                </span>
                            )}
                        </div>
                        <span className="shrink-0 text-[11px] text-muted-foreground">
                            {relativeTime(note.updated_at)}
                        </span>
                    </div>
                </button>
            </ContextMenuTrigger>
            <ContextMenuContent className="w-52 bg-popover">
                {note.trashed ? (
                    <>
                        <ContextMenuItem onClick={() => restoreNote(note)}>
                            <RotateCcw className="mr-2 h-3.5 w-3.5" /> Restore note
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => deleteNote(note)}
                        >
                            <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete forever
                        </ContextMenuItem>
                    </>
                ) : (
                    <>
                        <ContextMenuItem onClick={() => togglePin(note)}>
                            {note.pinned ? (
                                <PinOff className="mr-2 h-3.5 w-3.5" />
                            ) : (
                                <Pin className="mr-2 h-3.5 w-3.5" />
                            )}
                            {note.pinned ? "Unpin note" : "Pin to top"}
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => duplicateNote(note)}>
                            <Copy className="mr-2 h-3.5 w-3.5" /> Duplicate
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => exportNote(note, "md")}>
                            <Download className="mr-2 h-3.5 w-3.5" /> Export markdown
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem onClick={() => toggleArchive(note)}>
                            {note.archived ? (
                                <ArchiveRestore className="mr-2 h-3.5 w-3.5" />
                            ) : (
                                <Archive className="mr-2 h-3.5 w-3.5" />
                            )}
                            {note.archived ? "Unarchive" : "Archive"}
                        </ContextMenuItem>
                        <ContextMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => trashNote(note)}
                        >
                            <Trash2 className="mr-2 h-3.5 w-3.5" /> Move to trash
                        </ContextMenuItem>
                    </>
                )}
            </ContextMenuContent>
        </ContextMenu>
    );
};
