import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";

// Neue Bedrock-API-Keys (AWS_BEARER_TOKEN_BEDROCK) haben Vorrang - dann
// erkennt der SDK-Default-Provider sie automatisch. Fallback auf das alte
// Access-Key/Secret-Paar, falls kein Bearer-Token gesetzt ist.
const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || "eu-central-1",
  ...(process.env.AWS_BEARER_TOKEN_BEDROCK ? {} : {
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  }),
});

const MODEL_ID =
  process.env.BEDROCK_MODEL_ID || "eu.anthropic.claude-sonnet-4-6";

export async function adjustEmail(
  currentEmail: string,
  instruction: string
): Promise<string> {
  const systemPrompt = `Du bist ein Assistent, der B2B-Angebots-E-Mails für DEIN ERSTER TAG anpasst. DEIN ERSTER TAG ist ein Unternehmen, das Ausbildungs- und Berufsmedien für Schulen produziert.

Regeln, die immer gelten:
- Verwende "Medium"/"Medien" statt "Film" oder "Video" für das produzierte Content-Stück
- Behalte Links unverändert
- Ändere NUR was der Nutzer verlangt, alles andere bleibt identisch
- Gib NUR den überarbeiteten E-Mail-Text zurück (ohne Betreff, ohne Erklärung)`;

  const userMessage = `Hier ist die aktuelle E-Mail:\n\n${currentEmail}\n\nBitte passe die E-Mail wie folgt an: ${instruction}`;

  const body = JSON.stringify({
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: 2048,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  const command = new InvokeModelCommand({
    modelId: MODEL_ID,
    contentType: "application/json",
    accept: "application/json",
    body,
  });

  const response = await client.send(command);
  const result = JSON.parse(new TextDecoder().decode(response.body));
  return result.content[0].text as string;
}
