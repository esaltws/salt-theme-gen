import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { VERSION } from "./types";

describe("release version alignment", () => {
  it("VERSION in types.ts matches package.json version", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8")) as { version: string };
    expect(VERSION).toBe(pkg.version);
  });
});
