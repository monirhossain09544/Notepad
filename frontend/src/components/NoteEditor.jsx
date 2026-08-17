import React, { useCallback, useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import LinkExt from "@tiptap/extension-link";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import CharacterCount from "@tiptap/extension-character-count";
import {
    Archive,
    ArchiveRestore,
    Cloud,
    CloudOff,
    Copy,
    Download,
    Loader2,
    Maximize2,
    Minimize2,
    MoreHorizontal,
    Pin,
    PinOff,
    Printer,
    RotateCcw,
    Sparkles,
    Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "./ui/dropdown-menu";
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
import { EditorToolbar } from "./EditorToolbar";
import { EmptyEditor } from "./EmptyStates";
import { ColorPicker, FolderPicker, TagChips, TagPicker } from "./NoteMetaControls";
import { useApp } from "../context/AppContext";
import { agoTime, copyText, fullTime, modKey, noteTitle, readingTime } from "../lib/format";

const measure = (ed) => {
    const text = (ed?.getText?.({ blockSeparator: "\n" }) || "").replace(/\u00a0/g, " ");
    const trimmed = text.trim();
    return {
        words: trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0,
        chars: text.length,
    };
};

const SaveBadge = ({ status }) => {
    const map = {
        saving: { label: "Saving…", Icon: Loader2, spin: true },
        saved: { label: "Saved", Icon: Cloud },
        unsaved: { label: "Unsaved changes", Icon: Cloud },
        error: { label: "Save failed", Icon: CloudOff },
        idle: { label: "Saved", Icon: Cloud },
    };
    const { label, Icon, spin } = map[status] || map.idle;
    return (
        <span
            role="status"
            data-testid="save-status"
            className={`inline-flex items-center gap-1.5 text-[11px] ${
                status === "error" ? "text-destructive" : "text-muted-foreground"
            }`}
        >
            <Icon className={`h-3 w-3 ${spin ? "animate-spin" : ""}`} />
            {label}
        </span>
    );
};

export const NoteEditor = () => {
    const {
        activeNote,
        updateActive,
        registerEditor,
        saveStatus,
        togglePin,
        toggleArchive,
        trashNote,
        restoreNote,
        deleteNote,
        duplicateNote,
        exportNote,
        setAiOpen,
        focusMode,
        setFocusMode,
    } = useApp();

    const [counts, setCounts] = useState({ words: 0, chars: 0 });
    const updateRef = useRef(updateActive);
    updateRef.current = updateActive;
    const loadedId = useRef(null);
    const titleRef = useRef(null);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
            Underline,
            Highlight,
            LinkExt.configure({
                openOnClick: false,
                autolink: true,
                HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
            }),
            TaskList,
            TaskItem.configure({ nested: true }),
            TextAlign.configure({ types: ["heading", "paragraph"] }),
            CharacterCount,
            Placeholder.configure({
                placeholder: "Start writing… markdown shortcuts work too, try # or - ",
            }),
        ],
        content: "",
        autofocus: false,
        editorProps: {
            attributes: {
                class: "tiptap min-h-[46vh] focus:outline-none",
                "data-testid": "editor-body",
                spellcheck: "true",
            },
        },
        onUpdate: ({ editor: ed }) => {
            setCounts(measure(ed));
            updateRef.current({ html_content: ed.getHTML() });
        },
    });

    useEffect(() => {
        registerEditor(editor);
    }, [editor, registerEditor]);

    const readOnly = Boolean(activeNote?.trashed);

    useEffect(() => {
        if (!editor) return;
        editor.setEditable(!readOnly);
    }, [editor, readOnly]);

    useEffect(() => {
        if (!editor) return;
        if (!activeNote) {
            loadedId.current = null;
            return;
        }
        if (loadedId.current === activeNote.id) return;
        loadedId.current = activeNote.id;
        editor.commands.setContent(activeNote.html_content || "", false);
        setCounts(measure(editor));
        const isBlank = !activeNote.title && !(activeNote.html_content || "").trim();
        if (isBlank && !activeNote.trashed) {
            setTimeout(() => titleRef.current?.focus(), 60);
        }
    }, [editor, activeNote]);

    const printNote = useCallback(() => {
        if (!activeNote) return;
        const win = window.open("", "_blank");
        if (!win) {
            toast.error("Allow pop-ups to print this note");
            return;
        }
        const title = noteTitle(activeNote);
        const body = editor?.getHTML() || activeNote.html_content || "";
        const styles =
            "body{font-family:Georgia,'Times New Roman',serif;max-width:70ch;margin:48px auto;padding:0 24px;line-height:1.7;color:#111}" +
            "h1{font-size:30px;margin-bottom:8px}h2{font-size:22px}" +
            "blockquote{border-left:2px solid #ccc;margin-left:0;padding-left:16px;color:#555;font-style:italic}" +
            "pre{background:#f4f4f5;padding:14px;border-radius:8px;overflow:auto}" +
            "code{font-family:ui-monospace,Menlo,monospace;background:#f4f4f5;padding:2px 5px;border-radius:4px}" +
            "ul[data-type=taskList]{list-style:none;padding-left:0}mark{background:#fdf3c3}";
        win.document.write(
            `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>${styles}</style></head><body><h1>${title}</h1>${body}</body></html>`,
        );
        win.document.close();
        win.focus();
        setTimeout(() => win.print(), 240);
    }, [activeNote, editor]);

    if (!activeNote) return <EmptyEditor />;

    return (
        <div className="flex h-full min-h-0 flex-col bg-background" data-testid="note-editor">
            {readOnly && (
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-[hsl(var(--surface-2))] px-4 py-2.5 sm:px-6 lg:px-10">
                    <p className="text-xs text-muted-foreground">
                        This note is in the trash and is read-only.
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            data-testid="restore-note-btn"
                            onClick={() => restoreNote(activeNote)}
                            className="h-8 rounded-[10px] text-xs"
                        >
                            <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Restore
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    data-testid="delete-forever-btn"
                                    className="h-8 rounded-[10px] border-destructive/40 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                                >
                                    <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete forever
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-popover">
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Delete this note permanently?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        “{noteTitle(activeNote)}” will be gone for good.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        data-testid="confirm-delete-forever-btn"
                                        onClick={() => deleteNote(activeNote)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                        Delete forever
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>
            )}

            <div className="border-b border-border bg-background px-4 pt-4 pb-3 sm:px-6 lg:px-10">
                <input
                    ref={titleRef}
                    value={activeNote.title || ""}
                    onChange={(e) => updateActive({ title: e.target.value })}
                    placeholder="Untitled note"
                    disabled={readOnly}
                    data-testid="note-title-input"
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            editor?.commands.focus("end");
                        }
                    }}
                    style={{ fontFamily: "var(--font-editor)" }}
                    className="w-full bg-transparent text-[24px] font-semibold tracking-[-0.02em] text-foreground outline-none placeholder:text-muted-foreground/60 disabled:cursor-not-allowed sm:text-[28px] lg:text-[32px]"
                />

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                        <FolderPicker note={activeNote} disabled={readOnly} />
                        <TagPicker note={activeNote} disabled={readOnly} />
                        <ColorPicker note={activeNote} disabled={readOnly} />
                        <SaveBadge status={saveStatus} />
                    </div>

                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            aria-label={activeNote.pinned ? "Unpin note" : "Pin note"}
                            data-testid="pin-note-btn"
                            disabled={readOnly}
                            onClick={() => togglePin(activeNote)}
                            className={`h-9 w-9 rounded-[10px] ${
                                activeNote.pinned ? "text-foreground" : "text-muted-foreground"
                            }`}
                        >
                            {activeNote.pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Toggle focus mode"
                            data-testid="focus-mode-btn"
                            onClick={() => setFocusMode(!focusMode)}
                            className="hidden h-9 w-9 rounded-[10px] text-muted-foreground md:inline-flex"
                        >
                            {focusMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                        </Button>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    type="button"
                                    onClick={() => setAiOpen(true)}
                                    data-testid="open-ai-btn"
                                    className="inline-flex h-9 items-center gap-2 rounded-[10px] border border-border bg-[hsl(var(--surface-1))] px-2.5 text-[13px] font-medium text-foreground transition-colors duration-200 hover:bg-[hsl(var(--surface-2))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--background))]"
                                >
                                    <Sparkles className="h-4 w-4 text-[hsl(var(--accent))]" />
                                    <span className="hidden sm:inline">Assist</span>
                                    <kbd className="ml-0.5 hidden rounded-[6px] border border-border bg-[hsl(var(--surface-2))] px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground lg:inline">
                                        {`${modKey()}E`}
                                    </kbd>
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="text-xs">
                                Ask the assistant about this note
                            </TooltipContent>
                        </Tooltip>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label="More actions"
                                    data-testid="note-more-btn"
                                    className="h-9 w-9 rounded-[10px] text-muted-foreground"
                                >
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 bg-popover">
                                <DropdownMenuItem
                                    data-testid="duplicate-note-btn"
                                    onClick={() => duplicateNote(activeNote)}
                                >
                                    <Copy className="mr-2 h-3.5 w-3.5" /> Duplicate note
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={async () => {
                                        await copyText(activeNote.plain_text || "");
                                        toast.success("Note copied to clipboard");
                                    }}
                                >
                                    <Copy className="mr-2 h-3.5 w-3.5" /> Copy as plain text
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={printNote}>
                                    <Printer className="mr-2 h-3.5 w-3.5" /> Print / PDF
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel className="text-[11px] font-normal text-muted-foreground">
                                    Export
                                </DropdownMenuLabel>
                                <DropdownMenuItem
                                    data-testid="export-md-btn"
                                    onClick={() => exportNote(activeNote, "md")}
                                >
                                    <Download className="mr-2 h-3.5 w-3.5" /> Markdown (.md)
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    data-testid="export-txt-btn"
                                    onClick={() => exportNote(activeNote, "txt")}
                                >
                                    <Download className="mr-2 h-3.5 w-3.5" /> Plain text (.txt)
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => exportNote(activeNote, "html")}>
                                    <Download className="mr-2 h-3.5 w-3.5" /> Web page (.html)
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    data-testid="archive-note-btn"
                                    onClick={() => toggleArchive(activeNote)}
                                >
                                    {activeNote.archived ? (
                                        <ArchiveRestore className="mr-2 h-3.5 w-3.5" />
                                    ) : (
                                        <Archive className="mr-2 h-3.5 w-3.5" />
                                    )}
                                    {activeNote.archived ? "Move out of archive" : "Archive note"}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    data-testid="trash-note-btn"
                                    onClick={() => trashNote(activeNote)}
                                >
                                    <Trash2 className="mr-2 h-3.5 w-3.5" /> Move to trash
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <div className="mt-3">
                    <EditorToolbar editor={editor} disabled={readOnly} />
                </div>
            </div>

            <div className="thin-scroll min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-10">
                <div className={`mx-auto ${focusMode ? "max-w-[72ch]" : "max-w-[78ch]"}`}>
                    <TagChips note={activeNote} />
                    <div className="mt-3">
                        <EditorContent editor={editor} />
                    </div>
                </div>
            </div>

            <div className="border-t border-border bg-background px-4 py-2.5 sm:px-6 lg:px-10">
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
                    <span data-testid="editor-counts">
                        {`${counts.words} word${counts.words === 1 ? "" : "s"} · ${counts.chars} characters · ${readingTime(counts.words)}`}
                    </span>
                    <span title={fullTime(activeNote.updated_at)}>
                        Edited {agoTime(activeNote.updated_at)}
                    </span>
                </div>
            </div>
        </div>
    );
};
