import type { Content } from "./content";

export type Item = ItemDict[keyof ItemDict];

export interface ItemDict {
  system: Item.SystemMessage;
  user: Item.UserMessage;
  assistant: Item.AssistantMessage;
  reasoning: Item.Reasoning;
}

export namespace Item {
  export interface SystemMessage {
    type: "message";
    role: "system";
    content: string | Content.Text[];
  }

  export interface UserMessage {
    type: "message";
    role: "user";
    content: string | Content.Text[];
  }

  export interface AssistantMessage {
    type: "message";
    role: "assistant";
    content: Content.Text[];
  }

  export interface Reasoning {
    type: "reasoning";
    content: Content.Text[];
  }
}
