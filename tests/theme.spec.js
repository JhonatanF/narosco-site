const { test, expect } = require('@playwright/test');

test.describe('Theme Toggling Tests', () => {
  test.beforeEach(async ({ page }) => {
    page.on('pageerror', exception => {
      console.log(`UNCAUGHT EXCEPTION: ${exception.stack}`);
    });
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`CONSOLE ERROR: ${msg.text()}`);
      }
    });
    await page.goto('/');
  });

  test('should toggle theme and display the correct brand logo', async ({ page }) => {
    const htmlElement = page.locator('html');
    const themeToggleBtn = page.locator('#theme-toggle');
    const lightLogo = page.locator('.logo-img.theme-light-only');
    const darkLogo = page.locator('.logo-img.theme-dark-only');

    // Skip test if theme toggle is not present (some pages might not have it)
    if (await themeToggleBtn.count() === 0) {
      test.skip();
      return;
    }

    // 1. Check initial theme
    const initialTheme = await htmlElement.getAttribute('data-theme');
    console.log(`[TEST DEBUG] Initial Theme: ${initialTheme}`);
    expect(initialTheme).toMatch(/^(light|dark)$/);

    if (initialTheme === 'dark') {
      await expect(darkLogo.first()).toBeVisible();
      await expect(lightLogo.first()).toBeHidden();
    } else {
      await expect(lightLogo.first()).toBeVisible();
      await expect(darkLogo.first()).toBeHidden();
    }

    // Take screenshot before click
    await page.screenshot({ path: `test-results/before-click-${initialTheme}.png` });

    // 2. Click theme toggle button
    console.log('[TEST DEBUG] Dispatching click event on theme toggle...');
    await themeToggleBtn.dispatchEvent('click');
    
    // Wait for any DOM changes
    await page.waitForTimeout(500);

    // 3. Verify the theme swapped
    const newTheme = await htmlElement.getAttribute('data-theme');
    console.log(`[TEST DEBUG] New Theme: ${newTheme}`);
    
    // Take screenshot after click
    await page.screenshot({ path: `test-results/after-click-${newTheme}.png` });
    
    expect(newTheme).not.toBe(initialTheme);

    if (newTheme === 'dark') {
      await expect(darkLogo.first()).toBeVisible();
      await expect(lightLogo.first()).toBeHidden();
    } else {
      await expect(lightLogo.first()).toBeVisible();
      await expect(darkLogo.first()).toBeHidden();
    }
  });
});
