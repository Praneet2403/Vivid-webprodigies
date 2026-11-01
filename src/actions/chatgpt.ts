"use server";

import { client } from "@/lib/prisma";
import { ContentItem, ContentType, Slide } from "@/lib/types";
import { currentUser } from "@clerk/nextjs/server";
import Groq from "groq-sdk";
import OpenAI from "openai";
import { v4 as uuidv4 } from "uuid";
import * as slideComponents from "@/lib/slideComponents";
import * as slideLayouts from "@/lib/slideLayouts";
import { getPrefixedCdnBaseSync } from "@uploadcare/cname-prefix/sync";

const OPENROUTER_MODEL =
  process.env.OPENROUTER_MODEL || "nvidia/nemotron-3-ultra-550b-a55b:free";
const GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

const getLLMClient = () => {
  if (process.env.OPENROUTER_API_KEY) {
    return {
      client: new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: process.env.OPENROUTER_API_KEY,
        defaultHeaders: {
          "HTTP-Referer":
            process.env.NEXT_PUBLIC_HOST_URL || "http://localhost:3000",
          "X-Title": "Vivid Presentations",
        },
      }),
      model: OPENROUTER_MODEL,
    };
  }

  if (process.env.GROQ_API_KEY) {
    return {
      client: new Groq({ apiKey: process.env.GROQ_API_KEY }),
      model: GROQ_MODEL,
    };
  }

  throw new Error(
    "Missing LLM API key. Please configure OPENROUTER_API_KEY in your .env"
  );
};

interface ChatCompletionResponse {
  choices: Array<{
    message?: {
      content?: string | null;
    };
  }>;
}

const callChatCompletion = async (params: {
  messages: Array<{ role: "system" | "user"; content: string }>;
  max_tokens?: number;
  temperature?: number;
}): Promise<ChatCompletionResponse> => {
  const { client, model } = getLLMClient();
  if (client instanceof OpenAI) {
    return (await client.chat.completions.create({
      model,
      messages: params.messages,
      response_format: { type: "json_object" },
      max_tokens: params.max_tokens,
      temperature: params.temperature,
      // Optimize OpenRouter reasoning models (Nemotron) to generate faster and avoid server timeouts
      ...({
        extra_body: {
          reasoning: {
            effort: "low",
            exclude: true,
          },
        },
      } as Record<string, unknown>),
    })) as ChatCompletionResponse;
  }

  return await client.chat.completions.create({
    model,
    messages: params.messages,
    response_format: { type: "json_object" },
    max_tokens: params.max_tokens,
    temperature: params.temperature,
  });
};

const extractJson = <T = unknown>(text: string): T => {
  // Strip reasoning / thinking tokens (e.g., <think>...</think> from Nemotron/DeepSeek)
  const cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {}
  // Strip markdown code fences if wrapped in ```json ... ```
  const matchFence = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (matchFence) {
    try {
      return JSON.parse(matchFence[1]) as T;
    } catch {}
  }
  // Try locating outermost { ... }
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1)) as T;
    } catch {}
  }
  throw new Error("Unable to parse JSON from model output");
};

interface OutlineResponse {
  outlines: string[];
}

