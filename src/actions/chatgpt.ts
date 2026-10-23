"use server";

import { client } from "@/lib/prisma";
import { ContentItem, ContentType, Slide } from "@/lib/types";
import { currentUser } from "@clerk/nextjs/server";
import Groq from "groq-sdk";
import { v4 as uuidv4 } from "uuid";
import * as slideComponents from "@/lib/slideComponents";
import * as slideLayouts from "@/lib/slideLayouts";
import { getPrefixedCdnBaseSync } from "@uploadcare/cname-prefix/sync";

// Groq retires models over time (llama-3.3-70b-versatile is gone), so allow an override
const GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

export const generateCreativePrompt = async (userPrompt: string) => {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
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
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: finalPrompt,
        },
      ],
      model: GROQ_MODEL,
      response_format: { type: "json_object" },
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (responseContent) {
      try {
        const jsonResponse = JSON.parse(responseContent);
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
const IMAGE_CONCURRENCY = 2;

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

const generateImageUrl = async (prompt: string): Promise<string> => {
  if (!process.env.REPLICATE_API_TOKEN) {
    return placeholderImageUrl(prompt);
  }
  try {
    const prediction = await createPrediction(prompt);
    const imageUrl = await waitForPrediction(prediction);
    if (!imageUrl) {
      throw new Error("Replicate returned no image");
    }
    return await persistImage(imageUrl);
  } catch (error) {
    console.error("🔴 Error generating image:", error);
    return placeholderImageUrl(prompt);
  }
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
  quote: "blockquote",
  bulletedList: "bulletList",
  list: "bulletList",
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
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const item = raw as Record<string, unknown>;
  const rawType = String(item.type ?? "");
  let type = (TYPE_ALIASES[rawType] ?? rawType) as ContentType;

  if (!RENDERABLE_TYPES.has(type)) {
    // Unknown wrappers with children are still useful as a plain column
    if (Array.isArray(item.content)) type = "column";
    else return null;
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
    const children = Array.isArray(item.content) ? item.content : [item.content];
    normalized.content = children
      .map(normalizeContentItem)
      .filter((child): child is ContentItem => child !== null);
  } else if (LIST_TYPES.has(type)) {
    normalized.content = Array.isArray(item.content)
      ? item.content.map(asText)
      : asText(item.content).split("\n").filter(Boolean);
  } else if (type === "table") {
    const rows = Array.isArray(item.content)
      ? item.content.map((row) => (Array.isArray(row) ? row.map(asText) : [asText(row)]))
      : [];
    // The table editor assumes every row has the same number of cells
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
    // The URL is filled in by image generation
    normalized.content = "";
    normalized.alt = asText(item.alt) || normalized.name;
  } else if (type === "divider") {
    normalized.content = "";
  } else {
    normalized.content = asText(item.content);
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
    for (const key of ["slides", "layouts", "presentation"]) {
      if (Array.isArray(record[key])) return record[key] as unknown[];
    }
    const firstArray = Object.values(record).find(Array.isArray);
    if (firstArray) return firstArray;
    if ("content" in record) return [record];
  }
  return [];
};

const normalizeSlides = (parsed: unknown): Slide[] =>
  extractSlideArray(parsed)
    .map((raw, index): Slide | null => {
      if (!raw || typeof raw !== "object") return null;
      const slide = raw as Record<string, unknown>;
      let content = normalizeContentItem(slide.content);
      if (!content) return null;
      // The editor expects every slide to start with a column
      if (content.type !== "column") {
        content = { id: uuidv4(), type: "column", name: "Column", content: [content] };
      }
      return {
        id: uuidv4(),
        slideName:
          typeof slide.slideName === "string" ? slide.slideName : `Slide ${index + 1}`,
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
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const prompt = `
You are a highly creative AI that generates
JSON-based layouts for presentations. I will
provide you with an array of outlines, and for
each outline, you must generate a unique and
creative layout. Use the existing layouts as
examples for structure and design, and generate
unique designs based on the provided outline.

### Guidelines:
1. Write layouts based on the specific outline
   provided, one slide per outline entry, in order.
2. Use diverse and engaging designs, ensuring
   each layout is unique.
3. Follow the structure of the example layouts exactly.
   Only use these component types: ${[...RENDERABLE_TYPES].join(", ")}.
4. Only use className values that appear in the examples.
5. Fill real text into the "content" fields of text components.
6. For image components, leave "content" as an empty string and
   write a descriptive "alt" text according to the outline.
7. Do not include "id" fields.

### Example Layouts:
${JSON.stringify(stripIds(existingLayouts))}

### Outline Array:
${JSON.stringify(outlineArray)}

For Images
- The alt text should describe the image clearly
  and concisely.
- Focus on the main subject(s) of the image and
  any relevant details such as colors, shapes,
  people, or objects.
- Ensure the alt text aligns with the context of
  the presentation slide it will be used on (e.g.,
  professional, educational, business-related).
- Avoid using terms like "image of" or "picture
  of," and instead focus directly on the content
  and meaning.

Return only a JSON object of the form {"slides": [ ...one layout per outline... ]}.
Ensure there are no duplicate layouts across the array.
`;
  try {
    let slides: Slide[] = [];
    // JSON mode occasionally fails validation on long outputs, so allow a couple of retries
    for (let attempt = 0; attempt < 3 && slides.length === 0; attempt++) {
      try {
        const completion = await groq.chat.completions.create({
          model: GROQ_MODEL,
          messages: [
            {
              role: "system",
              content: "You generate JSON layouts for presentations.",
            },
            { role: "user", content: prompt },
          ],
          response_format: { type: "json_object" },
          max_tokens: 8000,
          temperature: 0.7,
        });

        const responseContent = completion?.choices?.[0]?.message?.content;
        if (!responseContent) continue;
        slides = normalizeSlides(JSON.parse(responseContent));
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
