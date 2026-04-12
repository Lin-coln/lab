import { iterateSSE, type Content, type Item, type Response, type StreamEvent, type Tool } from "cc";

export function createAdapter() {
  const host = "http://localhost:1234";

  return {
    async createResponse(opts: { model: string; input: Item[]; tools?: Tool[] }) {
      const input = structuredClone(opts.input).map(revertItem);
      const iterable = await responses({
        stream: true,
        model: opts.model,
        input: input,
        ...(opts.tools ? { tools: structuredClone(opts.tools) } : {}),
      });
      return iterateStreamEvents(iterable);
    },
  };

  async function responses(body: object) {
    const resp = await fetch(host + "/v1/responses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      throw new Error(`failed to invoke response api - ${resp.status} ${resp.statusText}`);
    }
    if (!resp.body) {
      throw new Error(`failed to invoke response api - empty body`);
    }
    return resp.body as unknown as AsyncIterable<Uint8Array<ArrayBuffer>>;
  }
}

async function* iterateStreamEvents(
  iterable: AsyncIterable<Uint8Array<ArrayBuffer> | ArrayBuffer>,
): AsyncIterable<StreamEvent> {
  for await (const msg of iterateSSE(iterable)) {
    const event = resolveStreamEvent(JSON.parse(msg.data));
    if (!event) continue;
    yield event;
  }
}

function resolveStreamEvent(x: any): StreamEvent | void {
  const type = x.type;

  if (type === "response.created") {
    return {
      type: "response.created",
      response: {
        created_at: x.response.created_at,
        completed_at: 0,
        output: [],
      },
    };
  }
  if (type === "response.in_progress") return;
  if (type === "response.completed") {
    return {
      type: "response.created",
      response: {
        created_at: x.response.created_at,
        completed_at: x.response.completed_at,
        output: x.response.output.map(resolveOutputItem),
      },
    };
  }

  if (type === "response.output_item.added") {
    return {
      type: "response.output_item.added",
      item_index: x.output_index,
      item: resolveOutputItem(x.item),
    };
  }
  if (type === "response.output_item.done") {
    return {
      type: "response.output_item.done",
      item_index: x.output_index,
      item: resolveOutputItem(x.item),
    };
  }

  if (type === "response.content_part.added") {
    return {
      type: "response.content_part.added",
      item_index: x.output_index,
      part_index: x.content_index,
      part: resolveContentPart(x.part),
    };
  }
  if (type === "response.content_part.done") {
    return {
      type: "response.content_part.done",
      item_index: x.output_index,
      part_index: x.content_index,
      part: resolveContentPart(x.part),
    };
  }

  // delta

  if (type === "response.reasoning_text.delta") {
    return {
      type: "response.delta.content_part.text",
      item_index: x.output_index,
      part_index: x.content_index,
      delta: x.delta,
    };
  }
  if (type === "response.reasoning_text.done") return;

  if (type === "response.output_text.delta") {
    return {
      type: "response.delta.content_part.text",
      item_index: x.output_index,
      part_index: x.content_index,
      delta: x.delta,
    };
  }
  if (type === "response.output_text.done") return;

  if (type === "response.function_call_arguments.done") return;

  console.log(JSON.stringify(x));
  throw new Error("failed to resolve stream event");
}

function resolveOutputItem(x: any): Response.OutputItem {
  if (x.type === "reasoning") {
    return {
      type: "reasoning",
      content: x.content.map(resolveContentPart),
    };
  }
  if (x.type === "message" && x.role === "assistant") {
    return {
      type: "message",
      role: "assistant",
      content: x.content.map(resolveContentPart),
    };
  }

  if (x.type === "function_call") {
    return {
      type: "tool_call",
      call_id: x.call_id,
      name: x.name,
      arguments: x.arguments,
    };
  }

  console.log(JSON.stringify(x));
  throw new Error("failed to resolve item");
}

function resolveContentPart(x: any): Content[keyof Content] {
  if (x.type === "reasoning_text") {
    return { type: "text", text: x.text };
  }
  if (x.type === "output_text") {
    return { type: "text", text: x.text };
  }

  console.log(JSON.stringify(x));
  throw new Error("failed to resolve content");
}

function revertItem(x: Item): any {
  if (x.type === "reasoning") {
    return {
      summary: [],
      ...x,
      content: x.content.map((x) => ({
        ...x,

        type: x.type === "text" ? "reasoning_text" : x.type,
      })),
    };
  }

  if (x.type === "message" && x.role === "assistant") {
    return {
      ...x,
      content: x.content.map((x) => ({
        ...x,
        type: x.type === "text" ? "output_text" : x.type,
      })),
    };
  }

  if (x.type === "tool_call") {
    return {
      ...x,
      type: "function_call",
    };
  }

  if (x.type === "tool_call_output") {
    return {
      ...x,
      type: "function_call_output",
    };
  }

  return x;
}
