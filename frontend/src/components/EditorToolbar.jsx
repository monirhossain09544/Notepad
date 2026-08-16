import React, { useState } from "react";
import {
    AlignCenter,
    AlignLeft,
    AlignRight,
    Bold,
    Code,
    Code2,
    Heading1,
    Heading2,
    Heading3,
    Highlighter,
    Italic,
    Link2,
    Link2Off,
    List,
    ListChecks,
    ListOrdered,
    Minus,
    Quote,
    Redo2,
    Strikethrough,
    Underline as UnderlineIcon,
    Undo2,
} from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

const ToolButton = ({ active, disabled, label, onClick, children, testId }) => (
    <button
        type="button"
        aria-label={label}
        title={label}
        disabled={disabled}
        data-testid={testId}
        onClick={onClick}
        className={`inline-flex h-8 w-8 items-center justify-center rounded-[10px] transition-colors duration-150 ${
            active
                ? "bg-[hsl(var(--surface-3))] text-foreground ring-1 ring-border"
                : "text-muted-foreground hover:bg-[hsl(var(--surface-3))] hover:text-foreground"
        } ${disabled ? "pointer-events-none opacity-40" : ""}`}
    >
        {children}
    </button>
);

const Divider = () => <span className="mx-0.5 h-5 w-px bg-border" />;

