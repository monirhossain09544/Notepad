import React, { useState } from "react";
import { useTheme } from "next-themes";
import {
    Archive,
    BarChart3,
    Check,
    FileText,
    FolderClosed,
    Keyboard,
    Moon,
    MoreHorizontal,
    NotebookPen,
    Pin,
    Plus,
    Search,
    Sun,
    Trash2,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { useApp } from "../context/AppContext";
import { TAG_COLORS } from "../lib/constants";
import { modKey } from "../lib/format";

const VIEW_ITEMS = [
    { type: "all", label: "All notes", Icon: FileText, statKey: "all" },
    { type: "pinned", label: "Pinned", Icon: Pin, statKey: "pinned" },
    { type: "archive", label: "Archive", Icon: Archive, statKey: "archive" },
    { type: "trash", label: "Trash", Icon: Trash2, statKey: "trash" },
];

const NavItem = ({ active, Icon, label, count, onClick, testId, accent }) => (
    <button
        type="button"
        onClick={onClick}
        data-testid={testId}
        className={`group flex w-full items-center justify-between gap-2 rounded-[12px] px-3 py-2 text-left text-sm transition-colors duration-150 ${
            active
                ? "bg-[hsl(var(--surface-3))] font-medium text-foreground ring-1 ring-border"
                : "text-foreground/85 hover:bg-[hsl(var(--surface-3))]"
        }`}
    >
        <span className="flex min-w-0 items-center gap-2.5">
            {accent ? (
                <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: `hsl(${accent})` }}
                />
            ) : (
                Icon && (
                    <Icon
                        className={`h-4 w-4 shrink-0 ${
                            active ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                        }`}
                    />
                )
            )}
            <span className="truncate">{label}</span>
        </span>
        {count > 0 && <span className="shrink-0 text-xs text-muted-foreground">{count}</span>}
    </button>
);

