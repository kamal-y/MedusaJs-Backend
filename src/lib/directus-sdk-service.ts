import { createDirectus, rest, authentication, login } from "@directus/sdk";
import { Schema } from "src/types";

const directus = createDirectus<Schema>(
  (process.env.NEXT_PUBLIC_DIRECTUS_URL as string) || "http://localhost:8055",
)
  .with(authentication("json"))
  .with(rest());

async function authenticate() {
  await directus.login("admin@example.com", "ORErMv9vZkmA");

  await directus.request(login("admin@example.com", "ORErMv9vZkmA"));
}

authenticate().catch(console.error);

export default directus;
