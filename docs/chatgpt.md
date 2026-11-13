# ChatGPT

ChatGPT does not install a plugin from this repository. It connects to Nooks as
a custom MCP connector, and the connector can be saved as a plugin in the
workspace.

## Before you start

- Use ChatGPT on the web. Mobile cannot add a custom connector.
- The workspace must allow custom MCP servers. Full MCP requires a Business,
  Enterprise or Edu workspace; Pro can connect read/fetch connectors.
- You need a Nooks account.

## Add the connector

1. Open **Plugins** in ChatGPT web.
2. Choose **Add custom MCP server**.
3. Enter `https://nooks.place/api/mcp-v2`. If the connector cannot connect, enter
   the 2025-compatible lane `https://nooks.place/api/mcp` instead.
4. Choose OAuth, then complete the Nooks sign-in and consent. Pick the builds
   the connection may see; allow edit only if the agent should save.
5. Choose **Create as a plugin**.
6. In a new chat, select the plugin with `@` and ask it to list your builds.

The menu label may differ between workspaces.

## What the person sees

For `view` and `render_preview`, the person gets a Nooks card with the build. The
card can show the workbench; if it is blank or blocked, the `Full workbench:`
link in the reply opens the editor in a browser tab.

The model reads the text report and `structuredContent`. It must not claim to
have seen an image.

## What the model can use instead of pixels

- `check_model` for the structure check and its report.
- `inspect_build` for text observations of a build.
- `read_project` for the program and its history.
- `read_workbench_context` for the person's live selection.
- `list_builds` for the builds the grant covers.

These are text results. None of them is a physical fit check or a guarantee of
buildability.

## Files and images

ChatGPT does not give the model a local file or image tool for this connection.
Do not rely on it downloading the `Exact PNG:` link. Put the `Exact PNG:` and
`Full workbench:` links in the reply so the person can open them.

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
      does not claim to have seen pixels.
- [ ] The reply contains `Exact PNG:` and `Full workbench:` links.
- [ ] Selecting a part in the workbench and calling `read_workbench_context`
      returns it.
- [ ] A read-only grant cannot save.
