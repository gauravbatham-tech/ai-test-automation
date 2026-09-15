import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
    const { repository, files } = await req.json();

    if (!repository || !files?.length) {
        return NextResponse.json(
            { error: "Repository code is required" },
            { status: 400 }
        );
    }

    const source = files
        .map((file: { path: string; content: string }) =>
            `FILE: ${file.path}\n${file.content}`
        )
        .join("\n\n")
        .slice(0, 100000);

    const response = await openai.responses.create({
        model: "gpt-5-mini",
        input: `You are an expert QA engineer.

Analyze this repository and generate useful end-to-end test cases.

Repository: ${repository}

Return ONLY valid JSON in this format:
{
  "tests": [
    {
      "title": "string",
      "category": "UI | API | Integration | Authentication",
      "steps": ["string"],
      "expectedResult": "string"
    }
  ]
}

SOURCE CODE:
${source}`,
    });

    const text = response.output_text;

    console.log("AI RESPONSE:", text);

    try {
        return NextResponse.json({
            tests: JSON.parse(text),
        });
    } catch {
        return NextResponse.json(
            { error: "AI returned invalid JSON", raw: text },
            { status: 500 }
        );
    }
}