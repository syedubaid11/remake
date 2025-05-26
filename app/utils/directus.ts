import { createDirectus, authentication, rest } from "@directus/sdk";


const directusUrl = import.meta.env.VITE_DIRECTUS_URL;
if (!directusUrl) {
  throw new Error("DIRECTUS_URL environment variable is not defined");
}

export const client = createDirectus(directusUrl)
  .with(authentication("json"))
  .with(rest());