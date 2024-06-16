// tests/indexing.test.js

const assert = require("assert");
const { fetchAndIndex } = require("../utils/indexing");

describe("Indexing Utility", () => {
  it("should fetch data and index it correctly", async () => {
    const url = "http://example.com";
    const mockResponse = {
      url: "http://example.com",
      content: "Example content",
    };

    // Mock the fetch function to return the mockResponse
    global.fetch = jest.fn(() =>
      Promise.resolve({
        text: () => Promise.resolve(mockResponse.content),
        ok: true,
      })
    );

    const result = await fetchAndIndex(url);

    assert.deepStrictEqual(
      result,
      mockResponse,
      "Indexed data should match expected data"
    );
  });

  it("should handle errors during fetching", async () => {
    const url = "http://invalid-url.com";
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 404,
      })
    );

    try {
      await fetchAndIndex(url);
      assert.fail("Function did not throw error for failed fetch");
    } catch (error) {
      assert.strictEqual(
        error.message,
        "HTTP error! status: 404",
        "Error message should match"
      );
    }
  });
});
