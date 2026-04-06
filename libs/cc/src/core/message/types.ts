export interface Message {
  role: string;
  content: string;
  thinking?: string;
}

export namespace Message {
  export interface Metadata {
    id: string;
    created_at: number;
  }

  export type StreamEvent = StreamEvent.MessageStart | StreamEvent.MessageChunk | StreamEvent.MessageStop;
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
      thinking?: string;
    }

    export interface MessageStop {
      type: "message_stop";
    }
  }
}
