import ollama from "ollama";

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

export async function listModel() {
  const resp = await ollama.list();
  const modelInfoList: ModelInfo[] = await Promise.all(
    resp.models.map(async (x) => {
      const resp = await ollama.show({ model: x.model });
      return {
        identifier: x.model,
        modified_at: x.modified_at.valueOf(),
        size: x.size,
        digest: x.digest,
        format: x.details.format,
        parameter_size: x.details.parameter_size,
        quantization_level: x.details.quantization_level,
        capabilities: resp.capabilities,
      };
    }),
  );
  return modelInfoList;
}

export async function deleteModel(model: string) {
  const resp = await ollama.delete({ model });
  console.log(`delete model: ${model}`, resp);
}
