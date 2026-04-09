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
