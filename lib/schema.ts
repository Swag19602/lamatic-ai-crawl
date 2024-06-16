import { gql } from "apollo-server-micro";
import { createClient } from "@supabase/supabase-js";
import { crawl, clearCrawledData } from "@/utils/crawl";
import indexing from "@/utils/indexing";
import { SUPABASE_KEY, SUPABASE_URL } from "@/utils/env";
import { importData } from "@/utils";
import { importData2 } from "@/utils/index2";

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
      // clearCrawledData(); // Clear existing data before starting a new crawl session
      // await crawl({ url: url, ignore: "/search" });
      console.log("Crawling Completed");
      console.log("Indexing started");
      // const className = await indexing();
      const className = await importData2();
      // const className = await importData();
      // const className = "WebPage_1718452887230";
      if (className) {
        // clearCrawledData();
        return `Crawling and Indexing completed. Class name: ${className}`;
      } else {
        return "Falied Crawling";
      }
    }
  }
};
// https://stackoverflow.com/questions/72597292/why-does-axios-geturl-data-not-work-axios-get-requests-and-property-accessor
