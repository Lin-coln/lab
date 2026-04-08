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
      properties?: Record<
        string,
        | boolean
        | {
            type?: string | string[];
            items?: any;
            description?: string;
            enum?: any[];
          }
      >;
    };
  };
}

export namespace Tool {
  export interface Call {
    id: string;
    function: {
      name: string;
      arguments: {
        [key: string]: any;
      };
    };
  }
}

declare module "@/core" {
  interface Message {
    tool_name?: string;
    tool_calls?: Tool.Call[];
  }
}
