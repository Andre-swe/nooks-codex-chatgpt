---
name: nooks-design
description: Design a custom brick set in Nooks from a photo or an idea, with real bricks, a checked structure, building instructions and a parts list. Use when the user asks for a brick model, a custom brick set, building instructions or a parts list.
---

# Nooks design

The Codex plugin in this repository configures the Nooks MCP server at
`https://nooks.place/api/mcp-v2`; ChatGPT connects through a custom connector.
Sign-in happens in the browser; never ask for a key or a token. If the tools are
missing, follow the setup for your client in the README.

## The loop

1. Call `runtime_guide` before the first build, and follow it over anything you
   remember about Nooks.
2. `list_builds`, then `create_build` or `open_build`. Work inside one build,
   and pass its id as `build` on project calls when the client keeps no session.
3. If the person gave a photo or a description, call `record_source` with their
   own words and the photo before building.
4. `find_parts` before naming a part. Read `currentRevision` from `read_project`
   and pass it as `baseRevision` to `build_program`, along with the `program`
   and a short `reason`. Use `null` only if the build has no revisions. Name
   the connector each placement joins.
5. `check_model` after each build. Read its report before any other output.
   `simulate_program` is the physics check; `view` shows the saved revision.
   Neither replaces `check_model`.
6. `finalize_model` when the model is right, then `export_kit` for the manual,
   the parts list and the BrickLink wanted list. Pass the same explicit saved
   `revision` to both calls. Report any incomplete checks or unverified parts.

## Rules

- Never say a model is buildable unless `check_model` passes. Report the rules
  it names, the parts they name and the fix; never invent a pass. A pass is
  still a software check; say what it does not verify.
- Every save is a new revision, and the old one stays. A `409` means someone
  saved in between: read the build again and continue from the latest revision.
  Do not overwrite the person's hand edit or force a save they did not agree
  to. If the client offers `replaceHumanEdit`, use it only after the person
  agrees.
- Sharing is explicit. Ask before publishing a build, and do not share one the
  person has not agreed to share.
- Nooks is for all ages. Refuse sexual, hateful (including hate symbols),
  harassing, gory or demeaning content about a real person, and offer something
  else in one line.
- Do not invent prices, stock or seller availability. Parts estimates are not
  live seller stock.

## Images by client

- Codex maps image output to model input. For a clear comparison, download the
  `Exact PNG:` link to `.nooks/revision-<n>.png` and inspect that file with
  `view_image`.
- ChatGPT may not show the model an image. Use the report and
  `structuredContent` from `check_model`, `inspect_build`, `read_project` and
  `read_workbench_context`, and give the person the `Exact PNG:` and
  `Full workbench:` links.