export const generateCreativePrompt = async (userPrompt: string) => {
  const finalPrompt = `Create a coherent and relevant outline for the following prompt: ${userPrompt}.

The outline should consist of at least 6 points, with each point written as a single sentence.
Ensure the outline is well-structured and directly related to the topic.
Return the output in the following JSON format:

{
  "outlines": [
    "Point 1",
    "Point 2",
    "Point 3",
    "Point 4",
    "Point 5",
    "Point 6"
  ]
}

Ensure that the JSON is valid and properly formatted. Do not include any other text or explanation outside the JSON.`;

  try {
    const completion = await callChatCompletion({
      messages: [
        {
          role: "user",
          content: finalPrompt,
        },
      ],
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (responseContent) {
      try {
        const jsonResponse = extractJson<OutlineResponse>(responseContent);
        return { status: 200, data: jsonResponse };
      } catch (error) {
        console.error("Invalid JSON received:", responseContent, error);
        return { status: 500, error: "Invalid JSON format." };
      }
    }
    return { status: 400, error: "No content generated." };
  } catch (error) {
    console.error("🔴 ERROR", error);
    return { status: 500, error: "Internal server error" };
  }
};

const existingLayouts = [
  {
    id: uuidv4(),
    slideName: "Blank card",
    type: "blank-card",
    className: "p-8 mx-auto flex justify-center items-center min-h-[200px]",
    content: {
      id: uuidv4(),
      type: "column" as ContentType,
      name: "Column",
      content: [
        {
          id: uuidv4(),
          type: "title" as ContentType,
          name: "Title",
          content: "",
          placeholder: "Untitled Card",
        },
      ],
    },
  },

  {
    id: uuidv4(),
    slideName: "Accent left",
    type: "accentLeft",
    className: "min-h-[300px]",
    content: {
      id: uuidv4(),
      type: "column" as ContentType,
      name: "Column",
      restrictDropTo: true,
      content: [
        {
          id: uuidv4(),
          type: "resizable-column" as ContentType,
          name: "Resizable column",
          restrictToDrop: true,
          content: [
            {
              id: uuidv4(),
              type: "image" as ContentType,
              name: "Image",
              content:
                "https://plus.unsplash.com/premium_photo-1729004379397-ece899804701?q=80&w=2767&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
              alt: "Title",
            },
            {
              id: uuidv4(),
              type: "column" as ContentType,
              name: "Column",
              content: [
                {
                  id: uuidv4(),
                  type: "heading1" as ContentType,
                  name: "Heading1",
                  content: "",
                  placeholder: "Heading1",
                },
                {
                  id: uuidv4(),
                  type: "paragraph" as ContentType,
                  name: "Paragraph",
                  content: "",
                  placeholder: "start typing here",
                },
              ],
              className: "w-full h-full p-8 flex justify-center items-center",
              placeholder: "Heading1",
            },
          ],
        },
      ],
    },
  },

  {
    id: uuidv4(),
    slideName: "Accent Right",
    type: "accentRight",
    className: "min-h-[300px]",
    content: {
      id: uuidv4(),
      type: "column" as ContentType,
      name: "Column",
      content: [
        {
          id: uuidv4(),
          type: "resizable-column" as ContentType,
          name: "Resizable column",
          restrictToDrop: true,
          content: [
            {
              id: uuidv4(),
              type: "column" as ContentType,
              name: "Column",
              content: [
                {
                  id: uuidv4(),
                  type: "heading1" as ContentType,
                  name: "Heading1",
                  content: "",
                  placeholder: "Heading1",
                },
                {
                  id: uuidv4(),
                  type: "paragraph" as ContentType,
                  name: "Paragraph",
                  content: "",
                  placeholder: "start typing here",
                },
              ],
              className: "w-full h-full p-8 flex justify-center items-center",
              placeholder: "Heading1",
            },
            {
              id: uuidv4(),
              type: "image" as ContentType,
              name: "Image",
              restrictToDrop: true,
              content:
                "https://plus.unsplash.com/premium_photo-1729004379397-ece899804701?q=80&w=2767&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
              alt: "Title",
            },
          ],
        },
      ],
    },
  },

  {
    id: uuidv4(),
    slideName: "Image and text",
    type: "imageAndText",
    className: "min-h-[200px] p-8 mx-auto flex justify-center items-center",
    content: {
      id: uuidv4(),
      type: "column" as ContentType,
      name: "Column",
      content: [
        {
          id: uuidv4(),
          type: "resizable-column" as ContentType,
          name: "Image and text",
          className: "border",
          content: [
            {
              id: uuidv4(),
              type: "column" as ContentType,
              name: "Column",
              content: [
                {
                  id: uuidv4(),
                  type: "image" as ContentType,
                  name: "Image",
                  className: "p-3",
                  content:
                    "https://plus.unsplash.com/premium_photo-1729004379397-ece899804701?q=80&w=2767&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                  alt: "Title",
                },
              ],
            },
            {
              id: uuidv4(),
              type: "column" as ContentType,
              name: "Column",
              content: [
                {
                  id: uuidv4(),
                  type: "heading1" as ContentType,
                  name: "Heading1",
                  content: "",
                  placeholder: "Heading1",
                },
                {
                  id: uuidv4(),
                  type: "paragraph" as ContentType,
                  name: "Paragraph",
                  content: "",
                  placeholder: "start typing here",
                },
              ],
              className: "w-full h-full p-8 flex justify-center items-center",
              placeholder: "Heading1",
            },
          ],
        },
      ],
    },
  },

  {
    id: uuidv4(),
    slideName: "Text and image",
    type: "textAndImage",
    className: "min-h-[200px] p-8 mx-auto flex justify-center items-center",
    content: {
      id: uuidv4(),
      type: "column" as ContentType,
      name: "Column",
      content: [
        {
          id: uuidv4(),
          type: "resizable-column" as ContentType,
          name: "Text and image",
          className: "border",
          content: [
            {
              id: uuidv4(),
              type: "column" as ContentType,
              name: "",
              content: [
                {
                  id: uuidv4(),
                  type: "heading1" as ContentType,
                  name: "Heading1",
                  content: "",
                  placeholder: "Heading1",
                },
                {
                  id: uuidv4(),
                  type: "paragraph" as ContentType,
                  name: "Paragraph",
                  content: "",
                  placeholder: "start typing here",
                },
              ],
              className: "w-full h-full p-8 flex justify-center items-center",
              placeholder: "Heading1",
            },
            {
              id: uuidv4(),
              type: "column" as ContentType,
              name: "Column",
              content: [
                {
                  id: uuidv4(),
                  type: "image" as ContentType,
                  name: "Image",
                  className: "p-3",
                  content:
                    "https://plus.unsplash.com/premium_photo-1729004379397-ece899804701?q=80&w=2767&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                  alt: "Title",
                },
              ],
            },
          ],
        },
      ],
    },
  },

  {
    id: uuidv4(),
    slideName: "Two columns",
    type: "twoColumns",
    className: "p-4 mx-auto flex justify-center items-center",
    content: {
      id: uuidv4(),
      type: "column" as ContentType,
      name: "Column",
      content: [
        {
          id: uuidv4(),
          type: "title" as ContentType,
          name: "Title",
          content: "",
          placeholder: "Untitled Card",
        },
        {
          id: uuidv4(),
          type: "resizable-column" as ContentType,
          name: "Text and image",
          className: "border",
          content: [
            {
              id: uuidv4(),
              type: "paragraph" as ContentType,
              name: "Paragraph",
              content: "",
              placeholder: "Start typing...",
            },
            {
              id: uuidv4(),
              type: "paragraph" as ContentType,
              name: "Paragraph",
              content: "",
              placeholder: "Start typing...",
            },
          ],
        },
      ],
    },
  },

  {
    id: uuidv4(),
    slideName: "Two columns with headings",
    type: "twoColumnsWithHeadings",
    className: "p-4 mx-auto flex justify-center items-center",
    content: {
      id: uuidv4(),
      type: "column" as ContentType,
      name: "Column",
      content: [
        {
          id: uuidv4(),
          type: "title" as ContentType,
          name: "Title",
          content: "",
          placeholder: "Untitled Card",
        },
        {
          id: uuidv4(),
          type: "resizable-column" as ContentType,
          name: "Text and image",
          className: "border",
          content: [
            {
              id: uuidv4(),
              type: "column" as ContentType,
              name: "Column",
              content: [
                {
                  id: uuidv4(),
                  type: "heading3" as ContentType,
                  name: "Heading3",
                  content: "",
                  placeholder: "Heading 3",
                },
                {
                  id: uuidv4(),
                  type: "paragraph" as ContentType,
                  name: "Paragraph",
                  content: "",
                  placeholder: "Start typing...",
                },
              ],
            },
            {
              id: uuidv4(),
              type: "column" as ContentType,
              name: "Column",
              content: [
                {
                  id: uuidv4(),
                  type: "heading3" as ContentType,
                  name: "Heading3",
                  content: "",
                  placeholder: "Heading 3",
                },
                {
                  id: uuidv4(),
                  type: "paragraph" as ContentType,
                  name: "Paragraph",
                  content: "",
                  placeholder: "Start typing...",
                },
              ],
            },
          ],
        },
      ],
    },
  },

  {
    id: uuidv4(),
    slideName: "Three column",
    type: "threeColumns",
    className: "p-4 mx-auto flex justify-center items-center",
    content: {
      id: uuidv4(),
      type: "column" as ContentType,
      name: "Column",
      content: [
        {
          id: uuidv4(),
          type: "title" as ContentType,
          name: "Title",
          content: "",
          placeholder: "Untitled Card",
        },
        {
          id: uuidv4(),
          type: "resizable-column" as ContentType,
          name: "Text and image",
          className: "border",
          content: [
            {
              id: uuidv4(),
              type: "paragraph" as ContentType,
              name: "",
              content: "",
              placeholder: "Start typing...",
            },
            {
              id: uuidv4(),
              type: "paragraph" as ContentType,
              name: "",
              content: "",
              placeholder: "Start typing...",
            },
            {
              id: uuidv4(),
              type: "paragraph" as ContentType,
              name: "",
              content: "",
              placeholder: "Start typing...",
            },
          ],
        },
      ],
    },
  },
];

const REPLICATE_API = "https://api.replicate.com/v1/predictions";
// stability-ai/sdxl
const REPLICATE_MODEL_VERSION =
  "39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b";
const IMAGE_TIMEOUT_MS = 120_000;
const IMAGE_CONCURRENCY = 4;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const placeholderImageUrl = (prompt: string) =>
  `https://placehold.co/1024x1024/4F46E5/FFFFFF.png?text=${encodeURIComponent(
    prompt.slice(0, 60)
  )}`;

const createPrediction = async (prompt: string) => {
  for (let attempt = 0; attempt < 5; attempt++) {
    const response = await fetch(REPLICATE_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
        // Ask Replicate to hold the request open until the image is ready (up to 60s)
        Prefer: "wait=60",
      },
      body: JSON.stringify({
        version: REPLICATE_MODEL_VERSION,
        input: {
          prompt: `Professional presentation image: ${prompt}. High quality, realistic, suitable for business presentations.`,
          width: 1024,
          height: 1024,
          num_outputs: 1,
          scheduler: "K_EULER",
          num_inference_steps: 30,
          guidance_scale: 7.5,
        },
      }),
    });

    // Low-credit Replicate accounts are limited to a few predictions per minute
    if (response.status === 429) {
      const body = await response.json().catch(() => ({}));
      const retryAfter = Number(
        body?.retry_after ?? response.headers.get("retry-after") ?? 10
      );
      await sleep(Math.max(1, retryAfter) * 1000);
      continue;
    }

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(`Replicate API error ${response.status}: ${detail}`);
    }

    return response.json();
  }
  throw new Error("Replicate rate limit: gave up after 5 attempts");
};

