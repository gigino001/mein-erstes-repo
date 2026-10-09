import { describe, expect, it } from "vitest";
import { hashFuer, leseHash } from "./router.svelte";

describe("Router", () => {
  it("liest und schreibt Adressen", () => {
    expect(leseHash("")).toEqual({ name: "liste" });
    expect(leseHash("#/")).toEqual({ name: "liste" });
    expect(leseHash("#/neu")).toEqual({ name: "neu" });
    expect(leseHash("#/p/123e4567-e89b-12d3-a456-426614174000")).toEqual({ name: "projekt", id: "123e4567-e89b-12d3-a456-426614174000" });
    expect(leseHash("#/p/<script>")).toEqual({ name: "liste" });
    expect(hashFuer({ name: "projekt", id: "abcdefgh1" })).toBe("#/p/abcdefgh1");
    expect(hashFuer({ name: "neu" })).toBe("#/neu");
  });
});
