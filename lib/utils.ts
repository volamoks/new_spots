import { clsx } from "clsx";

export function cn(...inputs: (string | boolean | undefined | null)[]): string {
  return clsx(inputs);
}
