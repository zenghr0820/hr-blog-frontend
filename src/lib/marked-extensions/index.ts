/** marked-extensions 模块入口，导出扩展注册和任务列表修复功能 */
export { registerMarkedExtensions, setContainerAliases } from "./extension-register";
export { fixTaskListHtml } from "./task-list";
export { parseMusicPlayerData, renderMusicPlayerHtml, decodeHtmlEntities } from "./music-player";
export type { MusicPlayerRenderData } from "./music-player";
