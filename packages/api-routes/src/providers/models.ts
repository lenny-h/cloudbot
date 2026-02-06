export type Provider =
  | "workers-ai"
  | "anthropic"
  | "azure"
  | "amazon-bedrock"
  | "google-vertex"
  | "openai";

export interface ChatModel {
  id: number;
  name: string;
  label: string;
  provider: Provider;
  description: string;
  images: boolean;
  pdfs: boolean;
  reasoning: boolean;
}

const defaultChatModels: Omit<ChatModel, "id">[] = [
  {
    name: "gpt-4o",
    label: "GPT-4o",
    provider: "openai",
    description: "Powerful model with fast response times",
    images: true,
    pdfs: true,
    reasoning: false,
  },
  {
    name: "gpt-5",
    label: "GPT-5",
    provider: "openai",
    description: "Powerful model, but slow response times",
    images: true,
    pdfs: true,
    reasoning: false,
  },
];

function parseChatModels(): ChatModel[] {
  const envModels = process.env.NEXT_PUBLIC_LLM_MODELS;

  if (envModels) {
    try {
      const parsed = JSON.parse(envModels) as Omit<ChatModel, "id">[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((model, index) => ({
          id: index,
          name: model.name,
          label: model.label,
          provider: model.provider,
          description: model.description,
          images: model.images ?? false,
          pdfs: model.pdfs ?? false,
          reasoning: model.reasoning ?? false,
        }));
      }
    } catch (e) {
      console.warn(
        "Failed to parse NEXT_PUBLIC_LLM_MODELS environment variable, using defaults",
      );
    }
  }

  return defaultChatModels.map((model, index) => ({ id: index, ...model }));
}

export const chatModels: ChatModel[] = parseChatModels();

export const titleModelIdx = parseInt(process.env.TITLE_MODEL_IDX ?? "0");
export const artifactModelIdx = parseInt(process.env.ARTIFACT_MODEL_IDX ?? "1");
export const webSearchModelIdx = parseInt(
  process.env.WEB_SEARCH_MODEL_IDX ?? "0",
);
export const completionModelIdx = parseInt(
  process.env.COMPLETION_MODEL_IDX ?? "0",
);
