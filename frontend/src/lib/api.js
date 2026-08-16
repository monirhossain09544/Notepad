import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";
export const API_BASE = `${BACKEND_URL}/api`;

const http = axios.create({
    baseURL: API_BASE,
    headers: { "Content-Type": "application/json" },
});

const data = (p) => p.then((r) => r.data);

export const errorMessage = (error, fallback = "Something went wrong") =>
    error?.response?.data?.detail || error?.message || fallback;

export const api = {
    health: () => data(http.get("/")),
    stats: () => data(http.get("/stats")),
    notes: {
        list: (params) => data(http.get("/notes", { params })),
        get: (id) => data(http.get(`/notes/${id}`)),
        create: (body) => data(http.post("/notes", body || {})),
        update: (id, body) => data(http.put(`/notes/${id}`, body)),
        duplicate: (id) => data(http.post(`/notes/${id}/duplicate`)),
        pin: (id, value) => data(http.post(`/notes/${id}/pin`, { value })),
        archive: (id, value) => data(http.post(`/notes/${id}/archive`, { value })),
        trash: (id) => data(http.post(`/notes/${id}/trash`)),
        restore: (id) => data(http.post(`/notes/${id}/restore`)),
        remove: (id) => data(http.delete(`/notes/${id}`)),
        emptyTrash: () => data(http.post("/notes/trash/empty")),
        exportFile: (id, format) =>
            http.get(`/notes/${id}/export`, {
                params: { format },
                responseType: "blob",
            }),
        chat: (id) => data(http.get(`/notes/${id}/chat`)),
        clearChat: (id) => data(http.delete(`/notes/${id}/chat`)),
    },
    folders: {
        list: () => data(http.get("/folders")),
        create: (name) => data(http.post("/folders", { name })),
        update: (id, name) => data(http.put(`/folders/${id}`, { name })),
        remove: (id) => data(http.delete(`/folders/${id}`)),
    },
    tags: {
        list: () => data(http.get("/tags")),
        create: (name, color) => data(http.post("/tags", { name, color })),
        update: (id, body) => data(http.put(`/tags/${id}`, body)),
        remove: (id) => data(http.delete(`/tags/${id}`)),
    },
    ai: {
        run: (action, body) => data(http.post(`/ai/${action}`, body)),
        ask: (body) => data(http.post("/ai/ask", body)),
        streamUrl: `${API_BASE}/ai/ask/stream`,
    },
};

export default api;
