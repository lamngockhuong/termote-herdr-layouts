// The bridge to Termote's own command. Links come from `termote url`, which
// knows the port, the LAN/Tailscale address and sign-in; this mod never builds
// one. Termote's hc backend names a session by space id (--group), tab id
// (--tab) and terminal address (--pane), the ids Herdr shows for this machine.

import { exec, home, notify, panes, spaces } from "herdr";

// Herdr's exec may not have ~/.local/bin on PATH (where `termote link` puts the
// command), so the install's own paths are tried too, as Termote's Herdr plugin
// launcher does. The first one that starts is kept.
let found = null;

function candidates() {
  const h = home();
  return ["termote", `${h}/.local/bin/termote`, `${h}/.local/share/termote/current/bin/termote`,
    // Windows: the installer's shim in %LOCALAPPDATA%\termote\bin is a .cmd.
    "termote.cmd", `${h}/AppData/Local/termote/bin/termote.cmd`];
}

// Runs termote with args; null when no termote could be started.
export async function termote(args) {
  for (const bin of new Set([found, ...candidates()].filter(Boolean))) {
    try {
      const r = await exec(bin, args);
      found = bin;
      return r;
    } catch {}
  }
  found = null;
  return null;
}

// What Termote needs to name a pane, or null when it can't show it: a mod pane
// (no terminal), or a space on another machine (Termote's hc backend lists
// this machine's terminals only; remote ids carry a "machine/" prefix).
export function target(paneId) {
  const p = panes().find((x) => x.pane === paneId);
  if (!p?.terminal || p.terminal.includes("/")) return null;
  const s = spaces().find((x) => x.tabs.some((c) => c.id === p.tab));
  if (!s || s.machine) return null;
  return { group: s.id, tab: p.tab, pane: p.terminal };
}

function urlArgs(t, extra) {
  return ["url", "--group", t.group, "--tab", t.tab, "--pane", t.pane, ...extra];
}

// A fixed message for each way it fails, never the raw output.
function failure(r) {
  if (!r) return "termote not found";
  if (/not running/i.test(r.stderr)) return "Termote is not running: termote start";
  return "termote url failed";
}

function toast(body, level = "error") {
  notify({ title: "Termote", body, level });
}

// The link to t (stdout's first line) and what follows it, or null after a toast.
async function link(t, extra) {
  const r = await termote(urlArgs(t, extra));
  if (!r || r.code !== 0) {
    toast(failure(r));
    return null;
  }
  const [url, ...rest] = r.stdout.split("\n");
  return { url: url.trim(), rest };
}

// Opens the pane in the browser here (termote url --open, which signs in too).
export async function openInTermote(t) {
  const r = await termote(urlArgs(t, ["--open"]));
  if (!r || r.code !== 0) toast(failure(r));
}

// Puts the pane's link on the clipboard through Herdr, which needs no
// clipboard program on Linux.
export async function copyLink(t, cx) {
  const l = await link(t, []);
  if (!l) return;
  cx.write_to_clipboard(l.url);
  toast("Link copied", "success");
}

// The link and its QR code as rows of booleans (true: dark module), quiet zone
// included. `termote url --qr` draws light modules with half blocks, two rows
// per line: █ both light, ▀ top light, ▄ bottom light, space both dark
// (server/cli_url.go qrText). The code is square, so the width gives the rows.
export function parseQR(lines) {
  const text = lines.map((l) => Array.from(l)).filter((l) => l.length);
  if (!text.length) return null;
  const n = text[0].length;
  const grid = [];
  for (const line of text) {
    const top = [], bottom = [];
    for (const ch of line) {
      top.push(!(ch === "█" || ch === "▀"));
      bottom.push(!(ch === "█" || ch === "▄"));
    }
    grid.push(top, bottom);
  }
  return grid.slice(0, n);
}

// { url, grid } for the QR popup, or null after a toast. grid is null when the
// link is too long for a QR code (termote prints none).
export async function qrLink(t) {
  const l = await link(t, ["--qr"]);
  return l && { url: l.url, grid: parseQR(l.rest) };
}

// Termote's server as `termote status --json` reports it (it exits 1 but still
// prints the report when the server is down).
export async function serverStatus() {
  const r = await termote(["status", "--json"]);
  if (!r) return { state: "missing" };
  try {
    const s = JSON.parse(r.stdout);
    return { state: s.running ? "running" : "stopped", port: s.port, backend: s.backend, status: s.status };
  } catch {
    return { state: "unknown" };
  }
}
