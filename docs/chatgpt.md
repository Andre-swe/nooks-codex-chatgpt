# ChatGPT

ChatGPT on the web connects to Nooks as a custom MCP server, signed in with
your own Nooks account. That connection gives the model the live Nooks tools,
server instructions and runtime guide. It does not add the `nooks-design`
workflow skill bundled in this plugin; desktop apps that support plugin
marketplaces can install the full plugin (see the [README](../README.md)).
The plugin ZIP is not a one-click install in ChatGPT on the web.

## Before you start

- Custom MCP availability and the exact controls depend on your ChatGPT plan,
  app and workspace settings. See
  [OpenAI's guide](https://developers.openai.com/api/docs/guides/custom-mcp-server).
- You need a Nooks account. Connecting is free.

## Add the server

1. Open **Plugins** on chatgpt.com, select **+**, then **Add custom MCP server**.
2. Enter `https://nooks.place/api/mcp-v2`. If it cannot connect, use the
   2025-compatible lane `https://nooks.place/api/mcp` instead.
3. Choose **OAuth**, then select **Create as a plugin**.
4. Sign in to Nooks and approve access. Pick the builds the connection may
   see; allow edit only if the agent should save.
5. In a new chat, select Nooks with `@` and ask it to list your builds.

Labels may differ between workspaces.

## What the person sees

For `view` and `render_preview`, the person gets a Nooks card with the build. The
card can show the workbench; if it is blank or blocked, the `Full workbench:`
link in the reply opens the editor in a browser tab.

The model reads the report and `structuredContent`. Some host configurations
also expose images; others render them only for the person. Use the actual
capabilities of the current connection and never claim to see pixels that were
not exposed to the model.

## What the model can use instead of pixels

- `check_model` for the structure check and its report.
- `inspect_build` for text observations of a build.
- `read_project` for the program and its history.
- `read_workbench_context` for the person's live selection.
- `list_builds` for the builds the grant covers.

These are text results. None of them is a physical fit check or a guarantee of
buildability.

## Files and images

Do not assume local file or image tools exist. If source and render images are
model-visible, compare them directly. Otherwise use spatial observations and
the returned visual review. Missing reference images or unavailable reviews
remain unverified. Return the exact render or workbench link for the person.

An image-only result can arrive empty. If that happens, use the report, call
`inspect_build`, and give the person the links.

## Selection

If the embedded workbench loads, select the parts there. Otherwise open the
`Full workbench:` link in a tab, select, then call `read_workbench_context`.
Selection is a live pointer, not a screenshot. If it is empty, ask the person to
select the parts or name the area.

## If something is missing

| Problem | What to do |
| --- | --- |
| The connector cannot connect | Enter the 2025-compatible lane `https://nooks.place/api/mcp` instead |
| The card is blank or the player is blocked | Give the person the `Full workbench:` link; do not retry the frame |
| No image | Use the report and `inspect_build` |
| `view` has no `Exact PNG:` line | The revision is not saved yet: save it, then call `view` again. `render_preview` also produces an image, but it is a simplified preview |
| A link has expired | Call `view` again |
| A tool answers `401` | Reconnect and complete Nooks sign-in |
| A save answers `409` | Read the build again and continue from the latest revision |

## Check yourself

- [ ] `list_builds` returns the build approved in consent.
- [ ] `view` on a saved revision shows the person a card or player; the model
      reports only visual evidence it actually received.
- [ ] The reply contains `Exact PNG:` and `Full workbench:` links.
- [ ] Selecting a part in the workbench and calling `read_workbench_context`
      returns it.
- [ ] A read-only grant cannot save.
