"use server";

import Groq from "groq-sdk";

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
      model: "llama-3.3-70b-versatile",
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
