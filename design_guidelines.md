{
  "meta": {
    "product": "Modern Note Pad (3-pane workspace)",
    "route_model": "single-route SPA",
    "modes": ["light", "dark"],
    "design_personality": {
      "keywords": [
        "calm",
        "editorial",
        "keyboard-first",
        "premium",
        "fast",
        "quietly expressive"
      ],
      "fusion_inspiration": [
        {
          "source": "Bear / Apple Notes",
          "take": "warm paper-like surfaces + generous line-height + minimal chrome"
        },
        {
          "source": "Notion / Linear",
          "take": "crisp navigation density + strong focus rings + command palette-first IA"
        },
        {
          "source": "Modern AI workspaces",
          "take": "AI as contextual actions + right drawer with solid surface (no transparency)"
        }
      ],
      "layout_principle": "Desktop-first 3-pane with resizable rails; mobile collapses to stacked panes with persistent top bar + bottom quick actions"
    },
    "hard_rules": {
      "no_transparent_floating_surfaces": true,
      "theme_toggle_persisted": true,
      "no_universal_transition_all": true,
      "no_centered_app_container": true,
      "data_testid_required": true
    }
  },

  "typography": {
    "google_fonts_import": {
      "instructions": "Add to /app/frontend/public/index.html <head> (preferred) OR import in index.css. Use display=swap.",
      "links": [
        "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Instrument+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
      ]
    },
    "font_families": {
      "ui": "Instrument Sans, ui-sans-serif, system-ui",
      "editor_serif": "Fraunces, ui-serif, Georgia",
      "mono": "JetBrains Mono, ui-monospace, SFMono-Regular"
    },
    "why_this_pairing": "Instrument Sans keeps navigation crisp and dense; Fraunces adds a premium editorial voice in the writing surface without feeling old-fashioned; JetBrains Mono is highly legible for inline/code blocks.",

    "type_scale_ui_tailwind": {
      "h1": "text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-[-0.02em]",
      "h2": "text-base md:text-lg font-medium text-muted-foreground",
      "body": "text-sm md:text-base",
      "small": "text-xs text-muted-foreground"
    },

    "editor_prose_rules": {
      "measure": "Target 62–72ch for body text; clamp editor content width to max-w-[72ch] in focus mode; in normal mode allow max-w-[78ch] but keep padding generous.",
      "base": {
        "font": "font-[var(--font-editor)]",
        "size": "text-[15px] sm:text-[16px] lg:text-[17px]",
        "line_height": "leading-[1.75]",
        "letter_spacing": "tracking-[-0.005em]"
      },
      "headings": {
        "h1": "text-[28px] sm:text-[32px] lg:text-[36px] leading-[1.15] tracking-[-0.02em] font-semibold",
        "h2": "text-[22px] sm:text-[24px] lg:text-[28px] leading-[1.2] tracking-[-0.015em] font-semibold",
        "h3": "text-[18px] sm:text-[20px] lg:text-[22px] leading-[1.25] tracking-[-0.01em] font-semibold"
      },
      "paragraphs_lists": {
        "p": "my-3",
        "ul_ol": "my-3 pl-6",
        "li": "my-1",
        "task_list": "flex items-start gap-2"
      },
      "inline": {
        "a": "underline underline-offset-4 decoration-[hsl(var(--link))] hover:decoration-[hsl(var(--link-hover))]",
        "mark_highlight": "bg-[hsl(var(--highlight))] text-[hsl(var(--highlight-foreground))] rounded px-1",
        "inline_code": "font-mono text-[0.92em] bg-[hsl(var(--code-bg))] text-[hsl(var(--code-fg))] px-1.5 py-0.5 rounded-md"
      },
      "blocks": {
        "blockquote": "border-l-2 border-[hsl(var(--border))] pl-4 italic text-[hsl(var(--muted-foreground))]",
        "code_block": "font-mono text-[13px] sm:text-[14px] leading-[1.6] bg-[hsl(var(--code-bg))] text-[hsl(var(--code-fg))] rounded-xl p-4 border border-[hsl(var(--border))]",
        "hr": "my-6 border-[hsl(var(--border))]"
      },
      "selection": "Use ::selection with a soft accent wash (no neon).",
      "tiptap_container": "Apply these styles to .tiptap (or .ProseMirror) inside the editor pane; ensure no layout shift while typing (avoid dynamic margins based on selection)."
    }
  },

  "color_system": {
    "notes": "No purple for AI/chat accents. Use ocean-teal + warm sand + ink neutrals. Gradients only as subtle section background accents (<20% viewport).",

    "css_tokens": {
      "light": "/* Light theme tokens (HSL) */\n:root {\n  --font-ui: 'Instrument Sans';\n  --font-editor: 'Fraunces';\n  --font-mono: 'JetBrains Mono';\n\n  --background: 36 33% 98%; /* warm paper */\n  --foreground: 222 22% 12%; /* ink */\n\n  --surface-1: 0 0% 100%;\n  --surface-2: 36 25% 96%;\n  --surface-3: 36 18% 93%;\n\n  --card: var(--surface-1);\n  --card-foreground: var(--foreground);\n\n  --popover: 36 33% 99%; /* SOLID */\n  --popover-foreground: var(--foreground);\n\n  --muted: 36 18% 94%;\n  --muted-foreground: 222 10% 42%;\n\n  --border: 30 14% 86%;\n  --input: 30 14% 86%;\n\n  --primary: 222 22% 12%;\n  --primary-foreground: 36 33% 98%;\n\n  --secondary: 36 18% 94%;\n  --secondary-foreground: 222 22% 12%;\n\n  --accent: 186 52% 40%; /* ocean teal */\n  --accent-foreground: 0 0% 100%;\n\n  --ring: 186 52% 40%;\n\n  --link: 186 60% 34%;\n  --link-hover: 186 70% 28%;\n\n  --highlight: 44 92% 85%;\n  --highlight-foreground: 222 22% 12%;\n\n  --code-bg: 36 22% 94%;\n  --code-fg: 222 22% 12%;\n\n  --destructive: 0 72% 52%;\n  --destructive-foreground: 0 0% 100%;\n\n  --shadow-color: 222 22% 12%;\n\n  --radius-sm: 10px;\n  --radius-md: 14px;\n  --radius-lg: 18px;\n\n  --shadow-sm: 0 1px 0 hsl(var(--shadow-color) / 0.04), 0 8px 24px hsl(var(--shadow-color) / 0.06);\n  --shadow-md: 0 2px 0 hsl(var(--shadow-color) / 0.05), 0 18px 50px hsl(var(--shadow-color) / 0.10);\n\n  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);\n  --ease-in: cubic-bezier(0.7, 0, 0.84, 0);\n  --dur-1: 120ms;\n  --dur-2: 180ms;\n  --dur-3: 240ms;\n}\n",
      "dark": "/* Dark theme tokens (HSL) */\n.dark {\n  --background: 222 22% 8%; /* deep ink */\n  --foreground: 36 33% 96%;\n\n  --surface-1: 222 20% 10%;\n  --surface-2: 222 18% 12%;\n  --surface-3: 222 16% 14%;\n\n  --card: var(--surface-2);\n  --card-foreground: var(--foreground);\n\n  --popover: 222 18% 12%; /* SOLID */\n  --popover-foreground: var(--foreground);\n\n  --muted: 222 16% 14%;\n  --muted-foreground: 36 10% 70%;\n\n  --border: 222 14% 18%;\n  --input: 222 14% 18%;\n\n  --primary: 36 33% 96%;\n  --primary-foreground: 222 22% 8%;\n\n  --secondary: 222 16% 14%;\n  --secondary-foreground: 36 33% 96%;\n\n  --accent: 186 52% 44%;\n  --accent-foreground: 222 22% 8%;\n\n  --ring: 186 52% 44%;\n\n  --link: 186 70% 60%;\n  --link-hover: 186 80% 66%;\n\n  --highlight: 44 70% 32%;\n  --highlight-foreground: 36 33% 96%;\n\n  --code-bg: 222 18% 12%;\n  --code-fg: 36 33% 96%;\n\n  --destructive: 0 62% 46%;\n  --destructive-foreground: 0 0% 100%;\n\n  --shadow-color: 0 0% 0%;\n  --shadow-sm: 0 1px 0 hsl(var(--shadow-color) / 0.25), 0 10px 30px hsl(var(--shadow-color) / 0.35);\n  --shadow-md: 0 2px 0 hsl(var(--shadow-color) / 0.28), 0 22px 70px hsl(var(--shadow-color) / 0.45);\n}\n"
    },

    "accent_palettes": {
      "note_accent_colors": [
        { "name": "Ocean", "bg": "186 52% 44%", "chip": "186 52% 44%", "ring": "186 52% 44%" },
        { "name": "Citrus", "bg": "44 92% 55%", "chip": "44 92% 55%", "ring": "44 92% 55%" },
        { "name": "Coral", "bg": "14 78% 58%", "chip": "14 78% 58%", "ring": "14 78% 58%" },
        { "name": "Sage", "bg": "142 28% 42%", "chip": "142 28% 42%", "ring": "142 28% 42%" },
        { "name": "Cobalt", "bg": "214 72% 56%", "chip": "214 72% 56%", "ring": "214 72% 56%" },
        { "name": "Umber", "bg": "24 32% 42%", "chip": "24 32% 42%", "ring": "24 32% 42%" }
      ],
      "tag_colors": [
        { "name": "Teal", "solid": "186 52% 44%" },
        { "name": "Amber", "solid": "44 92% 55%" },
        { "name": "Rose", "solid": "350 70% 58%" },
        { "name": "Indigo", "solid": "226 62% 60%" },
        { "name": "Green", "solid": "142 28% 42%" },
        { "name": "Brown", "solid": "24 32% 42%" }
      ]
    },

    "allowed_gradients": {
      "usage": [
        "Only as a subtle background wash behind the top app bar OR behind the editor header area (max 20% viewport height).",
        "Never on cards, dropdowns, command palette, or reading surfaces."
      ],
      "examples": [
        "background-image: radial-gradient(900px 240px at 20% 0%, hsl(186 52% 92% / 0.9), transparent 60%), radial-gradient(700px 220px at 80% 10%, hsl(44 92% 92% / 0.7), transparent 55%);",
        "dark: background-image: radial-gradient(900px 240px at 20% 0%, hsl(186 52% 22% / 0.35), transparent 60%), radial-gradient(700px 220px at 80% 10%, hsl(44 70% 22% / 0.25), transparent 55%);"
      ]
    }
  },

  "spacing_radius_shadow": {
    "spacing": {
      "rail_padding": "p-3 sm:p-4",
      "pane_gap": "gap-3",
      "editor_padding": "px-4 sm:px-6 lg:px-10 py-6",
      "list_item_padding": "px-3 py-2",
      "chip_padding": "px-2 py-0.5"
    },
    "radius": {
      "cards": "rounded-[var(--radius-md)]",
      "floating": "rounded-[var(--radius-lg)]",
      "chips": "rounded-full",
      "inputs": "rounded-[12px]"
    },
    "shadows": {
      "cards": "shadow-[var(--shadow-sm)]",
      "floating": "shadow-[var(--shadow-md)]",
      "focus": "focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--background))]"
    }
  },

  "layout_grid": {
    "desktop": {
      "structure": "ResizableGroup: [Sidebar 280px] [List 360px] [Editor flex] [AI Drawer 420px optional]",
      "min_widths": {
        "sidebar": "min-w-[240px]",
        "list": "min-w-[320px]",
        "editor": "min-w-[420px]",
        "ai": "w-[420px] max-w-[92vw]"
      },
      "sticky_regions": [
        "Sidebar header (brand + new note)",
        "List header (sort/view/search results count)",
        "Editor header (title + toolbar)",
        "Editor footer meta (word count / reading time)"
      ]
    },
    "mobile": {
      "pattern": "Single column with top bar. Sidebar and note list become Sheets/Drawers. Editor is primary view.",
      "navigation": {
        "left": "Sidebar opens via icon button (Sheet from left)",
        "middle": "Notes list opens via icon button (Sheet from left or bottom Drawer)",
        "right": "AI opens via Sheet from right"
      }
    }
  },

  "component_recipes": {
    "global": {
      "app_shell": {
        "class": "min-h-dvh bg-[hsl(var(--background))] text-[hsl(var(--foreground))]",
        "notes": "Remove CRA starter App.css centering; rely on Tailwind + tokens."
      },
      "noise_texture": {
        "implementation": "Add a subtle CSS noise overlay using a pseudo-element on the app root (opacity 0.035 light, 0.05 dark). Keep pointer-events none.",
        "css": ".app-noise::before{content:'';position:fixed;inset:0;pointer-events:none;z-index:0;background-image:url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22120%22 height=%22120%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22120%22 height=%22120%22 filter=%22url(%23n)%22 opacity=%220.35%22/%3E%3C/svg%3E');mix-blend-mode:multiply;opacity:0.035;} .dark .app-noise::before{mix-blend-mode:screen;opacity:0.05;}"
      }
    },

    "sidebar": {
      "container": "h-dvh bg-[hsl(var(--surface-2))] border-r border-[hsl(var(--border))]",
      "header": "sticky top-0 z-10 bg-[hsl(var(--surface-2))] px-3 pt-3 pb-2",
      "brand": "flex items-center gap-2 text-sm font-semibold tracking-[-0.01em]",
      "new_note_button": "w-full justify-between rounded-[12px] bg-[hsl(var(--foreground))] text-[hsl(var(--background))] hover:bg-[hsl(var(--foreground))]/90 active:scale-[0.99] transition-[background-color,box-shadow] duration-[var(--dur-2)]",
      "nav_item": {
        "base": "group flex items-center justify-between gap-2 rounded-[12px] px-3 py-2 text-sm text-[hsl(var(--foreground))] hover:bg-[hsl(var(--surface-3))] transition-[background-color] duration-[var(--dur-1)]",
        "active": "bg-[hsl(var(--surface-3))] ring-1 ring-[hsl(var(--border))]",
        "left_icon": "text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--foreground))]",
        "count_badge": "text-xs text-[hsl(var(--muted-foreground))]"
      },
      "tag_chip": "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--surface-3))] transition-[background-color] duration-[var(--dur-1)]",
      "theme_toggle": "flex items-center justify-between rounded-[12px] px-3 py-2 bg-[hsl(var(--surface-1))] border border-[hsl(var(--border))]"
    },

    "note_list": {
      "container": "h-dvh bg-[hsl(var(--surface-1))] border-r border-[hsl(var(--border))]",
      "header": "sticky top-0 z-10 bg-[hsl(var(--surface-1))] px-3 pt-3 pb-2 border-b border-[hsl(var(--border))]",
      "controls_row": "flex items-center justify-between gap-2",
      "search_input": "h-10 rounded-[12px] bg-[hsl(var(--surface-2))] border border-[hsl(var(--border))] focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]",
      "view_toggle": "rounded-[12px]",
      "note_card": {
        "base": "group rounded-[var(--radius-md)] border border-[hsl(var(--border))] bg-[hsl(var(--surface-1))] p-3 hover:bg-[hsl(var(--surface-2))] transition-[background-color,border-color] duration-[var(--dur-2)]",
        "active": "border-[hsl(var(--ring))] bg-[hsl(var(--surface-2))]",
        "title": "text-sm font-semibold tracking-[-0.01em] line-clamp-1",
        "snippet": "mt-1 text-xs text-[hsl(var(--muted-foreground))] line-clamp-2",
        "meta": "mt-2 flex items-center justify-between text-xs text-[hsl(var(--muted-foreground))]",
        "pinned_badge": "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] bg-[hsl(var(--muted))]"
      },
      "grid_mode": "grid grid-cols-1 sm:grid-cols-2 gap-3",
      "list_mode": "flex flex-col gap-2"
    },

    "editor": {
      "container": "relative h-dvh bg-[hsl(var(--background))]",
      "header": "sticky top-0 z-20 bg-[hsl(var(--background))] px-4 sm:px-6 lg:px-10 pt-4 pb-3 border-b border-[hsl(var(--border))]",
      "title_input": "w-full bg-transparent text-[22px] sm:text-[26px] lg:text-[30px] font-semibold tracking-[-0.02em] outline-none placeholder:text-[hsl(var(--muted-foreground))]",
      "action_bar": "mt-3 flex items-center justify-between gap-2",
      "saving_status": "text-xs text-[hsl(var(--muted-foreground))]",
      "toolbar": {
        "container": "mt-3 flex flex-wrap items-center gap-1 rounded-[14px] bg-[hsl(var(--surface-2))] border border-[hsl(var(--border))] p-1",
        "button": {
          "base": "h-9 w-9 rounded-[12px] inline-flex items-center justify-center text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--surface-3))] transition-[background-color,color] duration-[var(--dur-1)]",
          "active": "bg-[hsl(var(--surface-3))] text-[hsl(var(--foreground))] ring-1 ring-[hsl(var(--border))]",
          "disabled": "opacity-50 pointer-events-none"
        },
        "divider": "mx-1 h-6 w-px bg-[hsl(var(--border))]"
      },
      "body": "px-4 sm:px-6 lg:px-10 py-6",
      "prose_wrapper": "mx-auto max-w-[78ch]",
      "footer": "sticky bottom-0 z-10 bg-[hsl(var(--background))] px-4 sm:px-6 lg:px-10 py-3 border-t border-[hsl(var(--border))]",
      "footer_meta": "flex flex-wrap items-center justify-between gap-2 text-xs text-[hsl(var(--muted-foreground))]"
    },

    "ai_panel": {
      "pattern": "Right Sheet (desktop: persistent rail optional; mobile: Sheet from right). Solid surface only.",
      "sheet_content": "bg-[hsl(var(--popover))] text-[hsl(var(--popover-foreground))] border-l border-[hsl(var(--border))]",
      "header": "sticky top-0 z-10 bg-[hsl(var(--popover))] px-4 py-3 border-b border-[hsl(var(--border))]",
      "prompt_input": "h-10 rounded-[12px] bg-[hsl(var(--surface-2))] border border-[hsl(var(--border))]",
      "result_card": "rounded-[var(--radius-md)] border border-[hsl(var(--border))] bg-[hsl(var(--surface-1))] p-3 shadow-[var(--shadow-sm)]",
      "result_actions": {
        "row": "mt-3 flex flex-wrap gap-2",
        "primary": "rounded-[12px] bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] hover:bg-[hsl(var(--accent))]/90 transition-[background-color] duration-[var(--dur-2)]",
        "secondary": "rounded-[12px] bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] hover:bg-[hsl(var(--secondary))]/80 transition-[background-color] duration-[var(--dur-2)]"
      },
      "thinking_state": "Use Skeleton + subtle shimmer; show 'Thinking…' label with animated dots (prefers-reduced-motion safe).",
      "error_state": "Use Alert component with destructive tone; include Retry button."
    },

    "command_palette": {
      "component": "shadcn Command inside Dialog",
      "dialog": "bg-[hsl(var(--popover))] text-[hsl(var(--popover-foreground))] border border-[hsl(var(--border))] shadow-[var(--shadow-md)] rounded-[var(--radius-lg)]",
      "input": "h-11 rounded-[12px] bg-[hsl(var(--surface-2))] border border-[hsl(var(--border))]",
      "item": "rounded-[12px] aria-selected:bg-[hsl(var(--surface-3))] aria-selected:text-[hsl(var(--foreground))]",
      "kbd": "text-[11px] text-[hsl(var(--muted-foreground))]"
    },

    "toasts": {
      "library": "sonner",
      "style": "Solid surfaces; no transparency. Use accent for success, destructive for errors.",
      "class": "bg-[hsl(var(--popover))] text-[hsl(var(--popover-foreground))] border border-[hsl(var(--border))] shadow-[var(--shadow-md)]"
    }
  },

  "motion_microinteractions": {
    "principles": [
      "Animate opacity/translate for overlays; never animate editor layout while typing.",
      "Use short durations and a single easing curve for consistency.",
      "Respect prefers-reduced-motion: reduce (disable parallax, reduce entrance motion)."
    ],
    "durations": {
      "hover": "var(--dur-1)",
      "panel_open": "var(--dur-3)",
      "toast": "var(--dur-2)"
    },
    "easing": {
      "standard": "var(--ease-out)",
      "exit": "var(--ease-in)"
    },
    "framer_motion_specs": {
      "sheet": "initial {x: 24, opacity: 0} animate {x: 0, opacity: 1} exit {x: 24, opacity: 0} transition {duration: 0.24, ease: [0.16,1,0.3,1]}",
      "dialog": "initial {scale: 0.98, opacity: 0} animate {scale: 1, opacity: 1} exit {scale: 0.98, opacity: 0} transition {duration: 0.18, ease: [0.16,1,0.3,1]}",
      "list_item": "On hover: background-color only; avoid translate to prevent scroll jitter."
    }
  },

  "accessibility": {
    "contrast": [
      "All text on surfaces must meet WCAG AA (4.5:1 for normal text).",
      "Muted text still must be readable; avoid going below ~65% lightness in dark mode for muted-foreground."
    ],
    "focus": [
      "Use focus-visible rings on all interactive elements.",
      "Ring color uses --ring (accent teal). Ensure ring-offset uses background token for both themes."
    ],
    "keyboard_first": [
      "Cmd/Ctrl+K opens command palette.",
      "Esc closes dialogs/sheets.",
      "Arrow keys navigate Command items and note list.",
      "Provide a Shortcuts modal (Dialog) with searchable list."
    ],
    "aria": [
      "All icon-only buttons must have aria-label.",
      "Use role=status for saving indicator and AI thinking states."
    ]
  },

  "states_empty_loading": {
    "first_run_empty": {
      "visual": "Centered within editor pane only (not whole app). Use illustration-like icon + 2 lines of copy + primary CTA.",
      "cta": "Create your first note",
      "component": "Card + Button + Separator"
    },
    "empty_search": "Show query echo + tips (search tags, titles).",
    "empty_folder": "Show folder name + CTA to create note in folder.",
    "empty_trash": "Show calm empty state + 'You're all clear'.",
    "loading": "Use Skeleton for note list cards and editor header; avoid skeleton in editor body while typing (use subtle placeholder only).",
    "save_failed": "Inline Alert in editor header area with Retry + Copy content actions."
  },

  "image_urls": {
    "textures": [
      {
        "category": "background texture",
        "description": "Optional subtle paper texture for marketing-like empty states or onboarding panel backgrounds (keep opacity low; do not tile aggressively).",
        "url": "https://images.unsplash.com/photo-1596307312584-cc72d38b011f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMjh8MHwxfHNlYXJjaHw0fHxzdWJ0bGUlMjBwYXBlciUyMHRleHR1cmUlMjBiYWNrZ3JvdW5kJTIwbGlnaHR8ZW58MHx8fHRlYWx8MTc4NjkyMDQ0OHww&ixlib=rb-4.1.0&q=85"
      },
      {
        "category": "background texture",
        "description": "Alternative texture (use as blurred background in empty states only).",
        "url": "https://images.unsplash.com/photo-1705837861201-dd000d929a31?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMjh8MHwxfHNlYXJjaHwxfHxzdWJ0bGUlMjBwYXBlciUyMHRleHR1cmUlMjBiYWNrZ3JvdW5kJTIwbGlnaHR8ZW58MHx8fHRlYWx8MTc4NjkyMDQ0OHww&ixlib=rb-4.1.0&q=85"
      }
    ]
  },

  "component_path": {
    "primary_shadcn_components": [
      "/app/frontend/src/components/ui/button.jsx",
      "/app/frontend/src/components/ui/card.jsx",
      "/app/frontend/src/components/ui/dialog.jsx",
      "/app/frontend/src/components/ui/command.jsx",
      "/app/frontend/src/components/ui/dropdown-menu.jsx",
      "/app/frontend/src/components/ui/select.jsx",
      "/app/frontend/src/components/ui/sheet.jsx",
      "/app/frontend/src/components/ui/scroll-area.jsx",
      "/app/frontend/src/components/ui/separator.jsx",
      "/app/frontend/src/components/ui/skeleton.jsx",
      "/app/frontend/src/components/ui/tabs.jsx",
      "/app/frontend/src/components/ui/toggle.jsx",
      "/app/frontend/src/components/ui/toggle-group.jsx",
      "/app/frontend/src/components/ui/tooltip.jsx",
      "/app/frontend/src/components/ui/alert-dialog.jsx",
      "/app/frontend/src/components/ui/context-menu.jsx",
      "/app/frontend/src/components/ui/resizable.jsx",
      "/app/frontend/src/components/ui/sonner.jsx"
    ]
  },

  "instructions_to_main_agent": {
    "css_updates": [
      "Replace CRA starter App.css usage; do not center the app.",
      "Move token sets into /app/frontend/src/index.css under @layer base :root and .dark.",
      "Add font-family tokens and apply body font to UI; apply editor font only inside editor content.",
      "Ensure popover/dialog/sheet backgrounds use --popover (solid) and not transparent."
    ],
    "theme": [
      "Use next-themes ThemeProvider; persist theme in localStorage.",
      "Theme toggle in sidebar uses shadcn Switch or Toggle; include data-testid=\"theme-toggle\"."
    ],
    "testing": [
      "Add data-testid to: new note button, search input, sort select, view toggle, note cards, pin button, archive/trash actions, command palette input, AI prompt input, AI apply/insert/copy buttons, saving status label, editor title input, editor body, export actions, empty state CTA."
    ],
    "tiptap": [
      "Wrap TipTap editor in a div with className=\"tiptap\" (or ProseMirror) and apply the editor_prose_rules via CSS selectors.",
      "Keep toolbar sticky within editor header; avoid layout shifts by reserving toolbar height."
    ],
    "performance": [
      "Debounce search (150–250ms).",
      "Virtualize note list if needed later; for now keep card heights stable (line-clamp).",
      "Avoid heavy shadows on every list item in dark mode; use border + subtle bg shift."
    ]
  },

  "general_ui_ux_design_guidelines_appendix": "<General UI UX Design Guidelines>\n    - You must **not** apply universal transition. Eg: `transition: all`. This results in breaking transforms. Always add transitions for specific interactive elements like button, input excluding transforms\n    - You must **not** center align the app container, ie do not add `.App { text-align: center; }` in the css file. This disrupts the human natural reading flow of text\n   - NEVER: use AI assistant Emoji characters like`🤖🧠💭💡🔮🎯📚🎭🎬🎪🎉🎊🎁🎀🎂🍰🎈🎨🎰💰💵💳🏦💎🪙💸🤑📊📈📉💹🔢🏆🥇 etc for icons. Always use **FontAwesome cdn** or **lucid-react** library already installed in the package.json\n\n **GRADIENT RESTRICTION RULE**\nNEVER use dark/saturated gradient combos (e.g., purple/pink) on any UI element.  Prohibited gradients: blue-500 to purple 600, purple 500 to pink-500, green-500 to blue-500, red to pink etc\nNEVER use dark gradients for logo, testimonial, footer etc\nNEVER let gradients cover more than 20% of the viewport.\nNEVER apply gradients to text-heavy content or reading areas.\nNEVER use gradients on small UI elements (<100px width).\nNEVER stack multiple gradient layers in the same viewport.\n\n**ENFORCEMENT RULE:**\n    • Id gradient area exceeds 20% of viewport OR affects readability, **THEN** use solid colors\n\n**How and where to use:**\n   • Section backgrounds (not content backgrounds)\n   • Hero section header content. Eg: dark to light to dark color\n   • Decorative overlays and accent elements only\n   • Hero section with 2-3 mild color\n   • Gradients creation can be done for any angle say horizontal, vertical or diagonal\n\n- For AI chat, voice application, **do not use purple color. Use color like light green, ocean blue, peach orange etc**\n\n</Font Guidelines>\n\n- Every interaction needs micro-animations - hover states, transitions, parallax effects, and entrance animations. Static = dead. \n   \n- Use 2-3x more spacing than feels comfortable. Cramped designs look cheap.\n\n- Subtle grain textures, noise overlays, custom cursors, selection states, and loading animations: separates good from extraordinary.\n   \n- Before generating UI, infer the visual style from the problem statement (palette, contrast, mood, motion) and immediately instantiate it by setting global design tokens (primary, secondary/accent, background, foreground, ring, state colors), rather than relying on any library defaults. Don't make the background dark as a default step, always understand problem first and define colors accordingly\n    Eg: - if it implies playful/energetic, choose a colorful scheme\n           - if it implies monochrome/minimal, choose a black–white/neutral scheme\n\n**Component Reuse:**\n\t- Prioritize using pre-existing components from src/components/ui when applicable\n\t- Create new components that match the style and conventions of existing components when needed\n\t- Examine existing components to understand the project's component patterns before creating new ones\n\n**IMPORTANT**: Do not use HTML based component like dropdown, calendar, toast etc. You **MUST** always use `/app/frontend/src/components/ui/ ` only as a primary components as these are modern and stylish component\n\n**Best Practices:**\n\t- Use Shadcn/UI as the primary component library for consistency and accessibility\n\t- Import path: ./components/[component-name]\n\n**Export Conventions:**\n\t- Components MUST use named exports (export const ComponentName = ...)\n\t- Pages MUST use default exports (export default function PageName() {...})\n\n**Toasts:**\n  - Use `sonner` for toasts\"\n  - Sonner component are located in `/app/src/components/ui/sonner.tsx`\n\nUse 2–4 color gradients, subtle textures/noise overlays, or CSS-based noise to avoid flat visuals.\n</General UI UX Design Guidelines>"
}
