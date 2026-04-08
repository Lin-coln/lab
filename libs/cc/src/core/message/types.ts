export interface Message {
  role: string;
  content: string;
  reasoning?: string;
}

export namespace Message {
  export interface Metadata {
    id: string;
    created_at: number;
  }

  export type StreamEvent = StreamEvent.MessageStart | StreamEvent.MessageChunk | StreamEvent.MessageFinish;
  export namespace StreamEvent {
    export interface MessageStart {
      type: "message_start";
      id: string;
      created_at: number;
      role: string;
      content: string;
    }

    export interface MessageChunk {
      type: "message_chunk";
      content?: string;
      reasoning?: string;
    }

    export interface MessageFinish {
      type: "message_finish";
      reason: string;
    }
  }
}
