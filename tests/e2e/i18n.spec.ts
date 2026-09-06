import { expect, test, type Page } from "@playwright/test";

const route = "/ai/ask-portfolio";

async function seedPreference(page: Page, locale: "en" | "zh") {
  // Seed only the first document; a reload must use the preference the app saved.
  await page.addInitScript((initial) => {
    if (localStorage.getItem("portfolio-locale") === null) {
      localStorage.setItem("portfolio-locale", initial);
    }
  }, locale);
}

async function expectLocale(page: Page, locale: "en" | "zh") {
  await expect(page.locator("html")).toHaveAttribute("lang", locale === "zh" ? "zh-CN" : "en");
  await expect(page.getByRole("button", { name: locale === "zh" ? "中" : "EN", exact: true }))
    .toHaveAttribute("aria-pressed", "true");
}

for (const locale of ["en", "zh"] as const) {
  test(`explicit ${locale} replaces the stored preference before canonicalization and survives reload`, async ({ page }) => {
    await seedPreference(page, locale === "en" ? "zh" : "en");
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    await page.goto(`${route}?ref=shared&lang=${locale}#exhibit-01`);
    const canonical = `${route}?ref=shared${locale === "zh" ? "&lang=zh" : ""}#exhibit-01`;
    await expect(page).toHaveURL(canonical);
    await expectLocale(page, locale);
    expect(await page.evaluate(() => localStorage.getItem("portfolio-locale"))).toBe(locale);

    await page.reload();
    await expect(page).toHaveURL(canonical);
    await expectLocale(page, locale);
    expect(await page.evaluate(() => localStorage.getItem("portfolio-locale"))).toBe(locale);
    expect(errors).toEqual([]);
  });
}

test("language buttons and client links retain query, hash, and the saved choice", async ({ page }) => {
  await seedPreference(page, "zh");
  await page.goto(`${route}?ref=shared&lang=en#exhibit-02`);
  await expectLocale(page, "en");
  await page.getByRole("button", { name: "中", exact: true }).click();
  await expect(page).toHaveURL(`${route}?ref=shared&lang=zh#exhibit-02`);
  await expectLocale(page, "zh");
  await expect(page.getByLabel("项目工具").getByRole("link", { name: "联系章向国", exact: true })).toHaveAttribute("href", "/?lang=zh#contact");
  expect(await page.evaluate(() => localStorage.getItem("portfolio-locale"))).toBe("zh");

  await page.getByRole("button", { name: "EN", exact: true }).click();
  await expect(page).toHaveURL(`${route}?ref=shared#exhibit-02`);
  const contact = page.getByLabel("Project tools").getByRole("link", { name: "Contact Xiangguo", exact: true });
  await expect(contact).toHaveAttribute("href", "/#contact");
  await contact.click();
  await expect(page).toHaveURL("/#contact");
  await expectLocale(page, "en");
  await page.goBack();
  await expect(page).toHaveURL(`${route}?ref=shared#exhibit-02`);
  await expectLocale(page, "en");
  await page.goForward();
  await expect(page).toHaveURL("/#contact");
  await page.reload();
  await expectLocale(page, "en");
});

test("mounted provider observes explicit query navigation and preserves history state", async ({ page }) => {
  await seedPreference(page, "en");
  await page.goto(`${route}?lang=zh#exhibit-01`);
  await expectLocale(page, "zh");
  const historyLength = await page.evaluate(() => history.length);
  await page.evaluate((href) => history.pushState({ localeTest: "english" }, "", href), `${route}?lang=en&ref=history#exhibit-02`);
  await expect(page).toHaveURL(`${route}?ref=history#exhibit-02`);
  await expectLocale(page, "en");
  expect(await page.evaluate(() => localStorage.getItem("portfolio-locale"))).toBe("en");
  expect(await page.evaluate(() => ({ marker: history.state.localeTest, length: history.length })))
    .toEqual({ marker: "english", length: historyLength + 1 });
  await page.goBack();
  await expect(page).toHaveURL(`${route}?lang=zh#exhibit-01`);
  await expectLocale(page, "zh");
  expect(await page.evaluate(() => localStorage.getItem("portfolio-locale"))).toBe("zh");

  await page.evaluate((href) => history.replaceState({ localeTest: "replacement" }, "", href), `${route}?lang=en#exhibit-03`);
  await expect(page).toHaveURL(`${route}#exhibit-03`);
  await expectLocale(page, "en");
  expect(await page.evaluate(() => history.state.localeTest)).toBe("replacement");
  await page.reload();
  await expectLocale(page, "en");
});

