/*---------------------------------------------------------
 *  Author: Benjamin R. Bray
 *  License: MIT (see LICENSE in project root for details)
 *--------------------------------------------------------*/

import {
  chainCommands,
  createParagraphNear,
  deleteSelection,
  joinBackward,
  joinForward,
  liftEmptyBlock,
  newlineInCode,
  selectNodeBackward,
  selectNodeForward,
  splitBlock,
} from "prosemirror-commands";
import { inputRules } from "prosemirror-inputrules";
import { keymap } from "prosemirror-keymap";
import { Schema } from "prosemirror-model";
import { Plugin as ProsePlugin } from "prosemirror-state";
import { insertMathCmd } from "./commands/insert-math-cmd";
import { mathPlugin } from "./math-plugin";
import { mathSchemaSpec } from "./math-schema";
import { mathBackspaceCmd } from "./plugins/math-backspace";
import {
  makeBlockMathInputRule,
  makeInlineMathInputRule,
  REGEX_BLOCK_MATH_DOLLARS,
  REGEX_INLINE_MATH_DOLLARS,
} from "./plugins/math-inputrules";

export const textEditorSchema = new Schema(mathSchemaSpec);

export const inlineMathInputRule = makeInlineMathInputRule(
  REGEX_INLINE_MATH_DOLLARS,
  textEditorSchema.nodes.math_inline,
);

export const blockMathInputRule = makeBlockMathInputRule(
  REGEX_BLOCK_MATH_DOLLARS,
  textEditorSchema.nodes.math_display,
);

export const plugins: ProsePlugin[] = [
  mathPlugin,
  keymap({
    "Mod-Space": insertMathCmd(textEditorSchema.nodes.math_inline),
    Backspace: chainCommands(
      deleteSelection,
      mathBackspaceCmd,
      joinBackward,
      selectNodeBackward,
    ),
    // below is the default keymap
    Enter: chainCommands(
      newlineInCode,
      createParagraphNear,
      liftEmptyBlock,
      splitBlock,
    ),
    "Ctrl-Enter": chainCommands(newlineInCode, createParagraphNear, splitBlock),
    Delete: chainCommands(deleteSelection, joinForward, selectNodeForward),
  }),
  inputRules({ rules: [inlineMathInputRule, blockMathInputRule] }),
];
