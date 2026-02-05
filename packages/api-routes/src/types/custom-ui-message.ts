import { type UIMessage, type UIMessagePart } from "ai";
import { type CustomUIDataTypes } from "./custom-ui-data-types.js";
import { type CustomUIMetadata } from "./custom-ui-metadata.js";
import { type CustomUITools } from "./custom-ui-tools.js";

export type CustomUIMessagePart = UIMessagePart<
  CustomUIDataTypes,
  CustomUITools
>;
export type CustomUIMessage = UIMessage<
  CustomUIMetadata,
  CustomUIDataTypes,
  CustomUITools
>;
