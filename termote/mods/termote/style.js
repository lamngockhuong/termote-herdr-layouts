// What differs between the three Termote styles, and the pieces every role
// draws the same way. Mods can't read layout fields, so the style comes from
// the shown layout's name (shared("layout")): termote-neutral, -terminal, -native.

import { div, svg, image } from "gpui-kit";
import { h_flex } from "gpui-base";
import { shared } from "herdr";

// This mod's folder, as asset paths name it (rename here if the folder is renamed).
export const DIR = "mods/termote";

// Termote's --tm-radius-control / --tm-radius-panel per style. Terminal style
// labels its rows in a monospace face (--tm-font-label) and marks the selected
// row with a 2px accent bar instead of a tinted background.
const STYLES = {
  neutral: { control: 7, panel: 10, label: null, bar: false },
  terminal: { control: 4, panel: 6, label: "Geist Mono", bar: true },
  native: { control: 12, panel: 16, label: null, bar: false },
};

export function style() {
  const name = String(shared("layout") ?? "").replace(/^termote-/, "");
  return STYLES[name] ?? STYLES.neutral;
}

// The label face for names and section titles in this style.
export function label(el) {
  const f = style().label;
  return f ? el.font_family(f) : el;
}

export function icon(name, size, color) {
  return svg(`${DIR}/${name}.svg`).size(size).flex_none().text_color(color);
}

// Termote's agent badge (pwa/src/components/agent-status-badge.tsx): each status
// has its own icon as well as colour, so it reads without colour.
const BADGE = {
  working: { icon: "loader-circle", text: "Working" },
  blocked: { icon: "circle-alert", text: "Needs you" },
  done: { icon: "circle-check", text: "Done" },
  idle: { icon: "circle-dot", text: "Idle" },
};

export function statusColor(t, status) {
  return t[status] ?? t.dim;
}

// The status icon, with its word when `text` (headers); null for no status.
export function badge(t, status, text) {
  const b = BADGE[status];
  if (!b) return null;
  const color = statusColor(t, status);
  let mark = icon(b.icon, 14, color);
  if (status === "working") mark = mark.spin(1000);
  if (!text) return mark;
  return h_flex().flex_none().gap(4).items_center().text_size(11).text_color(color)
    .child(mark).child(div().child(b.text));
}

// A small dot in the status's colour (rail, counts).
export function dot(t, status, size = 8) {
  return div().size(size).flex_none().rounded_full().bg(statusColor(t, status));
}

// The program's glyph (programs.json), tinted when it is a one-colour one.
export function programIcon(program, size, color) {
  if (!program?.icon) return null;
  return program.tint ? svg(program.icon).size(size).flex_none().text_color(color)
    : image(program.icon).w(size).h(size).flex_none();
}
