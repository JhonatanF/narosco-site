const { test, expect } = require('@playwright/test');

test.describe('AI Chat Widget Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should open, interact, and close the chat widget', async ({ page }) => {
    const chatPanel = page.locator('#chat-panel');
    const toggleBtn = page.locator('#chat-toggle-btn');
    const closeBtn = page.locator('#chat-close-btn');
    const chatInput = page.locator('#chat-input');
    const sendBtn = page.locator('#chat-send-btn');
    const chatMessages = page.locator('#chat-messages');

    // 1. Initial State: Chat panel should be hidden (has the 'hidden' attribute)
    await expect(chatPanel).toHaveAttribute('hidden', '');

    // 2. Open Chat: Click the toggle button
    await toggleBtn.dispatchEvent('click');
    await expect(chatPanel).not.toHaveAttribute('hidden');

    // 3. Message Interaction:
    // Verify send button is disabled when input is empty
    await expect(sendBtn).toBeDisabled();

    // Type a message
    await chatInput.fill('Olá, gostaria de saber mais sobre agentes de IA.');
    
    // Verify send button is now enabled
    await expect(sendBtn).toBeEnabled();

    // Send the message
    await sendBtn.dispatchEvent('click');

    // Assert the user message is rendered in the chat messages
    await expect(chatMessages).toContainText('Olá, gostaria de saber mais sobre agentes de IA.');

    // 4. Close Chat: Click the close button
    await closeBtn.dispatchEvent('click');
    await expect(chatPanel).toHaveAttribute('hidden', '');
  });
});
