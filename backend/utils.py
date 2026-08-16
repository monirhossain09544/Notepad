"""HTML <-> text helpers used for search, word counts and export."""
import html as html_lib
import re

BLOCK_CLOSE = re.compile(
    r"</(p|div|h1|h2|h3|h4|li|blockquote|pre|tr)>", re.I
)
TAG = re.compile(r"<[^>]+>")


def html_to_text(raw: str) -> str:
    """Strip HTML down to readable plain text (used for search + AI + counts)."""
    if not raw:
        return ""
    text = re.sub(r"<br\s*/?>", "\n", raw, flags=re.I)
    text = BLOCK_CLOSE.sub("\n", text)
    text = TAG.sub("", text)
    text = html_lib.unescape(text)
    text = text.replace("\u00a0", " ")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def count_words(text: str) -> int:
    if not text:
        return 0
    return len([w for w in re.split(r"\s+", text.strip()) if w])


def make_snippet(text: str, length: int = 200) -> str:
    if not text:
        return ""
    flat = re.sub(r"\s+", " ", text).strip()
    return flat[:length] + ("\u2026" if len(flat) > length else "")


def slugify(value: str, fallback: str = "note") -> str:
    value = re.sub(r"[^a-zA-Z0-9\s-]", "", value or "").strip()
    value = re.sub(r"[\s_-]+", "-", value).lower()
    return value or fallback


def _strip(fragment: str) -> str:
    return html_lib.unescape(TAG.sub("", fragment or "")).strip()


def _ordered_list(match: re.Match) -> str:
    items = re.findall(r"<li[^>]*>(.*?)</li>", match.group(1), flags=re.I | re.S)
    lines = [f"{i + 1}. {_strip(it)}" for i, it in enumerate(items)]
    return "\n" + "\n".join(lines) + "\n"


def _unordered_list(match: re.Match) -> str:
    lines = []
    for m in re.finditer(r"<li([^>]*)>(.*?)</li>", match.group(1), flags=re.I | re.S):
        attrs, body = m.group(1) or "", m.group(2) or ""
        is_task = "taskitem" in attrs.lower() or 'type="checkbox"' in body.lower()
        checked = 'data-checked="true"' in attrs.lower() or "checked" in body.lower()
        text = _strip(body)
        if is_task:
            lines.append(("- [x] " if checked else "- [ ] ") + text)
        else:
            lines.append("- " + text)
    return "\n" + "\n".join(lines) + "\n"


def _blockquote(match: re.Match) -> str:
    body = _strip(match.group(1))
    return "\n" + "\n".join("> " + line for line in body.split("\n")) + "\n"


def _pre(match: re.Match) -> str:
    return "\n```\n" + _strip(match.group(1)) + "\n```\n"


def html_to_markdown(raw: str) -> str:
    """Small, dependency-free HTML -> Markdown converter for note export."""
    if not raw:
        return ""
    s = raw
    s = re.sub(r"<br\s*/?>", "  \n", s, flags=re.I)
    s = re.sub(r"<hr\s*/?>", "\n---\n", s, flags=re.I)
    s = re.sub(r"<pre[^>]*>(.*?)</pre>", _pre, s, flags=re.I | re.S)
    s = re.sub(r"<blockquote[^>]*>(.*?)</blockquote>", _blockquote, s, flags=re.I | re.S)
    s = re.sub(r"<ol[^>]*>(.*?)</ol>", _ordered_list, s, flags=re.I | re.S)
    s = re.sub(r"<ul[^>]*>(.*?)</ul>", _unordered_list, s, flags=re.I | re.S)
    for level in (1, 2, 3, 4):
        s = re.sub(
            rf"<h{level}[^>]*>(.*?)</h{level}>",
            lambda m, lv=level: "\n" + "#" * lv + " " + _strip(m.group(1)) + "\n",
            s,
            flags=re.I | re.S,
        )
    s = re.sub(r"<a [^>]*href=\"([^\"]*)\"[^>]*>(.*?)</a>", r"[\2](\1)", s, flags=re.I | re.S)
    s = re.sub(r"<(strong|b)[^>]*>(.*?)</\1>", r"**\2**", s, flags=re.I | re.S)
    s = re.sub(r"<(em|i)[^>]*>(.*?)</\1>", r"*\2*", s, flags=re.I | re.S)
    s = re.sub(r"<(s|del)[^>]*>(.*?)</\1>", r"~~\2~~", s, flags=re.I | re.S)
    s = re.sub(r"<mark[^>]*>(.*?)</mark>", r"==\1==", s, flags=re.I | re.S)
    s = re.sub(r"<code[^>]*>(.*?)</code>", r"`\1`", s, flags=re.I | re.S)
    s = re.sub(r"<p[^>]*>(.*?)</p>", lambda m: "\n" + _strip(m.group(1)) + "\n", s, flags=re.I | re.S)
    s = TAG.sub("", s)
    s = html_lib.unescape(s)
    s = re.sub(r"\n{3,}", "\n\n", s)
    return s.strip()
