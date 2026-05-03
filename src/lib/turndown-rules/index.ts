/**
 * turndown-rules 模块入口
 * 汇总所有 Turndown 转换规则并统一注册，
 * 将 HTML 转换回 Markdown 自定义语法。
 */

import type TurndownService from "turndown";
import { registerImageRules } from "./image-rules";
import { registerHeadingRules } from "./heading-rules";
import { registerTableRules } from "./table-rules";
import { registerBlockContainerRules } from "./block-container-rules";
import { registerInlineRules } from "./inline-rules";

/** 向 TurndownService 实例注册所有自定义转换规则 */
export function registerCustomRules(td: TurndownService) {
  registerImageRules(td);
  registerHeadingRules(td);
  registerTableRules(td);
  registerBlockContainerRules(td);
  registerInlineRules(td);
}
