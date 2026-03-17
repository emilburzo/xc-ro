// Jest mock for next/cache — unstable_cache passes through to the original function
export const unstable_cache = <T extends (...args: any[]) => any>(
  fn: T,
  _keyParts?: string[],
  _options?: { revalidate?: number; tags?: string[] }
): T => fn;

export const revalidateTag = (_tag: string) => {};
export const revalidatePath = (_path: string) => {};
export const cacheLife = () => {};
export const cacheTag = () => {};
