import { NextResponse } from "next/server";
import fs from "fs";
import OpenAI from "openai";

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

export async function POST(req: Request) {
  if (!openai) {
    return NextResponse.json(
      { error: 'OpenAI service is not configured' },
      { status: 503 }
    );
  }

  const body = await req.json();

  const base64Audio = body.audio;

  // Convert the base64 audio data to a Uint8Array
  const audio = new Uint8Array(Buffer.from(base64Audio, "base64"));

  // Define the file path for storing the temporary WAV file
  const filePath = "tmp/input.wav";

  try {
    // Write the audio data to a temporary WAV file synchronously
    fs.writeFileSync(filePath, audio);

    // Create a readable stream from the temporary WAV file
    const readStream = fs.createReadStream(filePath);

    const data = await openai.audio.transcriptions.create({
      file: readStream,
      model: "whisper-1",
    });

    // Remove the temporary file after successful processing
    fs.unlinkSync(filePath);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error processing audio:", error);
    return NextResponse.json(
      { error: 'Failed to process audio' },
      { status: 500 }
    );
  }
}
