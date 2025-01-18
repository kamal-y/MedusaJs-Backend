import { ProductType } from "src/types";

export function mapProductData(productData: any) {
  return {
    name: productData.title,
    description: productData.description,
    price: productData.variants?.[0]?.prices?.[0]?.amount || 0,
    slug: productData.handle,
    sku: productData.variants?.[0]?.prices?.[0]?.sku || "",
    medusa_reference_id: productData.id,
    date_updated: productData?.date_updated,
    metadata: {
      syncId: productData.syncId,
      syncSource: productData.syncSource,
      lastSyncedAt: productData?.lastSyncedAt,
    },
  };
}
