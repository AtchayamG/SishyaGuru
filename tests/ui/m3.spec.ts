import { expect, test } from "@playwright/test";

const storageKey = "sishyaguru_progress_v1";

async function submitSample(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "Use Sample Explanation" }).click();
  await page.getByRole("button", { name: "Submit Explanation" }).click();
}

test.describe("M3 deterministic Replay", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate((key) => localStorage.removeItem(key), storageKey);
    await page.reload();
  });

  test("completes three grounded turns, misconception, summary, and reload persistence", async ({ page }) => {
    await expect(page.getByText("I'm trying to understand The Water Cycle.")).toBeVisible();

    await submitSample(page);
    await expect(page.getByText(/Once the droplets in a cloud grow bigger/)).toBeVisible();
    await expect(page.getByLabel("Evaporation: secure")).toBeVisible();
    await expect(page.getByText("Spoken probe unavailable in Replay M3", { exact: false })).toBeVisible();

    await submitSample(page);
    await expect(page.getByText(/where do you think that water goes next/)).toBeVisible();
    await expect(page.getByRole("heading", { name: "Worth revisiting" })).toBeVisible();
    await expect(page.getByText(/does soaked-in water really leave the cycle/)).toBeVisible();

    await submitSample(page);
    await expect(page.getByText(/what do you think happens inside a leaf/)).toBeVisible();
    await page.getByRole("button", { name: "End Session" }).click();
    await expect(page.getByRole("heading", { name: "Session Summary" })).toBeVisible();
    await expect(page.getByText(/formative learning guidance, not a grade/)).toBeVisible();

    await page.reload();
    await expect(page.getByRole("heading", { name: "Session Summary" })).toBeVisible();
  });

  test("rejects unrelated text atomically and preserves the learner input", async ({ page }) => {
    const input = page.getByLabel("Your explanation");
    await input.fill("This unrelated answer has none of the fixed evidence quotes.");
    await page.getByRole("button", { name: "Submit Explanation" }).click();

    await expect(page.locator(".error-message")).toContainText("fixed demo can assess only");
    await expect(input).toHaveValue("This unrelated answer has none of the fixed evidence quotes.");
    await expect(page.getByLabel("Evaporation: unassessed")).toBeVisible();
  });

  test("requires review for a simulated transcript and applies the same evidence gate", async ({ page }) => {
    await page.getByRole("button", { name: "Use simulated voice transcript" }).click();
    const transcript = page.getByLabel("Simulated transcript review");
    await expect(transcript).toBeVisible();
    await expect(page.getByText(/Simulated transcript — review and edit/)).toBeVisible();

    await transcript.fill("Edited transcript without the required evidence.");
    await page.getByRole("button", { name: "Submit Reviewed Transcript" }).click();
    await expect(page.locator(".error-message")).toBeVisible();
    await expect(transcript).toHaveValue("Edited transcript without the required evidence.");

    await page.getByRole("button", { name: "Use simulated voice transcript" }).click();
    await page.getByRole("button", { name: "Submit Reviewed Transcript" }).click();
    await expect(page.getByText(/Once the droplets in a cloud grow bigger/)).toBeVisible();
  });

  test("discards corrupt or unsupported browser-local state without exposing it", async ({ page }) => {
    await page.evaluate((key) => {
      localStorage.setItem(key, JSON.stringify({ version: 99, messages: [{ text: "private-corrupt-value" }] }));
    }, storageKey);
    await page.reload();

    await expect(page.getByText("I'm trying to understand The Water Cycle.")).toBeVisible();
    await expect(page.getByText("private-corrupt-value")).toHaveCount(0);
    await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), storageKey)).toBeNull();
  });

  test("clear progress requires confirmation and removes persisted progress", async ({ page }) => {
    await submitSample(page);
    await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), storageKey)).not.toBeNull();

    page.once("dialog", (dialog) => dialog.dismiss());
    await page.getByRole("button", { name: "Clear progress" }).click();
    await expect(page.getByText(/Once the droplets in a cloud grow bigger/)).toBeVisible();

    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Clear progress" }).click();
    await expect(page.getByText(/Once the droplets in a cloud grow bigger/)).toHaveCount(0);
    await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), storageKey)).toBeNull();
  });

  test("keeps every workspace view reachable without horizontal overflow on mobile and tablet", async ({ page }) => {
    for (const viewport of [
      { width: 390, height: 844 },
      { width: 820, height: 900 },
    ]) {
      await page.setViewportSize(viewport);
      await page.reload();
      for (const tab of ["Concept Map", "Conversation", "Feedback"]) {
        const control = page.getByRole("tab", { name: tab });
        await expect(control).toBeVisible();
        await control.click();
        await expect(page.getByRole("tabpanel", { name: tab })).toBeVisible();
      }
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
        ),
      ).toBe(false);
    }
  });
});
