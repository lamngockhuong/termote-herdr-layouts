// One pane's 30px header: program, title, folder, agent status and, on hover,
// Open in Termote, Copy link, QR code, zoom and close. Props: { pane, terminal }.

import { div, svg } from "gpui-kit";
import { h_flex } from "gpui-base";
import { openOverlay, panes, props, run, theme } from "herdr";
import { DIR, badge, label, programIcon, style } from "./style.js";
import { copyLink, openInTermote, target } from "./termote.js";

// The folder's last part; Windows paths use backslashes.
const base = (cwd) => (cwd ? cwd.replace(/[\\/]+$/, "").split(/[\\/]/).pop() || cwd : "");

function button(t, id, icon, tip, action) {
  return div().id(id).p(3).rounded(style().control).text_color(t.dim).tooltip(tip)
    .hover((s) => s.bg(t.hover).text_color(t.foreground))
    .on_click((_e, cx) => { cx.stop_propagation(); action(cx); })
    .child(svg(icon).size(14));
}

export function pane(view) {
  const t = theme();
  const p = panes().find((x) => x.pane === props()?.pane);
  if (!p) return div();
  const id = p.pane;
  const name = ((p.program?.agent || p.program?.shell) && p.program.name) || p.title || p.program?.name || "shell";
  const pic = programIcon(p.program, 14, t.dim);
  const to = target(id);
  return h_flex().id(`pane-${id}`).size_full().px(10).gap(8).items_center().bg(t.background)
    .border_b(1).border_color(t.border).text_size(12)
    .on_hover((hovered, cx) => { view.hovered = hovered; cx.notify(); })
    .on_click(() => run("pane.focus", { pane: id }))
    .when(Boolean(pic), (el) => el.child(pic))
    .child(label(div().flex_none().max_w(260).truncate().font_medium().text_color(t.foreground).child(name)))
    .child(div().flex_1().min_w(0).truncate().text_color(t.dim).child(base(p.cwd)))
    .when(Boolean(p.status), (el) => el.child(badge(t, p.status, true)))
    .when(view.hovered && Boolean(to), (el) => el
      .child(button(t, `open-${id}`, `${DIR}/external-link.svg`, "Open in Termote",
        (cx) => cx.spawn(async () => { await openInTermote(to); })))
      .child(button(t, `copy-${id}`, `${DIR}/copy.svg`, "Copy Termote link",
        (cx) => cx.spawn(async (cx) => { await copyLink(to, cx); })))
      .child(button(t, `qr-${id}`, `${DIR}/qr-code.svg`, "Termote QR code",
        () => openOverlay({ mod: "termote", kind: "popup", width: 300, height: 380, props: { role: "qr", ...to } }))))
    .when(view.hovered, (el) => el
      .child(button(t, `zoom-${id}`, `mods/pane/${p.zoomed ? "unzoom" : "zoom"}.svg`, p.zoomed ? "Unzoom" : "Zoom",
        () => run("pane.zoom", { pane: id })))
      .child(button(t, `close-${id}`, "mods/pane/close.svg", "Close", () => run("pane.close", { pane: id }))));
}
