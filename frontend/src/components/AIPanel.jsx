import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    ArrowRight,
    Check,
    CornerDownLeft,
    Copy,
    Eraser,
    ListChecks,
    ListTree,
    Loader2,
    PenLine,
    RefreshCw,
    Sparkles,
    Tags,
    Type,
    Wand2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Skeleton } from "./ui/skeleton";
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

const QUICK_ACTIONS = [
    { key: "title", label: "Suggest title", Icon: Type },
    { key: "summarize", label: "Summarise", Icon: ListTree },
    { key: "improve", label: "Improve writing", Icon: Wand2 },
    { key: "continue", label: "Continue writing", Icon: PenLine },
    { key: "action-items", label: "Action items", Icon: ListChecks },
    { key: "suggest-tags", label: "Suggest tags", Icon: Tags },
];

const Thinking = () => (
    <div className="rounded-[var(--radius-md)] border border-border bg-[hsl(var(--surface-1))] p-3">
        <p role="status" className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Sparkles className="mr-1 h-3.5 w-3.5 text-[hsl(var(--accent))]" /> Thinking
            <span className="dot-1">.</span>
            <span className="dot-2">.</span>
            <span className="dot-3">.</span>
        </p>
        <Skeleton className="mt-3 h-3 w-full" />
        <Skeleton className="mt-2 h-3 w-4/5" />
        <Skeleton className="mt-2 h-3 w-2/3" />
    </div>
);

