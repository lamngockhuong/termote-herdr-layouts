// The 44px bar over the panes, as Termote's desktop header: the owl and the
// name, the shown space with its branch, and the space's agent status.

import { div, svg } from "gpui-kit";
import { h_flex } from "gpui-base";
import { spaces, theme } from "herdr";
import { DIR, badge, label, style } from "./style.js";

export function header() {
  const t = theme();
  const s = spaces().find((x) => x.active);
  // Termote's terminal style draws its header on the page colour, the others on surface.
  const bg = style().bar ? t.canvas : t.surface;
  return h_flex().size_full().px(12).gap(10).items_center().bg(bg).border_b(1).border_color(t.border).text_size(13)
    .child(svg(`${DIR}/brand.svg`).size(20).flex_none().text_color(t.foreground))
    .child(div().flex_none().font_semibold().text_color(t.foreground).child("Termote"))
    .when(Boolean(s), (el) => el
      .child(div().flex_none().w(1).h(18).bg(t.border))
      .child(label(div().flex_shrink_0().max_w(260).truncate().font_medium().text_color(t.foreground).child(s.name)))
      .when(Boolean(s.machine), (el) => el.child(div().flex_none().text_size(12).text_color(t.dim).child(`@ ${s.machine}`)))
      .when(Boolean(s.branch), (el) => el.child(h_flex().min_w(0).gap(4).items_center().text_size(12).text_color(t.dim)
        .child(svg("mods/workspace-chrome/git-branch.svg").size(13).flex_none())
        .child(div().min_w(0).truncate().child(s.branch)))))
    .child(div().flex_1())
    .when(Boolean(s?.status), (el) => el.child(badge(t, s.status, true)));
}
