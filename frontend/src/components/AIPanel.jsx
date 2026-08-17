import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    AlignLeft,
    ArrowUp,
    Check,
    ChevronRight,
    Copy,
    CornerDownLeft,
    Eraser,
    Hash,
    ListChecks,
    Loader2,
    PenLine,
    RotateCcw,
    SlidersHorizontal,
    Type,
    Wand2,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "./ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./ui/select";
import { useApp } from "../context/AppContext";
import { api, errorMessage } from "../lib/api";
import { TONES } from "../lib/constants";
import { bulletsToHtml, copyText, itemsToTaskHtml, noteTitle } from "../lib/format";

const GROUPS = [
    {
        label: "Rewrite",
        tone: true,
        items: [
            { key: "improve", label: "Improve writing", Icon: Wand2 },
            { key: "continue", label: "Continue writing", Icon: PenLine },
        ],
    },
    {
        label: "Extract",
        items: [
            { key: "summarize", label: "Summarise", Icon: AlignLeft },
            { key: "action-items", label: "Action items", Icon: ListChecks },
        ],
    },
    {
        label: "Organise",
        items: [
            { key: "title", label: "Suggest a title", Icon: Type },
            { key: "suggest-tags", label: "Suggest tags", Icon: Hash },
        ],
    },
];

const rowClass =
    "group flex items-center gap-2.5 rounded-[10px] px-2 py-2 text-left text-[13px] text-foreground transition-colors duration-150 hover:bg-[hsl(var(--surface-2))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-1 focus-visible:ring-offset-[hsl(var(--surface-1))] disabled:pointer-events-none disabled:opacity-45";

const iconClass =
    "h-4 w-4 shrink-0 text-muted-foreground transition-colors duration-150 group-hover:text-foreground";

const primaryBtn =
    "inline-flex h-8 items-center gap-1.5 rounded-[9px] bg-[hsl(var(--accent))] px-2.5 text-xs font-medium text-[hsl(var(--accent-foreground))] transition-colors duration-150 hover:bg-[hsl(var(--accent)/0.9)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--surface-1))]";

const secondaryBtn =
    "inline-flex h-8 items-center gap-1.5 rounded-[9px] border border-border bg-[hsl(var(--surface-2))] px-2.5 text-xs font-medium text-foreground transition-colors duration-150 hover:bg-[hsl(var(--surface-3))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--surface-1))]";

const IconAction = ({ label, onClick, children }) => (
    <Tooltip>
        <TooltipTrigger asChild>
            <button
                type="button"
                aria-label={label}
                onClick={onClick}
                className="grid h-7 w-7 place-items-center rounded-[8px] text-muted-foreground transition-colors duration-150 hover:bg-[hsl(var(--surface-2))] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-1 focus-visible:ring-offset-[hsl(var(--surface-1))]"
            >
                {children}
            </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
            {label}
        </TooltipContent>
    </Tooltip>
);

const Panel = ({ children, className = "", ...rest }) => (
    <div
        className={`relative overflow-hidden rounded-[var(--radius-md)] border border-border bg-[hsl(var(--surface-1))] px-3.5 py-3 ${className}`}
        {...rest}
    >
        <span className="absolute inset-y-3 left-0 w-[2px] rounded-full bg-[hsl(var(--accent)/0.55)]" />
        {children}
    </div>
);

const Label = ({ children }) => (
    <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
        {children}
    </p>
);

