// import fetch from "node-fetch";
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

    const imageUrls = $("img")
      .map((i, img) => (img as cheerio.TagElement).attribs?.src)
      .get();

    // imageUrls.forEach((imageUrl) => {

    //   fetch(getUrl(imageUrl, host, protocol))
    //     .then((response) => {
    //       if (response.body) {
    //         const filename = path.basename(imageUrl);
    //         const dest = fs.createWriteStream(`images/${filename}`);
    //         response.body.pipe(dest);
    //       }
    //     })
    //     .catch((error) => {
    //       console.error(`Error fetching image ${imageUrl}:`, error);
    //     });
    // });

    const crawlPromises = links
      .filter((link) => link && link.includes(host) && !link.includes(ignore))
      .map((link) => {
        const absoluteLink = getUrl(link, host, protocol);
        try {
          new URL(absoluteLink); // Validate the URL
          crawledLinks.push(absoluteLink);
          return crawl({
            url: absoluteLink,
            ignore,
          });
        } catch (error) {
          return Promise.resolve(); // Return resolved promise for invalid URLs to continue processing
        }
      });

    // Wait for all nested crawling operations to complete

  } catch (error) {
    return false;
  }
  if (crawledLinks.length > 0) {
    saveCrawledData(crawledLinks);
  }
};
const fetchWithRetry = async (
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
      // console.log(`Retrying fetch for ${url} (${i + 1}/${retryCount})`);
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

const saveCrawledData = (crawledLinks: string[]) => {
  const filePath = path.join(process.cwd(), "public", "crawledData.json");
  const existingData = readCrawledData();

  let newData;
  if (existingData.length > 0 && Array.isArray(existingData[0].links)) {
    existingData[0].links.push(...crawledLinks);
    newData = existingData;
  } else {
    newData = [{ links: crawledLinks }];
  }
  fs.writeFileSync(filePath, JSON.stringify(newData, null, 2));
};


export const clearCrawledData = () => {
  const filePath = path.join(process.cwd(), "public", "crawledData.json");
  fs.writeFileSync(filePath, JSON.stringify([], null, 2));
  console.log("Crawled data cleared successfully.");
};