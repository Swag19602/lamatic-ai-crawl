import { indexing, getData } from "../utils/indexing";

jest.mock("../utils/indexing", () => ({
  ...jest.requireActual("../utils/indexing"),
    getData: jest.fn(),
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
    const respones = await indexing();
    expect(getData).toHaveBeenCalled();
  });
});

