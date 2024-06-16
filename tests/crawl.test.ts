import * as fs from "fs";
import * as path from "path";
import { crawl, clearCrawledData, fetchWithRetry} from "../utils/crawl";

jest.mock("fs");
global.fetch = jest.fn();
jest.mock("path", () => ({
  join: jest.fn((...args) => args.join("/")),
  resolve: jest.requireActual("path").resolve,
  dirname: jest.requireActual("path").dirname,
  extname: jest.requireActual("path").extname,
}));
jest.mock("../utils/crawl", () => ({
  ...jest.requireActual("../utils/crawl"),
  fetchWithRetry: jest.fn()
}));

describe("crawl function", () => {
  const url = "http://example.com";
  const options = { timeout: 10000 };
  const retryCount = 3;
  const ignore = "/search";
  const mockResponse = {
    ok: true,
    status: 200,
    text: jest.fn().mockResolvedValue("Success"),
  };
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should save crawled links", async () => {
    await crawl({url,ignore})
    const response = await fetchWithRetry(url, options, retryCount);

    expect(fetch).toHaveBeenCalledWith(url, options);
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });
});

describe("clearCrawledData function", () => {
  const mockCrawledDataPath = path.join(
    process.cwd(),
          "public",
          "crawledData.json"
        );
        const mockCrawledData = [
          { links: ["http://example.com/page1", "http://example.com/page2"] },
        ];
        it("should clear crawled data", () => {
        (fs.writeFileSync as jest.Mock).mockImplementation(() => {});
        clearCrawledData();
        
        expect(fs.writeFileSync).toHaveBeenCalledWith(
          mockCrawledDataPath,
          JSON.stringify([], null, 2)
          );
        });
      });
    
