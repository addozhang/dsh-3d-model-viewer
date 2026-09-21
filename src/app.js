// Plugin registration: slots, document previews, locale.
import { React, h, useStore, makeStore, makeSessionStore } from "./core.js";
import { injectStyles } from "./styles.js";
import { SessionBridge, SessionDrawerOverlay, Model3dBody, M3D_DOC_ID } from "./ui.js";

export const INJECT = ["slots", "sessions", "locale", "documentPreviews"];

export function apply(ctx) {
  injectStyles();
  const layoutStore = makeStore();
  const sessionStores = new Map();
  const stores = {
    get(id) {
      let s = sessionStores.get(id);
      if (!s) { s = makeSessionStore(); sessionStores.set(id, s); }
      return s;
    },
  };
  function ActiveDrawer() {
    const layout = useStore(layoutStore);
    const list = React.useSyncExternalStore(ctx.sessions.list.subscribe, ctx.sessions.list.getSnapshot, ctx.sessions.list.getSnapshot);
    const id = layout.sessionId || list.current;
    const sessionStore = id ? stores.get(id) : makeSessionStore();
    return h(SessionDrawerOverlay, { sessionStore, layoutStore });
  }
  ctx.slots.inject("conversation.session.header.actions", () => ctx.slots.register(
    { name: "conversation.session.header.actions", id: "3d-model-preview-action", order: 70, inject: owner => ({ sessions: ctx.sessions, stores, layoutStore }) },
    SessionBridge));
  ctx.slots.inject("shell.overlay", () => ctx.slots.register(
    { name: "shell.overlay", id: "3d-session-preview-drawer", order: 70 },
    ActiveDrawer));

  const t = ctx.locale.bind("dsh3dDoc");
  ctx.effect(() => ctx.locale.register("dsh3dDoc", {
    zh: { title: "3D 模型", loading: "正在解析模型…", waiting: "等待文件内容…", failed: "无法解析这个模型：{message}" },
    en: { title: "3D Model", loading: "Parsing model…", waiting: "Waiting for file contents…", failed: "This model could not be parsed: {message}" },
  }), "3d-model-viewer: doc dictionaries");
  ctx.effect(() => ctx.documentPreviews.register({
    id: M3D_DOC_ID,
    extensions: ["stl", "3mf"],
    binaryExtensions: ["stl", "3mf"],
    priority: "extension",
    title: () => t("title"),
    loading: "bytes-complete",
    wrap: false,
  }), "3d-model-viewer: doc metadata");
  ctx.slots.inject("sidebar.right.tab.document", () => ctx.slots.register(
    { name: "sidebar.right.tab.document", key: M3D_DOC_ID, locale: "dsh3dDoc" },
    Model3dBody));
}
