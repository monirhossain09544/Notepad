import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { toast } from "sonner";
import { api, errorMessage } from "../lib/api";
import { TAG_COLORS, WELCOME_HTML } from "../lib/constants";
import { downloadBlob, noteTitle } from "../lib/format";

const AppCtx = createContext(null);
export const useApp = () => useContext(AppCtx);

const SAVE_DELAY = 700;

export function AppProvider({ children }) {
    const [notes, setNotes] = useState([]);
    const [folders, setFolders] = useState([]);
    const [tags, setTags] = useState([]);
    const [stats, setStats] = useState({
        all: 0,
        pinned: 0,
        archive: 0,
        trash: 0,
        total: 0,
        words: 0,
        folders: {},
        tags: {},
    });

    const [view, setView] = useState({ type: "all", id: null, label: "All notes" });
    const [query, setQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [sort, setSort] = useState("updated");
    const [layout, setLayout] = useState(
        () => window.localStorage.getItem("np:layout") || "list",
    );

    const [activeId, setActiveId] = useState(null);
    const [activeNote, setActiveNote] = useState(null);
    const [listLoading, setListLoading] = useState(true);
    const [booting, setBooting] = useState(true);
    const [saveStatus, setSaveStatus] = useState("idle");
    const [focusMode, setFocusMode] = useState(false);
    const [aiOpen, setAiOpen] = useState(false);
    const [navOpen, setNavOpen] = useState(false);
    const [listOpen, setListOpen] = useState(false);
    const [paletteOpen, setPaletteOpen] = useState(false);
    const [shortcutsOpen, setShortcutsOpen] = useState(false);
    const [statsOpen, setStatsOpen] = useState(false);

    const editorRef = useRef(null);
    const dirtyRef = useRef({ id: null, patch: {} });
    const timerRef = useRef(null);
    const activeIdRef = useRef(null);
    const firstLoad = useRef(true);

    useEffect(() => {
        activeIdRef.current = activeId;
    }, [activeId]);

    useEffect(() => {
        window.localStorage.setItem("np:layout", layout);
    }, [layout]);

    useEffect(() => {
        const t = setTimeout(() => setDebouncedQuery(query.trim()), 220);
        return () => clearTimeout(t);
    }, [query]);

    const registerEditor = useCallback((editor) => {
        editorRef.current = editor;
    }, []);

    /* ------------------------------------------------------------------ load */
    const loadMeta = useCallback(async () => {
        try {
            const [f, t, s] = await Promise.all([
                api.folders.list(),
                api.tags.list(),
                api.stats(),
            ]);
            setFolders(f);
            setTags(t);
            setStats(s);
        } catch (error) {
            console.error("meta load failed", error);
        }
    }, []);

    const loadNotes = useCallback(async () => {
        setListLoading(true);
        try {
            const params = { view: view.type, sort };
            if (view.type === "folder") params.folder_id = view.id;
            if (view.type === "tag") params.tag_id = view.id;
            if (debouncedQuery) params.q = debouncedQuery;
            const data = await api.notes.list(params);
            setNotes(data);
            return data;
        } catch (error) {
            toast.error(errorMessage(error, "Could not load notes"));
            return [];
        } finally {
            setListLoading(false);
        }
    }, [view, sort, debouncedQuery]);

    const openNote = useCallback(async (id, { flush } = {}) => {
        if (flush) await flush();
        try {
            const note = await api.notes.get(id);
            setActiveId(note.id);
            setActiveNote(note);
            setSaveStatus("idle");
            window.localStorage.setItem("np:lastNote", note.id);
            return note;
        } catch (error) {
            toast.error(errorMessage(error, "Could not open note"));
            return null;
        }
    }, []);

    /* ------------------------------------------------------------------ save */
    const mergeIntoList = useCallback((updated) => {
        setNotes((prev) =>
            prev.map((n) => (n.id === updated.id ? { ...n, ...updated } : n)),
        );
    }, []);

    const flushSave = useCallback(async () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        const { id, patch } = dirtyRef.current;
        if (!id || Object.keys(patch).length === 0) return null;
        dirtyRef.current = { id: null, patch: {} };
        setSaveStatus("saving");
        try {
            const updated = await api.notes.update(id, patch);
            mergeIntoList(updated);
            setActiveNote((prev) =>
                prev && prev.id === updated.id
                    ? {
                          ...prev,
                          updated_at: updated.updated_at,
                          plain_text: updated.plain_text,
                          word_count: updated.word_count,
                          snippet: updated.snippet,
                      }
                    : prev,
            );
            setSaveStatus("saved");
            loadMeta();
            return updated;
        } catch (error) {
            setSaveStatus("error");
            toast.error(errorMessage(error, "Could not save this note"));
            return null;
        }
    }, [mergeIntoList, loadMeta]);

    const scheduleSave = useCallback(
        (patch) => {
            const id = activeIdRef.current;
            if (!id) return;
            dirtyRef.current = {
                id,
                patch: { ...(dirtyRef.current.id === id ? dirtyRef.current.patch : {}), ...patch },
            };
            setSaveStatus("unsaved");
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => {
                flushSave();
            }, SAVE_DELAY);
        },
        [flushSave],
    );

    const updateActive = useCallback(
        (patch, { immediate } = {}) => {
            setActiveNote((prev) => (prev ? { ...prev, ...patch } : prev));
            if (patch.title !== undefined) {
                setNotes((prev) =>
                    prev.map((n) =>
                        n.id === activeIdRef.current ? { ...n, title: patch.title } : n,
                    ),
                );
            }
            scheduleSave(patch);
            if (immediate) return flushSave();
            return undefined;
        },
        [scheduleSave, flushSave],
    );

    const selectNote = useCallback(
        async (id) => {
            if (id === activeIdRef.current) return;
            await flushSave();
            await openNote(id);
            setAiOpen(false);
        },
        [flushSave, openNote],
    );

    /* --------------------------------------------------------------- boot */
    useEffect(() => {
        loadMeta();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const data = await loadNotes();
            if (cancelled) return;
            if (firstLoad.current) {
                firstLoad.current = false;
                if (data.length > 0) {
                    const last = window.localStorage.getItem("np:lastNote");
                    const target = last && data.some((n) => n.id === last) ? last : data[0].id;
                    await openNote(target);
                }
                setBooting(false);
            }
        })();
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loadNotes]);

    /* ------------------------------------------------------------ mutations */
    const refresh = useCallback(async () => {
        await Promise.all([loadNotes(), loadMeta()]);
    }, [loadNotes, loadMeta]);

    const createNote = useCallback(
        async ({ html = "", title = "", folderId, tagIds } = {}) => {
            await flushSave();
            try {
                const body = {
                    title,
                    html_content: html,
                    folder_id: folderId ?? (view.type === "folder" ? view.id : null),
                    tag_ids: tagIds ?? (view.type === "tag" ? [view.id] : []),
                };
                const note = await api.notes.create(body);
                if (view.type === "archive" || view.type === "trash" || view.type === "pinned") {
                    setView({ type: "all", id: null, label: "All notes" });
                }
                setNotes((prev) => [note, ...prev]);
                setActiveId(note.id);
                setActiveNote(note);
                setSaveStatus("idle");
                window.localStorage.setItem("np:lastNote", note.id);
                loadMeta();
                return note;
            } catch (error) {
                toast.error(errorMessage(error, "Could not create note"));
                return null;
            }
        },
        [flushSave, view, loadMeta],
    );

    const createWelcomeNote = useCallback(
        () => createNote({ html: WELCOME_HTML, title: "Welcome to your notepad" }),
        [createNote],
    );

    const afterMutation = useCallback(
        async (updated, { close } = {}) => {
            await refresh();
            if (close && activeIdRef.current === updated?.id) {
                setActiveId(null);
                setActiveNote(null);
            } else if (updated && activeIdRef.current === updated.id) {
                setActiveNote((prev) => (prev ? { ...prev, ...updated } : prev));
            }
        },
        [refresh],
    );

    const togglePin = useCallback(
        async (note) => {
            try {
                const updated = await api.notes.pin(note.id, !note.pinned);
                toast.success(updated.pinned ? "Pinned to top" : "Unpinned");
                await afterMutation(updated);
            } catch (error) {
                toast.error(errorMessage(error));
            }
        },
        [afterMutation],
    );

    const toggleArchive = useCallback(
        async (note) => {
            try {
                const updated = await api.notes.archive(note.id, !note.archived);
                toast.success(updated.archived ? "Moved to archive" : "Restored from archive");
                await afterMutation(updated, { close: updated.archived });
            } catch (error) {
                toast.error(errorMessage(error));
            }
        },
        [afterMutation],
    );

    const trashNote = useCallback(
        async (note) => {
            try {
                const updated = await api.notes.trash(note.id);
                toast.success(`"${noteTitle(note)}" moved to trash`, {
                    action: {
                        label: "Undo",
                        onClick: async () => {
                            await api.notes.restore(note.id);
                            await refresh();
                        },
                    },
                });
                await afterMutation(updated, { close: true });
            } catch (error) {
                toast.error(errorMessage(error));
            }
        },
        [afterMutation, refresh],
    );

    const restoreNote = useCallback(
        async (note) => {
            try {
                const updated = await api.notes.restore(note.id);
                toast.success("Note restored");
                await refresh();
                await openNote(updated.id);
            } catch (error) {
                toast.error(errorMessage(error));
            }
        },
        [refresh, openNote],
    );

    const deleteNote = useCallback(
        async (note) => {
            try {
                await api.notes.remove(note.id);
                toast.success("Note deleted permanently");
                if (activeIdRef.current === note.id) {
                    setActiveId(null);
                    setActiveNote(null);
                }
                await refresh();
            } catch (error) {
                toast.error(errorMessage(error));
            }
        },
        [refresh],
    );

    const emptyTrash = useCallback(async () => {
        try {
            const res = await api.notes.emptyTrash();
            toast.success(`Trash emptied (${res.deleted} note${res.deleted === 1 ? "" : "s"})`);
            setActiveId(null);
            setActiveNote(null);
            await refresh();
        } catch (error) {
            toast.error(errorMessage(error));
        }
    }, [refresh]);

    const duplicateNote = useCallback(
        async (note) => {
            await flushSave();
            try {
                const copy = await api.notes.duplicate(note.id);
                toast.success("Note duplicated");
                await refresh();
                await openNote(copy.id);
            } catch (error) {
                toast.error(errorMessage(error));
            }
        },
        [flushSave, refresh, openNote],
    );

    const exportNote = useCallback(
        async (note, format) => {
            await flushSave();
            try {
                const res = await api.notes.exportFile(note.id, format);
                const slug =
                    noteTitle(note)
                        .toLowerCase()
                        .replace(/[^a-z0-9\s-]/g, "")
                        .trim()
                        .replace(/[\s_-]+/g, "-") || "note";
                downloadBlob(res.data, `${slug}.${format}`);
                toast.success(`Exported as .${format}`);
            } catch (error) {
                toast.error(errorMessage(error, "Export failed"));
            }
        },
        [flushSave],
    );

    /* ------------------------------------------------------- folders & tags */
    const createFolder = useCallback(
        async (name) => {
            try {
                const folder = await api.folders.create(name);
                toast.success(`Folder "${folder.name}" created`);
                await loadMeta();
                return folder;
            } catch (error) {
                toast.error(errorMessage(error));
                return null;
            }
        },
        [loadMeta],
    );

    const renameFolder = useCallback(
        async (id, name) => {
            try {
                await api.folders.update(id, name);
                await loadMeta();
                toast.success("Folder renamed");
            } catch (error) {
                toast.error(errorMessage(error));
            }
        },
        [loadMeta],
    );

    const deleteFolder = useCallback(
        async (folder) => {
            try {
                await api.folders.remove(folder.id);
                toast.success(`Folder "${folder.name}" removed`);
                if (view.type === "folder" && view.id === folder.id) {
                    setView({ type: "all", id: null, label: "All notes" });
                }
                await refresh();
            } catch (error) {
                toast.error(errorMessage(error));
            }
        },
        [refresh, view],
    );

    const createTag = useCallback(
        async (name, color) => {
            try {
                const tag = await api.tags.create(
                    name,
                    color || TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)].hsl,
                );
                await loadMeta();
                return tag;
            } catch (error) {
                toast.error(errorMessage(error));
                return null;
            }
        },
        [loadMeta],
    );

    const updateTag = useCallback(
        async (id, body) => {
            try {
                await api.tags.update(id, body);
                await loadMeta();
                await loadNotes();
            } catch (error) {
                toast.error(errorMessage(error));
            }
        },
        [loadMeta, loadNotes],
    );

    const deleteTag = useCallback(
        async (tag) => {
            try {
                await api.tags.remove(tag.id);
                toast.success(`Tag "${tag.name}" removed`);
                if (view.type === "tag" && view.id === tag.id) {
                    setView({ type: "all", id: null, label: "All notes" });
                }
                await refresh();
                if (activeIdRef.current) {
                    setActiveNote((prev) =>
                        prev
                            ? { ...prev, tag_ids: (prev.tag_ids || []).filter((t) => t !== tag.id) }
                            : prev,
                    );
                }
            } catch (error) {
                toast.error(errorMessage(error));
            }
        },
        [refresh, view],
    );

    const ensureTag = useCallback(
        async (name) => {
            const clean = (name || "").trim().toLowerCase();
            if (!clean) return null;
            const existing = tags.find((t) => t.name === clean);
            if (existing) return existing;
            return createTag(clean);
        },
        [tags, createTag],
    );

    const setNoteTags = useCallback(
        async (tagIds) => {
            await updateActive({ tag_ids: tagIds }, { immediate: true });
            setNotes((prev) =>
                prev.map((n) => (n.id === activeIdRef.current ? { ...n, tag_ids: tagIds } : n)),
            );
            loadMeta();
        },
        [updateActive, loadMeta],
    );

    /* The stats panel is anchored to the sidebar footer, so make sure the sidebar
       is actually on screen before opening it (mobile sheet / focus mode). */
    const revealStats = useCallback(() => {
        const needsSheet = window.innerWidth < 1024;
        setFocusMode(false);
        if (needsSheet) setNavOpen(true);
        setTimeout(() => setStatsOpen(true), needsSheet ? 320 : 40);
    }, []);

    const value = useMemo(
        () => ({
            notes,
            folders,
            tags,
            stats,
            view,
            setView,
            query,
            setQuery,
            debouncedQuery,
            sort,
            setSort,
            layout,
            setLayout,
            activeId,
            activeNote,
            listLoading,
            booting,
            saveStatus,
            focusMode,
            setFocusMode,
            aiOpen,
            setAiOpen,
            navOpen,
            setNavOpen,
            listOpen,
            setListOpen,
            revealStats,
            paletteOpen,
            setPaletteOpen,
            shortcutsOpen,
            setShortcutsOpen,
            statsOpen,
            setStatsOpen,
            editorRef,
            registerEditor,
            selectNote,
            openNote,
            updateActive,
            flushSave,
            createNote,
            createWelcomeNote,
            togglePin,
            toggleArchive,
            trashNote,
            restoreNote,
            deleteNote,
            emptyTrash,
            duplicateNote,
            exportNote,
            createFolder,
            renameFolder,
            deleteFolder,
            createTag,
            updateTag,
            deleteTag,
            ensureTag,
            setNoteTags,
            refresh,
        }),
        [
            notes,
            folders,
            tags,
            stats,
            view,
            query,
            debouncedQuery,
            sort,
            layout,
            activeId,
            activeNote,
            listLoading,
            booting,
            saveStatus,
            focusMode,
            aiOpen,
            navOpen,
            listOpen,
            revealStats,
            paletteOpen,
            shortcutsOpen,
            statsOpen,
            registerEditor,
            selectNote,
            openNote,
            updateActive,
            flushSave,
            createNote,
            createWelcomeNote,
            togglePin,
            toggleArchive,
            trashNote,
            restoreNote,
            deleteNote,
            emptyTrash,
            duplicateNote,
            exportNote,
            createFolder,
            renameFolder,
            deleteFolder,
            createTag,
            updateTag,
            deleteTag,
            ensureTag,
            setNoteTags,
            refresh,
        ],
    );

    return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}
