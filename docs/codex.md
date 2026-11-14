# Codex

Codex connects to Nooks as a remote MCP server. The plugin in this repository
adds the server and the `nooks-design` skill.

## Install

Add this repository as a plugin marketplace:

```bash
codex plugin marketplace add Andre-swe/nooks-codex-chatgpt
```

Open the Plugins Directory or run `/plugins`, install **Nooks** and start a new
session. On the first tool call, Codex asks you to sign in to Nooks.

Without the plugin, add the server directly:

```bash
codex mcp add nooks --url https://nooks.place/api/mcp-v2
codex mcp login nooks
codex mcp list
```

`codex mcp add` writes this entry to `~/.codex/config.toml`:

```toml
[mcp_servers.nooks]
url = "https://nooks.place/api/mcp-v2"
```

Then run `codex mcp login nooks`. Codex stores the OAuth credential itself; do
not add a token to this file.

## Sign-in and consent

Sign-in opens Nooks in a browser. Consent names the client, lets the person
choose one or more builds, and allows or denies edit access. A read-only grant
cannot save.

A `401` means the connection has no credential yet. Complete the Nooks OAuth
sign-in; for a server added by hand, run `codex mcp login nooks`. Do not paste a
key.

## Image loop

1. `open_build`, then `view` on the saved revision. The result carries an
   `Exact PNG:` URL.
2. Download it into the Codex workspace. In bash or zsh:

   ```bash
   mkdir -p .nooks
   curl -L "<Exact PNG URL>" -o .nooks/revision-1.png
   ```

   In PowerShell:

   ```powershell
   New-Item -ItemType Directory -Force .nooks | Out-Null
   Invoke-WebRequest "<Exact PNG URL>" -OutFile .nooks/revision-1.png
   ```

3. Ask Codex to call `view_image` on `.nooks/revision-1.png`. A relative path
   is fine; the tool does not expand shell variables.

4. Read `currentRevision` with `read_project`, then call `build_program` with
   that value as `baseRevision`, the updated `program` and a short `reason`.
5. Save the next render as a new file, `revision-2.png`, so the comparison is
   clear.

`render_preview` returns a simplified preview. Use `view` when the appearance
of the parts matters. Only a saved revision gets an `Exact PNG:` link; a `view`
of an unsaved program does not. Signed links are temporary; if one has expired,
call `view` again.

## Selection

Open the `Full workbench:` link in a browser tab, select the parts, then call
`read_workbench_context`. It returns the selected part keys, type, colour,
position and bounds. If the client keeps no session, pass `build` on the call.
If the selection is empty, ask the person which parts they mean; do not infer it
from a render.

## Conflicts and client differences

- A save answers `409` when the person or another agent saved first. Read the
  build again and continue from the latest revision.
- `view` and `read_workbench_context` are on the default address. The core
  address, `https://nooks.place/api/mcp-v2/core`, does not serve them.
- Codex maps MCP image output to model input. The downloaded file is still the
  clearest way to compare revisions.
- The server does not write to your filesystem. You download the PNG.

## Check yourself

- [ ] The Nooks plugin is installed (`codex plugin list`), or, on the manual
      path, `codex mcp list` shows `nooks`.
- [ ] `view` on a saved revision shows the build; download the Exact PNG and
      inspect it with `view_image`.
- [ ] Two revisions are compared as two separate files.
- [ ] A selection made in the workbench comes back from
      `read_workbench_context`.
- [ ] A `409` is handled by reading again, not by forcing the save.