const waitForPrediction = async (prediction: {
  id: string;
  status: string;
  output?: string[] | string;
}) => {
  const deadline = Date.now() + IMAGE_TIMEOUT_MS;
  let current = prediction;

  while (Date.now() < deadline) {
    if (current.status === "succeeded") {
      return Array.isArray(current.output) ? current.output[0] : current.output;
    }
    if (current.status === "failed" || current.status === "canceled") {
      throw new Error(`Image generation ${current.status}`);
    }

    await sleep(2000);
    const statusResponse = await fetch(`${REPLICATE_API}/${current.id}`, {
      headers: { Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN}` },
    });
    if (statusResponse.ok) {
      current = await statusResponse.json();
    }
  }
  throw new Error("Image generation timed out");
};

// Replicate deletes its output files after about an hour, so copy each image to Uploadcare
const persistImage = async (sourceUrl: string): Promise<string> => {
  const pubKey =
    process.env.UPLOADCARE_PUBLIC_KEY ||
    process.env.NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY;
  if (!pubKey) return sourceUrl;

  try {
    const form = new FormData();
    form.append("pub_key", pubKey);
    form.append("source_url", sourceUrl);
    form.append("store", "1");
    const uploadResponse = await fetch("https://upload.uploadcare.com/from_url/", {
      method: "POST",
      body: form,
    });
    if (!uploadResponse.ok) {
      throw new Error(`Uploadcare error ${uploadResponse.status}`);
    }
    const upload = await uploadResponse.json();
    // Newer Uploadcare projects serve files from a per-project subdomain of ucarecd.net
    const cdnBase = getPrefixedCdnBaseSync(pubKey, "https://ucarecd.net");
    if (upload.uuid) return `${cdnBase}/${upload.uuid}/`;

    const deadline = Date.now() + 30_000;
    while (Date.now() < deadline) {
      await sleep(1000);
      const statusResponse = await fetch(
        `https://upload.uploadcare.com/from_url/status/?token=${upload.token}`
      );
      const status = await statusResponse.json();
      if (status.status === "success" && status.uuid) {
        return `${cdnBase}/${status.uuid}/`;
      }
      if (status.status === "error") {
        throw new Error(status.error || "Uploadcare upload failed");
      }
    }
    throw new Error("Uploadcare upload timed out");
  } catch (error) {
    console.error("🔴 Could not store image on Uploadcare:", error);
    return sourceUrl;
  }
};

