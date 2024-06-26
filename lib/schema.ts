import { gql } from "apollo-server-micro";
import { createClient } from "@supabase/supabase-js";
import { crawl, clearCrawledData } from "../utils/crawl";
import { SUPABASE_KEY, SUPABASE_URL } from "../utils/env";
import { clearIndexedData, indexing } from "@/utils/indexing";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export const typeDefs = gql`
  type Query {
    hello: String
  }

  type Mutation {
    saveSitemapUrl(url: String!): String
    crawlSitemap(url: String!): String
  }
`;

export const resolvers = {
  Query: {
    hello: () => "Hello world!",
  },
  Mutation: {
    saveSitemapUrl: async (_: any, { url }: { url: string }) => {
      const { data, error } = await supabase.from("sitemaps").insert([{ url }]);
      if (error) {
        console.error('Error inserting into Supabase:', error);
        throw new Error(error.message);
      }
      return "Sitemap URL saved successfully. Crawling and Indexing in progress.....";
    },
    crawlSitemap: async(_: any, { url }: { url: string }) => {
      clearCrawledData(); // Clear existing data before starting a new crawl session
      await crawl({ url: url, ignore: "/search" });
      console.log('Crawling Done')
      const className = await indexing(); // Indexing the crawled web pages
      console.log('Indexing Done')
      if (className) {
        clearCrawledData();
        clearIndexedData()
        return `Crawling and Indexing completed. Class name: ${className}`;
      } else {
        return "Crawling Failed. Refresh the page and Try once again.....";
      }
    }
  }
};


