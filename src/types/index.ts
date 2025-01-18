export interface SyncMetadata {
  lastSyncedAt?: string;
  syncSource?: "directus" | "medusa";
  syncId?: string;
}

export interface ProductType {
  id?: string;
  name: string;
  price?: number;
  description: string;
  slug: string;
  medusa_reference_id: string;
  sku?: string;
  updated_at?: string;
  metadata: SyncMetadata;
}

export interface Schema {
  products: ProductType[];
}
