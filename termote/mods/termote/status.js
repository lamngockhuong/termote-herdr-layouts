// The 24px strip under the panes: Termote's server state, agent counts and the
// layout's name. The server is asked at start and every 30 s (data, not frames).

import { div } from "gpui-kit";
import { h_flex } from "gpui-base";
import { agents, shared, theme } from "herdr";
import { dot, label } from "./style.js";
import { serverStatus } from "./termote.js";

export function statusInit(view, cx) {
  view.server = null;
  const refresh = (cx) => cx.spawn(async (cx) => { view.server = await serverStatus(); cx.notify(); });
  view.refresh = refresh;
  refresh(cx);
  cx.timer.every(30000, refresh);
}

// Termote's connection dot (connection-indicator.tsx): success when up,
// danger when down; the words say which.
function server(t, s) {
  if (!s) return { color: t.dim, text: "Termote: checking…" };
  switch (s.state) {
    case "running": {
      const how = s.backend ? ` (${s.backend})` : s.status && s.status !== "ok" ? ` (${s.status})` : "";
      return { color: t.done, text: `Termote: running on :${s.port}${how}`,
        hint: s.backend && s.backend !== "hc" ? "links open Termote's home: termote start --mux hc" : null };
    }
    case "stopped": return { color: t.blocked, text: "Termote: stopped" };
    case "missing": return { color: t.dim, text: "Termote: not installed" };
    default: return { color: t.dim, text: "Termote: unknown" };
  }
}

function count(t, status, n, word) {
  return h_flex().flex_none().gap(5).items_center().child(dot(t, status, 6)).child(`${n} ${word}`);
}

export function status(view) {
  const t = theme();
  const s = server(t, view.server);
  const list = agents();
  const n = (st) => list.filter((a) => a.status === st).length;
  return label(h_flex().size_full().px(12).gap(14).items_center().bg(t.chrome).border_t(1).border_color(t.border)
    .text_size(11).text_color(t.muted)
    .child(h_flex().id("server").flex_none().gap(6).items_center().cursor_pointer().tooltip("Check again")
      .on_click((_e, cx) => view.refresh(cx))
      .child(div().size(8).flex_none().rounded_full().bg(s.color)).child(s.text))
    .when(Boolean(s.hint), (el) => el.child(div().min_w(0).truncate().text_color(t.blocked).child(s.hint)))
    .child(count(t, "working", n("working"), "working"))
    .child(count(t, "blocked", n("blocked"), "need you"))
    .child(count(t, "done", n("done"), "done"))
    .child(div().flex_1())
    .child(div().flex_none().text_color(t.dim).child(String(shared("layout") ?? ""))));
}
