import { ApolloServer } from "apollo-server-micro";
import { typeDefs, resolvers } from "../../lib/schema";
import { NextApiRequest, NextApiResponse } from "next";
import Cors from "micro-cors";

const cors = Cors();

const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
  formatError: (err) => {
    console.error("GraphQL Error:", err);
    return err;
  },
});

const startServer = apolloServer.start();

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "OPTIONS") {
    res.end();
    return;
  }

  await startServer;
  await apolloServer.createHandler({ path: "/api/graphql" })(req, res);
};

export default cors(handler as any);

export const config = {
  api: {
    bodyParser: false,
  },
};
