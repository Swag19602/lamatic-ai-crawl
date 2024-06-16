import fs from "fs";
import path from "path";
import { WeaviateClient } from "weaviate-ts-client";
import { weaviateClient } from "@/utils/weaviate";
import fetch from "node-fetch";
import { JSDOM } from "jsdom";
import { HfInference } from "@huggingface/inference";
import { HUGGING_FACE } from "./env";

const client: WeaviateClient = weaviateClient;
const hfClient = new HfInference(HUGGING_FACE);

const extractTextFromHTML = (html: any): string => {
  const dom = new JSDOM(html);
  return dom.window.document.body.textContent || "";
};

export default async () => {
  const filePath = path.join(process.cwd(), "public", "crawledData.json");
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const newClassName = `WebPage_${Date.now()}`;
  try {
    // Create a new class in Weaviate
    await client.schema
      .classCreator()
      .withClass({
        class: newClassName,
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
        properties: [
          { name: "url", dataType: ["string"] },
          { name: "content", dataType: ["string"] },
          { name: "vector", dataType: ["number[]"] },
        ],
      })
      .do()
      .then(() => {
        console.log("Schema created successfully", newClassName);
      })
      .catch((err) => {
        console.error("Error creating schema:", err);
      });
    // Fetching the contents of the links and creating an array of objects
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
    console.log('batcher done')
    const query = "How does the body store excess glucose?";
    queryWeaviate(newClassName, query);
    console.log('query done')
    // clearIndexedData();
    return newClassName;
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    } else {
      return { error: "An unknown error occurred" };
    }
  }
};
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
export const saveIndexedData = (data: any[], fileName: string) => {
  const filePath = path.join(process.cwd(), "public", `${fileName}.json`);
  const existingData = readIndexedData();

  let newData;
  if (existingData.length > 0 && Array.isArray(existingData)) {
    newData = [...existingData, ...data];
  } else {
    newData = data;
  }
  fs.writeFileSync(filePath, JSON.stringify(newData, null, 2));
};
export const readIndexedData = (): any[] => {
  const filePath = path.join(process.cwd(), "public", "indexedData.json");
  if (!fs.existsSync(filePath)) {
    return [];
  }
  const data = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(data);
};
export const clearIndexedData = () => {
  const filePath = path.join(process.cwd(), "public", "indexData.json");
  fs.writeFileSync(filePath, JSON.stringify([], null, 2));
  console.log("Crawled data cleared successfully.");
};

async function queryWeaviate(className: string, queryText: string) {
  try {
    const result = await client.graphql
      .get()
      .withClassName(className)
      .withFields("url content")
      .withNearText({ concepts: ["glycogen"] })
      .withLimit(3)
      .do();

    if (result.data.Get[className].length > 0) {
      result.data.Get[className].forEach((item: any) => {
        console.log(`URL: ${item.url}`);
        console.log(`Content: ${item.content}`);
      });
    } else {
      console.log("No matching data found.");
    }
  } catch (error) {
    console.error("Error querying Weaviate:", error);
  }
}
