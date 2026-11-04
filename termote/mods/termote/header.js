// The 44px bar over the panes, as Termote's desktop header: the owl and the
// name, the shown space with its branch, the space's agent status, and the
// Files and Changes buttons that open Herdr's side panel (as Herdr's own
// layout does from its tab bar).

import { div, svg } from "gpui-kit";
import { h_flex } from "gpui-base";
import { layout, run, shared, spaces, theme } from "herdr";
import { DIR, badge, label, style } from "./style.js";

function find(node, id) {
  if (node?.id === id) return node;
  for (const child of node?.children ?? []) {
    const found = find(child, id);
    if (found) return found;
  }
  return null;
}

function show(id) {
  if (id) {
    run("layout.select", { stack: "panel-body", child: id });
    run("layout.show", { id: "panel" });
  } else run("layout.hide", { id: "panel" });
}

// The panel is remembered per space, as Herdr's tabs mod does: switching shows
// that space's choice (closed if it never had one), opening or closing records it.
function syncPanel(view, space, panel, body, enabled) {
  if (!space || !panel) return;
  view.panels ??= JSON.parse(localStorage.getItem("panels") ?? "{}");
  const now = panel.hidden ? null : body?.active ?? null;
  if (space.id !== view.space) {
    const first = view.space === undefined;
    view.space = space.id;
    view.pending = null;
    if (!(first && !(space.id in view.panels))) {
      const stored = view.panels[space.id] ?? null;
      const want = enabled.includes(stored) ? stored : null;
      if (want !== now) {
        view.pending = { want, until: Date.now() + 1000 };
        show(want);
        return;
      }
    }
  }
  // Until the restore lands (or something else won), the old state isn't a choice.
  if (view.pending) {
    if (view.pending.want !== now && Date.now() < view.pending.until) return;
    view.pending = null;
  }
  if (view.panels[space.id] === now) return;
  view.panels[space.id] = now;
  localStorage.setItem("panels", JSON.stringify(view.panels));
}

export function header(view) {
  const t = theme();
  const s = spaces().find((x) => x.active);
  // Termote's terminal style draws its header on the page colour, the others on surface.
  const bg = style().bar ? t.canvas : t.surface;
  const root = layout(), panel = find(root, "panel"), body = find(root, "panel-body");
  // Which panels: Herdr's welcome choice, both when unset.
  const chosen = shared("workspace.panels");
  const enabled = Array.isArray(chosen) ? chosen : ["files", "changes"];
  syncPanel(view, s, panel, body, enabled);
  const panelButton = (id, text, path) => {
    const on = panel && !panel.hidden && body?.active === id;
    return h_flex().id(`panel-${id}`).h(28).px(9).gap(5).flex_none().items_center().rounded(style().control)
      .text_size(12).bg(on ? t.selected : bg).text_color(on ? t.foreground : t.muted)
      .hover((x) => x.bg(t.hover).text_color(t.foreground))
      .on_click(() => show(on ? null : id))
      .child(svg(path).size(14).flex_none()).child(text);
  };
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
    .when(Boolean(s?.status), (el) => el.child(badge(t, s.status, true)))
    .when(Boolean(panel) && enabled.length > 0, (el) => el.child(h_flex().flex_none().gap(2).items_center()
      .when(enabled.includes("files"), (el) => el.child(panelButton("files", "Files", "mods/termote-files/file.svg")))
      .when(enabled.includes("changes"), (el) => el.child(panelButton("changes", "Changes", "mods/termote-changes/changes.svg")))));
}