export const Sidebar = ({ onNavigate }) => {
    const {
        view,
        setView,
        stats,
        folders,
        tags,
        createNote,
        createFolder,
        renameFolder,
        deleteFolder,
        createTag,
        updateTag,
        deleteTag,
        setPaletteOpen,
        setShortcutsOpen,
        setStatsOpen,
    } = useApp();
    const { theme, setTheme } = useTheme();

    const [folderDraft, setFolderDraft] = useState(null);
    const [tagDraft, setTagDraft] = useState(null);
    const [tagColor, setTagColor] = useState(TAG_COLORS[0].hsl);
    const [editing, setEditing] = useState(null); // {kind, id, value}

    const go = (next) => {
        setView(next);
        onNavigate?.();
    };

    const submitFolder = async () => {
        const name = (folderDraft || "").trim();
        setFolderDraft(null);
        if (name) await createFolder(name);
    };

    const submitTag = async () => {
        const name = (tagDraft || "").trim();
        setTagDraft(null);
        if (name) await createTag(name, tagColor);
    };

    const submitEdit = async () => {
        if (!editing) return;
        const value = editing.value.trim();
        const current = editing;
        setEditing(null);
        if (!value) return;
        if (current.kind === "folder") await renameFolder(current.id, value);
        else await updateTag(current.id, { name: value });
    };

    return (
        <div className="flex h-full min-h-0 flex-col bg-[hsl(var(--surface-2))]">
            <div className="paper-wash px-3 pt-4 pb-3">
                <div className="flex items-center gap-2 px-1 pb-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-foreground text-background">
                        <NotebookPen className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold tracking-[-0.01em]">Notepad</p>
                        <p className="truncate text-[11px] text-muted-foreground">
                            {`${stats.total} note${stats.total === 1 ? "" : "s"} · ${stats.words.toLocaleString()} words`}
                        </p>
                    </div>
                </div>

                <Button
                    onClick={() => {
                        createNote();
                        onNavigate?.();
                    }}
                    data-testid="new-note-btn"
                    className="h-10 w-full justify-between rounded-[12px] bg-foreground text-background hover:bg-foreground/90"
                >
                    <span className="flex items-center gap-2 text-sm font-medium">
                        <Plus className="h-4 w-4" /> New note
                    </span>
                    <span className="text-[11px] opacity-70">{modKey()}⇧N</span>
                </Button>

                <button
                    type="button"
                    onClick={() => setPaletteOpen(true)}
                    data-testid="open-palette-btn"
                    className="mt-2 flex w-full items-center justify-between rounded-[12px] border border-border bg-[hsl(var(--surface-1))] px-3 py-2 text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground"
                >
                    <span className="flex items-center gap-2">
                        <Search className="h-3.5 w-3.5" /> Quick find
                    </span>
                    <span className="text-[11px]">{modKey()}K</span>
                </button>
            </div>

            <div className="thin-scroll min-h-0 flex-1 overflow-y-auto px-3 pb-4">
                <nav className="space-y-0.5">
                    {VIEW_ITEMS.map(({ type, label, Icon, statKey }) => (
                        <NavItem
                            key={type}
                            active={view.type === type}
                            Icon={Icon}
                            label={label}
                            count={stats[statKey]}
                            testId={`view-${type}`}
                            onClick={() => go({ type, id: null, label })}
                        />
                    ))}
                </nav>

                <div className="mt-6">
                    <div className="flex items-center justify-between px-3 pb-1">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                            Folders
                        </p>
                        <button
                            type="button"
                            aria-label="New folder"
                            data-testid="add-folder-btn"
                            onClick={() => setFolderDraft("")}
                            className="rounded-md p-1 text-muted-foreground transition-colors duration-150 hover:bg-[hsl(var(--surface-3))] hover:text-foreground"
                        >
                            <Plus className="h-3.5 w-3.5" />
                        </button>
                    </div>

                    {folderDraft !== null && (
                        <div className="px-1 pb-1">
                            <Input
                                autoFocus
                                value={folderDraft}
                                data-testid="folder-name-input"
                                placeholder="Folder name"
                                onChange={(e) => setFolderDraft(e.target.value)}
                                onBlur={submitFolder}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") submitFolder();
                                    if (e.key === "Escape") setFolderDraft(null);
                                }}
                                className="h-9 rounded-[10px] bg-[hsl(var(--surface-1))]"
                            />
                        </div>
                    )}

                    <div className="space-y-0.5">
                        {folders.length === 0 && folderDraft === null && (
                            <p className="px-3 py-1 text-xs text-muted-foreground">No folders yet</p>
                        )}
                        {folders.map((folder) =>
                            editing?.kind === "folder" && editing.id === folder.id ? (
                                <div key={folder.id} className="px-1">
                                    <Input
                                        autoFocus
                                        value={editing.value}
                                        onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                                        onBlur={submitEdit}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") submitEdit();
                                            if (e.key === "Escape") setEditing(null);
                                        }}
                                        className="h-9 rounded-[10px] bg-[hsl(var(--surface-1))]"
                                    />
                                </div>
                            ) : (
                                <div key={folder.id} className="group/row relative">
                                    <NavItem
                                        active={view.type === "folder" && view.id === folder.id}
                                        Icon={FolderClosed}
                                        label={folder.name}
                                        count={stats.folders?.[folder.id] || 0}
                                        testId={`folder-${folder.id}`}
                                        onClick={() =>
                                            go({ type: "folder", id: folder.id, label: folder.name })
                                        }
                                    />
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button
                                                type="button"
                                                aria-label={`Folder options for ${folder.name}`}
                                                data-testid={`folder-menu-${folder.id}`}
                                                className="absolute right-1.5 top-1.5 rounded-md bg-[hsl(var(--surface-2))] p-1 text-muted-foreground opacity-0 transition-opacity duration-150 hover:text-foreground focus-visible:opacity-100 group-hover/row:opacity-100"
                                            >
                                                <MoreHorizontal className="h-3.5 w-3.5" />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-44">
                                            <DropdownMenuItem
                                                onClick={() =>
                                                    setEditing({
                                                        kind: "folder",
                                                        id: folder.id,
                                                        value: folder.name,
                                                    })
                                                }
                                            >
                                                Rename folder
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                className="text-destructive focus:text-destructive"
                                                onClick={() => deleteFolder(folder)}
                                            >
                                                Delete folder
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            ),
                        )}
                    </div>
                </div>

                <div className="mt-6">
                    <div className="flex items-center justify-between px-3 pb-1">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                            Tags
                        </p>
                        <Popover
                            open={tagDraft !== null}
                            onOpenChange={(open) => setTagDraft(open ? "" : null)}
                        >
                            <PopoverTrigger asChild>
                                <button
                                    type="button"
                                    aria-label="New tag"
                                    data-testid="add-tag-btn"
                                    className="rounded-md p-1 text-muted-foreground transition-colors duration-150 hover:bg-[hsl(var(--surface-3))] hover:text-foreground"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                </button>
                            </PopoverTrigger>
                            <PopoverContent align="end" className="w-64 bg-popover">
                                <p className="pb-2 text-xs font-medium text-muted-foreground">New tag</p>
                                <Input
                                    autoFocus
                                    value={tagDraft || ""}
                                    data-testid="tag-name-input"
                                    placeholder="e.g. research"
                                    onChange={(e) => setTagDraft(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") submitTag();
                                        if (e.key === "Escape") setTagDraft(null);
                                    }}
                                    className="h-9 rounded-[10px]"
                                />
                                <div className="flex items-center gap-1.5 pt-3">
                                    {TAG_COLORS.map((c) => (
                                        <button
                                            key={c.hsl}
                                            type="button"
                                            aria-label={c.name}
                                            onClick={() => setTagColor(c.hsl)}
                                            className={`flex h-6 w-6 items-center justify-center rounded-full ring-offset-2 ring-offset-[hsl(var(--popover))] transition-transform duration-150 hover:scale-110 ${
                                                tagColor === c.hsl ? "ring-2 ring-foreground" : ""
                                            }`}
                                            style={{ backgroundColor: `hsl(${c.hsl})` }}
                                        >
                                            {tagColor === c.hsl && (
                                                <Check className="h-3 w-3 text-white" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                                <Button
                                    onClick={submitTag}
                                    data-testid="save-tag-btn"
                                    className="mt-3 h-9 w-full rounded-[10px]"
                                >
                                    Create tag
                                </Button>
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="space-y-0.5">
                        {tags.length === 0 && (
                            <p className="px-3 py-1 text-xs text-muted-foreground">No tags yet</p>
                        )}
                        {tags.map((tag) =>
                            editing?.kind === "tag" && editing.id === tag.id ? (
                                <div key={tag.id} className="px-1">
                                    <Input
                                        autoFocus
                                        value={editing.value}
                                        onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                                        onBlur={submitEdit}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") submitEdit();
                                            if (e.key === "Escape") setEditing(null);
                                        }}
                                        className="h-9 rounded-[10px] bg-[hsl(var(--surface-1))]"
                                    />
                                </div>
                            ) : (
                                <div key={tag.id} className="group/row relative">
                                    <NavItem
                                        active={view.type === "tag" && view.id === tag.id}
                                        accent={tag.color}
                                        label={tag.name}
                                        count={stats.tags?.[tag.id] || 0}
                                        testId={`tag-${tag.id}`}
                                        onClick={() => go({ type: "tag", id: tag.id, label: `#${tag.name}` })}
                                    />
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button
                                                type="button"
                                                aria-label={`Tag options for ${tag.name}`}
                                                data-testid={`tag-menu-${tag.id}`}
                                                className="absolute right-1.5 top-1.5 rounded-md bg-[hsl(var(--surface-2))] p-1 text-muted-foreground opacity-0 transition-opacity duration-150 hover:text-foreground focus-visible:opacity-100 group-hover/row:opacity-100"
                                            >
                                                <MoreHorizontal className="h-3.5 w-3.5" />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48">
                                            <DropdownMenuItem
                                                onClick={() =>
                                                    setEditing({ kind: "tag", id: tag.id, value: tag.name })
                                                }
                                            >
                                                Rename tag
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuLabel className="text-[11px] font-normal text-muted-foreground">
                                                Colour
                                            </DropdownMenuLabel>
                                            <div className="flex items-center gap-1.5 px-2 pb-2">
                                                {TAG_COLORS.map((c) => (
                                                    <button
                                                        key={c.hsl}
                                                        type="button"
                                                        aria-label={c.name}
                                                        onClick={() => updateTag(tag.id, { color: c.hsl })}
                                                        className="h-5 w-5 rounded-full transition-transform duration-150 hover:scale-110"
                                                        style={{ backgroundColor: `hsl(${c.hsl})` }}
                                                    />
                                                ))}
                                            </div>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                className="text-destructive focus:text-destructive"
                                                onClick={() => deleteTag(tag)}
                                            >
                                                Delete tag
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            ),
                        )}
                    </div>
                </div>
            </div>

            <div className="border-t border-border bg-[hsl(var(--surface-2))] p-3">
                <div className="flex items-center gap-1.5">
                    <button
                        type="button"
                        data-testid="theme-toggle"
                        aria-label="Toggle theme"
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                        className="flex flex-1 items-center gap-2 rounded-[10px] border border-border bg-[hsl(var(--surface-1))] px-3 py-2 text-xs text-foreground transition-colors duration-150 hover:bg-[hsl(var(--surface-3))]"
                    >
                        {theme === "dark" ? (
                            <Moon className="h-3.5 w-3.5" />
                        ) : (
                            <Sun className="h-3.5 w-3.5" />
                        )}
                        {theme === "dark" ? "Dark" : "Light"}
                    </button>
                    <button
                        type="button"
                        aria-label="Writing stats"
                        data-testid="open-stats-btn"
                        onClick={() => setStatsOpen(true)}
                        className="rounded-[10px] border border-border bg-[hsl(var(--surface-1))] p-2 text-muted-foreground transition-colors duration-150 hover:text-foreground"
                    >
                        <BarChart3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                        type="button"
                        aria-label="Keyboard shortcuts"
                        data-testid="open-shortcuts-btn"
                        onClick={() => setShortcutsOpen(true)}
                        className="rounded-[10px] border border-border bg-[hsl(var(--surface-1))] p-2 text-muted-foreground transition-colors duration-150 hover:text-foreground"
                    >
                        <Keyboard className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
};
