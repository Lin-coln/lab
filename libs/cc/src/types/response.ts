import type { Content } from "./content";
import type { Item } from "./item";

/**
 * response
 */
export interface Response {
  created_at: number;
  completed_at: number;
  output: Response.OutputItem[];
}

export namespace Response {
  export type OutputItem = OutputDict[keyof OutputDict];

  export interface OutputDict {
    reasoning: Item.Reasoning;
    assistant: Item.AssistantMessage;
  }
}

/**
 * stream event
 */
export type StreamEvent =
  | StreamEvent.ResponseCreated
  | StreamEvent.ResponseCompleted
  | StreamEvent.OutputItemAdded
  | StreamEvent.OutputItemDone
  | StreamEvent.ContentPartAdded
  | StreamEvent.ContentPartDone
  | StreamEvent.ResponseDelta;
export namespace StreamEvent {
  /**
   * response.created
   * response.completed
   */
  export interface ResponseCreated {
    type: "response.created";
    response: Response;
  }

  export interface ResponseCompleted {
    type: "response.completed";
    response: Response;
  }

  /**
   * response.output_item.added
   * response.output_item.done
   */
  export interface OutputItemAdded {
    type: "response.output_item.added";
    item_index: number;
    item: Response.OutputItem;
  }

  export interface OutputItemDone {
    type: "response.output_item.done";
    item_index: number;
    item: Response.OutputItem;
  }

  /**
   * response.content_part.added
   * response.content_part.done
   */
  type ContentPart = Content[keyof Content];

  export interface ContentPartAdded {
    type: "response.content_part.added";
    item_index: number;
    part_index: number;
    part: ContentPart;
  }

  export interface ContentPartDone {
    type: "response.content_part.done";
    item_index: number;
    part_index: number;
    part: ContentPart;
  }

  /**
   * response.delta.<custom>
   */
  export type ResponseDelta = ResponseDeltaDict[keyof ResponseDeltaDict];

  export interface ResponseDeltaDict {
    "content_part.text": ResponseDelta.ContentText;
  }

  export namespace ResponseDelta {
    export interface ContentText {
      type: "response.delta.content_part.text";
      item_index: number;
      part_index: number;
      delta: string;
    }
  }
}