const persistImageBase64 = async (base64Data: string): Promise<string> => {
  const pubKey =
    process.env.UPLOADCARE_PUBLIC_KEY ||
    process.env.NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY;
  const dataUri = `data:image/png;base64,${base64Data}`;
  if (!pubKey) return dataUri;

  try {
    const buffer = Buffer.from(base64Data, "base64");
    const blob = new Blob([buffer], { type: "image/png" });
    const form = new FormData();
    form.append("UPLOADCARE_PUB_KEY", pubKey);
    form.append("UPLOADCARE_STORE", "1");
    form.append("file", blob, "flux-schnell.png");

    const uploadResponse = await fetch("https://upload.uploadcare.com/base/", {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(30_000),
    });

    if (!uploadResponse.ok) {
      throw new Error(`Uploadcare error ${uploadResponse.status}`);
    }

    const upload = (await uploadResponse.json()) as { file?: string };
    const cdnBase = getPrefixedCdnBaseSync(pubKey, "https://ucarecd.net");
    if (upload.file) {
      return `${cdnBase}/${upload.file}/`;
    }
    return dataUri;
  } catch (error) {
    console.error("🔴 Could not store image on Uploadcare:", error);
    return dataUri;
  }
};

const generateImageWithCloudflare = async (prompt: string): Promise<string> => {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  if (!accountId || !apiToken) {
    throw new Error("Cloudflare Workers AI credentials missing");
  }

  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/black-forest-labs/flux-1-schnell`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt: `Professional presentation image: ${prompt}. High quality, realistic, suitable for business presentations.`,
      steps: 4,
    }),
    signal: AbortSignal.timeout(60_000),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Cloudflare Workers AI error ${response.status}: ${detail}`);
  }

  const contentType = response.headers.get("content-type") || "";
  let base64 = "";

  if (contentType.includes("application/json")) {
    const data = (await response.json()) as {
      success?: boolean;
      result?: { image?: string };
      errors?: unknown[];
    };
    if (!data.result?.image) {
      throw new Error(`Cloudflare AI missing image: ${JSON.stringify(data.errors || data)}`);
    }
    base64 = data.result.image;
  } else {
    const arrayBuffer = await response.arrayBuffer();
    base64 = Buffer.from(arrayBuffer).toString("base64");
  }

  return await persistImageBase64(base64);
};

