# Nooks for Codex and ChatGPT

This repository is the Codex plugin and ChatGPT connector notes for Nooks. Nooks
turns a photo or an idea into a custom brick set with real bricks, a structure
checked in software, a manual, a parts list and a BrickLink wanted list.

People edit the same build by hand in the browser workbench while an agent works
through MCP. Every save creates a new revision, and older revisions stay.

Codex installs the plugin from this repository. ChatGPT uses a custom MCP
connector added in ChatGPT web; this repository explains that path.

## Status

- This repository is public and installable from source. It is not in the public plugin directory; this repository is the install path.
- Codex OAuth sign-in has been tested with the Codex CLI. A model-driven tool call is not recorded.
- Nooks supports a custom connector in ChatGPT. No end-to-end ChatGPT session is recorded.

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

Then install **Nooks** from the Plugins Directory (or `/plugins`) and start a
new session. Complete the Nooks OAuth sign-in when Codex asks for it.

Manual fallback, without the plugin:

```bash
codex mcp add nooks --url https://nooks.place/api/mcp-v2
codex mcp login nooks
```

`codex mcp list` shows the server. Codex stores the OAuth credential itself, so
no token goes in a configuration file. The plugin path needs a Codex CLI with
plugin marketplace support; the manifest targets 0.167.2.

## Connect in ChatGPT

ChatGPT does not install a plugin from this repository. Add a custom MCP
connector instead:

1. Use ChatGPT on the web. Mobile cannot add a custom connector.
2. Your workspace must allow custom MCP servers. Full MCP needs a Business,
   Enterprise or Edu workspace; Pro can connect read/fetch connectors.
3. Open **Plugins**, then **Add custom MCP server**.
4. Enter `https://nooks.place/api/mcp-v2` and choose OAuth. If the connector
   cannot connect, enter the 2025-compatible lane
   `https://nooks.place/api/mcp` instead.
5. Complete the Nooks sign-in and consent, then choose **Create as a plugin**.
   In a new chat, select it with `@`.

The person sees the Nooks card and links. The model reads the text report and
`structuredContent`; do not assume it can see an image. See
[docs/chatgpt.md](docs/chatgpt.md) if the card or an image is missing.

## The loop

1. Read the runtime guide (`runtime_guide`) before the first build.
2. Open or create one build, and keep its id for project calls.
3. Record the photo or the person's words with `record_source`.
4. Find real parts with `find_parts`. Read `currentRevision` with `read_project`
   and pass it to `build_program` as `baseRevision`, with the `program` and a
   short `reason`. Use `null` only if the build has no revisions.
5. Check with `check_model`. Use `simulate_program` for the two-second gravity
   simulation and `view` for the saved render.
6. Pass the same saved `revision` to `finalize_model` and `export_kit`.

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

- It does not install anything into ChatGPT. ChatGPT uses a custom connector.
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
