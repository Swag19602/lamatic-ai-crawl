import { WeaviateClient } from "weaviate-ts-client";
import { HfInference } from "@huggingface/inference";
import { weaviateClient } from "./weaviate";
import { HUGGING_FACE } from "./env";
import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import { JSDOM } from "jsdom";


// Initialize Weaviate client
const client: WeaviateClient = weaviateClient;

const hfClient = new HfInference(HUGGING_FACE);

const fetchDelay=600

const extractTextFromHTML = (html: any): string => {
  const dom = new JSDOM(html);
  return dom.window.document.body.textContent || "";
};

const sleep = (ms: number | undefined) =>
  new Promise((resolve) => setTimeout(resolve, ms));
export async function getData() {
  clearIndexedData();
  const filePath = path.join(process.cwd(), "public", "crawledData.json");
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const elements: { url: string; content: string }[] = [];
  const fetchPromises = data.map(async (entry: any) => {
    const linkPromises = entry.links.map(async (link: string) => {
      await sleep(fetchDelay);
      const fetchedData = await fetchAndIndex(link);
      if (fetchedData) {
        elements.push(fetchedData);
      }
    });
    await Promise.all(linkPromises);
  });
  await Promise.all(fetchPromises);
  saveIndexedData(elements, `indexData`);
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
        content: textContent
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
export async function indexing() {
  const newClassName = `WebPage_${Date.now()}`;
  await getData();
  console.log("indexData Saved");
  const filePath = path.join(process.cwd(), "public", "indexData.json");
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

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
            // useGPU: true,
            useCache: true,
          },
          vectorizeClassName: true,
        },
      },
      properties: [
        { name: "url", dataType: ["text"] },
        {
          name: "content",
          dataType: ["text"],
          moduleConfig: {
            "text2vec-huggingface": {
              skip: false,
              vectorizePropertyName: false,
            },
          },
        },
      ],
    })
    .do()
    .then(async () => {
      // Loop through the data array and store each item in the class
      for (const item of data) {
        try {
          const response = await client.data
            .creator()
            .withClassName(newClassName)
            .withProperties(item)
            .do();
        } catch (err) {
          console.error("Error saving data:", err);
        }
      }
    })
    .catch((err) => {
      console.error("Error creating class:", err);
    });
  // await queryWeaviate(newClassName, query);
  return newClassName;
}
/**
 * 
 This is a test function which has already been implemented and tested on the gradio layer. This function basically contains the code to query the weaviate db based on a text query
 This code has not been called in this file
 */
async function queryWeaviate(className: string, queryText: string) {
  try {
    const result = await client.graphql
      .get()
      .withClassName(className)
      .withFields("url content")
      .withNearText({ concepts: [queryText], certainty: 0.6 })
      .withLimit(5)
      .do();
      console.log(result.data['Get'][className].length)
  } catch (error) {
    console.error("Error querying Weaviate:", error);
  }
}

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
  const filePath = path.join(process.cwd(), "public", "indexData.json");
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

