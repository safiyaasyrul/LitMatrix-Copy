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