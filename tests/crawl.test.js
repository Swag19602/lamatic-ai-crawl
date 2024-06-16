// tests/crawl.test.js

const assert = require("assert");
const { crawl } = require("../utils/crawl");

describe("Crawling Utility", () => {
  it("should crawl and fetch data from a given URL", async () => {
    const url = "http://example.com";
    const mockResponse = {
      url: "http://example.com",
      content: "<html><body>Example content</body></html>",
    };

    // Mock the fetch function to return the mockResponse
    global.fetch = jest.fn(() =>
      Promise.resolve({
        text: () => Promise.resolve(mockResponse.content),
        ok: true,
      })
    );

    const result = await crawl({ url, ignore: "example.com" });

    assert.strictEqual(result.url, mockResponse.url, "URL should match");
    assert.strictEqual(
      result.content.includes("Example content"),
      true,
      "Content should match"
    );
  });

  it("should handle invalid URLs", async () => {
    const url = "invalid-url";
    try {
      await crawl({ url, ignore: "example.com" });
      assert.fail("Function did not throw error for invalid URL");
    } catch (error) {
      assert.strictEqual(
        error.message,
        "Invalid URL",
        "Error message should match"
      );
    }
  });

  it("should skip already seen URLs", async () => {
    const url = "http://example.com";
    const mockResponse = {
      url: "http://example.com",
      content: "<html><body>Example content</body></html>",
    };

    // Mock the fetch function to return the mockResponse
    global.fetch = jest.fn(() =>
      Promise.resolve({
        text: () => Promise.resolve(mockResponse.content),
        ok: true,
      })
    );

    const seenUrls = { "http://example.com": true };
    const result = await crawl({ url, ignore: "example.com" }, seenUrls);

    assert.strictEqual(
      result,
      undefined,
      "Result should be undefined for already seen URLs"
    );
  });
});