export const AIPanel = () => {
    const { activeNote, editorRef, flushSave, updateActive, ensureTag, setNoteTags } = useApp();

    const [busy, setBusy] = useState(null);
    const [result, setResult] = useState(null);
    const [tone, setTone] = useState("professional");
    const [messages, setMessages] = useState([]);
    const [question, setQuestion] = useState("");
    const [streaming, setStreaming] = useState(false);
    const [streamText, setStreamText] = useState("");
    const chatEndRef = useRef(null);

    const noteId = activeNote?.id;

    useEffect(() => {
        if (!noteId) return undefined;
        let cancelled = false;
        (async () => {
            try {
                const history = await api.notes.chat(noteId);
                if (!cancelled) {
                    setMessages(history.map((m) => ({ role: m.role, content: m.content })));
                }
            } catch {
                /* history is best effort */
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [noteId]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ block: "end" });
    }, [messages, streamText]);

    const currentHtml = useCallback(
        () => editorRef.current?.getHTML?.() || activeNote?.html_content || "",
        [editorRef, activeNote],
    );

    const runAction = useCallback(
        async (action, extra = {}) => {
            if (!activeNote) return;
            setBusy(action);
            setResult(null);
            try {
                await flushSave();
                const data = await api.ai.run(action, {
                    note_id: activeNote.id,
                    html_content: currentHtml(),
                    ...extra,
                });
                setResult({ action, data });
            } catch (error) {
                toast.error(errorMessage(error, "The assistant could not finish that"));
            } finally {
                setBusy(null);
            }
        },
        [activeNote, flushSave, currentHtml],
    );

    const insertAtEnd = (html) => {
        const editor = editorRef.current;
        if (!editor) return;
        editor.chain().focus("end").insertContent(html).run();
        toast.success("Added to your note");
    };

    const replaceAll = (html) => {
        const editor = editorRef.current;
        if (!editor) return;
        editor.commands.setContent(html, true);
        toast.success("Note updated — undo with Ctrl/⌘ Z");
    };

    const applyTags = async (suggested) => {
        const ids = [...(activeNote.tag_ids || [])];
        for (const name of suggested) {
            // eslint-disable-next-line no-await-in-loop
            const tag = await ensureTag(name);
            if (tag && !ids.includes(tag.id)) ids.push(tag.id);
        }
        await setNoteTags(ids);
        toast.success("Tags added to this note");
    };

    const ask = async () => {
        const q = question.trim();
        if (!q || !activeNote) return;
        setQuestion("");
        setMessages((prev) => [...prev, { role: "user", content: q }]);
        setStreaming(true);
        setStreamText("");
        let acc = "";
        try {
            await flushSave();
            const res = await fetch(api.ai.streamUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    note_id: activeNote.id,
                    html_content: currentHtml(),
                    question: q,
                }),
            });
            if (!res.ok || !res.body) {
                const payload = await res.json().catch(() => ({}));
                throw new Error(payload.detail || "The assistant is unavailable right now");
            }
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";
            for (;;) {
                // eslint-disable-next-line no-await-in-loop
                const { value, done } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const parts = buffer.split("\n\n");
                buffer = parts.pop() || "";
                for (const part of parts) {
                    const line = part.trim();
                    if (!line.startsWith("data:")) continue;
                    let payload;
                    try {
                        payload = JSON.parse(line.slice(5).trim());
                    } catch {
                        continue;
                    }
                    if (payload.delta) {
                        acc += payload.delta;
                        setStreamText(acc);
                    } else if (payload.error) {
                        throw new Error(payload.error);
                    } else if (payload.done) {
                        acc = payload.answer || acc;
                    }
                }
            }
            setMessages((prev) => [...prev, { role: "assistant", content: acc }]);
        } catch (error) {
            toast.error(error.message || "Could not answer that");
            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: "I could not answer that. Please try again." },
            ]);
        } finally {
            setStreaming(false);
            setStreamText("");
        }
    };

    const clearChat = async () => {
        if (!noteId) return;
        try {
            await api.notes.clearChat(noteId);
            setMessages([]);
            toast.success("Conversation cleared");
        } catch (error) {
            toast.error(errorMessage(error));
        }
    };

    if (!activeNote) return null;

    const thinking = Boolean(busy);

    const renderResult = () => {
        if (!result) return null;
        const { action, data } = result;
        const retry = () => runAction(action, action === "tone" ? { tone } : {});

        if (action === "title") {
            return (
                <Panel className="pr-16" data-testid="ai-result-title">
                    <div className="absolute right-1.5 top-1.5 flex items-center gap-0.5">
                        <IconAction
                            label="Copy"
                            onClick={async () => {
                                await copyText(data.title || "");
                                toast.success("Copied");
                            }}
                        >
                            <Copy className="h-3.5 w-3.5" />
                        </IconAction>
                        <IconAction label="Try again" onClick={retry}>
                            <RotateCcw className="h-3.5 w-3.5" />
                        </IconAction>
                    </div>
                    <Label>Suggested title</Label>
                    <p
                        className="mt-1.5 text-[17px] font-semibold leading-snug tracking-[-0.01em]"
                        style={{ fontFamily: "var(--font-editor)" }}
                    >
                        {data.title}
                    </p>
                    <div className="mt-3">
                        <button
                            type="button"
                            data-testid="ai-apply-title-btn"
                            className={primaryBtn}
                            onClick={() => {
                                updateActive({ title: data.title }, { immediate: true });
                                toast.success("Title applied");
                            }}
                        >
                            <Check className="h-3.5 w-3.5" /> Use this title
                        </button>
                    </div>
                </Panel>
            );
        }

        if (action === "summarize" || action === "action-items") {
            const items = action === "summarize" ? data.bullets || [] : data.items || [];
            const heading = action === "summarize" ? "Summary" : "Action items";
            return (
                <Panel className="pr-16" data-testid={`ai-result-${action}`}>
                    <div className="absolute right-1.5 top-1.5 flex items-center gap-0.5">
                        <IconAction
                            label="Copy"
                            onClick={async () => {
                                await copyText(items.map((i) => `- ${i}`).join("\n"));
                                toast.success("Copied");
                            }}
                        >
                            <Copy className="h-3.5 w-3.5" />
                        </IconAction>
                        <IconAction label="Try again" onClick={retry}>
                            <RotateCcw className="h-3.5 w-3.5" />
                        </IconAction>
                    </div>
                    <Label>{heading}</Label>
                    {items.length === 0 ? (
                        <p className="mt-2 text-[13px] text-muted-foreground">
                            Nothing to pull out of this note yet.
                        </p>
                    ) : (
                        <ul className="mt-2 space-y-1.5">
                            {items.map((item, i) => (
                                <li key={i} className="flex gap-2.5 text-[13px] leading-relaxed">
                                    <span className="mt-[8px] h-1 w-1 shrink-0 rounded-full bg-[hsl(var(--accent))]" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                    {items.length > 0 && (
                        <div className="mt-3">
                            <button
                                type="button"
                                data-testid={`ai-insert-${action}-btn`}
                                className={primaryBtn}
                                onClick={() =>
                                    insertAtEnd(
                                        action === "summarize"
                                            ? bulletsToHtml(items, heading)
                                            : itemsToTaskHtml(items, heading),
                                    )
                                }
                            >
                                <CornerDownLeft className="h-3.5 w-3.5" />
                                {action === "summarize" ? "Add to note" : "Add as checklist"}
                            </button>
                        </div>
                    )}
                </Panel>
            );
        }

        if (action === "suggest-tags") {
            const suggested = data.tags || [];
            return (
                <Panel className="pr-12" data-testid="ai-result-suggest-tags">
                    <div className="absolute right-1.5 top-1.5 flex items-center gap-0.5">
                        <IconAction label="Try again" onClick={retry}>
                            <RotateCcw className="h-3.5 w-3.5" />
                        </IconAction>
                    </div>
                    <Label>Suggested tags</Label>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                        {suggested.map((name) => (
                            <button
                                key={name}
                                type="button"
                                onClick={() => applyTags([name])}
                                className="inline-flex items-center gap-1 rounded-full border border-border bg-[hsl(var(--surface-2))] px-2.5 py-1 text-xs text-foreground transition-colors duration-150 hover:bg-[hsl(var(--surface-3))]"
                            >
                                <Hash className="h-3 w-3 text-muted-foreground" />
                                {name}
                            </button>
                        ))}
                    </div>
                    {suggested.length > 0 && (
                        <div className="mt-3">
                            <button
                                type="button"
                                data-testid="ai-apply-tags-btn"
                                className={primaryBtn}
                                onClick={() => applyTags(suggested)}
                            >
                                <Check className="h-3.5 w-3.5" /> Add them all
                            </button>
                        </div>
                    )}
                </Panel>
            );
        }

        const html = data.html || "";
        const isContinue = action === "continue";
        const label = isContinue
            ? "Suggested continuation"
            : action === "tone"
              ? `Rewritten · ${data.tone || tone}`
              : "Improved draft";
        return (
            <Panel className="pr-12" data-testid={`ai-result-${action}`}>
                <div className="absolute right-1.5 top-1.5 flex items-center gap-0.5">
                    <IconAction label="Try again" onClick={retry}>
                        <RotateCcw className="h-3.5 w-3.5" />
                    </IconAction>
                </div>
                <Label>{label}</Label>
                <div
                    className="note-prose thin-scroll mt-2 max-h-56 overflow-y-auto pr-1"
                    dangerouslySetInnerHTML={{ __html: html }}
                />
                <div className="mt-3 flex flex-wrap items-center gap-2">
                    {isContinue ? (
                        <button
                            type="button"
                            data-testid="ai-insert-continue-btn"
                            className={primaryBtn}
                            onClick={() => insertAtEnd(html)}
                        >
                            <CornerDownLeft className="h-3.5 w-3.5" /> Add to note
                        </button>
                    ) : (
                        <>
                            <button
                                type="button"
                                data-testid="ai-replace-note-btn"
                                className={primaryBtn}
                                onClick={() => replaceAll(html)}
                            >
                                <Check className="h-3.5 w-3.5" /> Replace note
                            </button>
                            <button
                                type="button"
                                className={secondaryBtn}
                                onClick={() => insertAtEnd(html)}
                            >
                                Append instead
                            </button>
                        </>
                    )}
                </div>
            </Panel>
        );
    };

    return (
        <div className="flex h-full min-h-0 flex-col bg-popover text-popover-foreground">
            <div className="flex items-center justify-between gap-3 border-b border-border bg-[hsl(var(--surface-2))] px-4 py-3 pr-12">
                <div className="min-w-0">
                    <p className="text-sm font-medium">Assistant</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {noteTitle(activeNote)}
                    </p>
                </div>
                <span
                    role="status"
                    className="flex shrink-0 items-center gap-1.5 text-[11px] font-medium text-muted-foreground"
                >
                    <span
                        className={`h-1.5 w-1.5 rounded-full ${
                            thinking || streaming
                                ? "animate-pulse bg-[hsl(var(--accent))]"
                                : "bg-[hsl(var(--muted-foreground)/0.4)]"
                        }`}
                    />
                    {thinking || streaming ? "Thinking" : "Ready"}
                </span>
            </div>

            <div className="thin-scroll min-h-0 flex-1 overflow-y-auto">
                <div className="px-3.5 pt-3.5">
                    <div className="overflow-hidden rounded-[var(--radius-md)] border border-border bg-[hsl(var(--surface-1))]">
                        {GROUPS.map((group, gi) => (
                            <div
                                key={group.label}
                                className={gi > 0 ? "border-t border-border" : ""}
                            >
                                <p className="px-3 pb-0.5 pt-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                                    {group.label}
                                </p>
                                <div className="px-1.5 pb-1.5">
                                    {group.items.map(({ key, label, Icon }) => (
                                        <button
                                            key={key}
                                            type="button"
                                            disabled={thinking}
                                            data-testid={`ai-action-${key}`}
                                            onClick={() => runAction(key)}
                                            className={`${rowClass} w-full`}
                                        >
                                            {busy === key ? (
                                                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[hsl(var(--accent))]" />
                                            ) : (
                                                <Icon className={iconClass} />
                                            )}
                                            <span className="min-w-0 flex-1 truncate">{label}</span>
                                            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity duration-150 group-hover:opacity-70" />
                                        </button>
                                    ))}

                                    {group.tone && (
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                type="button"
                                                disabled={thinking}
                                                data-testid="ai-action-tone"
                                                onClick={() => runAction("tone", { tone })}
                                                className={`${rowClass} min-w-0 flex-1`}
                                            >
                                                {busy === "tone" ? (
                                                    <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[hsl(var(--accent))]" />
                                                ) : (
                                                    <SlidersHorizontal className={iconClass} />
                                                )}
                                                <span className="truncate">Change tone</span>
                                            </button>
                                            <Select value={tone} onValueChange={setTone}>
                                                <SelectTrigger
                                                    data-testid="ai-tone-select"
                                                    aria-label="Tone"
                                                    className="h-7 w-auto shrink-0 gap-1 rounded-[8px] border-0 bg-[hsl(var(--surface-2))] px-2 text-[11px] font-medium text-muted-foreground focus:ring-0 focus:ring-offset-0"
                                                >
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent align="end" className="bg-popover">
                                                    {TONES.map((t) => (
                                                        <SelectItem
                                                            key={t.value}
                                                            value={t.value}
                                                            className="text-xs"
                                                        >
                                                            {t.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="px-3.5 pt-3">
                    {thinking ? (
                        <Panel className="np-scanline">
                            <Label>Working</Label>
                            <p className="mt-1.5 flex items-center gap-1 text-[13px] text-muted-foreground">
                                Reading your note
                                <span className="dot-1">.</span>
                                <span className="dot-2">.</span>
                                <span className="dot-3">.</span>
                            </p>
                            <div className="mt-2.5 space-y-1.5">
                                <span className="block h-2 w-full rounded-full bg-[hsl(var(--surface-3))]" />
                                <span className="block h-2 w-4/5 rounded-full bg-[hsl(var(--surface-3))]" />
                                <span className="block h-2 w-2/3 rounded-full bg-[hsl(var(--surface-3))]" />
                            </div>
                        </Panel>
                    ) : (
                        renderResult() || (
                            <div className="rounded-[var(--radius-md)] bg-[hsl(var(--surface-2))] px-3.5 py-3">
                                <p className="text-[13px] font-medium">Nothing running</p>
                                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                                    Pick an action above, or ask a question — answers only ever use
                                    what is written in this note.
                                </p>
                            </div>
                        )
                    )}
                </div>

                <div className="px-3.5 pb-5 pt-5">
                    <div className="flex items-center justify-between pb-1.5">
                        <Label>Conversation</Label>
                        {messages.length > 0 && (
                            <button
                                type="button"
                                onClick={clearChat}
                                data-testid="ai-clear-chat-btn"
                                className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] text-muted-foreground transition-colors duration-150 hover:text-foreground"
                            >
                                <Eraser className="h-3 w-3" /> Clear
                            </button>
                        )}
                    </div>
                    <div data-testid="ai-chat-thread">
                        {messages.length === 0 && !streaming && (
                            <p className="text-xs text-muted-foreground">
                                Nothing asked yet. Try “what did I decide here?”
                            </p>
                        )}
                        {messages.map((m, i) =>
                            m.role === "user" ? (
                                <div
                                    key={i}
                                    className="ml-auto mt-2.5 max-w-[88%] rounded-[12px] border border-border bg-[hsl(var(--surface-2))] px-3 py-2 text-[13px] text-foreground"
                                >
                                    {m.content}
                                </div>
                            ) : (
                                <Panel key={i} className="mt-2.5">
                                    <p className="whitespace-pre-wrap text-[13px] leading-relaxed">
                                        {m.content}
                                    </p>
                                </Panel>
                            ),
                        )}
                        {streaming && (
                            <Panel className={`mt-2.5 ${streamText ? "" : "np-scanline"}`}>
                                {streamText ? (
                                    <p className="whitespace-pre-wrap text-[13px] leading-relaxed">
                                        {streamText}
                                    </p>
                                ) : (
                                    <p className="flex items-center gap-1 text-[13px] text-muted-foreground">
                                        Looking through the note
                                        <span className="dot-1">.</span>
                                        <span className="dot-2">.</span>
                                        <span className="dot-3">.</span>
                                    </p>
                                )}
                            </Panel>
                        )}
                        <div ref={chatEndRef} />
                    </div>
                </div>
            </div>

            <div className="border-t border-border bg-popover px-3.5 py-3">
                <div className="relative">
                    <Input
                        value={question}
                        placeholder="Ask about this note…"
                        data-testid="ai-question-input"
                        disabled={streaming}
                        onChange={(e) => setQuestion(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && ask()}
                        className="h-11 rounded-[12px] border-border bg-[hsl(var(--surface-1))] pr-12 text-[13px]"
                    />
                    <button
                        type="button"
                        onClick={ask}
                        disabled={streaming || !question.trim()}
                        aria-label="Send question"
                        data-testid="ai-ask-btn"
                        className="absolute right-1.5 top-1.5 grid h-8 w-8 place-items-center rounded-[9px] bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] transition-colors duration-150 hover:bg-[hsl(var(--accent)/0.9)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--popover))] disabled:opacity-40"
                    >
                        {streaming ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <ArrowUp className="h-4 w-4" />
                        )}
                    </button>
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">
                    Enter to send · the assistant only reads this note
                </p>
            </div>
        </div>
    );
};
