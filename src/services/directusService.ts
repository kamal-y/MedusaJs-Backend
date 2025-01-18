import {
  createDirectus,
  createItem,
  deleteItem,
  readItems,
  rest,
  DirectusClient,
  RestClient,
  updateItem,
} from "@directus/sdk";
import { Schema, ProductType } from "src/types";

export class DirectusService {
  private directus: DirectusClient<Schema> & RestClient<Schema>;

  constructor() {
    const url = process.env.NEXT_PUBLIC_DIRECTUS_URL || "http://localhost:8055";
    this.directus = createDirectus<Schema>(url).with(rest());
  }

  async createProduct(productData: Omit<ProductType, "id">): Promise<void> {
    try {
      await this.directus.request(createItem("products", productData));
    } catch (error) {
      console.error("Error creating product in Directus:", error);
      throw error;
    }
  }

  async updateProduct(
    medusaProductId: string,
    productData: Partial<ProductType>,
  ): Promise<void> {
    try {
      const productId = await this.getProductByMedusaReferenceID(
        medusaProductId,
      );
      await this.directus.request(
        updateItem("products", productId[0].id!, productData),
      );
    } catch (error) {
      console.error("Error updating product in Directus:", error);
      throw error;
    }
  }

  async deleteProduct(medusaProductId: string): Promise<void> {
    try {
      const directusProducts = await this.getProductByMedusaReferenceID(
        medusaProductId,
      );

      if (!directusProducts || directusProducts.length === 0) {
        throw new Error(
          `No product found with medusa_reference_id: ${medusaProductId}`,
        );
      }

      await this.directus.request(
        deleteItem("products", directusProducts[0].id!),
      );
    } catch (error) {
      console.error("Error deleting product in Directus:", error);
      throw error;
    }
  }

  async getProductByMedusaReferenceID(
    medusaProductId: string,
  ): Promise<ProductType[]> {
    try {
      const directusProducts = await this.directus.request(
        readItems("products", {
          filter: {
            medusa_reference_id: {
              _eq: medusaProductId,
            },
          },
        }),
      );

      return directusProducts;
    } catch (error) {
      console.error(
        "Error in finding product in Directus with same medusa reference ID:",
        error,
      );
      throw error;
    }
  }
}
