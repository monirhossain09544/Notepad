{
  "scope": {
    "app": "Notepad (3-pane workspace)",
    "goal": "Redesign ONLY: (1) theme switcher in sidebar footer, (2) writing stats surface, (3) AI assistant entry + panel IA. Keep existing tokens/palette/typography/radii/shadows and existing data-testid attributes.",
    "non_goals": [
      "Do not change overall layout/structure of the app",
      "Do not change existing color system/tokens (warm paper light, deep ink dark, ocean-teal accent)",
      "Do not introduce transparent floating surfaces (popover/sheet/dialog must be solid --popover)",
      "Do not add gradients beyond existing paper-wash (and keep gradients under 20% viewport)"
    ]
  },
  "design_personality": {
    "keywords": [
      "shipped-product",
      "quietly-premium",
      "editorial",
      "tool-like",
      "Raycast/Linear-calibre",
      "low-chrome",
      "high-craft micro-interactions"
    ],
    "principles": [
      "Prefer compact, intentional controls over full-width pills.",
      "Replace ‘six equal boxes’ with editorial hierarchy: one hero metric + calm secondary rows.",
      "Assistant should feel like a command surface (action list) + conversation, not a form grid.",
      "Use hairline separators, subtle surfaces (surface-2/3), and typography contrast instead of borders everywhere."
    ]
  },
  "tokens_and_type": {
    "fonts": {
      "ui": "Instrument Sans (already set via --font-ui)",
      "editor": "Fraunces (already set via --font-editor)",
      "mono": "JetBrains Mono (already set via --font-mono)",
      "usage": {
        "hero_numbers": "Fraunces for the hero metric number only (stats panel).",
        "labels": "Instrument Sans for labels, buttons, hints.",
        "kbd_hints": "JetBrains Mono for keyboard hints (⌘E etc.)."
      }
    },
    "type_scale_overrides_for_these_surfaces": {
      "sidebar_footer_icon": "text-[13px] leading-none (icon buttons are icon-only; tooltip provides label)",
      "stats_title": "text-sm font-medium",
      "stats_hero_number": "text-4xl sm:text-5xl font-semibold tracking-[-0.02em] font-[var(--font-editor)]",
      "stats_hero_label": "text-xs text-muted-foreground",
      "stats_row_label": "text-sm",
      "stats_row_value": "text-sm font-medium tabular-nums",
      "assistant_panel_title": "text-sm font-medium",
      "assistant_section_label": "text-[11px] uppercase tracking-[0.14em] text-muted-foreground",
      "assistant_action": "text-sm",
      "assistant_message": "text-sm leading-relaxed",
      "assistant_hint": "text-xs text-muted-foreground"
    }
  },
  "surface_1_theme_switcher": {
    "decision": "Use a compact 2-up segmented control (Sun | Moon) with a sliding thumb, placed inside a unified footer utility bar with the other two utilities as icon-only ghost buttons + tooltips.",
    "why_this_is_shipped": [
      "Segmented control reads as a deliberate setting, not a CTA.",
      "Icon-only utilities reduce visual noise; tooltips restore clarity.",
      "Unified bar makes the three controls feel like one system."
    ],
    "composition_in_sidebar_footer": {
      "layout": "Single unified row: [Stats icon] [Shortcuts icon] [Theme segmented control]. Stats/Shortcuts are square; theme is compact segmented.",
      "container_classes": "mt-3 flex items-center gap-2 rounded-[var(--radius-md)] border bg-[hsl(var(--surface-2))] px-2 py-2 shadow-[var(--shadow-sm)]",
      "notes": [
        "Keep this bar visually distinct from the sidebar list via surface-2 + shadow-sm.",
        "Do not make it full-width pill with text; keep it compact and tool-like."
      ]
    },
    "stats_and_shortcuts_buttons": {
      "component": "/app/frontend/src/components/ui/button.jsx (variant=ghost)",
      "icons": {
        "stats": "BarChart3 (lucide-react)",
        "shortcuts": "Keyboard (lucide-react)"
      },
      "button_classes": "h-9 w-9 rounded-[var(--radius-sm)] text-muted-foreground hover:text-foreground hover:bg-[hsl(var(--surface-3))] focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--surface-2))]",
      "tooltip": {
        "component": "/app/frontend/src/components/ui/tooltip.jsx",
        "content_classes": "text-xs",
        "labels": {
          "stats": "Writing stats",
          "shortcuts": "Keyboard shortcuts"
        }
      },
      "data_testids": {
        "stats": "open-stats-btn",
        "shortcuts": "open-shortcuts-btn"
      }
    },
    "theme_segmented_control": {
      "implementation": "Use ToggleGroup (type=single) + ToggleGroupItem from shadcn. Add a custom sliding thumb via a pseudo-element on the group using CSS variables and data-state.",
      "components": [
        "/app/frontend/src/components/ui/toggle-group.jsx",
        "/app/frontend/src/components/ui/tooltip.jsx"
      ],
      "icons": {
        "light": "Sun",
        "dark": "Moon"
      },
      "markup_recipe_jsx": "<ToggleGroup type=\"single\" value={theme} onValueChange={(v)=>v && setTheme(v)} className=\"np-seg relative ml-auto h-9 rounded-[var(--radius-sm)] border bg-[hsl(var(--surface-1))] p-1 shadow-[inset_0_1px_0_hsl(var(--border))]\" data-testid=\"theme-toggle\">\n  <ToggleGroupItem value=\"light\" className=\"relative z-10 h-7 w-8 rounded-[8px] text-muted-foreground data-[state=on]:text-foreground focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--surface-2))]\">\n    <Sun className=\"h-4 w-4\" />\n  </ToggleGroupItem>\n  <ToggleGroupItem value=\"dark\" className=\"relative z-10 h-7 w-8 rounded-[8px] text-muted-foreground data-[state=on]:text-foreground focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--surface-2))]\">\n    <Moon className=\"h-4 w-4\" />\n  </ToggleGroupItem>\n</ToggleGroup>",
      "css_needed_in_index_css": {
        "class_name": ".np-seg",
        "rules": [
          "Create a ::before thumb that slides between the two items.",
          "Use transform translateX with var(--np-seg-x) set by [data-value] or by adding a data-theme attribute.",
          "Animate only transform + background-color (no transition: all).",
          "Disable transitions under prefers-reduced-motion (already globally handled, but keep it clean)."
        ],
        "exact_css": ".np-seg::before{content:\"\";position:absolute;inset:4px auto 4px 4px;width:32px;border-radius:8px;background:hsl(var(--surface-2));box-shadow:0 1px 0 hsl(var(--border)),0 8px 18px hsl(var(--shadow-color)/0.08);transform:translateX(var(--np-seg-x,0px));transition:transform var(--dur-2) var(--ease-out),background-color var(--dur-2) var(--ease-out);}\n.np-seg[data-state=\"dark\"],.np-seg[data-value=\"dark\"]{--np-seg-x:36px;}\n.dark .np-seg::before{background:hsl(var(--surface-3));box-shadow:0 1px 0 hsl(var(--border)),0 10px 22px hsl(var(--shadow-color)/0.35);}"
      },
      "tooltip": {
        "pattern": "Wrap the segmented control in a TooltipTrigger and show ‘Theme’ + current state in TooltipContent.",
        "content": "Theme: Light / Dark"
      }
    }
  },
  "surface_2_writing_stats_panel": {
    "decision": "Convert from centered Dialog to a Popover anchored to the stats icon in the footer utility bar.",
    "why": [
      "Stats are a quick glance utility; popover matches intent and reduces modal heaviness.",
      "Anchoring to the footer button makes it feel like a real tool panel (Bear/Raycast vibe)."
    ],
    "component": "/app/frontend/src/components/ui/popover.jsx",
    "popover_content_classes": "w-[340px] sm:w-[380px] rounded-[var(--radius-lg)] border bg-[hsl(var(--popover))] p-4 shadow-[var(--shadow-md)]",
    "header": {
      "layout_classes": "flex items-start justify-between gap-3",
      "title": {
        "text": "Your writing",
        "classes": "text-sm font-medium"
      },
      "subtitle": {
        "text": "A quick look at this workspace.",
        "classes": "mt-0.5 text-xs text-muted-foreground"
      }
    },
    "hero_metric": {
      "layout_classes": "mt-4 rounded-[var(--radius-md)] bg-[hsl(var(--surface-2))] px-4 py-3",
      "number_classes": "font-[var(--font-editor)] text-4xl sm:text-5xl font-semibold tracking-[-0.02em] tabular-nums",
      "label_classes": "mt-1 text-xs text-muted-foreground",
      "label_text": "Words written",
      "supporting_hint": {
        "classes": "mt-2 flex items-center justify-between text-xs text-muted-foreground",
        "left": "Est. read time",
        "right": "~{minutes} min"
      }
    },
    "secondary_metrics": {
      "pattern": "Definition-list rows (no cards). Hairline separators. Values right-aligned with tabular-nums.",
      "container_classes": "mt-4",
      "row_classes": "flex items-center justify-between py-2",
      "separator": "<Separator className=\"bg-[hsl(var(--border))]\" />",
      "label_classes": "text-sm text-foreground",
      "value_classes": "text-sm font-medium tabular-nums text-foreground",
      "muted_value_classes": "text-sm font-medium tabular-nums text-muted-foreground",
      "rows": [
        "Active notes",
        "Pinned",
        "Archived",
        "In trash",
        "Folders",
        "Tags"
      ]
    },
    "useful_visual_element": {
      "decision": "Add a tiny ‘storage composition’ bar (not a chart): Active / Archived / Trash as a single Progress-like stacked bar.",
      "honesty": "Only show if totals > 0; widths are real proportions.",
      "layout_classes": "mt-4 rounded-[var(--radius-md)] border bg-[hsl(var(--surface-1))] px-3 py-3",
      "label_classes": "text-xs text-muted-foreground",
      "bar_container_classes": "mt-2 h-2 w-full overflow-hidden rounded-full bg-[hsl(var(--surface-3))]",
      "segments": {
        "active": "bg-[hsl(var(--accent)/0.55)]",
        "archived": "bg-[hsl(var(--muted-foreground)/0.35)]",
        "trash": "bg-[hsl(var(--destructive)/0.45)]"
      }
    },
    "footer_actions": {
      "pattern": "One quiet action row: ‘View details’ (optional) + Close icon button.",
      "classes": "mt-4 flex items-center justify-end gap-2",
      "close_button": {
        "component": "Button variant=ghost size=icon",
        "icon": "X",
        "classes": "h-8 w-8 rounded-[var(--radius-sm)]"
      }
    },
    "data_testids": {
      "trigger": "open-stats-btn",
      "panel": "stats-dialog"
    }
  },
  "surface_3_ai_assistant": {
    "entry_point": {
      "decision": "Replace solid teal ‘Assistant’ CTA with a quiet ghost button that has: Sparkles icon, label ‘Assist’, and a subtle keyboard hint ‘⌘E’.",
      "component": "/app/frontend/src/components/ui/button.jsx + tooltip.jsx",
      "icon": "Sparkles",
      "button_classes": "h-9 rounded-[var(--radius-sm)] border bg-[hsl(var(--surface-1))] px-2.5 text-sm font-medium text-foreground shadow-[inset_0_1px_0_hsl(var(--border))] hover:bg-[hsl(var(--surface-2))] focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--background))]",
      "inner_layout": {
        "wrapper": "flex items-center gap-2",
        "icon_chip": "grid h-6 w-6 place-items-center rounded-[10px] bg-[hsl(var(--accent)/0.12)] text-[hsl(var(--accent))]",
        "kbd": "ml-1 rounded-md border bg-[hsl(var(--surface-2))] px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground"
      },
      "micro_interaction": {
        "hover": "Icon chip brightens slightly; button background shifts surface-2.",
        "active": "scale-[0.98] (apply only on button, not container)",
        "transition": "transition-colors duration-[var(--dur-2)] ease-[var(--ease-out)]"
      },
      "data_testid": "open-ai-btn"
    },
    "panel_container": {
      "component": "/app/frontend/src/components/ui/sheet.jsx",
      "sheet_classes": "w-full sm:max-w-[420px] border-l bg-[hsl(var(--popover))] shadow-[var(--shadow-md)]",
      "header": {
        "layout": "Top bar with title + subtle status + close.",
        "classes": "flex items-center justify-between gap-3 border-b bg-[hsl(var(--surface-2))] px-4 py-3",
        "title_classes": "text-sm font-medium",
        "status": "Small dot + ‘Ready’ / ‘Thinking…’",
        "status_classes": "flex items-center gap-2 text-xs text-muted-foreground"
      }
    },
    "assistant_ia": {
      "decision": "Replace 2×3 grid with a Raycast-style single-column Command list grouped by intent: Rewrite / Extract / Organize. Tone becomes an inline sub-control that appears only when Rewrite is selected.",
      "components": [
        "/app/frontend/src/components/ui/command.jsx",
        "/app/frontend/src/components/ui/separator.jsx",
        "/app/frontend/src/components/ui/select.jsx",
        "/app/frontend/src/components/ui/scroll-area.jsx",
        "/app/frontend/src/components/ui/input.jsx",
        "/app/frontend/src/components/ui/button.jsx"
      ],
      "layout": {
        "top_actions_area": "Command surface pinned near top; results + chat below.",
        "classes": "flex h-full flex-col"
      },
      "command_surface": {
        "container_classes": "px-4 py-4",
        "command_classes": "rounded-[var(--radius-lg)] border bg-[hsl(var(--surface-1))] shadow-[var(--shadow-sm)]",
        "search_optional": "No search input (avoid form feel). Use CommandList only.",
        "section_label_classes": "px-3 pt-3 pb-1 text-[11px] uppercase tracking-[0.14em] text-muted-foreground",
        "item_classes": "mx-1 flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-sm aria-selected:bg-[hsl(var(--surface-2))]",
        "leading_icon_chip": "grid h-8 w-8 place-items-center rounded-[12px] bg-[hsl(var(--accent)/0.10)] text-[hsl(var(--accent))]",
        "right_hint": "ml-auto font-mono text-[11px] text-muted-foreground",
        "groups": {
          "Rewrite": [
            {
              "id": "ai-action-improve",
              "label": "Improve writing",
              "icon": "Wand2",
              "hint": "⌘I"
            },
            {
              "id": "ai-action-continue",
              "label": "Continue writing",
              "icon": "ArrowRight",
              "hint": "⌘↩"
            }
          ],
          "Extract": [
            {
              "id": "ai-action-summarize",
              "label": "Summarise",
              "icon": "AlignLeft",
              "hint": "⌘S"
            },
            {
              "id": "ai-action-action-items",
              "label": "Action items",
              "icon": "ListTodo",
              "hint": "⌘A"
            }
          ],
          "Organize": [
            {
              "id": "ai-action-title",
              "label": "Suggest title",
              "icon": "Heading1",
              "hint": "⌘T"
            },
            {
              "id": "ai-action-suggest-tags",
              "label": "Suggest tags",
              "icon": "Tag",
              "hint": "⌘G"
            }
          ]
        },
        "tone_inline": {
          "decision": "Tone select appears as an inline row directly under the selected Rewrite action (Improve writing).",
          "row_classes": "mx-3 mb-3 mt-1 flex items-center justify-between gap-2 rounded-[12px] border bg-[hsl(var(--surface-2))] px-3 py-2",
          "label_classes": "text-xs text-muted-foreground",
          "select_trigger_classes": "h-8 rounded-[10px] bg-[hsl(var(--surface-1))]",
          "data_testids": {
            "tone_action": "ai-action-tone",
            "tone_select": "ai-tone-select"
          }
        }
      }
    },
    "results_surface": {
      "decision": "Results render as ‘assistant messages’ (prose) with a left accent rail, not cards. Actions (Apply/Insert/Copy/Replace) are quiet icon buttons aligned to the top-right of the message.",
      "container_classes": "px-4",
      "message_classes": "relative mt-3 rounded-[var(--radius-lg)] border bg-[hsl(var(--surface-1))] px-4 py-3 shadow-[var(--shadow-sm)]",
      "accent_rail": "before:absolute before:left-0 before:top-3 before:bottom-3 before:w-[2px] before:rounded-full before:bg-[hsl(var(--accent)/0.65)]",
      "title_classes": "text-xs font-medium text-muted-foreground",
      "body_classes": "mt-2 text-sm leading-relaxed",
      "action_row_classes": "absolute right-2 top-2 flex items-center gap-1",
      "icon_button_classes": "h-8 w-8 rounded-[10px] text-muted-foreground hover:text-foreground hover:bg-[hsl(var(--surface-2))] focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--surface-1))]",
      "icons": {
        "copy": "Copy",
        "insert": "CornerDownLeft",
        "apply": "Check",
        "retry": "RotateCcw"
      },
      "data_testids": {
        "apply_title": "ai-apply-title-btn",
        "insert_summarize": "ai-insert-summarize-btn",
        "insert_action_items": "ai-insert-action-items-btn",
        "apply_tags": "ai-apply-tags-btn",
        "replace_note": "ai-replace-note-btn",
        "insert_continue": "ai-insert-continue-btn"
      }
    },
    "thinking_state": {
      "decision": "Use a subtle ‘accent scanline’ animation at the top border of the message container + three-dot pulse (reuse existing pulse-dot keyframes). No skeleton bars.",
      "css_needed": {
        "class_name": ".np-scanline",
        "exact_css": ".np-scanline{position:relative;overflow:hidden;}\n.np-scanline::after{content:\"\";position:absolute;left:-30%;top:0;height:2px;width:30%;background:hsl(var(--accent)/0.55);filter:blur(0.2px);animation:np-scan var(--dur-3) var(--ease-out) infinite;}\n@keyframes np-scan{0%{transform:translateX(0);}100%{transform:translateX(460%);}}"
      },
      "reduced_motion": "prefers-reduced-motion already clamps animations globally; keep scanline subtle."
    },
    "chat_thread": {
      "decision": "Avoid classic teal bubbles. Use a single-column transcript: user prompts as right-aligned compact ‘prompt pills’ on surface-2; assistant replies as unbubbled prose blocks with the accent rail.",
      "thread_container": "mt-4 px-4 pb-24",
      "thread_scroll": "Use ScrollArea for the transcript region.",
      "assistant_reply_classes": "relative mt-3 rounded-[var(--radius-lg)] border bg-[hsl(var(--surface-1))] px-4 py-3 shadow-[var(--shadow-sm)] before:absolute before:left-0 before:top-3 before:bottom-3 before:w-[2px] before:rounded-full before:bg-[hsl(var(--accent)/0.55)]",
      "user_prompt_classes": "ml-auto mt-3 max-w-[85%] rounded-[16px] border bg-[hsl(var(--surface-2))] px-3 py-2 text-sm text-foreground shadow-[var(--shadow-sm)]",
      "meta_classes": "mt-1 text-[11px] text-muted-foreground",
      "data_testids": {
        "thread": "ai-chat-thread",
        "clear": "ai-clear-chat-btn"
      }
    },
    "composer": {
      "decision": "Bottom composer as a rounded field with inline send button; no heavy footer bar.",
      "container_classes": "absolute bottom-0 left-0 right-0 border-t bg-[hsl(var(--popover))] px-4 py-3",
      "inner_classes": "flex items-end gap-2",
      "input_classes": "min-h-[44px] flex-1 rounded-[16px] border bg-[hsl(var(--surface-1))] px-3 py-2 text-sm shadow-[inset_0_1px_0_hsl(var(--border))] focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--popover))]",
      "send_button": {
        "classes": "h-11 w-11 rounded-[16px] bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] hover:bg-[hsl(var(--accent)/0.92)] focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--popover))]",
        "icon": "ArrowUp"
      },
      "hint": {
        "classes": "mt-2 text-xs text-muted-foreground",
        "text": "Tip: Select text in the editor, then run an action."
      },
      "data_testids": {
        "input": "ai-question-input",
        "ask": "ai-ask-btn"
      }
    },
    "empty_state": {
      "pattern": "Quiet empty state inside the panel above the command list.",
      "classes": "px-4 pt-4",
      "title": {
        "text": "Assistant, on standby",
        "classes": "text-sm font-medium"
      },
      "body": {
        "text": "Run an action to generate a result, or ask a question about this note.",
        "classes": "mt-1 text-xs text-muted-foreground"
      }
    }
  },
  "component_path": {
    "shadcn_primary": [
      "/app/frontend/src/components/ui/button.jsx",
      "/app/frontend/src/components/ui/tooltip.jsx",
      "/app/frontend/src/components/ui/toggle-group.jsx",
      "/app/frontend/src/components/ui/popover.jsx",
      "/app/frontend/src/components/ui/separator.jsx",
      "/app/frontend/src/components/ui/command.jsx",
      "/app/frontend/src/components/ui/select.jsx",
      "/app/frontend/src/components/ui/sheet.jsx",
      "/app/frontend/src/components/ui/scroll-area.jsx",
      "/app/frontend/src/components/ui/input.jsx"
    ],
    "files_to_edit": {
      "sidebar_footer": "/app/frontend/src/components/Sidebar.jsx",
      "stats_surface": "/app/frontend/src/components/Dialogs.jsx (convert StatsDialog -> StatsPopover but keep data-testid=stats-dialog)",
      "assistant_entry": "/app/frontend/src/components/NoteEditor.jsx",
      "assistant_panel": "/app/frontend/src/components/AIPanel.jsx",
      "css": "/app/frontend/src/index.css"
    }
  },
  "css_additions_index_css": {
    "add": [
      "Segmented control thumb (.np-seg::before) + dark variant",
      "Assistant thinking scanline (.np-scanline + @keyframes np-scan)"
    ],
    "do_not": [
      "Do not add transition: all",
      "Do not add global animation overrides beyond existing prefers-reduced-motion block"
    ]
  },
  "motion_specs": {
    "durations": {
      "hover": "var(--dur-1)",
      "toggle": "var(--dur-2)",
      "panel_open": "var(--dur-3)"
    },
    "easing": "var(--ease-out)",
    "rules": [
      "Animate only transform/opacity/colors; never layout-affecting properties.",
      "Respect prefers-reduced-motion (already enforced globally)."
    ]
  },
  "accessibility": {
    "focus": "Every interactive element must have focus-visible ring: ring-2 ring-[hsl(var(--ring))] ring-offset-2 with appropriate ring-offset background.",
    "tooltips": "Icon-only buttons must have tooltips for clarity.",
    "contrast": "Use muted-foreground only for secondary text; primary labels remain foreground.",
    "keyboard": "Expose keyboard hints visually (kbd chips) but do not rely on them as the only affordance."
  },
  "data_testid_requirements": {
    "rule": "Keep existing data-testid attributes intact. If wrapping elements changes DOM, ensure the attribute remains on the clickable trigger element.",
    "list": [
      "theme-toggle",
      "open-stats-btn",
      "open-shortcuts-btn",
      "stats-dialog",
      "open-ai-btn",
      "ai-action-title",
      "ai-action-summarize",
      "ai-action-improve",
      "ai-action-continue",
      "ai-action-action-items",
      "ai-action-suggest-tags",
      "ai-action-tone",
      "ai-tone-select",
      "ai-question-input",
      "ai-ask-btn",
      "ai-chat-thread",
      "ai-clear-chat-btn",
      "ai-apply-title-btn",
      "ai-insert-summarize-btn",
      "ai-insert-action-items-btn",
      "ai-apply-tags-btn",
      "ai-replace-note-btn",
      "ai-insert-continue-btn",
      "ai-result-*"
    ]
  },
  "instructions_to_main_agent": [
    "Implement the sidebar footer as a single utility bar container with two icon-only ghost buttons (stats/shortcuts) + the segmented theme toggle aligned right.",
    "Convert stats from Dialog to Popover anchored to the stats icon button; keep data-testid=stats-dialog on PopoverContent.",
    "Replace assistant entry CTA with quiet bordered ghost button + icon chip + kbd hint; keep data-testid=open-ai-btn.",
    "Refactor AI panel actions into a Command list grouped by intent; remove the 2×3 grid.",
    "Move tone selection to appear inline under the selected Rewrite action; keep ai-action-tone and ai-tone-select testids.",
    "Render AI results as message surfaces with accent rail and a top-right icon action row; keep existing ai-result-* testids on the relevant result containers.",
    "Update chat transcript styling to user prompt pills (right aligned) + assistant prose blocks; keep ai-chat-thread.",
    "Add CSS for .np-seg and .np-scanline to /app/frontend/src/index.css exactly; do not introduce transition: all."
  ],
  "General UI UX Design Guidelines": [
    "- You must **not** apply universal transition. Eg: `transition: all`. This results in breaking transforms. Always add transitions for specific interactive elements like button, input excluding transforms",
    "- You must **not** center align the app container, ie do not add `.App { text-align: center; }` in the css file. This disrupts the human natural reading flow of text",
    "- NEVER: use AI assistant Emoji characters like`🤖🧠💭💡🔮🎯📚🎭🎬🎪🎉🎊🎁🎀🎂🍰🎈🎨🎰💰💵💳🏦💎🪙💸🤑📊📈📉💹🔢🏆🥇 etc for icons. Always use **FontAwesome cdn** or **lucid-react** library already installed in the package.json",
    "\n **GRADIENT RESTRICTION RULE**",
    "NEVER use dark/saturated gradient combos (e.g., purple/pink) on any UI element.  Prohibited gradients: blue-500 to purple 600, purple 500 to pink-500, green-500 to blue-500, red to pink etc",
    "NEVER use dark gradients for logo, testimonial, footer etc",
    "NEVER let gradients cover more than 20% of the viewport.",
    "NEVER apply gradients to text-heavy content or reading areas.",
    "NEVER use gradients on small UI elements (<100px width).",
    "NEVER stack multiple gradient layers in the same viewport.",
    "\n **ENFORCEMENT RULE:**",
    "    • Id gradient area exceeds 20% of viewport OR affects readability, **THEN** use solid colors",
    "\n **How and where to use:**",
    "   • Section backgrounds (not content backgrounds)",
    "   • Hero section header content. Eg: dark to light to dark color",
    "   • Decorative overlays and accent elements only",
    "   • Hero section with 2-3 mild color",
    "   • Gradients creation can be done for any angle say horizontal, vertical or diagonal",
    "\n- For AI chat, voice application, **do not use purple color. Use color like light green, ocean blue, peach orange etc**",
    "\n</Font Guidelines>",
    "\n- Every interaction needs micro-animations - hover states, transitions, parallax effects, and entrance animations. Static = dead.",
    "   ",
    "- Use 2-3x more spacing than feels comfortable. Cramped designs look cheap.",
    "\n- Subtle grain textures, noise overlays, custom cursors, selection states, and loading animations: separates good from extraordinary.",
    "   ",
    "- Before generating UI, infer the visual style from the problem statement (palette, contrast, mood, motion) and immediately instantiate it by setting global design tokens (primary, secondary/accent, background, foreground, ring, state colors), rather than relying on any library defaults. Don't make the background dark as a default step, always understand problem first and define colors accordingly",
    "    Eg: - if it implies playful/energetic, choose a colorful scheme",
    "           - if it implies monochrome/minimal, choose a black–white/neutral scheme",
    "\n**Component Reuse:**",
    "\t- Prioritize using pre-existing components from src/components/ui when applicable",
    "\t- Create new components that match the style and conventions of existing components when needed",
    "\t- Examine existing components to understand the project's component patterns before creating new ones",
    "\n**IMPORTANT**: Do not use HTML based component like dropdown, calendar, toast etc. You **MUST** always use `/app/frontend/src/components/ui/ ` only as a primary components as these are modern and stylish component",
    "\n**Best Practices:**",
    "\t- Use Shadcn/UI as the primary component library for consistency and accessibility",
    "\t- Import path: ./components/[component-name]",
    "\n**Export Conventions:**",
    "\t- Components MUST use named exports (export const ComponentName = ...)",
    "\t- Pages MUST use default exports (export default function PageName() {...})",
    "\n**Toasts:**",
    "  - Use `sonner` for toasts\"",
    "  - Sonner component are located in `/app/src/components/ui/sonner.tsx`",
    "\nUse 2–4 color gradients, subtle textures/noise overlays, or CSS-based noise to avoid flat visuals."
  ]
}
