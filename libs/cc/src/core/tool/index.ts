export interface Tool {
  type: string;
  function: {
    name?: string;
    description?: string;
    type?: string;
    parameters?: {
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
  };
}

export namespace Tool {
  export interface Call {
    id: string;
    type: string;
    function: { name: string; arguments: string };
  }
}

declare module "../../core" {
  interface Message {
    tool_call_id?: string;
    tool_calls?: Tool.Call[];
  }

  namespace Message {
    namespace StreamEvent {
      interface MessageChunk {
        tool_calls?: Tool.Call[];
      }
    }
  }
}
