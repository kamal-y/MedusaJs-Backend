import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { emitEventStep } from "@medusajs/medusa/core-flows";

export const createProductWorkflow = createWorkflow(
  "create-product",
  async (input: any) => {
    const product = await createProductWorkflow(input);

    emitEventStep({
      eventName: "product.created",
      data: {
        id: product.id,
      },
    });

    return new WorkflowResponse(product);
  },
);
