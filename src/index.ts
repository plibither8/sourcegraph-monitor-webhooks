import { Hono } from "hono";
import { markdownv2 as format } from "telegram-format";

interface Env {
  AUTH_TOKEN: string;
  TG_BOT_TOKEN: string;
  TG_CHAT_ID: string;
}

interface PayloadResult {
  repository: string;
  commit: string;
  diff: string;
  matchedDiffRanges: [number, number][];
}

interface Payload {
  monitorDescription: string;
  monitorURL: string;
  query: string;
  results?: PayloadResult[];
}

const app = new Hono<{ Bindings: Env }>();

app.post("/telegram", async (ctx) => {
  const token = ctx.req.query("token");
  if (token !== ctx.env.AUTH_TOKEN) return ctx.text("Invalid token", 401);
  const payload = await ctx.req.json<Payload>();
  const text = `${format.bold("✨ Sourcegraph Code Monitor ✨")}
${format.escape("New code monitor results from")} ${format.url(
    payload.monitorDescription,
    payload.monitorURL
  )}${format.escape("!")}\n\n
${
  payload.results
    ?.map((result) => format.monospaceBlock(result.diff, "diff"))
    .join("\n") || ""
}`;
  try {
    await fetch(
      `https://api.telegram.org/bot${ctx.env.TG_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: ctx.env.TG_CHAT_ID,
          parse_mode: "MarkdownV2",
          disable_web_page_preview: true,
          text,
        }),
      }
    );
  } catch (err) {
    return ctx.text(`Error sending message: ${err}`, 500);
  }
  return ctx.text("Message sent");
});

app.all("*", (ctx) =>
  ctx.text(
    "Thanks for dropping by! Visit https://github.com/plibither8/sourcegraph-monitor-webhooks for more info ;)"
  )
);

export default app;
