import { randomBytes } from "node:crypto";

export const randomSequence = (bytes: number) => randomBytes(bytes).toString("hex");
