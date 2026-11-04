// The QR popup for one pane: the link Termote gives as a scannable code, drawn
// as squares (dark on white, whatever the theme: phones read that best),
// with the link under it and a Copy button. Props: { group, tab, pane, overlay }.

import { div } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { closeOverlay, notify, props, theme } from "herdr";
import { label, style } from "./style.js";
import { qrLink } from "./termote.js";

const SIDE = 236; // px the code may take, quiet zone included

export function qrInit(view, cx) {
  view.qr = null;
  const { group, tab, pane, overlay } = props() ?? {};
  if (!pane) return;
  cx.spawn(async (cx) => {
    const r = await qrLink({ group, tab, pane });
    if (!r) { closeOverlay(overlay); return; }
    view.qr = r;
    cx.notify();
  });
}

// One row of modules, consecutive dark ones merged into one bar.
function line(row, y, m) {
  const bars = [];
  for (let x = 0; x < row.length;) {
    let end = x;
    while (end < row.length && row[end] === row[x]) end++;
    bars.push(div().flex_none().w((end - x) * m).h(m).when(row[x], (el) => el.bg("#000000")));
    x = end;
  }
  return h_flex().id(`qr-${y}`).flex_none().children(bars);
}

export function qr(view) {
  const t = theme();
  const st = style();
  const r = view.qr;
  const body = v_flex().size_full().p(16).gap(12).items_center().bg(t.popover).text_size(12).text_color(t.foreground)
    .child(div().font_semibold().text_size(13).child("Open this pane on your phone"));
  if (!r) return body.child(div().text_color(t.dim).child("Asking Termote…"));
  const m = r.grid ? Math.max(2, Math.floor(SIDE / r.grid.length)) : 0;
  return body
    .when(Boolean(r.grid), (el) => el.child(v_flex().flex_none().bg("#ffffff").rounded(st.control)
      .children(r.grid.map((row, y) => line(row, y, m)))))
    .when(!r.grid, (el) => el.child(div().text_color(t.dim).child("The link is too long for a QR code.")))
    .child(h_flex().w_full().gap(8).items_center()
      .child(label(div().flex_1().min_w(0).truncate().text_size(11).text_color(t.muted).child(r.url)))
      .child(div().id("qr-copy").flex_none().px(10).h(26).flex().items_center().rounded(st.control)
        .bg(t.solid).text_color(t.solid_foreground).font_medium().cursor_pointer()
        .on_click((_e, cx) => {
          cx.write_to_clipboard(r.url);
          notify({ title: "Termote", body: "Link copied", level: "success" });
        })
        .child("Copy")));
}
