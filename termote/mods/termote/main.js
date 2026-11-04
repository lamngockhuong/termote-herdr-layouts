// Termote's look for Herdr: one mod drawn by role (props().role), placed by
// the termote-neutral, termote-terminal and termote-native layouts.
//   header   the 44px bar over the panes
//   sidebar  spaces and their tabs, as Termote's session list
//   pane     each pane's header, with Open in Termote, Copy link and QR code
//   status   the 24px strip: Termote's server, agent counts, layout
//   qr       the popup the pane header's QR button opens

import { View, div } from "gpui-kit";
import { props } from "herdr";
import { header } from "./header.js";
import { pane } from "./pane.js";
import { qr, qrInit } from "./qr.js";
import { sidebar } from "./sidebar.js";
import { status, statusInit } from "./status.js";

const ROLES = {
  header: { render: header },
  sidebar: { render: sidebar },
  pane: { render: pane },
  status: { init: statusInit, render: status },
  qr: { init: qrInit, render: qr },
};

export default class Termote extends View {
  init(_props, cx) {
    this.role = ROLES[props()?.role];
    this.role?.init?.(this, cx);
  }

  render(cx) {
    return this.role ? this.role.render(this, cx) : div();
  }
}
