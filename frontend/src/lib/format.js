import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";

export const relativeTime = (value) => {
    if (!value) return "";
    try {
        const d = new Date(value);
        if (isToday(d)) return format(d, "HH:mm");
        if (isYesterday(d)) return "Yesterday";
        const diffDays = (Date.now() - d.getTime()) / 86400000;
        if (diffDays < 7) return format(d, "EEEE");
        return format(d, "d MMM");
    } catch {
        return "";
    }
};

export const fullTime = (value) => {
    if (!value) return "";
    try {
        return format(new Date(value), "d MMM yyyy, HH:mm");
    } catch {
        return "";
    }
};

export const agoTime = (value) => {
    if (!value) return "";
    try {
        return formatDistanceToNow(new Date(value), { addSuffix: true });
    } catch {
        return "";
    }
};

export const readingTime = (words) => {
    const mins = Math.max(1, Math.round((words || 0) / 200));
    return `${mins} min read`;
};

export const isMac = () =>
    typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.platform || "");

export const modKey = () => (isMac() ? "⌘" : "Ctrl");

export const escapeHtml = (str) =>
    (str || "").replace(/[&<>"']/g, (c) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
    );

export const highlightHtml = (text, query) => {
    const safe = escapeHtml(text);
    if (!query || !query.trim()) return safe;
    const needle = query.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return safe.replace(new RegExp(`(${needle})`, "gi"), '<span class="search-hit">$1</span>');
};

export const downloadBlob = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
};

export const copyText = async (text) => {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        const ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        try {
            document.execCommand("copy");
            return true;
        } finally {
            ta.remove();
        }
    }
};

export const bulletsToHtml = (bullets, heading = "Summary") =>
    `<h3>${escapeHtml(heading)}</h3><ul>${bullets
        .map((b) => `<li><p>${escapeHtml(b)}</p></li>`)
        .join("")}</ul>`;

export const itemsToTaskHtml = (items, heading = "Action items") =>
    `<h3>${escapeHtml(heading)}</h3><ul data-type="taskList">${items
        .map(
            (i) =>
                `<li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div><p>${escapeHtml(
                    i,
                )}</p></div></li>`,
        )
        .join("")}</ul>`;

export const noteTitle = (note) => (note?.title || "").trim() || "Untitled note";

export const matchExcerpt = (text, query, length = 170) => {
    const flat = (text || "").replace(/\s+/g, " ").trim();
    const tail = (end) => (end < flat.length ? "…" : "");
    if (!query || !query.trim()) return flat.slice(0, length) + tail(length);
    const idx = flat.toLowerCase().indexOf(query.trim().toLowerCase());
    if (idx < 0) return flat.slice(0, length) + tail(length);
    const start = Math.max(0, idx - 45);
    const end = Math.min(flat.length, start + length);
    return (start > 0 ? "…" : "") + flat.slice(start, end) + tail(end);
};
