/** Mongo docs -> plain JSON (ObjectId -> hex string, Date -> ISO string). */
export function serialize<T>(value: unknown): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