const generateImageUrl = async (prompt: string): Promise<string> => {
  // 1. Cloudflare Workers AI FLUX.1 [schnell]
  if (process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_API_TOKEN) {
    try {
      return await generateImageWithCloudflare(prompt);
    } catch (error) {
      console.error("🔴 Error generating image with Cloudflare Workers AI:", error);
    }
  }

  // 2. Fallback to Replicate if token is configured
  if (process.env.REPLICATE_API_TOKEN) {
    try {
      const prediction = await createPrediction(prompt);
      const imageUrl = await waitForPrediction(prediction);
      if (imageUrl) {
        return await persistImage(imageUrl);
      }
    } catch (error) {
      console.error("🔴 Error generating image with Replicate:", error);
    }
  }

  // 3. Fallback to placeholder
  return placeholderImageUrl(prompt);
};

const findImageComponents = (layout: ContentItem): ContentItem[] => {
  const images = [];
  if (layout.type === "image") {
    images.push(layout);
  }
  if (Array.isArray(layout.content)) {
    layout.content.forEach((child) => {
      if (child && typeof child === "object" && !Array.isArray(child)) {
        images.push(...findImageComponents(child as ContentItem));
      }
    });
  }
  return images;
};

const replaceImagePlaceholders = async (slides: Slide[]) => {
  const jobs = slides.flatMap((slide) =>
    findImageComponents(slide.content).map((component) => ({
      component,
      prompt: component.alt || slide.slideName || "Business presentation",
    }))
  );

  // A small worker pool keeps us under Replicate's rate limit
  let next = 0;
  const worker = async () => {
    while (next < jobs.length) {
      const job = jobs[next++];
      job.component.content = await generateImageUrl(job.prompt);
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(IMAGE_CONCURRENCY, jobs.length) }, worker)
  );
};

