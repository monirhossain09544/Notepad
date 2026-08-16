export const NOTE_COLORS = [
    { name: "None", value: null, hsl: null },
    { name: "Ocean", value: "ocean", hsl: "186 52% 44%" },
    { name: "Citrus", value: "citrus", hsl: "44 92% 55%" },
    { name: "Coral", value: "coral", hsl: "14 78% 58%" },
    { name: "Sage", value: "sage", hsl: "142 28% 42%" },
    { name: "Cobalt", value: "cobalt", hsl: "214 72% 56%" },
    { name: "Umber", value: "umber", hsl: "24 32% 42%" },
];

export const colorHsl = (value) =>
    NOTE_COLORS.find((c) => c.value === value)?.hsl || null;

export const TAG_COLORS = [
    { name: "Teal", hsl: "186 52% 44%" },
    { name: "Amber", hsl: "44 92% 55%" },
    { name: "Rose", hsl: "350 70% 58%" },
    { name: "Indigo", hsl: "226 62% 60%" },
    { name: "Green", hsl: "142 28% 42%" },
    { name: "Brown", hsl: "24 32% 42%" },
];

export const TONES = [
    { value: "professional", label: "Professional" },
    { value: "casual", label: "Casual & friendly" },
    { value: "concise", label: "Short & punchy" },
    { value: "confident", label: "Confident" },
    { value: "academic", label: "Academic" },
];

export const SORT_OPTIONS = [
    { value: "updated", label: "Last edited" },
    { value: "created", label: "Date created" },
    { value: "title", label: "Title A–Z" },
];

export const VIEWS = [
    { type: "all", label: "All notes", icon: "FileText" },
    { type: "pinned", label: "Pinned", icon: "Pin" },
    { type: "archive", label: "Archive", icon: "Archive" },
    { type: "trash", label: "Trash", icon: "Trash2" },
];

export const WELCOME_HTML = `<h1>Welcome to your notepad</h1><p>This is a real note — edit it, or throw it in the trash. Everything you write is saved automatically.</p><h2>Things worth trying</h2><ul data-type="taskList"><li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div><p>Press <code>Ctrl/⌘ + K</code> to open the command palette</p></div></li><li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div><p>Open the <strong>AI assistant</strong> and ask it to summarise this note</p></div></li><li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div><p>Create a folder and a couple of coloured tags in the sidebar</p></div></li><li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div><p>Hit the focus button for distraction-free writing</p></div></li></ul><h2>Formatting</h2><p>You get <strong>bold</strong>, <em>italic</em>, <u>underline</u>, <s>strikethrough</s>, <mark>highlight</mark>, <code>inline code</code>, headings, lists, checklists, quotes and code blocks.</p><blockquote><p>Write drunk, edit sober — or just let the assistant tidy it up for you.</p></blockquote>`;
