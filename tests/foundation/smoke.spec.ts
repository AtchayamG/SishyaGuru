import { expect, test } from "@playwright/test";

test("foundation shell renders the three-region workspace honestly", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1, name: "SishyaGuru" })).toBeVisible();
  await expect(page.getByText("Pre-production foundation", { exact: true })).toBeVisible();
  await expect(page.getByText("Provider: Simulated (Replay mode)")).toBeVisible();

  await expect(page.getByRole("complementary", { name: "Concept mastery map" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Teaching conversation" })).toBeVisible();
  await expect(page.getByRole("complementary", { name: "Mastery feedback" })).toBeVisible();
});

test("voice capability is detected without requesting microphone permission", async ({
  page,
}) => {
  let permissionRequested = false;
  await page.exposeFunction("__markPermissionRequest", () => {
    permissionRequested = true;
  });
  await page.addInitScript(() => {
    const original = navigator.mediaDevices?.getUserMedia?.bind(navigator.mediaDevices);
    if (navigator.mediaDevices && original) {
      navigator.mediaDevices.getUserMedia = (...args) => {
        (window as unknown as { __markPermissionRequest: () => void }).__markPermissionRequest();
        return original(...args);
      };
    }
  });

  await page.goto("/");
  await expect(page.getByTestId("voice-support")).toContainText(
    /supports push-to-talk recording|not supported in this browser/,
  );
  expect(permissionRequested).toBe(false);
});

test("no server secret names leak into the page", async ({ page }) => {
  const response = await page.goto("/");
  const html = (await response?.text()) ?? "";
  expect(html).not.toContain("OPENAI_API_KEY");
});
