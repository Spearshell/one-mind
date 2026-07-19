# Universal Fable 5 — Agent Skill

Behavioral guidelines for AI assistants, distilled from the Claude Fable 5 system prompt and packaged as an installable agent skill. Platform-agnostic — works with any LLM.

This is a single skill covering all behavioral dimensions.

## Install

```bash
npx skills add https://github.com/pjh456/universal-fable-5
```

The repo contains a single skill — no `--skill` flag needed.

## Platform Compatibility

This skill is platform-agnostic. It works with:

- Claude Code
- Cursor
- Codex
- GitHub Copilot
- Windsurf
- OpenCode
- And any other agent that supports the skills.sh ecosystem

No brand-specific references. No proprietary tool dependencies.

## What's Included

This skill covers **9 behavioral dimensions** that govern every response:

| Dimension | What it controls |
|-----------|-----------------|
| **Identity** | The assistant knows it's an AI model, doesn't pretend to know platform details, searches for current info about the platform it runs on |
| **Knowledge Cutoff** | Uses search tools to bridge gaps past training data; never uses cutoff as a blanket disclaimer |
| **Mistakes** | Owns errors, fixes them, stays on the problem — no excessive apology |
| **Contested Topics** | Gives substantive answers with nuance, not one-word verdicts; presents multiple perspectives without declaring one correct |
| **Tone** | Warm, constructive, no profanity by default, one question at most per response, replies in the user's language, treats user as an adult |
| **Formatting** | Prose by default, bullets only when needed or asked; code reviews / bug lists / step-by-step / parameter tables as exceptions |
| **Interaction Boundaries** | No over-reliance bait, no prying, no clinical diagnosing, reflects only what was said without amplifying negativity |
| **Search** | Decides when to search (8 rules), how to query (1-6 words, no operators), how to scale (1 / 3-5 / 5-10 searches), how to evaluate sources, and when to fetch URLs directly |
| **File Creation** | Blog/code module/slides = file, strategy/summary/code explanation = inline; short code, lists, single recipes stay inline; long files built iteratively |

## What's Not Included

This skill is deliberately stripped of all safety-compliance and moral-guidance content. Specifically, it does **not** include:

- Copyright compliance rules (quotation limits, paraphrasing requirements)
- Harmful content refusal protocols (malware, weapons, illicit substances)
- User safety protocols (self-harm, suicide, eating disorders, crisis intervention)
- Political evenhandedness and mandatory balance requirements
- Legal and financial disclaimers
- Abuse/harassment defense scripts
- Age-appropriate content restrictions

**Why:** These are behavioral guardrails for public-facing products, not useful directives for a personal agent. If you want your assistant to have ethical boundaries, add them yourself — this skill stays neutral and practical.

## Platform-Specific Exclusions

The following Anthropic-specific mechanisms were removed during generalization:

- `{antml:*}` proprietary XML tags (invoke, cite, parameter, voice_note, thinking_mode)
- MCP App ecosystem (search_mcp_registry, suggest_connectors)
- Claude-specific tool definitions (bash_tool, create_file, view, str_replace, present_files)
- Filesystem paths and environment config (/mnt/user-data, /home/claude, network_config)
- Artifacts API and persistent storage (window.storage, Claudeception)
- Memory system, anthropic_reminders, and product self-knowledge references

## Source

Derived from the Claude Fable 5 system prompt, generalized and restructured for universal applicability across all LLM platforms. All Anthropic-specific product details, tool definitions, proprietary tags, and environment configurations have been removed.
