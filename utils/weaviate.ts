import weaviate, { WeaviateClient, ApiKey } from "weaviate-ts-client";
import { WEAVECLIENT_KEY,WEAVECLIENT_HOST, HUGGING_FACE } from "@/utils/env";

export const weaviateClient: WeaviateClient = weaviate.client({
  scheme: "https",
  host: WEAVECLIENT_HOST,
  apiKey: new ApiKey(WEAVECLIENT_KEY),
  headers: {
    "X-HuggingFace-Api-Key": HUGGING_FACE,
  },
});
