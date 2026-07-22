const { test, expect } = require('@playwright/test');

test.describe('FAQ Accordion Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should toggle FAQ answers on click', async ({ page }) => {
    // Locate the first FAQ question button
    const firstFaqBtn = page.locator('.faq-question').first();
    const firstFaqAnswer = page.locator('.faq-answer').first();

    // Verify initially it is collapsed
    await expect(firstFaqBtn).toHaveAttribute('aria-expanded', 'false');
    await expect(firstFaqAnswer).not.toBeVisible();

    // Click to expand
    await firstFaqBtn.dispatchEvent('click');

    // Verify it is expanded
    await expect(firstFaqBtn).toHaveAttribute('aria-expanded', 'true');
    await expect(firstFaqAnswer).toBeVisible();

    // Click again to collapse
    await firstFaqBtn.dispatchEvent('click');

    // Verify it is collapsed again
    await expect(firstFaqBtn).toHaveAttribute('aria-expanded', 'false');
    await expect(firstFaqAnswer).not.toBeVisible();
  });
});
