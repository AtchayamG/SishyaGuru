import { expect, test } from "@playwright/test";

const explanation =
  "The sun heats water, so liquid water becomes water vapour and rises.";

test("Live UI submits typed evidence and exposes disclosed optional speech", async ({ page }) => {
  await page.route("**/api/session/turn", async (route) => {
    const request = route.request().postDataJSON();
    expect(request.outputMode).toBe("text_and_audio");
    expect(request.explanation).toBe(explanation);
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        envelope: {
          providerMode: "live",
          audioStatus: "ready",
          result: {
            assessments: [
              {
                nodeId: "evaporation",
                state: "developing",
                evidenceQuote: "liquid water becomes water vapour and rises",
                rationale: "You explained the state change and direction.",
              },
            ],
            misconceptions: [],
            probe: {
              question: "What makes the water vapour cool into cloud droplets?",
              targetsNodeId: "condensation",
            },
          },
          probeAudio: {
            mediaType: "audio/mpeg",
            dataBase64: "SUQzBA==",
            disclosure: "AI-generated voice",
          },
        },
      }),
    });
  });

  await page.goto("/");
  await expect(page.getByText("Provider: Live GPT-5.6 + bounded voice")).toBeVisible();
  await expect(page.getByRole("button", { name: "Record lesson" })).toBeEnabled();
  await page.getByLabel("Your explanation").fill(explanation);
  await page.getByRole("button", { name: "Submit Explanation" }).click();

  await expect(page.getByText(/What makes the water vapour cool/)).toBeVisible();
  await expect(page.getByLabel("Evaporation: developing")).toBeVisible();
  await expect(page.getByLabel("AI-generated spoken probe")).toBeVisible();
  await expect(page.getByText(/AI-generated voice/)).toBeVisible();
});

test("Live client synchronously blocks duplicate turns and ignores a response after clear", async ({ page }) => {
  let calls = 0;
  let releaseResponse: (() => void) | undefined;
  const responseGate = new Promise<void>((resolve) => { releaseResponse = resolve; });
  await page.route("**/api/session/turn", async (route) => {
    calls += 1;
    await responseGate;
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        envelope: {
          providerMode: "live",
          audioStatus: "not_requested",
          probeAudio: null,
          result: {
            assessments: [{
              nodeId: "evaporation",
              state: "developing",
              evidenceQuote: "liquid water becomes water vapour and rises",
              rationale: "Grounded evidence.",
            }],
            misconceptions: [],
            probe: { question: "Late response", targetsNodeId: "condensation" },
          },
        },
      }),
    });
  });
  page.on("dialog", (dialog) => void dialog.accept());
  await page.goto("/");
  await page.getByLabel("Your explanation").fill(explanation);
  await Promise.all([
    page.getByLabel("Your explanation").press("Enter"),
    page.getByLabel("Your explanation").press("Enter"),
  ]);
  await expect.poll(() => calls).toBe(1);
  await page.getByRole("button", { name: "Clear progress" }).click();
  releaseResponse?.();
  await expect(page.getByText("Late response")).toHaveCount(0);
  await expect(page.getByText("You:", { exact: false })).toHaveCount(0);
});

test("Live client rejects mismatched provider provenance", async ({ page }) => {
  await page.route("**/api/session/turn", (route) => route.fulfill({
    contentType: "application/json",
    body: JSON.stringify({
      ok: true,
      envelope: {
        providerMode: "replay",
        audioStatus: "not_requested",
        probeAudio: null,
        result: {
          assessments: [],
          misconceptions: [],
          probe: { question: "Wrong provider", targetsNodeId: "condensation" },
        },
      },
    }),
  }));
  await page.goto("/");
  await page.getByLabel("Your explanation").fill(explanation);
  await page.getByRole("button", { name: "Submit Explanation" }).click();
  await expect(page.getByText(/provenance did not match/)).toBeVisible();
  await expect(page.getByText("Wrong provider")).toHaveCount(0);
});

test("Microphone denial preserves the complete typed path", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia: async () => { throw new DOMException("denied", "NotAllowedError"); } },
    });
    class FakeMediaRecorder {
      static isTypeSupported() { return true; }
    }
    Object.assign(window, { MediaRecorder: FakeMediaRecorder });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Record lesson" }).click();
  await expect(page.getByText(/Microphone access was unavailable/)).toBeVisible();
  await expect(page.getByLabel("Your explanation")).toBeEnabled();
});

test("A stale microphone permission rejection cannot interrupt a replacement recording", async ({ page }) => {
  await page.addInitScript(() => {
    const pending: Array<{
      resolve: (stream: unknown) => void;
      reject: (reason: unknown) => void;
    }> = [];
    Object.assign(window, { __pendingMicrophones: pending });
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: () => new Promise((resolve, reject) => pending.push({ resolve, reject })),
      },
    });
    class FakeMediaRecorder {
      static isTypeSupported() { return true; }
      state = "inactive";
      start() { this.state = "recording"; }
      stop() { this.state = "inactive"; }
    }
    Object.assign(window, { MediaRecorder: FakeMediaRecorder });
  });
  page.on("dialog", (dialog) => void dialog.accept());
  await page.goto("/");
  await page.getByRole("button", { name: "Record lesson" }).click();
  await page.getByRole("button", { name: "Clear progress" }).click();
  await page.getByRole("button", { name: "Record lesson" }).click();
  await page.evaluate(() => {
    const pending = (window as unknown as { __pendingMicrophones: Array<{ resolve: (value: unknown) => void; reject: (reason: unknown) => void }> }).__pendingMicrophones;
    const track = { stop: () => undefined, addEventListener: () => undefined };
    pending[1]?.resolve({ getTracks: () => [track] });
    pending[0]?.reject(new DOMException("stale denial", "NotAllowedError"));
  });
  await expect(page.getByRole("button", { name: "Stop and transcribe" })).toBeVisible();
  await expect(page.getByText(/Microphone access was unavailable/)).toHaveCount(0);
});

