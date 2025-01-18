# Medusa Project with Directus Integration

This project demonstrates an integration of Medusa with Directus using Medusa's event-based system and Directus's API. The goal is to synchronize product data between Medusa and Directus, while avoiding infinite synchronization loops.

## Project Setup

### Prerequisites
- Node.js (>=20)
- PostgreSQL Database
- Redis
- Directus Instance
- Medusa CLI

### Installation
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables in a `.env` file:
   ```env
   MEDUSA_ADMIN_ONBOARDING_TYPE=default
   STORE_CORS=http://localhost:8000,https://docs.medusajs.com
   ADMIN_CORS=http://localhost:5173,http://localhost:9000,https://docs.medusajs.com
   AUTH_CORS=http://localhost:5173,http://localhost:9000,http://localhost:8000,https://docs.medusajs.com
   REDIS_URL=redis://localhost:6379
   JWT_SECRET=supersecret
   COOKIE_SECRET=supersecret
   DATABASE_URL=postgresql://neondb_owner:password@your-neon-database-url:5432/database-name?sslmode=require
   CMS_API_KEY=your_directus_api_key
   CMS_BASE_URL=https://your-directus-instance-url
   NEXT_PUBLIC_DIRECTUS_URL=http://localhost:8055
   MEDUSA_SECRET_API=your_medusa_secret_api
   ```

4. Seed the database:
   ```bash
   npm run seed
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## Event-Subscriber Logic for Synchronization

### Overview
Medusa utilizes an event-subscriber system to listen for events (e.g., product creation, update, deletion) and synchronizes data with Directus. This integration ensures bi-directional data sync while managing infinite loop scenarios.

### Logic to Handle Infinite Loop
The infinite loop is managed using metadata that tracks the source of the last synchronization and its timestamp.

#### Metadata Example
```typescript
export interface SyncMetadata {
  lastSyncedAt: string;
  syncSource: 'directus' | 'medusa';
  syncId: string;
}
```

#### Metadata Generation
```typescript
const generateSyncMetadata = (): SyncMetadata => ({
  lastSyncedAt: new Date().toISOString(),
  syncSource: 'medusa',
  syncId: Math.random().toString(36).substring(7),
});
```

#### External Sync Validation
```typescript
const isExternalSync = (product: any): boolean => {
  const metadata = product?.metadata;
  if (!metadata?.lastSyncedAt) return false;

  const timeDiff = Date.now() - new Date(metadata.lastSyncedAt).getTime();
  logger.info(`[Medusa] Time since last sync: ${timeDiff}ms`);

  return metadata.syncSource === 'directus' && timeDiff < SYNC_THRESHOLD;
};
```

### Event Handler
The following events are handled:
- `product.created`
- `product.updated`
- `product.deleted`

#### Example Code
```typescript
export default async function productEventHandler({
  event: { data, name },
  container,
}: SubscriberArgs<any>) {
  const logger = container.resolve('logger');

  try {
    switch (name) {
      case 'product.created': {
        const createdProduct = await MedusaSdk.admin.product.retrieve(data.id);
        if (isExternalSync(createdProduct.product)) return;

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
      case 'product.updated': {
        const updatedProduct = await MedusaSdk.admin.product.retrieve(data.id);
        if (isExternalSync(updatedProduct.product)) return;

        const syncMetadata = generateSyncMetadata();
        const productData = {
          ...mapProductData(updatedProduct.product),
          metadata: syncMetadata,
        };

        await directusService.updateProduct(data.id, productData);
        logger.info(`[Medusa] Product updated in Directus: ${data.id}`);
        break;
      }
      case 'product.deleted': {
        if (isExternalSync(data)) return;

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
```

### Configuration
The subscriber is configured as follows:
```typescript
export const config: SubscriberConfig = {
  event: ['product.created', 'product.updated', 'product.deleted'],
  context: {
    subscriberId: 'directus-sync-subscriber',
  },
};
```

## Directus Integration
Directus API is utilized for the following operations:
- `createProduct`
- `updateProduct`
- `deleteProduct`

Ensure that the Directus instance is properly configured and accessible using the API key specified in the `.env` file.

## Scripts
- **Start Development Server**: `npm run dev`
- **Seed Database**: `npm run seed`
- **Build Project**: `npm run build`

## Dependencies
- `@medusajs/medusa`
- `@directus/sdk`
- `@medusajs/framework`
- `pg`
- `redis`

## Additional Notes
- Make sure that the Directus instance and Medusa server are running simultaneously.
- Update the environment variables according to your setup.

Feel free to reach out for any queries or issues!
