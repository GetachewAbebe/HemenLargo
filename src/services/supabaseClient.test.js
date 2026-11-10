import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchWithTimeout } from "./supabaseClient";

describe("fetchWithTimeout", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("adds an abort signal so a hung request cannot block the sync outbox", async () => {
    const fetchMock = vi.fn().mockResolvedValue("ok");
    vi.stubGlobal("fetch", fetchMock);

    await fetchWithTimeout("https://example.supabase.co/rest/v1/sales", { method: "POST" });

    const [, init] = fetchMock.mock.calls[0];
    expect(init.method).toBe("POST");
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it("still honours the caller's own abort signal", async () => {
    const fetchMock = vi.fn().mockResolvedValue("ok");
    vi.stubGlobal("fetch", fetchMock);
    const controller = new AbortController();

    await fetchWithTimeout("https://example.supabase.co/rest/v1/sales", { signal: controller.signal });
    controller.abort();

    expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(true);
  });
});
