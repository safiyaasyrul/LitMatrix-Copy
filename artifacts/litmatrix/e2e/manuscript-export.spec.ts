import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

const manuscriptResponse = {
  title: "Stubbed Evidence-Grounded Manuscript",
  abstract: {
    bg: "The review addresses a defined question.",
    obj: "The objective was to map the supplied evidence.",
    meth: "Reviewer-confirmed records were synthesized narratively.",
    res: "The included evidence showed a coherent reported pattern.",
    concl: "The findings support cautious interpretation.",
    keywords: ["systematic review", "evidence synthesis"],
  },
  introduction:
    "1.1 Review Scope\nThe approved protocol defined the review question and eligibility boundary.",
  methods:
    "2.1 Evidence Handling\nThe workflow used reviewer-confirmed title and abstract decisions.",
  results:
    "3.1 Results Evidence\nIncluded record findings remain traceable {{rec-01}}, while an unsupported citation {{missing-record}} is discarded.",
  discussion:
    "4.1 Discussion Interpretation\nThe reported pattern warrants cautious interpretation {{rec-01}}, without unsupported claims {{missing-record}}.",
  conclusion:
    "5.1 Conclusion\nThe review supports a bounded narrative conclusion.",
  keywords: ["systematic review", "evidence synthesis"],
};

const abstractResponse = {
  background:
    "The review addresses a defined question, as reported by Smith et al. (2024) {{rec-01}}.",
  objective:
    "The objective was to map the supplied evidence without unsupported interpretation.",
  methods:
    "Reviewer-confirmed records were synthesized narratively, with details available at https://example.test/methods.",
  results:
    "The included abstracts showed a coherent reported pattern {{rec-01}} and no supported claim {{missing-record}}.",
  conclusion:
    "The findings support cautious interpretation (Jones et al., 2023) and a bounded evidence gap.",
  keywords: ["systematic review", "evidence synthesis", "{{missing-record}}"],
};

function extractMarkdownHeadings(markdown: string) {
  return markdown
    .split(/\r?\n/)
    .filter((line) => /^(#{1,3})\s+/.test(line))
    .map((line) => {
      const match = line.match(/^(#{1,3})\s+(.*)$/);
      return `h${match?.[1].length}:${match?.[2].trim()}`;
    });
}

function extractWordHeadings(wordHtml: string) {
  return [...wordHtml.matchAll(/<(h[1-3])(?:\s[^>]*)?>([\s\S]*?)<\/\1>/gi)].map(
    ([, level, heading]) => `${level.toLowerCase()}:${heading.replace(/<[^>]+>/g, "").trim()}`,
  );
}

test("generates an evidence-grounded manuscript with matching Markdown and Word structure", async ({
  page,
}) => {
  await page.route("**/prisma-api/openai/generate", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ text: JSON.stringify(manuscriptResponse) }),
    });
  });

  await page.goto("/");

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: /Load Demo/i }).click();
  await page.getByRole("button", { name: /Consolidated Manuscript/i }).click();

  const generateButton = page.getByRole("button", { name: "Generate Full Journal Manuscript" });
  await expect(generateButton).toBeEnabled();
  await generateButton.click();

  await expect(page.getByRole("button", { name: "Grammar Checked" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "3.1 Results Evidence", level: 3 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "4.1 Discussion Interpretation", level: 3 })).toBeVisible();
  await expect(page.locator("body")).toContainText("(Chen, L. et al., 2023)");
  await expect(page.locator("body")).not.toContainText("missing-record");
  await expect(page.locator("body")).not.toContainText("{{");

  const markdownDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download Markdown (.md)" }).click();
  const markdownPath = await (await markdownDownload).path();
  expect(markdownPath).toBeTruthy();
  const markdown = await readFile(markdownPath!, "utf8");

  const wordDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download Word (.doc)" }).click();
  const wordPath = await (await wordDownload).path();
  expect(wordPath).toBeTruthy();
  const wordHtml = await readFile(wordPath!, "utf8");

  expect(markdown).toContain("(Chen, L. et al., 2023)");
  expect(markdown).not.toContain("missing-record");
  expect(wordHtml).toContain("(Chen, L. et al., 2023)");
  expect(wordHtml).not.toContain("missing-record");
  expect(extractWordHeadings(wordHtml)).toEqual(extractMarkdownHeadings(markdown));
});

test("exports a generated abstract before a manuscript with clean content and matching headings", async ({
  page,
}) => {
  await page.route("**/prisma-api/openai/generate", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ text: JSON.stringify(abstractResponse) }),
    });
  });

  await page.goto("/");

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: /Load Demo/i }).click();
  await page.getByRole("button", { name: /Consolidated Manuscript/i }).click();

  const generateButton = page.getByRole("button", { name: "Generate Abstract" });
  await expect(generateButton).toBeEnabled();
  await generateButton.click();

  await expect(page.getByText("Synthesis Abstract Ready", { exact: true })).toBeVisible();
  await expect(page.locator("body")).toContainText(
    "The review addresses a defined question, as reported by.",
  );
  await expect(page.locator("body")).not.toContainText("Smith et al.");
  await expect(page.locator("body")).not.toContainText("Jones et al.");
  await expect(page.locator("body")).not.toContainText("example.test");
  await expect(page.locator("body")).not.toContainText("missing-record");
  await expect(page.locator("body")).not.toContainText("{{");

  const markdownDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download Markdown (.md)" }).click();
  const markdownPath = await (await markdownDownload).path();
  expect(markdownPath).toBeTruthy();
  const markdown = await readFile(markdownPath!, "utf8");

  const wordDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download Word (.doc)" }).click();
  const wordPath = await (await wordDownload).path();
  expect(wordPath).toBeTruthy();
  const wordHtml = await readFile(wordPath!, "utf8");

  const expectedHeadings = [
    "h1:Machine Learning for Early Type 2 Diabetes Risk Prediction: An Abstract-Level Systematic Review with Narrative and Thematic Synthesis",
    "h2:Abstract",
    "h2:1. Introduction and Academic Rationale",
    "h2:2. Methods",
    "h2:3. Results",
    "h3:3.7 Cross-study Synthesis",
    "h2:4. Discussion",
    "h2:5. Limitations",
    "h2:6. Conclusion",
    "h2:References of Included Studies",
  ];

  expect(markdown).toContain("## Abstract");
  expect(markdown).toContain("The review addresses a defined question, as reported by.");
  expect(markdown).not.toContain("Smith et al.");
  expect(markdown).not.toContain("Jones et al.");
  expect(markdown).not.toContain("example.test");
  expect(markdown).not.toContain("missing-record");
  expect(markdown).not.toContain("{{");
  const markdownHeadings = extractMarkdownHeadings(markdown);
  expect(markdownHeadings).toEqual(expect.arrayContaining(expectedHeadings));

  expect(wordHtml).toContain("The review addresses a defined question, as reported by.");
  expect(wordHtml).not.toContain("Smith et al.");
  expect(wordHtml).not.toContain("Jones et al.");
  expect(wordHtml).not.toContain("example.test");
  expect(wordHtml).not.toContain("missing-record");
  expect(wordHtml).not.toContain("{{");
  const wordHeadings = extractWordHeadings(wordHtml);
  expect(wordHeadings).toEqual(expect.arrayContaining(expectedHeadings));
  expect(wordHeadings).toEqual(markdownHeadings);
});