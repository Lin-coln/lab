import { Agent } from "@/core";
import z from "zod";

const systemPrompt = `# TOOL USE

You have access to a set of tools that
are executed upon the user's approval.
You can use one tool per message, and
will receive the result of that tool
use in the user's response. You use
tools step-by-step to accomplish a
given task, with each tool use
informed by the result of the previous
tool use.

# THINK

thinking in chinese, don't thinking too long`;

export const agent = new Agent();
agent.functions.add({
  name: "get_current_weather",
  description: "Get the current weather for a city",
  schema: z.object({
    city: z.string().describe("The city and state, e.g. San Francisco, CA"),
  }),
  handler: async ({ city }) => {
    return { city, weather: "Sunny", temp: "25°C" };
  },
});
