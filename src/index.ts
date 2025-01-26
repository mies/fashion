import { instrument } from "@fiberplane/hono-otel";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { eq, sql } from "drizzle-orm";
import * as schema from "./db/schema";

import { createMiddleware } from "@fiberplane/embedded";
import apiSpec from "./apiSpec";
import Anthropic from "@anthropic-ai/sdk";
import { env } from "hono/adapter";
import { GeneratedFashionItem, validateGeneratedItem } from "./types";

type Bindings = {
  DB: D1Database;
  ANTHROPIC_API_KEY: string;
  CLOUDFLARE_ACCOUNT_ID: string;
  CLOUDFLARE_GATEWAY_ID: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use("*", cors());

app.get("/", (c) => {
  return c.text("Honc from above! ☁️🪿");
});

app.get("/openapi.json", (c) => {
  return c.json(apiSpec);
});

app.use(
  "/fp/*",
  createMiddleware({
    openapi: { content: JSON.stringify(apiSpec) },
    apiKey: "",
  }),
);

app.get("/api/users", async (c) => {
  const db = drizzle(c.env.DB);
  const users = await db.select().from(schema.users);
  return c.json({ users });
});

app.post("/api/user", async (c) => {
  const db = drizzle(c.env.DB);
  const { name, email } = await c.req.json();

  const [newUser] = await db
    .insert(schema.users)
    .values({
      name: name,
      email: email,
    })
    .returning();

  return c.json(newUser);
});

// Fashion Items CRUD endpoints
app.get("/api/fashion-items", async (c) => {
  const db = drizzle(c.env.DB);
  const season = c.req.query("season");
  const category = c.req.query("category");

  const conditions = [];
  if (season) {
    conditions.push(eq(schema.fashionItems.season, season));
  }
  if (category) {
    conditions.push(eq(schema.fashionItems.category, category));
  }

  const items =
    conditions.length > 0
      ? await db
          .select()
          .from(schema.fashionItems)
          .where(sql`${conditions.join(" AND ")}`)
          .all()
      : await db.select().from(schema.fashionItems).all();

  return c.json({ items });
});

app.get("/api/fashion-items/:id", async (c) => {
  const db = drizzle(c.env.DB);
  const id = Number.parseInt(c.req.param("id"));

  const [item] = await db
    .select()
    .from(schema.fashionItems)
    .where(eq(schema.fashionItems.id, id));

  if (!item) {
    return c.json({ error: "Item not found" }, 404);
  }

  return c.json(item);
});


app.post("/api/fashion-items", async (c) => {
  try {
    const db = drizzle(c.env.DB);
    const { category, season } = await c.req.json();

    // Initialize Anthropic client with Cloudflare AI Gateway
    const anthropic = new Anthropic({
      apiKey: c.env.ANTHROPIC_API_KEY,
      baseURL: `https://gateway.ai.cloudflare.com/v1/${c.env.CLOUDFLARE_ACCOUNT_ID}/${c.env.CLOUDFLARE_GATEWAY_ID}/anthropic`,
    });

    // Generate fashion item details using Claude
    const prompt = `Generate a creative fashion item for the ${category} category in the ${season} season.
    Include a name, detailed description, and suggested price in cents (between 2000 and 50000).
    Format the response as a JSON object with these exact keys: name, description, price.`;

    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20240620",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1024,
      temperature: 0.1,
      tool_choice: { type: "tool", name: "generate_fashion_item" },
      tools: [
        {
          name: "generate_fashion_item",
          description: "Generate a creative fashion item for the given category and season.",
          input_schema: {
            type: "object",
            properties: {
              name: {
                type: "string",
                description: "The name of the fashion item",
              },
              description: {
                type: "string", 
                description: "Detailed description of the fashion item",
              },
              price: {
                type: "number",
                description: "Price in cents between 2000 and 50000",
                minimum: 2000,
                maximum: 50000
              },
            },
            required: ["name", "description", "price"],
          },
        },
      ],
    });

    let generatedItem: GeneratedFashionItem;
    if (response.content[0].type === "tool_use") {
      const rawInput = response.content[0].input;
      if (!validateGeneratedItem(rawInput)) {
        console.error("Invalid generated item format", rawInput);
        return c.json({ error: "Invalid response upstream" }, 500);
      }
      generatedItem = rawInput;
    } else {
      console.error("No tool use found in response", response);
      return c.json({ error: "Invalid response upstream" }, 500);
    }

    const [newItem] = await db
      .insert(schema.fashionItems)
      .values({
        name: generatedItem.name,
        description: generatedItem.description,
        season: season,
        category: category,
        price: generatedItem.price,
        inStock: true,
      })
      .returning();

    return c.json(newItem, 201);
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : "Internal server error" }, 500);
  }
});

app.put("/api/fashion-items/:id", async (c) => {
  const db = drizzle(c.env.DB);
  const id = Number.parseInt(c.req.param("id"));
  const body = await c.req.json();

  const [updatedItem] = await db
    .update(schema.fashionItems)
    .set({
      name: body.name,
      description: body.description,
      season: body.season,
      category: body.category,
      price: body.price,
      imageUrl: body.imageUrl,
      inStock: body.inStock,
      updatedAt: sql`(CURRENT_TIMESTAMP)`,
    })
    .where(eq(schema.fashionItems.id, id))
    .returning();

  if (!updatedItem) {
    return c.json({ error: "Item not found" }, 404);
  }

  return c.json(updatedItem);
});

app.delete("/api/fashion-items/:id", async (c) => {
  const db = drizzle(c.env.DB);
  const id = Number.parseInt(c.req.param("id"));

  const [deletedItem] = await db
    .delete(schema.fashionItems)
    .where(eq(schema.fashionItems.id, id))
    .returning();

  if (!deletedItem) {
    return c.json({ error: "Item not found" }, 404);
  }

  return c.json({ message: "Item deleted successfully" });
});

export default instrument(app);