export const AIPanel = () => {
    const { activeNote, editorRef, flushSave, updateActive, ensureTag, setNoteTags, tags } = useApp();

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
                /* chat history is best effort */
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

    const renderResult = () => {
        if (!result) return null;
        const { action, data } = result;

        if (action === "title") {
            return (
                <div
                    className="rounded-[var(--radius-md)] border border-border bg-[hsl(var(--surface-1))] p-3 shadow-[var(--shadow-sm)]"
                    data-testid="ai-result-title"
                >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                        Suggested title
                    </p>
                    <p className="mt-2 text-base font-semibold" style={{ fontFamily: "var(--font-editor)" }}>
                        {data.title}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                            size="sm"
                            data-testid="ai-apply-title-btn"
                            onClick={() => {
                                updateActive({ title: data.title }, { immediate: true });
                                toast.success("Title applied");
                            }}
                            className="h-8 rounded-[10px] bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] hover:bg-[hsl(var(--accent))]/90"
                        >
                            <Check className="mr-1.5 h-3.5 w-3.5" /> Use this title
                        </Button>
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => runAction("title")}
                            className="h-8 rounded-[10px]"
                        >
                            <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Try again
                        </Button>
                    </div>
                </div>
            );
        }

        if (action === "summarize" || action === "action-items") {
            const items = action === "summarize" ? data.bullets || [] : data.items || [];
            const heading = action === "summarize" ? "Summary" : "Action items";
            return (
                <div
                    className="rounded-[var(--radius-md)] border border-border bg-[hsl(var(--surface-1))] p-3 shadow-[var(--shadow-sm)]"
                    data-testid={`ai-result-${action}`}
                >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                        {heading}
                    </p>
                    {items.length === 0 ? (
                        <p className="mt-2 text-sm text-muted-foreground">Nothing found in this note yet.</p>
                    ) : (
                        <ul className="mt-2 space-y-1.5">
                            {items.map((item, i) => (
                                <li key={i} className="flex gap-2 text-sm leading-relaxed">
                                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[hsl(var(--accent))]" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                    {items.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                            <Button
                                size="sm"
                                data-testid={`ai-insert-${action}-btn`}
                                onClick={() =>
                                    insertAtEnd(
                                        action === "summarize"
                                            ? bulletsToHtml(items, heading)
                                            : itemsToTaskHtml(items, heading),
                                    )
                                }
                                className="h-8 rounded-[10px] bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] hover:bg-[hsl(var(--accent))]/90"
                            >
                                <ArrowRight className="mr-1.5 h-3.5 w-3.5" />
                                {action === "summarize" ? "Insert summary" : "Insert checklist"}
                            </Button>
                            <Button
                                size="sm"
                                variant="secondary"
                                onClick={async () => {
                                    await copyText(items.map((i) => `- ${i}`).join("\n"));
                                    toast.success("Copied");
                                }}
                                className="h-8 rounded-[10px]"
                            >
                                <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy
                            </Button>
                        </div>
                    )}
                </div>
            );
        }

        if (action === "suggest-tags") {
            const suggested = data.tags || [];
            return (
                <div
                    className="rounded-[var(--radius-md)] border border-border bg-[hsl(var(--surface-1))] p-3 shadow-[var(--shadow-sm)]"
                    data-testid="ai-result-suggest-tags"
                >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                        Suggested tags
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                        {suggested.map((name) => (
                            <button
                                key={name}
                                type="button"
                                onClick={() => applyTags([name])}
                                className="rounded-full border border-border bg-[hsl(var(--surface-2))] px-2.5 py-1 text-xs transition-colors duration-150 hover:bg-[hsl(var(--surface-3))]"
                            >
                                #{name}
                            </button>
                        ))}
                    </div>
                    {suggested.length > 0 && (
                        <Button
                            size="sm"
                            data-testid="ai-apply-tags-btn"
                            onClick={() => applyTags(suggested)}
                            className="mt-3 h-8 rounded-[10px] bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] hover:bg-[hsl(var(--accent))]/90"
                        >
                            <Check className="mr-1.5 h-3.5 w-3.5" /> Add all tags
                        </Button>
                    )}
                </div>
            );
        }

        const html = data.html || "";
        const isContinue = action === "continue";
        const label = isContinue
            ? "Suggested continuation"
            : action === "tone"
              ? `Rewritten in a ${data.tone || tone} tone`
              : "Improved draft";
        return (
            <div
                className="rounded-[var(--radius-md)] border border-border bg-[hsl(var(--surface-1))] p-3 shadow-[var(--shadow-sm)]"
                data-testid={`ai-result-${action}`}
            >
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    {label}
                </p>
                <div
                    className="note-prose thin-scroll mt-2 max-h-64 overflow-y-auto rounded-[10px] bg-[hsl(var(--surface-2))] p-3"
                    dangerouslySetInnerHTML={{ __html: html }}
                />
                <div className="mt-3 flex flex-wrap gap-2">
                    {isContinue ? (
                        <Button
                            size="sm"
                            data-testid="ai-insert-continue-btn"
                            onClick={() => insertAtEnd(html)}
                            className="h-8 rounded-[10px] bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] hover:bg-[hsl(var(--accent))]/90"
                        >
                            <ArrowRight className="mr-1.5 h-3.5 w-3.5" /> Add to note
                        </Button>
                    ) : (
                        <>
                            <Button
                                size="sm"
                                data-testid="ai-replace-note-btn"
                                onClick={() => replaceAll(html)}
                                className="h-8 rounded-[10px] bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] hover:bg-[hsl(var(--accent))]/90"
                            >
                                <Check className="mr-1.5 h-3.5 w-3.5" /> Replace note
                            </Button>
                            <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => insertAtEnd(html)}
                                className="h-8 rounded-[10px]"
                            >
                                Append instead
                            </Button>
                        </>
                    )}
                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => runAction(action, action === "tone" ? { tone } : {})}
                        className="h-8 rounded-[10px]"
                    >
                        <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Retry
                    </Button>
                </div>
            </div>
        );
    };

    return (
        <div className="flex h-full min-h-0 flex-col bg-popover text-popover-foreground">
            <div className="flex items-start justify-between gap-3 border-b border-border bg-popover px-4 py-3.5 pr-12">
                <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm font-semibold">
                        <Sparkles className="h-4 w-4 text-[hsl(var(--accent))]" /> AI assistant
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        Working on “{noteTitle(activeNote)}”
                    </p>
                </div>
            </div>

            <div className="thin-scroll min-h-0 flex-1 overflow-y-auto px-4 py-4">
                <div className="grid grid-cols-2 gap-2">
                    {QUICK_ACTIONS.map(({ key, label: actionLabel, Icon }) => (
                        <button
                            key={key}
                            type="button"
                            disabled={Boolean(busy)}
                            data-testid={`ai-action-${key}`}
                            onClick={() => runAction(key)}
                            className="flex items-center gap-2 rounded-[12px] border border-border bg-[hsl(var(--surface-1))] px-3 py-2.5 text-left text-xs font-medium transition-colors duration-200 hover:bg-[hsl(var(--surface-2))] disabled:opacity-50"
                        >
                            {busy === key ? (
                                <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-[hsl(var(--accent))]" />
                            ) : (
                                <Icon className="h-3.5 w-3.5 shrink-0 text-[hsl(var(--accent))]" />
                            )}
                            <span className="truncate">{actionLabel}</span>
                        </button>
                    ))}
                </div>

                <div className="mt-2 flex items-center gap-2">
                    <Select value={tone} onValueChange={setTone}>
                        <SelectTrigger
                            className="h-9 flex-1 rounded-[12px] border-border bg-[hsl(var(--surface-1))] text-xs"
                            data-testid="ai-tone-select"
                        >
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover">
                            {TONES.map((t) => (
                                <SelectItem key={t.value} value={t.value} className="text-xs">
                                    {t.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button
                        size="sm"
                        variant="secondary"
                        disabled={Boolean(busy)}
                        data-testid="ai-action-tone"
                        onClick={() => runAction("tone", { tone })}
                        className="h-9 rounded-[12px] text-xs"
                    >
                        {busy === "tone" ? (
                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        ) : (
                            <Wand2 className="mr-1.5 h-3.5 w-3.5" />
                        )}
                        Rewrite tone
                    </Button>
                </div>

                <div className="mt-4">
                    {busy ? (
                        <Thinking />
                    ) : (
                        renderResult() || (
                            <p className="rounded-[var(--radius-md)] border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
                                Pick an action above, or ask a question about this note below.
                            </p>
                        )
                    )}
                </div>

                <div className="mt-6">
                    <div className="flex items-center justify-between pb-2">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                            Ask about this note
                        </p>
                        {messages.length > 0 && (
                            <button
                                type="button"
                                onClick={clearChat}
                                data-testid="ai-clear-chat-btn"
                                className="flex items-center gap-1 text-[11px] text-muted-foreground transition-colors duration-150 hover:text-foreground"
                            >
                                <Eraser className="h-3 w-3" /> Clear
                            </button>
                        )}
                    </div>
                    <div className="space-y-2" data-testid="ai-chat-thread">
                        {messages.length === 0 && !streaming && (
                            <p className="text-xs text-muted-foreground">
                                Try “what did I decide here?” or “list the open questions”.
                            </p>
                        )}
                        {messages.map((m, i) => (
                            <div
                                key={i}
                                className={`max-w-[92%] whitespace-pre-wrap rounded-[12px] px-3 py-2 text-sm leading-relaxed ${
                                    m.role === "user"
                                        ? "ml-auto bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]"
                                        : "bg-[hsl(var(--surface-2))] text-foreground"
                                }`}
                            >
                                {m.content}
                            </div>
                        ))}
                        {streaming && (
                            <div className="max-w-[92%] whitespace-pre-wrap rounded-[12px] bg-[hsl(var(--surface-2))] px-3 py-2 text-sm leading-relaxed">
                                {streamText || (
                                    <span className="text-muted-foreground">
                                        Reading your note<span className="dot-1">.</span>
                                        <span className="dot-2">.</span>
                                        <span className="dot-3">.</span>
                                    </span>
                                )}
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>
                </div>
            </div>

            <div className="border-t border-border bg-popover px-4 py-3">
                <div className="flex items-center gap-2">
                    <Input
                        value={question}
                        placeholder="Ask anything about this note…"
                        data-testid="ai-question-input"
                        disabled={streaming}
                        onChange={(e) => setQuestion(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && ask()}
                        className="h-10 rounded-[12px] bg-[hsl(var(--surface-1))] text-sm"
                    />
                    <Button
                        onClick={ask}
                        disabled={streaming || !question.trim()}
                        aria-label="Send question"
                        data-testid="ai-ask-btn"
                        className="h-10 w-10 shrink-0 rounded-[12px] bg-[hsl(var(--accent))] p-0 text-[hsl(var(--accent-foreground))] hover:bg-[hsl(var(--accent))]/90"
                    >
                        {streaming ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <CornerDownLeft className="h-4 w-4" />
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
};
