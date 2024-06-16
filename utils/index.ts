import { WeaviateClient } from "weaviate-ts-client";
import { HfInference } from "@huggingface/inference";
import { weaviateClient } from "./weaviate";
import { HUGGING_FACE } from "./env";
import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import { JSDOM } from "jsdom";
import { clearIndexedData, saveIndexedData } from "./indexing";
// Initialize Weaviate client
const client: WeaviateClient = weaviateClient;

const hfClient = new HfInference(HUGGING_FACE);

// const jsonData = [
//   {
//     url: "https://github.com/Swag19602/ai-text-completion/blob/main/routes/chat_api.py",
//     content:
//       "This organ removes excess glucose from the blood & stores it as glycogen",
//   },
//   {
//     url: "https://github.com/Swag19602/ai-text-completion/blob/main/routes/chat_api.py",
//     content:
//       "This organ removes excess glucose from the blood & stores it as glycogen",
//   }
// ];
const extractTextFromHTML = (html: any): string => {
  const dom = new JSDOM(html);
  return dom.window.document.body.textContent || "";
};

async function getData() {
  const filePath = path.join(process.cwd(), "public", "crawledData.json");
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const elements: { url: string; content: string }[] = [];
  for (const entry of data) {
    for (const link of entry.links) {
      const fetchedData = await fetchAndIndex(link);
      if (fetchedData) {
        elements.push(fetchedData);
      }
    }
  }
  // clearIndexedData();
  // saveIndexedData(elements, `indexData`);
}
const fetchAndIndex = async (
  link: string
): Promise<{ url: string; content: string } | null> => {
  try {
    const response = await fetch(link);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const html = await response.text();
    const textContent: string = extractTextFromHTML(html);
    if (textContent) {
      return {
        url: link,
        content:
          "This organ removes excess glucose from the blood & stores it as glycogen",
      };
    } else {
      console.warn(`No content extracted from URL ${link}`);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching URL ${link}:`, error);
    return null;
  }
};
export async function importData() {
  const newClassName = `WebPage_${Date.now()}`;
  // await getData();
  console.log("indexData Saved");
  const filePath = path.join(process.cwd(), "public", "indexData2.json");
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  // Create a new class in Weaviate
  console.log("indexData Saved");
  await client.schema
    .classCreator()
    .withClass({
      class: newClassName,
      properties: [
        { name: "url", dataType: ["string"] },
        { name: "content", dataType: ["string"] },
        { name: "vector", dataType: ["number[]"] },
      ],
      vectorizer: "text2vec-huggingface",
      moduleConfig: {
        "text2vec-huggingface": {
          model: "sentence-transformers/all-MiniLM-L6-v2",
          options: {
            waitForModel: true,
            useGPU: true,
            useCache: true,
          },
          vectorizeClassName: true,
        },
      },
    })
    .do()
    .then(() => {
      console.log("Schema created successfully", newClassName);
    })
    .catch((err) => {
      console.error("Error creating schema:", err);
    });

  // Prepare a batcher
  let batcher = client.batch.objectsBatcher();
  let counter = 0;
  const batchSize = 100;

  for (const item of data) {
    // Get vector from Hugging Face
    const embedding = await hfClient.featureExtraction({
      model: "sentence-transformers/all-MiniLM-L6-v2",
      inputs: item.content,
    });
    const vector = embedding;
    // Construct an object with a class and properties 'url', 'content', and 'vector'
    const obj = {
      class: newClassName,
      properties: {
        url: item.url,
        content: item.content,
        vector: vector, // Assuming the embedding is the first item
      },
    };

    // Add the object to the batch queue
    batcher = batcher.withObject(obj);

    // When the batch counter reaches batchSize, push the objects to Weaviate
    if (counter++ === batchSize) {
      await batcher.do();
      counter = 0;
      batcher = client.batch.objectsBatcher();
    }
  }

  // Flush the remaining objects
  await batcher.do();
  console.log("batcher done");
  const query = "glycogenesis";
  await queryWeaviate(newClassName, query);
  console.log("query done");
  return newClassName;
}
async function queryWeaviate(className: string, queryText: string) {
  try {
    const embedding = await hfClient.featureExtraction({
      model: "sentence-transformers/all-MiniLM-L6-v2",
      inputs: queryText,
    });
    const vector = getVector(embedding);

    const result = await client.graphql
      .get()
      .withClassName(className)
      .withFields("url content")
      .withNearText({ concepts: ["glycogenesis"] })
      .withLimit(2)
      .do();
    console.log(result, "result");
  } catch (error: any) {
    console.error("Error querying Weaviate:", error.response.errors);
  }
}

function getVector(embedding: any): number[] {
  return flattenArray(embedding);
}

function flattenArray(arr: any[]): number[] {
  return arr.reduce(
    (acc, val) =>
      Array.isArray(val) ? acc.concat(flattenArray(val)) : acc.concat(val),
    []
  );
}