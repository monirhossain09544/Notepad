import React, { useState } from "react";
import { Check, ChevronDown, FolderClosed, Palette, Plus, Tag as TagIcon } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { useApp } from "../context/AppContext";
import { NOTE_COLORS, TAG_COLORS, colorHsl } from "../lib/constants";

const chipClass =
    "inline-flex items-center gap-1.5 rounded-full border border-border bg-[hsl(var(--surface-2))] px-2.5 py-1 text-xs text-foreground transition-colors duration-150 hover:bg-[hsl(var(--surface-3))]";

export const FolderPicker = ({ note, disabled }) => {
    const { folders, updateActive, refresh } = useApp();
    const [open, setOpen] = useState(false);
    const current = folders.find((f) => f.id === note.folder_id);

    const pick = async (folderId) => {
        setOpen(false);
        await updateActive({ folder_id: folderId }, { immediate: true });
        refresh();
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild disabled={disabled}>
                <button type="button" className={chipClass} data-testid="folder-picker-btn">
                    <FolderClosed className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="max-w-[130px] truncate">{current ? current.name : "No folder"}</span>
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-56 bg-popover p-1.5">
                <button
                    type="button"
                    onClick={() => pick(null)}
                    className="flex w-full items-center justify-between rounded-[10px] px-2.5 py-2 text-sm transition-colors duration-150 hover:bg-[hsl(var(--surface-3))]"
                >
                    No folder
                    {!note.folder_id && <Check className="h-3.5 w-3.5" />}
                </button>
                {folders.map((f) => (
                    <button
                        key={f.id}
                        type="button"
                        data-testid={`pick-folder-${f.id}`}
                        onClick={() => pick(f.id)}
                        className="flex w-full items-center justify-between rounded-[10px] px-2.5 py-2 text-sm transition-colors duration-150 hover:bg-[hsl(var(--surface-3))]"
                    >
                        <span className="truncate">{f.name}</span>
                        {note.folder_id === f.id && <Check className="h-3.5 w-3.5 shrink-0" />}
                    </button>
                ))}
                {folders.length === 0 && (
                    <p className="px-2.5 py-2 text-xs text-muted-foreground">
                        Create a folder in the sidebar first.
                    </p>
                )}
            </PopoverContent>
        </Popover>
    );
};

export const TagPicker = ({ note, disabled }) => {
    const { tags, setNoteTags, createTag } = useApp();
    const [open, setOpen] = useState(false);
    const [draft, setDraft] = useState("");
    const selected = note.tag_ids || [];

    const toggle = (tagId) => {
        const next = selected.includes(tagId)
            ? selected.filter((t) => t !== tagId)
            : [...selected, tagId];
        setNoteTags(next);
    };

    const addNew = async () => {
        const name = draft.trim();
        if (!name) return;
        setDraft("");
        const tag = await createTag(name);
        if (tag && !selected.includes(tag.id)) setNoteTags([...selected, tag.id]);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild disabled={disabled}>
                <button type="button" className={chipClass} data-testid="tag-picker-btn">
                    <TagIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    {selected.length > 0
                        ? `${selected.length} tag${selected.length === 1 ? "" : "s"}`
                        : "Add tags"}
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-64 bg-popover p-2">
                <div className="flex items-center gap-1.5 pb-2">
                    <Input
                        value={draft}
                        placeholder="New tag name"
                        data-testid="editor-new-tag-input"
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addNew()}
                        className="h-8 rounded-[10px] text-xs"
                    />
                    <Button
                        size="icon"
                        onClick={addNew}
                        aria-label="Create tag"
                        data-testid="editor-create-tag-btn"
                        className="h-8 w-8 shrink-0 rounded-[10px]"
                    >
                        <Plus className="h-3.5 w-3.5" />
                    </Button>
                </div>
                <div className="thin-scroll max-h-56 overflow-y-auto">
                    {tags.length === 0 && (
                        <p className="px-1 py-2 text-xs text-muted-foreground">No tags yet.</p>
                    )}
                    {tags.map((tag) => (
                        <button
                            key={tag.id}
                            type="button"
                            data-testid={`toggle-tag-${tag.id}`}
                            onClick={() => toggle(tag.id)}
                            className="flex w-full items-center justify-between rounded-[10px] px-2 py-1.5 text-sm transition-colors duration-150 hover:bg-[hsl(var(--surface-3))]"
                        >
                            <span className="flex min-w-0 items-center gap-2">
                                <span
                                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                                    style={{ backgroundColor: `hsl(${tag.color})` }}
                                />
                                <span className="truncate">{tag.name}</span>
                            </span>
                            {selected.includes(tag.id) && <Check className="h-3.5 w-3.5 shrink-0" />}
                        </button>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    );
};

export const ColorPicker = ({ note, disabled }) => {
    const { updateActive, refresh } = useApp();
    const [open, setOpen] = useState(false);
    const accent = colorHsl(note.color);

    const pick = async (value) => {
        setOpen(false);
        await updateActive({ color: value }, { immediate: true });
        refresh();
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild disabled={disabled}>
                <button type="button" className={chipClass} data-testid="color-picker-btn">
                    {accent ? (
                        <span
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: `hsl(${accent})` }}
                        />
                    ) : (
                        <Palette className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    Colour
                </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-auto bg-popover p-2">
                <div className="flex items-center gap-1.5">
                    {NOTE_COLORS.map((c) => (
                        <button
                            key={c.name}
                            type="button"
                            aria-label={c.name}
                            title={c.name}
                            data-testid={`note-color-${c.value || "none"}`}
                            onClick={() => pick(c.value)}
                            className={`flex h-7 w-7 items-center justify-center rounded-full border border-border transition-transform duration-150 hover:scale-110 ${
                                note.color === c.value
                                    ? "ring-2 ring-foreground ring-offset-2 ring-offset-[hsl(var(--popover))]"
                                    : ""
                            }`}
                            style={c.hsl ? { backgroundColor: `hsl(${c.hsl})` } : undefined}
                        >
                            {!c.hsl && <span className="text-[10px] text-muted-foreground">/</span>}
                        </button>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    );
};

export const TagChips = ({ note }) => {
    const { tags } = useApp();
    const noteTags = (note.tag_ids || [])
        .map((id) => tags.find((t) => t.id === id))
        .filter(Boolean);
    if (noteTags.length === 0) return null;
    return (
        <div className="flex flex-wrap items-center gap-1.5">
            {noteTags.map((tag) => (
                <span
                    key={tag.id}
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                    style={{
                        backgroundColor: `hsl(${tag.color} / 0.16)`,
                        color: `hsl(${tag.color})`,
                    }}
                >
                    <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: `hsl(${tag.color})` }}
                    />
                    {tag.name}
                </span>
            ))}
        </div>
    );
};

export const TAG_PALETTE = TAG_COLORS;
