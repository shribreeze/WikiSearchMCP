import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const WIKI_API_BASE = "https://en.wikipedia.org/api/rest_v1/page/summary/";

//server setup
const server = new McpServer({
  name: "wikisearch",
  version: "1.0.0",
});


//wikipedia search function

interface WikipediaResponse {
  extract?: string;
  title?: string;
  thumbnail?: {
    source: string;
  };
}

async function fetchWikipediaSummary(query: string): Promise<string> {
  let myQuery = query.split(" ")[0];
  myQuery = encodeURIComponent(myQuery.trim()); 

  //const myQuery = encodeURIComponent(query); In this case, claude is modifying the query.

  const response = await fetch(`${WIKI_API_BASE}${myQuery}`);

  if (!response.ok) {
    return `Wikipedia search failed (Error ${response.status}). Try a more specific topic.`;
  }

  const data = (await response.json()) as WikipediaResponse;
  return data.extract || "No summary found for this topic.";
}



//mcp server tool
server.tool(
  "wikisearch",
  "Search Wikipedia for a given topic",
  {
    query: z.string().min(1).describe("The search query to search on Wikipedia"),
  },
  async ({ query }) => {
    const summary = await fetchWikipediaSummary(query);
    return { content: [{ type: "text", text: summary }] };
  }
);


//server start
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("WikiSearch MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});

