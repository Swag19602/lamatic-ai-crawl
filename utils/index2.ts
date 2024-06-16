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
  clearIndexedData();
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
export async function importData2() {
  const newClassName = `WebPage_${Date.now()}`;
  //   await getData();
  console.log("indexData Saved");
  const filePath = path.join(process.cwd(), "public", "indexData2.json");
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  // Create a new class in Weaviate
  console.log("indexData Saved fjadf;a");
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
        console.log(item, "item");
        try {
          const response = await client.data
            .creator()
            .withClassName(newClassName)
            .withProperties(item)
            .do();
          console.log("Data saved successfully:", response);
        } catch (err) {
          console.error("Error saving data:", err);
        }
      }
    })
    .catch((err) => {
      console.error("Error creating class:", err);
    });
  console.log("Indexed successfully");
  const query = "How does the body store excess glucose?";
  console.log("weav1");
  await queryWeaviate(newClassName, query);
  console.log("weav2");
  return newClassName;
}
async function queryWeaviate(className: string, queryText: string) {
  try {
    const result = await client.graphql
      .get()
      .withClassName(className)
      .withFields("url content")
      .withNearText({ concepts: ["Akbar"], certainty: 0.6 })
      .withLimit(5)
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
    // console.log("its and error");
    console.error("Error querying Weaviate:", error);
  }
}
