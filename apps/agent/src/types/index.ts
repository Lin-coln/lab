export interface ModelInfo {
  identifier: string;
  modified_at: number;
  size: number;
  digest: string;
  format: string;
  parameter_size: string;
  quantization_level: string;
  capabilities: string[];
}

export interface Message {
  id: string;

  // ollama chat response
  created_at: number;
  done?: boolean;
  done_reason?: string;
  total_duration?: number;
  prompt_eval_count?: number;
  eval_count?: number;

  // ollama message
  role: string;
  content: string;
  thinking?: string;
}

export interface ToolCall {
  function: {
    name: string;
    arguments: {
      [key: string]: any;
    };
  };
}
