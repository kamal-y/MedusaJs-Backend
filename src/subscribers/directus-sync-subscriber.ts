import { SubscriberArgs } from "@medusajs/framework";
import { SubscriberConfig } from "@medusajs/medusa";
import { mapProductData } from "src/helper/mapProductData";
import { MedusaSdk } from "src/lib/medusa-sdk";
import { DirectusService } from "src/services/directusService";
import { SyncMetadata } from "../types";

const directusService = new DirectusService();
const SYNC_THRESHOLD = 10000;

export default async function productEventHandler({
  event: { data, name },
  container,
}: SubscriberArgs<any>) {
  const logger = container.resolve("logger");

  const generateSyncMetadata = (): SyncMetadata => ({
    lastSyncedAt: new Date().toISOString(),
    syncSource: "medusa",
    syncId: Math.random().toString(36).substring(7),
  });

  const isExternalSync = (product: any): boolean => {
    const metadata = product?.metadata;
    if (!metadata?.lastSyncedAt) return false;

    const timeDiff = Date.now() - new Date(metadata.lastSyncedAt).getTime();
    logger.info(`[Medusa] Time since last sync: ${timeDiff}ms`);

    return metadata.syncSource === "directus" && timeDiff < SYNC_THRESHOLD;
  };

  try {
    switch (name) {
      case "product.created": {
        const createdProduct = await MedusaSdk.admin.product.retrieve(data.id);
        logger.info(`[Medusa] Product created: ${data.id}`);

        if (isExternalSync(createdProduct.product)) {
          logger.info("[Medusa] Skipping sync - product created from Directus");
          return;
        }

        const syncMetadata = generateSyncMetadata();
        const productData = {
          ...mapProductData(createdProduct.product),
          metadata: syncMetadata,
          medusa_reference_id: data.id,
        };

        await directusService.createProduct(productData);
        logger.info(`[Medusa] Product synced to Directus: ${data.id}`);
        break;
      }

      case "product.updated": {
        const updatedProduct = await MedusaSdk.admin.product.retrieve(data.id);
        logger.info(`[Medusa] Product updated: ${data.id}`);

        if (isExternalSync(updatedProduct.product)) {
          logger.info("[Medusa] Skipping sync - product updated from Directus");
          return;
        }

        const syncMetadata = generateSyncMetadata();
        const productData = {
          ...mapProductData(updatedProduct.product),
          metadata: syncMetadata,
        };

        await directusService.updateProduct(data.id, productData);
        logger.info(`[Medusa] Product updated in Directus: ${data.id}`);
        break;
      }

      case "product.deleted": {
        if (isExternalSync(data)) {
          logger.info("[Medusa] Skipping sync - product deleted from Directus");
          return;
        }

        await directusService.deleteProduct(data.id);
        logger.info(`[Medusa] Product deleted from Directus: ${data.id}`);
        break;
      }

      default:
        logger.warn(`[Medusa] Unhandled event: ${name}`);
    }
  } catch (error) {
    logger.error(`[Medusa] Error handling event ${name}:`, error);
  }
}

export const config: SubscriberConfig = {
  event: ["product.created", "product.updated", "product.deleted"],
  context: {
    subscriberId: "directus-sync-subscriber",
  },
};
