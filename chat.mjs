import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "fs";
import { createInterface } from "readline";

const soul = readFileSync("SOUL.md", "utf-8");
const memory = readFileSync("MEMORY.md", "utf-8");
const agents = readFileSync("AGENTS.md", "utf-8");

const systemPrompt = [soul, memory, agents].join("\n\n---\n\n");

const client = new Anthropic();
const messages = [];

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

let closed = false;
rl.on("close", () => {
  closed = true;
});

function prompt() {
  rl.question("\nyou: ", async (input) => {
    input = input.trim();
    if (!input) return prompt();
    if (input === "/quit") return process.exit(0);

    messages.push({ role: "user", content: input });

    process.stdout.write("\nsamantha: ");

    const stream = client.messages.stream({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    });

    let response = "";

    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        process.stdout.write(event.delta.text);
        response += event.delta.text;
      }
    }

    process.stdout.write("\n");
    messages.push({ role: "assistant", content: response });
    if (closed) return process.exit(0);
    prompt();
  });
}

console.log("samantha — type /quit to exit\n");
prompt();