export const EditorToolbar = ({ editor, disabled }) => {
    const [linkUrl, setLinkUrl] = useState("");
    const [linkOpen, setLinkOpen] = useState(false);

    if (!editor) return null;

    const applyLink = () => {
        const url = linkUrl.trim();
        if (!url) {
            editor.chain().focus().extendMarkRange("link").unsetLink().run();
        } else {
            const href = /^https?:\/\//i.test(url) ? url : `https://${url}`;
            editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
        }
        setLinkOpen(false);
        setLinkUrl("");
    };

    return (
        <div
            className={`flex flex-wrap items-center gap-0.5 rounded-[14px] border border-border bg-[hsl(var(--surface-2))] p-1 ${
                disabled ? "pointer-events-none opacity-50" : ""
            }`}
            data-testid="editor-toolbar"
        >
            <ToolButton
                label="Undo"
                testId="tool-undo"
                disabled={!editor.can().undo()}
                onClick={() => editor.chain().focus().undo().run()}
            >
                <Undo2 className="h-4 w-4" />
            </ToolButton>
            <ToolButton
                label="Redo"
                testId="tool-redo"
                disabled={!editor.can().redo()}
                onClick={() => editor.chain().focus().redo().run()}
            >
                <Redo2 className="h-4 w-4" />
            </ToolButton>
            <Divider />
            <ToolButton
                label="Heading 1"
                testId="tool-h1"
                active={editor.isActive("heading", { level: 1 })}
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            >
                <Heading1 className="h-4 w-4" />
            </ToolButton>
            <ToolButton
                label="Heading 2"
                testId="tool-h2"
                active={editor.isActive("heading", { level: 2 })}
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            >
                <Heading2 className="h-4 w-4" />
            </ToolButton>
            <ToolButton
                label="Heading 3"
                testId="tool-h3"
                active={editor.isActive("heading", { level: 3 })}
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            >
                <Heading3 className="h-4 w-4" />
            </ToolButton>
            <Divider />
            <ToolButton
                label="Bold"
                testId="tool-bold"
                active={editor.isActive("bold")}
                onClick={() => editor.chain().focus().toggleBold().run()}
            >
                <Bold className="h-4 w-4" />
            </ToolButton>
            <ToolButton
                label="Italic"
                testId="tool-italic"
                active={editor.isActive("italic")}
                onClick={() => editor.chain().focus().toggleItalic().run()}
            >
                <Italic className="h-4 w-4" />
            </ToolButton>
            <ToolButton
                label="Underline"
                testId="tool-underline"
                active={editor.isActive("underline")}
                onClick={() => editor.chain().focus().toggleUnderline().run()}
            >
                <UnderlineIcon className="h-4 w-4" />
            </ToolButton>
            <ToolButton
                label="Strikethrough"
                testId="tool-strike"
                active={editor.isActive("strike")}
                onClick={() => editor.chain().focus().toggleStrike().run()}
            >
                <Strikethrough className="h-4 w-4" />
            </ToolButton>
            <ToolButton
                label="Highlight"
                testId="tool-highlight"
                active={editor.isActive("highlight")}
                onClick={() => editor.chain().focus().toggleHighlight().run()}
            >
                <Highlighter className="h-4 w-4" />
            </ToolButton>
            <Divider />
            <ToolButton
                label="Bullet list"
                testId="tool-bullet"
                active={editor.isActive("bulletList")}
                onClick={() => editor.chain().focus().toggleBulletList().run()}
            >
                <List className="h-4 w-4" />
            </ToolButton>
            <ToolButton
                label="Numbered list"
                testId="tool-ordered"
                active={editor.isActive("orderedList")}
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
            >
                <ListOrdered className="h-4 w-4" />
            </ToolButton>
            <ToolButton
                label="Checklist"
                testId="tool-task"
                active={editor.isActive("taskList")}
                onClick={() => editor.chain().focus().toggleTaskList().run()}
            >
                <ListChecks className="h-4 w-4" />
            </ToolButton>
            <Divider />
            <ToolButton
                label="Quote"
                testId="tool-quote"
                active={editor.isActive("blockquote")}
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
            >
                <Quote className="h-4 w-4" />
            </ToolButton>
            <ToolButton
                label="Inline code"
                testId="tool-code"
                active={editor.isActive("code")}
                onClick={() => editor.chain().focus().toggleCode().run()}
            >
                <Code className="h-4 w-4" />
            </ToolButton>
            <ToolButton
                label="Code block"
                testId="tool-codeblock"
                active={editor.isActive("codeBlock")}
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            >
                <Code2 className="h-4 w-4" />
            </ToolButton>
            <ToolButton
                label="Divider"
                testId="tool-hr"
                onClick={() => editor.chain().focus().setHorizontalRule().run()}
            >
                <Minus className="h-4 w-4" />
            </ToolButton>
            <Divider />
            <Popover open={linkOpen} onOpenChange={setLinkOpen}>
                <PopoverTrigger asChild>
                    <button
                        type="button"
                        aria-label="Add link"
                        title="Add link"
                        data-testid="tool-link"
                        onClick={() => setLinkUrl(editor.getAttributes("link")?.href || "")}
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-[10px] transition-colors duration-150 ${
                            editor.isActive("link")
                                ? "bg-[hsl(var(--surface-3))] text-foreground ring-1 ring-border"
                                : "text-muted-foreground hover:bg-[hsl(var(--surface-3))] hover:text-foreground"
                        }`}
                    >
                        <Link2 className="h-4 w-4" />
                    </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-72 bg-popover">
                    <p className="pb-2 text-xs font-medium text-muted-foreground">Link URL</p>
                    <div className="flex items-center gap-2">
                        <Input
                            autoFocus
                            value={linkUrl}
                            data-testid="link-url-input"
                            placeholder="example.com"
                            onChange={(e) => setLinkUrl(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && applyLink()}
                            className="h-9 rounded-[10px]"
                        />
                        <Button onClick={applyLink} data-testid="apply-link-btn" className="h-9 rounded-[10px]">
                            Save
                        </Button>
                    </div>
                    {editor.isActive("link") && (
                        <Button
                            variant="ghost"
                            onClick={() => {
                                editor.chain().focus().extendMarkRange("link").unsetLink().run();
                                setLinkOpen(false);
                            }}
                            className="mt-2 h-8 w-full justify-start rounded-[10px] text-xs text-destructive hover:text-destructive"
                        >
                            <Link2Off className="mr-2 h-3.5 w-3.5" /> Remove link
                        </Button>
                    )}
                </PopoverContent>
            </Popover>
            <Divider />
            <ToolButton
                label="Align left"
                testId="tool-align-left"
                active={editor.isActive({ textAlign: "left" })}
                onClick={() => editor.chain().focus().setTextAlign("left").run()}
            >
                <AlignLeft className="h-4 w-4" />
            </ToolButton>
            <ToolButton
                label="Align centre"
                testId="tool-align-center"
                active={editor.isActive({ textAlign: "center" })}
                onClick={() => editor.chain().focus().setTextAlign("center").run()}
            >
                <AlignCenter className="h-4 w-4" />
            </ToolButton>
            <ToolButton
                label="Align right"
                testId="tool-align-right"
                active={editor.isActive({ textAlign: "right" })}
                onClick={() => editor.chain().focus().setTextAlign("right").run()}
            >
                <AlignRight className="h-4 w-4" />
            </ToolButton>
        </div>
    );
};