const RENDERABLE_TYPES = new Set<ContentType>([
  "column",
  "resizable-column",
  "title",
  "heading1",
  "heading2",
  "heading3",
  "heading4",
  "paragraph",
  "image",
  "table",
  "blockquote",
  "numberedList",
  "bulletList",
  "todoList",
  "calloutBox",
  "codeBlock",
  "tableOfContents",
  "customButton",
  "divider",
]);

const TYPE_ALIASES: Record<string, ContentType> = {
  text: "paragraph",
  body: "paragraph",
  description: "paragraph",
  quote: "blockquote",
  bulletedList: "bulletList",
  list: "bulletList",
  bullets: "bulletList",
  heading: "heading2",
  subtitle: "heading3",
  code: "codeBlock",
  link: "customButton",
  button: "customButton",
  multiColumn: "resizable-column",
};

const CONTAINER_TYPES = new Set<ContentType>(["column", "resizable-column"]);
const LIST_TYPES = new Set<ContentType>([
  "numberedList",
  "bulletList",
  "todoList",
  "tableOfContents",
]);
const CALLOUT_TYPES = ["success", "warning", "info", "question", "caution"];

// Tailwind only ships classes it finds in our source, so the AI may only use classes we already use
const collectClassNames = (value: unknown, classes: Set<string>) => {
  if (Array.isArray(value)) {
    value.forEach((child) => collectClassNames(child, classes));
  } else if (value && typeof value === "object") {
    const item = value as Record<string, unknown>;
    if (typeof item.className === "string") {
      item.className.split(/\s+/).filter(Boolean).forEach((c) => classes.add(c));
    }
    Object.values(item).forEach((child) => collectClassNames(child, classes));
  }
};
const KNOWN_CLASSES = new Set<string>();
collectClassNames(
  [existingLayouts, Object.values(slideLayouts), Object.values(slideComponents)],
  KNOWN_CLASSES
);

const sanitizeClassName = (value: unknown) =>
  typeof value === "string"
    ? value
        .split(/\s+/)
        .filter((c) => KNOWN_CLASSES.has(c))
        .join(" ") || undefined
    : undefined;

const asText = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(asText).join(" ");
  if (value === null || value === undefined) return "";
  return String(value);
};

