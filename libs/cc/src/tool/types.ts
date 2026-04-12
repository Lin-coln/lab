import type { ZodType } from "zod";

export interface Tool {
  type: "function";
  name: string;
  description: string;
  parameters: {
    type?: string;
    items?: any;
    required?: string[];
    properties?: {
      [key: string]: {
        type?: string | string[];
        items?: any;
        description?: string;
        enum?: any[];
      };
    };
  };
}

export namespace Tool {
  export interface Context {
    resolveTools(): Promise<Tool[]>;

    add(opts: { name: string; description: string; input: ZodType; handler: (args: any) => any }): void;

    call(name: string, args: string): Promise<string>;
  }
}

declare module "../types" {
  interface ItemDict {
    tool_call: Item.ToolCall;
    tool_call_output: Item.ToolCallOutput;
  }

  namespace Item {
    export interface ToolCall {
      type: "tool_call";
      call_id: string;
      name: string;
      arguments: string;
    }

    export interface ToolCallOutput {
      type: "tool_call_output";
      call_id: string;
      output: string;
    }
  }

  namespace Response {
    interface OutputDict {
      tool_call: Item.ToolCall;
    }
  }

  namespace StreamEvent {
    interface ResponseDeltaDict {
      tool_call_arguments: ResponseDelta.ToolCallArguments;
    }

    namespace ResponseDelta {
      export interface ToolCallArguments {
        type: "response.delta.tool_call_arguments";
        item_index: number;
        delta: string;
      }
    }
  }
}
