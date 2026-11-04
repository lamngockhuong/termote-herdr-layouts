// Termote's session list: each space a group, its tabs the sessions under it,
// the shown one highlighted. Under 160px wide, a rail of status dots.

import { div } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { agents, panes, run, setAgentOrder, spaces, theme } from "herdr";
import { badge, dot, label, programIcon, style } from "./style.js";

const RAIL = 160;

// The tab's agent, else its first program.
function tabProgram(c, ps) {
  const mine = ps.filter((p) => p.tab === c.id);
  return (mine.find((p) => p.program?.agent) ?? mine[0])?.program;
}

// Unnamed tabs are called by their place ("2"); Termote names a session after
// what runs in it, so the tab's program names it here.
function tabName(c, ps) {
  return c.named ? c.name : tabProgram(c, ps)?.name ?? `Tab ${c.index}`;
}

function group(t, s, ps, st) {
  return v_flex().flex_none().pb(8)
    .child(h_flex().id(`space-${s.id}`).h(28).px(8).gap(6).items_center().rounded(st.control)
      .text_size(11).font_semibold().text_color(s.active ? t.foreground : t.muted)
      .hover((x) => x.bg(t.hover)).cursor_pointer()
      .on_click(() => run("space.select", { id: s.id }))
      .child(label(div().min_w(0).truncate().child(s.name.toUpperCase())))
      .when(Boolean(s.machine), (el) => el.child(div().flex_none().font_medium().text_color(t.dim).child(`@${s.machine}`)))
      .child(div().flex_1())
      .when(Boolean(s.status), (el) => el.child(dot(t, s.status, 7))))
    .children(s.tabs.map((c) => row(t, s, c, ps, st)));
}

function row(t, s, c, ps, st) {
  const on = s.active && c.active;
  const pic = programIcon(tabProgram(c, ps), 14, on ? t.foreground : t.muted);
  return h_flex().id(`tab-${c.id}`).relative().h(34).px(8).gap(8).items_center().rounded(st.control).text_size(13)
    .when(on, (el) => el.bg(t.selected).text_color(t.foreground).font_medium())
    .when(!on, (el) => el.text_color(t.muted).hover((x) => x.bg(t.hover).text_color(t.foreground)))
    .when(on && st.bar, (el) => el.child(div().absolute().left(0).top(6).bottom(6).w(2).rounded(1).bg(t.accent)))
    .on_click(() => {
      if (!s.active) run("space.select", { id: s.id });
      run("tab.select", { id: c.id });
    })
    .when(Boolean(pic), (el) => el.child(pic))
    .child(label(div().flex_1().min_w(0).truncate().child(tabName(c, ps))))
    .when(c.zoomed, (el) => el.child(div().flex_none().text_size(11).text_color(t.dim).child("zoomed")))
    .when(Boolean(c.status), (el) => el.child(badge(t, c.status, false)));
}

function rail(t, s, st) {
  return v_flex().id(`space-${s.id}`).flex_none().h(34).items_center().justify_center().gap(3).rounded(st.control)
    .when(s.active, (el) => el.bg(t.selected))
    .when(!s.active, (el) => el.hover((x) => x.bg(t.hover)))
    .tooltip(s.name)
    .on_click(() => run("space.select", { id: s.id }))
    .child(label(div().text_size(12).font_semibold().text_color(s.active ? t.foreground : t.muted).child([...s.name][0]?.toUpperCase() ?? "?")))
    .child(s.status ? dot(t, s.status, 6) : div().h(6));
}

export function sidebar(view) {
  const t = theme();
  const st = style();
  const sp = spaces();
  const ps = panes();
  // agent.next / agent.prev follow this list: spaces, then their tabs, in order.
  const ag = agents();
  const order = sp.flatMap((s) => s.tabs.flatMap((c) => ag.filter((a) => a.tab === c.id).map((a) => a.address)));
  setAgentOrder(order);
  const narrow = (view.width ?? Infinity) < RAIL;
  return v_flex().id("root").size_full().min_h(0).bg(t.chrome)
    .on_size_change((size, cx) => {
      if ((size.width < RAIL) !== ((view.width ?? Infinity) < RAIL)) cx.notify();
      view.width = size.width;
    })
    .when(!narrow, (el) => el.child(h_flex().h(36).flex_none().px(16).items_center().text_size(11).font_semibold()
      .text_color(t.dim).child(label(div().child("SESSIONS")))))
    .child(v_flex().id("list").flex_1().min_h(0).px(narrow ? 4 : 8).pt(narrow ? 6 : 0).pb(12).gap(narrow ? 4 : 0)
      .overflow_y_scrollbar()
      .children(sp.map((s) => (narrow ? rail(t, s, st) : group(t, s, ps, st)))));
}
