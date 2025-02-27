import { instrument } from "@fiberplane/hono-otel";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { eq, sql, and } from "drizzle-orm";
import * as schema from "./db/schema";

import { createFiberplane } from "@fiberplane/hono";
import apiSpec from "./apiSpec";
import Anthropic from "@anthropic-ai/sdk";
import { type GeneratedFashionItem, validateGeneratedItem } from "./types";
import { serveEmojiFavicon } from "./middleware";

type Bindings = {
  DB: D1Database;
  ANTHROPIC_API_KEY: string;
  CLOUDFLARE_ACCOUNT_ID: string;
  CLOUDFLARE_GATEWAY_ID: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use("*", cors());

app.use("*", serveEmojiFavicon("👗"));

app.get("/", async (c) => {
  return c.text("*Fashionable HONC* ☁️🪿👗");
});

function hasServers(spec: unknown): spec is { servers: unknown[] } {
  return (
    !!spec &&
    typeof spec === "object" &&
    "servers" in spec &&
    Array.isArray(spec.servers) &&
    spec.servers.length > 0
  );
}

app.get("/openapi.json", (c) => {
  const origin = new URL(c.req.url).origin;

  // HACK - Allows us to force a server of "localhost:8787" even when the playground SPA is running in dev mode on :6660
  const spec = {
    ...apiSpec,
    servers: hasServers(apiSpec) ? apiSpec.servers : [],
  };

  if (origin?.includes("localhost")) {
    spec.servers = [
      {
        url: "http://localhost:8787",
        description: "Local development server",
      },
      ...(spec.servers || []),
    ];
  }

  return c.json(spec);
});

app.use(
  "/fp/*",
  createFiberplane({
    app,
    openapi: { url: "/openapi.json" },
    apiKey: "fp_wD9nLEXNhaVfq-U-iUzwbOfQAWjTBlDF",
    //fpxEndpoint: "http://localhost:8787/v1/traces",
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
          .where(and(...conditions))
          .all()
      : await db.select().from(schema.fashionItems).all();

  return c.json({ items });
});

app.get("/api/fashion-items/price-range", async (c) => {
  const db = drizzle(c.env.DB);
  const minPrice = Number(c.req.query("min")) || 0;
  const maxPrice = Number(c.req.query("max")) || Number.MAX_SAFE_INTEGER;

  const items = await db
    .select()
    .from(schema.fashionItems)
    .where(
      sql`${schema.fashionItems.price} >= ${minPrice} AND ${schema.fashionItems.price} <= ${maxPrice}`,
    )
    .all();

  return c.json({ items });
});

app.get("/api/fashion-items/trending", async (c) => {
  const db = drizzle(c.env.DB);
  const limit = Number(c.req.query("limit")) || 10;

  // For now, we'll just return the most recently added in-stock items
  // In a real app, you might want to track views/purchases
  const items = await db
    .select()
    .from(schema.fashionItems)
    .where(eq(schema.fashionItems.inStock, true))
    .orderBy(sql`${schema.fashionItems.createdAt} DESC`)
    .limit(limit)
    .all();

  return c.json({ items });
});

app.get("/api/fashion-items/by-categories", async (c) => {
  const db = drizzle(c.env.DB);
  const categories = c.req.query("categories")?.split(",") || [];

  if (categories.length === 0) {
    return c.json({ error: "No categories provided" }, 400);
  }

  const items = await db
    .select()
    .from(schema.fashionItems)
    .where(sql`${schema.fashionItems.category} IN ${categories}`)
    .all();

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
      fetch: globalThis.fetch,
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
          description:
            "Generate a creative fashion item for the given category and season.",
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
                maximum: 50000,
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
    return c.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      500,
    );
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

app.patch("/api/fashion-items/:id/stock-status", async (c) => {
  const db = drizzle(c.env.DB);
  const id = Number.parseInt(c.req.param("id"));
  const { inStock } = await c.req.json();

  if (typeof inStock !== "boolean") {
    return c.json({ error: "inStock must be a boolean value" }, 400);
  }

  const [updatedItem] = await db
    .update(schema.fashionItems)
    .set({
      inStock: inStock,
      updatedAt: sql`(CURRENT_TIMESTAMP)`,
    })
    .where(eq(schema.fashionItems.id, id))
    .returning();

  if (!updatedItem) {
    return c.json({ error: "Item not found" }, 404);
  }

  return c.json(updatedItem);
});

app.post("/api/fashion-items/bulk-price-update", async (c) => {
  const db = drizzle(c.env.DB);
  const { category, percentageIncrease } = await c.req.json();

  if (!category || typeof percentageIncrease !== "number") {
    return c.json({ error: "Invalid input parameters" }, 400);
  }

  try {
    // Intentionally faulty SQL that will cause an error
    // Using incorrect syntax for demonstration
    const items = await db
      .select()
      .from(schema.fashionItems)
      .where(sql`${schema.fashionItems.category} = ${category}`)
      .set({
        // This is incorrect - mixing select with set
        price: sql`${schema.fashionItems.price} * (1 + ${percentageIncrease / 100})`,
      })
      .all();

    return c.json({ items });
  } catch (error) {
    console.error("Database error:", error);
    return c.json(
      {
        error: "Failed to update prices",
        details: error instanceof Error ? error.message : "Unknown error",
        technicalDetails: "Attempted to perform an invalid SQL operation",
      },
      500,
    );
  }
});

export default instrument(app);
