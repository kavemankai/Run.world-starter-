import { test, expect, type Page } from "@playwright/test";
async function enter(page: Page, mode = "one", weapon = 0) {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.locator("#offline").click();
  await page.locator(`[data-weapon="${weapon}"]`).click();
  await page.locator("#mode").selectOption(mode);
  await page.locator("#action").click();
  await expect(page.locator("#touch-controls")).toBeVisible();
}
async function heroPosition(page: Page): Promise<{ x: number; y: number }> {
  return page.locator("canvas").evaluate((canvas) => {
    const ctx = canvas.getContext("2d")!,
      pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let x = 0,
      y = 0,
      n = 0;
    for (let i = 0; i < pixels.length; i += 4)
      if (pixels[i] === 65 && pixels[i + 1] === 124 && pixels[i + 2] === 169) {
        x += (i / 4) % canvas.width;
        y += Math.floor(i / 4 / canvas.width);
        n++;
      }
    if (!n) throw new Error("Hero pixels not found");
    return {
      x: (x / n / canvas.width) * 720,
      y: (y / n / canvas.height) * 1280,
    };
  });
}
test("menu, all weapon choices, shield eligibility, and responsive safe areas", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  for (let i = 0; i < 5; i++) {
    await page.locator(`[data-weapon="${i}"]`).click();
    await expect(page.locator(`[data-weapon="${i}"]`)).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    if (i < 2) await expect(page.locator("#shield")).toBeEnabled();
    else await expect(page.locator("#shield")).toBeDisabled();
  }
  for (const [width, height] of [
    [320, 568],
    [390, 844],
    [720, 1280],
    [810, 1080],
    [1280, 800],
  ]) {
    await page.setViewportSize({ width, height });
    const dimensions = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      width: innerWidth,
    }));
    expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.width);
    await expect(page.locator("#offline")).toBeInViewport();
    await page.screenshot({ path: `test-results/menu-${width}x${height}.png` });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => {
    for (const [side, value] of [
      ["top", "44px"],
      ["bottom", "34px"],
      ["left", "15px"],
      ["right", "15px"],
    ])
      document.documentElement.style.setProperty(
        `--rundot-safe-area-${side}`,
        value,
      );
  });
  const stage = await page.locator(".stage").boundingBox();
  expect(stage!.x).toBeGreaterThanOrEqual(15);
  expect(stage!.y).toBeGreaterThanOrEqual(44);
});
test("keyboard movement, pause freezes the fight, resume clears held attack, mute", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await enter(page);
  const before = await heroPosition(page);
  await page.keyboard.down("a");
  await page.waitForTimeout(140);
  await page.keyboard.up("a");
  const after = await heroPosition(page);
  expect(after.x).toBeLessThan(before.x - 10);
  await page.keyboard.down("j");
  await page.waitForTimeout(240);
  await page.keyboard.press("Escape");
  await expect(page.locator("#panel-title")).toHaveText("Take a breath.");
  const time = await page.locator("#timer").textContent();
  await page.waitForTimeout(1100);
  await expect(page.locator("#timer")).toHaveText(time!);
  await page.keyboard.up("j");
  await page.locator("#action").click();
  await expect(page.locator("#panel")).toBeHidden();
  await page.locator("#mute").click();
  await expect(page.locator("#mute")).toHaveText("Sound off");
  await page.locator("#mute").click();
  await expect(page.locator("#mute")).toHaveText("Sound on");
  const beforeMuteMove = await heroPosition(page);
  await page.keyboard.down("d");
  await page.waitForTimeout(140);
  await page.keyboard.up("d");
  expect((await heroPosition(page)).x).toBeGreaterThan(beforeMuteMove.x + 10);
  expect(errors).toEqual([]);
});
test("actual keyboard attacks win a practice fight and retry resets HP and timer", async ({
  page,
}) => {
  await enter(page);
  await page.waitForTimeout(1250);
  for (let i = 0; i < 5; i++) {
    if (await page.locator("#panel").isVisible()) break;
    await page.keyboard.down("j");
    await page.waitForTimeout(260);
    await page.keyboard.up("j");
    await page.waitForTimeout(850);
  }
  await expect(page.locator("#panel-title")).toHaveText("The arena is yours.", {
    timeout: 3000,
  });
  await page.screenshot({ path: "test-results/victory.png" });
  await page.locator("#action").click();
  await expect(page.locator("#hp")).toHaveText("100 / 100");
  await expect(page.locator("#timer")).toHaveText("0:00");
});
test("idle player loses, then can change loadout and start captain mode", async ({
  page,
}) => {
  await enter(page, "threeCaptain");
  await expect(page.locator("#panel-title")).toHaveText("Rise again.", {
    timeout: 25000,
  });
  await page.locator("#back").click();
  await page.locator('[data-weapon="3"]').click();
  await page.locator("#mode").selectOption("captain");
  await page.locator("#action").click();
  await expect(page.locator("#encounter")).toHaveText("CAPTAIN");
  await expect(page.locator("#loadout")).toHaveText("Daggers");
  await page.screenshot({ path: "test-results/captain.png" });
});
test("real multitouch: stick + held attack, slide-off cancel, block, dodge and pointer cancel", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  try {
    await enter(page);
    const cdp = await context.newCDPSession(page);
    const move = (await page.locator(".move-zone").boundingBox())!,
      attack = (await page.locator('[data-control="attack"]').boundingBox())!;
    const block = (await page.locator('[data-control="block"]').boundingBox())!,
      dodge = (await page.locator('[data-control="dodge"]').boundingBox())!;
    const center = (r: typeof move, id: number) => ({
      x: r.x + r.width / 2,
      y: r.y + r.height / 2,
      id,
    });
    const stick = center(move, 1),
      strike = center(attack, 2);
    const before = await heroPosition(page);
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [stick],
    });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [stick, strike],
    });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ ...stick, x: stick.x - 30 }, strike],
    });
    await page.waitForTimeout(140);
    await expect(page.locator('[data-control="attack"]')).toHaveClass(/held/);
    const after = await heroPosition(page);
    expect(after.x).toBeLessThan(before.x - 5);
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [
        { ...stick, x: stick.x - 30 },
        { ...strike, x: strike.x - 120, y: strike.y - 150 },
      ],
    });
    await expect(page.locator('[data-control="attack"]')).not.toHaveClass(
      /held/,
    );
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchCancel",
      touchPoints: [],
    });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [center(block, 3)],
    });
    await expect(page.locator('[data-control="block"]')).toHaveClass(/held/);
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [center(block, 3), center(dodge, 4)],
    });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchCancel",
      touchPoints: [],
    });
    await expect(page.locator(".held")).toHaveCount(0);
    await page.screenshot({ path: "test-results/multitouch.png" });
    await page.evaluate(() => window.dispatchEvent(new Event("blur")));
    await expect(page.locator("#panel-title")).toHaveText("Take a breath.");
  } finally {
    await context.close();
  }
});
test("relative bundle assets load from a nested hosting path", async ({
  page,
}) => {
  const failures: string[] = [];
  page.on("response", (r) => {
    if (r.url().includes("/hosted/game/") && r.status() >= 400)
      failures.push(r.url());
  });
  await page.route("**/hosted/game/**", async (route) => {
    const url = new URL(route.request().url());
    url.pathname = url.pathname.replace("/hosted/game/", "/");
    await route.fulfill({
      response: await route.fetch({ url: url.toString() }),
    });
  });
  await page.goto("/hosted/game/", { waitUntil: "domcontentloaded" });
  await page.locator("#offline").click();
  await page.locator("#action").click();
  await expect(page.locator(".hud")).toBeVisible();
  expect(failures).toEqual([]);
});
