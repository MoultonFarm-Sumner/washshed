import { apiRequest, getQueryFn } from './queryClient';

const ROW_ORDER_KEY = 'inventoryRowOrder';

/**
 * Save the row ordering to the database
 * @param productIds Array of product IDs in the order they should be displayed
 * @returns Promise that resolves when the ordering is saved
 */
export async function saveRowOrder(productIds: number[]): Promise<void> {
  try {
    await apiRequest("POST", '/api/settings', {
      key: ROW_ORDER_KEY,
      value: productIds,
    });
  } catch (error) {
    console.error('Failed to save row ordering:', error);
    throw error;
  }
}

/**
 * Load the row ordering from the database
 * @returns Promise that resolves with the array of product IDs in order, or null if not found
 */
export async function loadRowOrder(): Promise<number[] | null> {
  try {
    const queryFn = getQueryFn<any>({ on401: "returnNull" });
    const data = await queryFn(`/api/settings/${ROW_ORDER_KEY}`);
    
    if (!data || !data.value) {
      return null;
    }
    
    return data.value;
  } catch (error) {
    console.error('Failed to load row ordering:', error);
    return null;
  }
}

/**
 * Apply row ordering to a list of products
 * @param products Array of products to order
 * @param orderIds Array of product IDs in the desired order
 * @returns Array of products in the specified order
 */
export function applyRowOrdering(products: any[], orderIds: number[] | null): any[] {
  if (!orderIds || orderIds.length === 0) {
    return products;
  }

  // Create a map of product IDs to their positions in the order array
  const orderMap = new Map<number, number>();
  orderIds.forEach((id, index) => {
    orderMap.set(id, index);
  });

  // Find products that are in the order array
  const orderedProducts = products.filter(p => orderMap.has(p.id));
  // Find products that are not in the order array (new products)
  const unorderedProducts = products.filter(p => !orderMap.has(p.id));

  // Sort ordered products according to the order array
  orderedProducts.sort((a, b) => {
    const posA = orderMap.get(a.id) ?? 0;
    const posB = orderMap.get(b.id) ?? 0;
    return posA - posB;
  });

  // Return ordered products followed by unordered products
  return [...orderedProducts, ...unorderedProducts];
}

/**
 * Update row ordering when products are deleted
 * @param currentOrder Current row ordering
 * @param deletedProductId ID of the product that was deleted
 * @returns Updated row ordering with the deleted product removed
 */
export function removeDeletedProductFromOrder(currentOrder: number[] | null, deletedProductId: number): number[] {
  if (!currentOrder) return [];
  return currentOrder.filter(id => id !== deletedProductId);
}