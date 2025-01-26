export type GeneratedFashionItem = {
  name: string;
  description: string;
  price: number;
};

// Add this validation function before the app.post("/api/fashion-items") endpoint
export function validateGeneratedItem(input: unknown): input is GeneratedFashionItem {
  const item = input as unknown;

  return (
    !!item &&
    typeof item === 'object' &&
    "name" in item &&
    typeof item.name === 'string' &&
    "description" in item &&
    typeof item.description === 'string' &&
    "price" in item &&
    typeof item.price === 'number' &&
    item.price >= 2000 &&
    item.price <= 50000
  );
}