# ChatGPT

Nooks can be connected as a custom MCP app and saved as a private plugin.
An existing App-backed plugin can also carry the `nooks-design` workflow skill.
Keep its connection and identity when adding skills; do not create a second
connection merely to add guidance.

## Before you start

- Use a host that supports custom MCP connections and the account's permitted
  plugin setup flow. Available setup controls depend on the host and policy.
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
