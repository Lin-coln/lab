import { Model } from "./model";
import { MessageContext } from "./message";
import { Functions } from "./functions";

export class Agent {
  model: Model;
  messageContext: MessageContext;
  functions: Functions;
  model_name: string | null;
  constructor() {
    this.model = new Model();
    this.messageContext = new MessageContext();
    this.functions = new Functions();
    this.model_name = null;
  }

  async chat() {
    while (true) {
      const model = this.model_name;
      if (!model) throw new Error("specific model first");

      const respMessage = await this.model.chat({
        model,
        tools: [...this.functions.getTools()],
        messages: this.messageContext.messages,
        createStream: this.messageContext.createStream.bind(this.messageContext),
        upsertMessage: this.messageContext.upsert.bind(this.messageContext),
      });

      // tool calls
      if (respMessage.tool_calls) {
        await Promise.all(
          respMessage.tool_calls.map(async (call) => {
            const { name, arguments: args } = call.function;
            await this.functions.call({
              name,
              args,
              createStream: this.messageContext.createStream.bind(this.messageContext),
              upsertMessage: this.messageContext.upsert.bind(this.messageContext),
            });
          }),
        );
      }

      const last = this.messageContext.messages.at(-1);
      if (!last) break;
      if (last.role === "tool") continue;
      if (last.role === "assistant" && last.tool_calls?.length) continue;

      break;
    }
  }
}