const normalizeContentItem = (raw: unknown): ContentItem | null => {
  if (!raw) return null;

  // If raw is an array of items, wrap it into a column
  if (Array.isArray(raw)) {
    const children = raw
      .map(normalizeContentItem)
      .filter((c): c is ContentItem => c !== null);
    return {
      id: uuidv4(),
      type: "column",
      name: "Column",
      content: children,
    };
  }

  if (typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  const rawType = String(item.type ?? item.component ?? "");
  let type = (TYPE_ALIASES[rawType] ?? rawType) as ContentType;

  const rawChildren =
    item.content ?? item.components ?? item.children ?? item.elements ?? item.items;

  if (!RENDERABLE_TYPES.has(type)) {
    if (Array.isArray(rawChildren)) {
      type = "column";
    } else if (item.content || item.text || item.title || item.body) {
      type = "paragraph";
    } else {
      return null;
    }
  }

  const normalized: ContentItem = {
    id: uuidv4(),
    type,
    name: typeof item.name === "string" && item.name ? item.name : type,
    content: "",
  };
  if (typeof item.placeholder === "string") normalized.placeholder = item.placeholder;
  const className = sanitizeClassName(item.className);
  if (className) normalized.className = className;
  if (item.restrictToDrop === true) normalized.restrictToDrop = true;

  if (CONTAINER_TYPES.has(type)) {
    const children = Array.isArray(rawChildren) ? rawChildren : [rawChildren];
    normalized.content = children
      .map(normalizeContentItem)
      .filter((child): child is ContentItem => child !== null);
  } else if (LIST_TYPES.has(type)) {
    normalized.content = Array.isArray(rawChildren)
      ? rawChildren.map(asText)
      : asText(rawChildren).split("\n").filter(Boolean);
  } else if (type === "table") {
    const rows = Array.isArray(item.content)
      ? item.content.map((row) => (Array.isArray(row) ? row.map(asText) : [asText(row)]))
      : [];
    const width = Math.max(0, ...rows.map((row) => row.length));
    normalized.content = rows.map((row) => [
      ...row,
      ...Array<string>(width - row.length).fill(""),
    ]);
    normalized.initialRows =
      typeof item.initialRows === "number" ? item.initialRows : 2;
    normalized.initialColumns =
      typeof item.initialColumns === "number" ? item.initialColumns : 2;
  } else if (type === "image") {
    normalized.content = "";
    normalized.alt = asText(item.alt || item.prompt || item.description || normalized.name);
  } else if (type === "divider") {
    normalized.content = "";
  } else {
    normalized.content = asText(item.content ?? item.text ?? item.title ?? item.value ?? "");
  }

  if (type === "calloutBox") {
    normalized.callOutType = CALLOUT_TYPES.includes(String(item.callOutType))
      ? (item.callOutType as ContentItem["callOutType"])
      : "info";
  }
  if (type === "codeBlock") {
    normalized.code = asText(item.code ?? item.content);
    normalized.content = normalized.code;
    normalized.language =
      typeof item.language === "string" ? item.language : "javascript";
  }
  if (type === "customButton") {
    if (typeof item.link === "string") normalized.link = item.link;
    if (typeof item.bgColor === "string") normalized.bgColor = item.bgColor;
  }

  return normalized;
};

const extractSlideArray = (parsed: unknown): unknown[] => {
  if (Array.isArray(parsed)) return parsed;
  if (parsed && typeof parsed === "object") {
    const record = parsed as Record<string, unknown>;
    for (const key of ["slides", "layouts", "presentation", "deck", "data"]) {
      if (Array.isArray(record[key])) return record[key] as unknown[];
    }
    const firstArray = Object.values(record).find(Array.isArray);
    if (firstArray) return firstArray;
    if ("content" in record || "components" in record) return [record];
  }
  return [];
};

const normalizeSlides = (parsed: unknown): Slide[] =>
  extractSlideArray(parsed)
    .map((raw, index): Slide | null => {
      if (!raw || typeof raw !== "object") return null;
      const slide = raw as Record<string, unknown>;

      const rawContent =
        slide.content ??
        slide.components ??
        slide.elements ??
        slide.items ??
        slide.children;

      let content = normalizeContentItem(rawContent);

      // Fallback if slide has flat top-level fields (e.g. title, description)
      if (!content) {
        const fallbackChildren: ContentItem[] = [];
        const title = slide.title || slide.slideName || slide.heading;
        if (title) {
          fallbackChildren.push({
            id: uuidv4(),
            type: "title",
            name: "Title",
            content: asText(title),
          });
        }
        const body =
          slide.description || slide.body || slide.text || slide.subtitle;
        if (body) {
          fallbackChildren.push({
            id: uuidv4(),
            type: "paragraph",
            name: "Paragraph",
            content: asText(body),
          });
        }
        if (fallbackChildren.length > 0) {
          content = {
            id: uuidv4(),
            type: "column",
            name: "Column",
            content: fallbackChildren,
          };
        }
      }

      if (!content) return null;

      // The editor expects every slide to start with a column
      if (content.type !== "column") {
        content = {
          id: uuidv4(),
          type: "column",
          name: "Column",
          content: [content],
        };
      }

      return {
        id: uuidv4(),
        slideName:
          typeof slide.slideName === "string"
            ? slide.slideName
            : typeof slide.title === "string"
            ? slide.title
            : `Slide ${index + 1}`,
        type: typeof slide.type === "string" ? slide.type : "blank-card",
        className: sanitizeClassName(slide.className),
        slideOrder: index,
        content,
      };
    })
    .filter((slide): slide is Slide => slide !== null)
    .map((slide, index) => ({ ...slide, slideOrder: index }));

// Example layouts without ids keep the prompt small; ids are regenerated anyway
const stripIds = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(stripIds);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => key !== "id")
        .map(([key, child]) => [key, stripIds(child)])
    );
  }
  return value;
};

