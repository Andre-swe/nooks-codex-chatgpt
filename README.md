# Nooks for Codex and ChatGPT

This repository is the Codex plugin and ChatGPT connector notes for Nooks. Nooks
turns a photo or an idea into a custom brick set with real bricks, a structure
checked in software, a manual, a parts list and a BrickLink wanted list.

People edit the same build by hand in the browser workbench while an agent works
through MCP. Every save creates a new revision, and older revisions stay.

## Connect the MCP or install the plugin

- **Connect the MCP:** add `https://nooks.place/api/mcp-v2` to your client and
  sign in with your own Nooks account. Your agent gets the live Nooks tools,
  server instructions and runtime guide.
- **Install the full plugin:** adds the `nooks-design` workflow skill and its
  reference-comparison guidance on top of the same connection, in clients that
  install plugins.

Both are free. You approve access on Nooks; nobody shares an account or a key.

## Status

- Public and installable from this repository. Nooks has not been submitted to,
  or listed in, a public plugin directory.
- A private ChatGPT plugin link does not give other accounts access; each person
  connects with their own Nooks account.
- [Download the plugin ZIP (v1.0.2)](https://github.com/Andre-swe/nooks-codex-chatgpt/releases/download/v1.0.2/nooks-1.0.2.zip)
  for clients that install plugin packages. It is not a one-click install in
  ChatGPT on the web.

## What you can do

- Start a build from a photo or an idea.
- Have the agent place real parts, check the structure and simulate the build.
- Open the build in the [workbench](https://nooks.place/workbench) and edit it by hand.
- Export a manual, a parts list and a BrickLink wanted list.

## Install in Codex

Add this repository as a plugin marketplace:

```bash
codex plugin marketplace add Andre-swe/nooks-codex-chatgpt
```

Then install **Nooks** from the Plugins Directory (or `/plugins`), or run
`codex plugin add nooks@nooks`, and start a new session. Complete the Nooks
OAuth sign-in when Codex asks for it. Other desktop apps that support plugin
marketplaces can add the same repository and install Nooks from their Plugins
directory.

MCP only, without the plugin's workflow skill:

```bash
codex mcp add nooks --url https://nooks.place/api/mcp-v2
codex mcp login nooks
```

`codex mcp list` shows the server. Codex stores the OAuth credential itself, so
no token goes in a configuration file. The plugin path needs a Codex CLI with
plugin marketplace support; the manifest targets 0.167.2.

## Connect in ChatGPT

ChatGPT on the web connects to Nooks as a custom MCP server. Availability and
the exact controls depend on your ChatGPT plan, app and workspace settings; see
[OpenAI's guide](https://developers.openai.com/api/docs/guides/custom-mcp-server).

1. Open **Plugins** on chatgpt.com, select **+**, then **Add custom MCP server**.
2. Enter `https://nooks.place/api/mcp-v2` and choose **OAuth**. If it cannot
   connect, use the 2025-compatible lane `https://nooks.place/api/mcp`.
3. Select **Create as a plugin**, then sign in to Nooks and approve access.
4. In a new chat, select Nooks with `@`.

This connects the tools, server instructions and runtime guide. It does not
add the bundled `nooks-design` skill.

The person sees the Nooks card and links. The model reads the text report and
`structuredContent`; do not assume it can see an image. See
[docs/chatgpt.md](docs/chatgpt.md) if the card or an image is missing.

## The loop

1. Read the runtime guide (`runtime_guide`) before the first build.
2. Open or create one build, and keep its id for project calls.
3. Record the photo or the person's words with `record_source`.
4. Use connector-aware `build_program` or `run_code` for the selected system.
   Pass `currentRevision` as `baseRevision`; use `null` only for an empty build.
5. Run `check_model` after saves. Compare saved renders against the actual source
   and prior candidate, tracking validity, alignment and design quality separately.
   Refine the largest mismatch and retain the best valid version.
6. For bricks, complete supported physics/finalization and manual review before
   exporting the same revision. Brain Flakes uses its own guide and checks;
   brick instruction/export tools are currently unavailable for that system.

The skill includes a review record, system routes, research context and a copy
of the Nooks best-practices guide. Refresh the guide from its owning source with:

```bash
node scripts/sync-nooks-guide.mjs <path-to-Nooks/apps/create/lib/mcp-best-practices.mjs>
```

## Main files

| Path | What it is |
| --- | --- |
| `plugin.json` | Portable Agent Plugins manifest, with the OpenAI interface block |
| `mcp.json` | MCP server entry Codex reads |
| `.agents/plugins/marketplace.json` | Repo marketplace that Codex reads |
| `skills/nooks-design/SKILL.md` | The design workflow the agent follows |
| `assets/icon.svg` | The square listing icon, drawn from the Nooks mark |
| `scripts/validate.mjs` | Checks the package against the directory's rules |
| `scripts/pack.mjs` | Builds the ZIP the plugin directory accepts |
| `docs/codex.md` | Codex setup, image loop, selection and conflicts |
| `docs/chatgpt.md` | ChatGPT connector setup and what the model can use |

## Package for submission

The plugin directory takes a ZIP of the plugin, not the repository:

```bash
node scripts/pack.mjs          # writes dist/nooks-<version>.zip
node scripts/pack.mjs --check  # checks the package without writing it
```

The archive holds `plugin.json`, `mcp.json`, `skills/`, `assets/`, `docs/`,
`README.md`, `LICENSE`, `NOTICE` and `SECURITY.md`, and leaves out CI, the
scripts and the Git files. The archive is stored, not compressed, and every
entry carries a fixed timestamp, so the same tree produces the same bytes.
Raise `version` in `plugin.json` with every release.

## What it does not do

- Packaging does not authenticate the server, deploy it, or publish a directory listing.
- It does not contain the Nooks service. The hosted service, workbench and server are proprietary; this repository is not an open-source release of them.
- Software checks do not prove physical buildability, part availability or that a person can assemble it by hand. Nooks does not sell, hold stock for, box or ship kits.
- It does not contain credentials. Do not put a key or token in a URL, a repository or a chat message.

## Troubleshooting

| Problem | What to do |
| --- | --- |
| Codex shows no Nooks tools | Install the plugin or add the server, start a new session, and complete OAuth |
| `marketplace add` is rejected | The marketplace file is invalid; update Codex and re-check `policy.authentication` |
| A tool answers `401` | Complete the Nooks OAuth sign-in; for a server added by hand, run `codex mcp login nooks`. In ChatGPT, reconnect. |
| A save answers `409` | Someone saved first: read the build again and continue from the latest revision |
| ChatGPT shows no image | Use the text report and `structuredContent`; give the person the links |
| The card is blank | Open the `Full workbench:` link in a browser tab |
| `view` has no `Exact PNG:` line | The revision is not saved yet: save it, then call `view` again. `render_preview` also produces an image, but it is a simplified preview |

## Learn more

[Nooks](https://nooks.place) · [Connect a client](https://nooks.place/connect) ·
[Support](https://nooks.place/connect) ·
[Developer docs](https://nooks.place/developers) ·
[Workbench guide](https://nooks.place/workbench-guide) ·
[Privacy](https://nooks.place/privacy) · [Terms](https://nooks.place/terms) · [Security policy](SECURITY.md)

Nooks is independent and is not affiliated with, sponsored or endorsed by
OpenAI, the LEGO Group or Brain Flakes (Viahart). Codex and ChatGPT are
trademarks of OpenAI. LEGO® is a trademark of the LEGO Group.

## Licence

The files in this repository are Apache-2.0 licensed. The hosted Nooks service,
workbench and server remain proprietary, and the Nooks name and marks are not
licensed. See [LICENSE](LICENSE) and [NOTICE](NOTICE).