test("an explicit language can be revisited after URL cleanup and a language-button change", async ({ page }) => {
  await seedPreference(page, "zh");
  const explicitEnglish = `${route}?lang=en#exhibit-01`;
  await page.goto(explicitEnglish);
  await expectLocale(page, "en");
  await expect(page).toHaveURL(`${route}#exhibit-01`);
  await page.getByRole("button", { name: "中", exact: true }).click();
  await expectLocale(page, "zh");
  await page.evaluate((href) => history.pushState(null, "", href), explicitEnglish);
  await expect(page).toHaveURL(`${route}#exhibit-01`);
  await expectLocale(page, "en");
  expect(await page.evaluate(() => localStorage.getItem("portfolio-locale"))).toBe("en");
});

test("homepage canonicalization keeps client navigation and Back/Forward in the same document", async ({ page }) => {
  await seedPreference(page, "zh");
  await page.goto("/?lang=en#contact");
  await expect(page).toHaveURL("/#contact");
  await expectLocale(page, "en");
  await page.evaluate(() => Reflect.set(window, "localeNavigationSentinel", true));
  await page.locator(".home-cta").click();
  await expect(page).toHaveURL("/ai/frontier-forge");
  await page.goBack();
  await expect(page).toHaveURL("/#contact");
  await expectLocale(page, "en");
  await page.goForward();
  await expect(page).toHaveURL("/ai/frontier-forge");
  expect(await page.evaluate(() => Reflect.get(window, "localeNavigationSentinel"))).toBe(true);
});

for (const [query, expected] of [
  ["lang=zh-CN", "zh"],
  ["lang=", "zh"],
  ["lang=en&lang=zh", "en"],
  ["lang=zh&lang=en", "zh"],
  ["lang=invalid&lang=en", "zh"],
] as const) {
  test(`ordinary route keeps existing query precedence for ${query}`, async ({ page }) => {
    await seedPreference(page, "zh");
    await page.goto(`${route}?${query}&ref=query#exhibit-01`);
    await expectLocale(page, expected);
    await expect(page).toHaveURL(`${route}?${expected === "zh" ? "lang=zh&" : ""}ref=query#exhibit-01`);
    expect(await page.evaluate(() => localStorage.getItem("portfolio-locale"))).toBe(expected);
  });
}

test("Artifact Viewer retains explicit English, strict query parsing, and localized return links", async ({ page }) => {
  await seedPreference(page, "zh");
  const source = "/case-studies/rag-quality-lab/claim-registry.json";
  const href = (lang: string) => `/artifact?src=${encodeURIComponent(source)}&from=%2Fai%2Frag-quality-lab&${lang}#records`;
  await page.goto(href("lang=en"));
  await expectLocale(page, "en");
  await expect(page).toHaveURL(href("lang=en"));
  await expect(page.locator(".artifact-page > .back-link")).toHaveAttribute("href", "/ai/rag-quality-lab");
  await page.reload();
  await expectLocale(page, "en");
  await expect(page).toHaveURL(href("lang=en"));

  for (const query of ["lang=zh-CN", "lang=zh&lang=en"]) {
    await page.evaluate(() => localStorage.setItem("portfolio-locale", "zh"));
    await page.goto(href(query));
    await expectLocale(page, "en");
    await expect(page).toHaveURL(href("lang=en"));
  }
  await page.getByRole("button", { name: "中", exact: true }).click();
  await expectLocale(page, "zh");
  await expect(page).toHaveURL(href("lang=zh"));
  await expect(page.locator(".artifact-page > .back-link")).toHaveAttribute("href", "/ai/rag-quality-lab?lang=zh");
});

test.describe("static locale fallback", () => {
  test.use({ javaScriptEnabled: false });

  test("an explicit language URL keeps the Ask document readable without JavaScript", async ({ page }) => {
    await page.goto(`${route}?lang=zh#exhibit-01`);
    await expect(page).toHaveURL(`${route}?lang=zh#exhibit-01`);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator('[data-exhibit="01"] .exhibit-title')).toContainText("A conversation with the work itself.");
    await expect(page.locator('[data-exhibit="01"] .ask-opener')).toHaveCount(3);
  });
});

test.describe("browser language fallback", () => {
  test.use({ locale: "zh-CN" });

  test("an inferred Chinese locale is not saved as an explicit preference", async ({ page }) => {
    await page.goto(route, { waitUntil: "networkidle" });
    await expectLocale(page, "zh");
    await expect(page).toHaveURL(`${route}?lang=zh`);
    expect(await page.evaluate(() => localStorage.getItem("portfolio-locale"))).toBeNull();
  });
});