export const generateLayoutsJson = async (outlineArray: string[]) => {
  const prompt = `
You are a highly creative AI that generates
JSON-based layouts for presentations. I will
provide you with an array of outlines, and for
each outline, you must generate a unique and
creative layout.

### Guidelines:
1. Write layouts based on the specific outline provided, one slide per outline entry, in order.
2. Use diverse and engaging designs, ensuring each layout is unique.
3. Follow the structure of the example layouts exactly.
   Only use these component types: ${[...RENDERABLE_TYPES].join(", ")}.
4. Fill real, comprehensive text into the "content" fields of text components.
5. For image components, leave "content" as an empty string and write a descriptive "alt" text according to the outline.
6. Do not include "id" fields.

### Example Layout Structure:
${JSON.stringify(stripIds(existingLayouts.slice(0, 3)))}

### Outline Array:
${JSON.stringify(outlineArray)}

For Images:
- The alt text should describe the image clearly and concisely for an image generation model.
- Focus on subject, composition, and professional aesthetics.

Return only a JSON object of the form:
{
  "slides": [
    {
      "slideName": "Slide Title",
      "type": "blank-card",
      "content": {
        "type": "column",
        "content": [
          { "type": "title", "content": "Slide Title" },
          { "type": "paragraph", "content": "Detailed text content..." },
          { "type": "image", "content": "", "alt": "Descriptive visual prompt" }
        ]
      }
    }
  ]
}
Ensure there are no duplicate layouts across the array.
`;
  try {
    let slides: Slide[] = [];
    // JSON mode occasionally fails validation on long outputs, so allow a couple of retries
    for (let attempt = 0; attempt < 3 && slides.length === 0; attempt++) {
      try {
        const completion = await callChatCompletion({
          messages: [
            {
              role: "system",
              content: "You generate JSON layouts for presentations.",
            },
            { role: "user", content: prompt },
          ],
          max_tokens: 8000,
          temperature: 0.7,
        });

        const responseContent = completion?.choices?.[0]?.message?.content;
        if (!responseContent) continue;
        slides = normalizeSlides(extractJson(responseContent));
      } catch (error) {
        console.error(
          `🔴 Layout generation attempt ${attempt + 1} failed:`,
          error instanceof Error ? error.message.slice(0, 200) : error
        );
      }
    }

    if (slides.length === 0) {
      return { status: 500, error: "The AI did not return any usable slides. Please try again." };
    }

    await replaceImagePlaceholders(slides);
    return { status: 200, data: slides };
  } catch (error) {
    console.error("🔴 ERROR", error);
    return { status: 500, error: "Internal server error" };
  }
};

export const generateLayouts = async (projectId: string, theme: string) => {
  try {
    if (!projectId) {
      return { status: 400, error: "Project ID is required." };
    }
    const user = await currentUser();
    if (!user) {
      return { status: 403, error: "Unauthorized" };
    }

    const userExist = await client.user.findUnique({
      where: { clerkId: user.id },
    });

    if (!userExist) {
      return { status: 403, error: "User not found in the database." };
    }

    // Payments are optional; only require a subscription when LemonSqueezy is set up
    if (process.env.LEMON_SQUEEZY_API_KEY && !userExist.subscription) {
      return {
        status: 403,
        error: "You need an active subscription to generate presentations.",
      };
    }

    const project = await client.project.findFirst({
      where: { id: projectId, userId: userExist.id, isDeleted: false },
    });

    if (!project) {
      return { status: 404, error: "Project not found" };
    }

    if (!project.outlines || project.outlines.length === 0) {
      return { status: 400, error: "Project does not have any outlines" };
    }

    const layouts = await generateLayoutsJson(project.outlines);

    if (layouts.status !== 200 || !layouts.data) {
      return { status: layouts.status, error: layouts.error };
    }

    await client.project.update({
      where: { id: projectId },
      data: {
        slides: JSON.parse(JSON.stringify(layouts.data)),
        themeName: theme,
      },
    });

    return { status: 200, data: layouts.data };
  } catch (error) {
    console.error("🔴 ERROR", error);
    return { status: 500, error: "Internal server error" };
  }
};
