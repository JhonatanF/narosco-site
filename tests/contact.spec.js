const { test, expect } = require('@playwright/test');

test.describe('Contact Form Submission Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should fill and submit the lead form successfully', async ({ page }) => {
    const leadForm = page.locator('#lead-form');
    const nameInput = page.locator('#name');
    const emailInput = page.locator('#email');
    const companyInput = page.locator('#company');
    const processSelect = page.locator('#process');
    const submitBtn = page.locator('#form-submit');
    const successModal = page.locator('#success-modal');

    // 1. Check form inputs are visible
    await expect(leadForm).toBeVisible();
    await expect(nameInput).toBeVisible();
    await expect(emailInput).toBeVisible();
    await expect(companyInput).toBeVisible();
    await expect(processSelect).toBeVisible();

    // 2. Fill the form
    await nameInput.fill('Tester da Narosco');
    await emailInput.fill('test@narosco.com');
    await companyInput.fill('Narosco E2E Inc.');
    await processSelect.selectOption('atendimento');

    // 3. Submit the form
    await submitBtn.dispatchEvent('click');

    // 4. Assert success modal is displayed
    await expect(successModal).toBeVisible();

    // 5. Close the success modal
    const closeBtn = page.locator('#modal-close');
    await closeBtn.dispatchEvent('click');
    await expect(successModal).toBeHidden();
  });
});
