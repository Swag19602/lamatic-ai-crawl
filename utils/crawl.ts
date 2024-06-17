import * as cheerio from "cheerio";
import * as fs from "fs";
import * as path from "path";

const seenUrls: { [key: string]: boolean } = {};

const getUrl = (link: string, host: string, protocol: string) => {
  if (link.includes("http")) {
    return link;
  } else if (link.startsWith("/")) {
    return `${protocol}//${host}${link}`;
  } else {
    return `${protocol}//${host}/${link}`;
  }
};

export const crawl = async ({ url, ignore }: { url: string; ignore: string },retryCount=3) => {
  let crawledLinks: string[] = [];
  if (seenUrls[url]) return;
  seenUrls[url] = true;

  const parsedUrl = new URL(url);
  const { host, protocol } = parsedUrl;

  try {
     const response = await fetchWithRetry(url, { timeout: 10000 }, retryCount);
     if (!response) {
       return;
     }
    const html = await response.text();
    const $ = cheerio.load(html);

    const links = $("a")
      .map((i, link) => (link as cheerio.TagElement).attribs?.href)
      .get();

    const crawlPromises = links
      .filter((link) => link && link.includes(host) && !link.includes(ignore))
      .map((link) => {
        const absoluteLink = getUrl(link, host, protocol);
        try {
          new URL(absoluteLink); // Validate the URL
          if (!crawledLinks.includes(absoluteLink)){
          crawledLinks.push(absoluteLink);
          return crawl({
            url: absoluteLink,
            ignore,
          });
        }
        } catch (error) {
          return Promise.resolve(); // Return resolved promise for invalid URLs to continue processing
        }
      });
      if (crawledLinks.length > 0) {
        const setCrawledLinks: string[] = crawledLinks.filter((link) => {
          if (!checkContainsData(link)) {
            return link;
          }
        });

        saveCrawledData([url,...setCrawledLinks]);
        return;
      }
      
    // Wait for all nested crawling operations to complete
     await Promise.all(crawlPromises);

  } catch (error) {
    return false;
  }
  
};
export const fetchWithRetry = async (
  url: string,
  options: any,
  retryCount: number
) => {
  for (let i = 0; i < retryCount; i++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok)
        throw new Error(`Fetch failed with status: ${response.status}`);
      return response;
    } catch (error) {
      if (i === retryCount - 1) throw error;
    }
  }
};
const readCrawledData = (): any[] => {
  const filePath = path.join(process.cwd(), "public", "crawledData.json");
  if (!fs.existsSync(filePath)) {
    return [];
  }
  const data = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(data);
};

export const saveCrawledData = (crawledLinks: string[]) => {
  const filePath = path.join(process.cwd(), "public", "crawledData.json");
  const existingData = readCrawledData();

  let newData;
  
    if (existingData.length > 0 && Array.isArray(existingData[0].links)) {
      if ((existingData[0].links.length < 10)) {
        existingData[0].links.push(...crawledLinks);
      }
      newData = existingData;
    } else {
      newData = [{ links: crawledLinks }];
    }
  fs.writeFileSync(filePath, JSON.stringify(newData, null, 2));
};

export const checkContainsData = (link: string) => {
  const existingData = readCrawledData();

  if (existingData.length > 0 && Array.isArray(existingData[0].links)) {
    return existingData[0].links.includes(link);
  }
  return false;
};


export const clearCrawledData = () => {
  const filePath = path.join(process.cwd(), "public", "crawledData.json");
  fs.writeFileSync(filePath, JSON.stringify([], null, 2));
  console.log("Crawled data cleared successfully.");
};