test("Delayed callbacks from a discarded recorder cannot corrupt a replacement recording", async ({ page }) => {
  await page.addInitScript(() => {
    const instances: unknown[] = [];
    Object.assign(window, { __recorderInstances: instances });
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: async () => ({
          getTracks: () => [{ stop: () => undefined, addEventListener: () => undefined }],
        }),
      },
    });
    class DelayedMediaRecorder {
      static isTypeSupported() { return true; }
      state = "inactive";
      ondataavailable?: (event: { data: Blob }) => void;
      onstop?: () => void;
      onerror?: () => void;
      constructor() { instances.push(this); }
      start() { this.state = "recording"; }
      stop() { this.state = "inactive"; }
    }
    Object.assign(window, { MediaRecorder: DelayedMediaRecorder });
  });
  let transcriptionCalls = 0;
  await page.route("**/api/audio/transcribe", (route) => {
    transcriptionCalls += 1;
    return route.abort();
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Record lesson" }).click();
  await page.getByRole("button", { name: "Discard recording" }).click();
  await page.getByRole("button", { name: "Record lesson" }).click();
  await page.evaluate(() => {
    const first = (window as unknown as { __recorderInstances: Array<{
      ondataavailable?: (event: { data: Blob }) => void;
      onstop?: () => void;
      onerror?: () => void;
    }> }).__recorderInstances[0];
    first?.ondataavailable?.({ data: new Blob([Uint8Array.from([1, 2, 3])]) });
    first?.onerror?.();
    first?.onstop?.();
  });
  await expect(page.getByRole("button", { name: "Stop and transcribe" })).toBeVisible();
  expect(transcriptionCalls).toBe(0);
  await expect(page.getByText(/stopped unexpectedly/)).toHaveCount(0);
});

test("Live push-to-talk requires a click and returns editable candidate text without auto-submit", async ({ page }) => {
  await page.addInitScript(() => {
    const state = { microphoneCalls: 0, tracksStopped: 0 };
    Object.assign(window, { __voiceTestState: state });
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: async () => {
          state.microphoneCalls += 1;
          return { getTracks: () => [{ stop: () => { state.tracksStopped += 1; } }] };
        },
      },
    });
    class FakeMediaRecorder {
      static isTypeSupported(type: string) {
        return type.startsWith("audio/webm");
      }
      state = "inactive";
      ondataavailable?: (event: { data: Blob }) => void;
      onstop?: () => void;
      start() {
        this.state = "recording";
      }
      stop() {
        this.state = "inactive";
        this.ondataavailable?.({ data: new Blob([Uint8Array.from([1, 2, 3])], { type: "audio/webm" }) });
        this.onstop?.();
      }
    }
    Object.assign(window, { MediaRecorder: FakeMediaRecorder });
  });
  let transcriptionCalls = 0;
  await page.route("**/api/audio/transcribe", async (route) => {
    transcriptionCalls += 1;
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        providerMode: "live",
        candidateOnly: true,
        transcript: "The sun heats water and it rises as water vapour.",
        media: {
          mediaType: "audio/webm",
          byteLength: 3,
          durationMs: 500,
          durationSource: "server-derived",
        },
      }),
    });
  });

  await page.goto("/");
  expect(await page.evaluate(() => (window as unknown as { __voiceTestState: { microphoneCalls: number } }).__voiceTestState.microphoneCalls)).toBe(0);
  await page.getByRole("button", { name: "Record lesson" }).click();
  expect(await page.evaluate(() => (window as unknown as { __voiceTestState: { microphoneCalls: number } }).__voiceTestState.microphoneCalls)).toBe(1);
  await expect(page.getByText(/Recording 0:00 \/ 1:00/)).toBeVisible();
  await page.getByRole("button", { name: "Discard recording" }).click();
  await expect.poll(() => transcriptionCalls).toBe(0);
  expect(await page.evaluate(() => (window as unknown as { __voiceTestState: { tracksStopped: number } }).__voiceTestState.tracksStopped)).toBe(1);

  await page.getByRole("button", { name: "Record lesson" }).click();
  await page.getByRole("button", { name: "Stop and transcribe" }).click();

  await expect(page.getByLabel("Transcribed candidate review")).toHaveValue(
    "The sun heats water and it rises as water vapour.",
  );
  await expect(page.getByText(/Transcribed candidate — review and edit/)).toBeVisible();
  await expect(page.getByText("You:", { exact: false })).toHaveCount(0);
  expect(transcriptionCalls).toBe(1);
});
