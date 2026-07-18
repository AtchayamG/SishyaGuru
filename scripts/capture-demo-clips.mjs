import { chromium } from "@playwright/test";
import { mkdir, copyFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const outputDir = path.join(root, "docs", "submission", "raw-clips");
const fakeAudio = path.join(root, "docs", "submission", "sishyaguru-demo-live-lesson.wav");
await mkdir(outputDir, { recursive: true });

async function captureReplay() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: { dir: outputDir, size: { width: 1920, height: 1080 } },
  });
  const page = await context.newPage();
  const video = page.video();
  await page.goto(process.env.REPLAY_URL ?? "http://127.0.0.1:3200", {
    waitUntil: "networkidle",
  });
  await page.waitForTimeout(4_000);
  for (let turn = 0; turn < 3; turn += 1) {
    await page.getByRole("button", { name: "Use Sample Explanation" }).click();
    await page.waitForTimeout(2_500);
    await page.getByRole("button", { name: "Submit Explanation" }).click();
    await page.waitForTimeout(5_000);
  }
  await page.getByRole("button", { name: "End Session" }).click();
  await page.waitForTimeout(7_000);
  await context.close();
  if (!video) throw new Error("Replay video recording was unavailable");
  await copyFile(await video.path(), path.join(outputDir, "replay-golden-path.webm"));
  await browser.close();
}

async function captureLive() {
  const browser = await chromium.launch({
    headless: true,
    args: [
      "--use-fake-device-for-media-stream",
      "--use-fake-ui-for-media-stream",
      `--use-file-for-fake-audio-capture=${fakeAudio}`,
    ],
  });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    permissions: ["microphone"],
    recordVideo: { dir: outputDir, size: { width: 1920, height: 1080 } },
  });
  const page = await context.newPage();
  const video = page.video();
  await page.route("**/api/audio/transcribe", async (route) => {
    const request = route.request();
    const body = request.postDataBuffer();
    if (body) {
      const form = await new Request(request.url(), {
        method: "POST",
        headers: { "content-type": request.headers()["content-type"] ?? "" },
        body,
      }).formData();
      const audio = form.get("audio");
      if (audio instanceof File) {
        await writeFile(
          path.join(outputDir, "live-browser-recording.webm"),
          Buffer.from(await audio.arrayBuffer()),
        );
      }
    }
    await route.continue();
  });
  await page.goto(process.env.LIVE_URL ?? "http://127.0.0.1:3201", {
    waitUntil: "networkidle",
  });
  await page.waitForTimeout(3_000);
  await page.getByRole("button", { name: "Record lesson" }).click();
  await page.waitForTimeout(9_000);
  await page.getByRole("button", { name: "Stop and transcribe" }).click();
  try {
    await page.getByLabel("Transcribed candidate review").waitFor({
      state: "visible",
      timeout: 45_000,
    });
  } catch (error) {
    console.error("Live capture errors:", await page.locator(".error-message").allTextContents());
    await page.screenshot({ path: path.join(outputDir, "live-capture-error.png") });
    throw error;
  }
  await page.waitForTimeout(5_000);
  await page.getByRole("button", { name: "Submit Reviewed Transcript" }).click();
  await page.getByLabel("AI-generated spoken probe").waitFor({
    state: "visible",
    timeout: 45_000,
  });
  await page.waitForTimeout(8_000);
  await context.close();
  if (!video) throw new Error("Live video recording was unavailable");
  await copyFile(await video.path(), path.join(outputDir, "live-voice-proof.webm"));
  await browser.close();
}

if (process.argv.includes("--replay")) await captureReplay();
if (process.argv.includes("--live")) await captureLive();
if (!process.argv.includes("--replay") && !process.argv.includes("--live")) {
  throw new Error("Choose --replay, --live, or both");
}
