import { test, expect } from '@playwright/test';

// ═══════════════════════════════════════════════════════
// Act 1: Bayan Panel — Persistent AI Assistant
// ═══════════════════════════════════════════════════════

test.describe('Bayan Panel', () => {
  test('Bayan panel is visible on dashboard', async ({ page }) => {
    await page.goto('/dashboard');

    // Bayan panel should be visible
    await expect(page.locator('.bayan-panel')).toBeVisible();

    // Bayan header visible (name in header div, not h2)
    await expect(page.locator('.bayan-panel .bayan-header')).toContainText('Bayan');
    await expect(page.locator('.bayan-panel').locator('text=Online')).toBeVisible();

    // Welcome message should appear
    await expect(page.locator('.bayan-panel').locator('text=Hello').first()).toBeVisible({ timeout: 10000 });
  });

  test('Bayan panel has chat input', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('.bayan-panel input[placeholder*="Ask Bayan"]')).toBeVisible();
  });

  test('Bayan panel persists across navigation', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('.bayan-panel')).toBeVisible();

    // Navigate to another page
    await page.click('a[href="/risks"]');
    await page.waitForTimeout(500);

    // Bayan panel should still be visible
    await expect(page.locator('.bayan-panel')).toBeVisible();

    // Navigation message should appear
    await expect(page.locator('.bayan-panel').locator('text=Risk').first()).toBeVisible({ timeout: 5000 });
  });

  test('chat input sends message and gets response', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(1000);

    // Type a message
    const input = page.locator('.bayan-panel input[placeholder*="Ask Bayan"]');
    await input.fill('What is the status of Customer Portal?');

    // Set up chat response waiter before clicking
    const chatResponse = page.waitForResponse(r => r.url().includes('/api/chat') && r.request().method() === 'POST', { timeout: 30000 });

    // Click send button
    const sendButton = page.locator('.bayan-panel button').filter({ has: page.locator('svg') }).last();
    await sendButton.click();

    // Wait for AI response
    const response = await chatResponse;
    expect(response.status()).toBe(200);

    // AI response should appear
    await page.waitForTimeout(2000);
    const panelContent = await page.locator('.bayan-panel').textContent();
    expect(panelContent.toLowerCase()).toContain('customer portal');
  });

  test('quick actions are visible', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(500);

    // Quick action buttons should be visible
    await expect(page.locator('.bayan-panel').locator('text=Portfolio').first()).toBeVisible();
    await expect(page.locator('.bayan-panel').locator('text=Risks').first()).toBeVisible();
  });

  test('quick action buttons work', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(1000);

    // Set up chat response waiter before clicking
    const chatResponse = page.waitForResponse(r => r.url().includes('/api/chat') && r.request().method() === 'POST', { timeout: 30000 });

    // Click "Portfolio" quick action
    const quickBtn = page.locator('.bayan-quick-actions button:has-text("Portfolio")');
    await quickBtn.click();

    const response = await chatResponse;
    expect(response.status()).toBe(200);
  });
});

// ═══════════════════════════════════════════════════════
// Act 2: Sidebar & PS Connection
// ═══════════════════════════════════════════════════════

test.describe('Sidebar & Navigation', () => {
  test('sidebar toggle works and shows branding when expanded', async ({ page }) => {
    await page.goto('/dashboard');

    // Sidebar is collapsed by default - expand it
    const expandBtn = page.locator('button[title="Expand sidebar"]');
    await expect(expandBtn).toBeVisible();
    await expandBtn.click();

    // Now branding should be visible
    await expect(page.locator('.sidebar h2')).toContainText('EPM Intelligence');
    await expect(page.locator('text=Powered by Bayan AI')).toBeVisible();

    // First nav item should be Portfolio (not Bayan anymore)
    const firstNav = page.locator('.sidebar li a').first();
    await expect(firstNav).toContainText('Portfolio');
  });

  test('PS connection indicator shows status when sidebar expanded', async ({ page }) => {
    const statusResponse = page.waitForResponse(r => r.url().includes('/api/ps/status'));
    await page.goto('/dashboard');
    await statusResponse;

    // Expand sidebar to see PS status
    const expandBtn = page.locator('button[title="Expand sidebar"]');
    await expandBtn.click();
    await page.waitForTimeout(500);

    await expect(page.locator('text=LIVE — PROJECT SERVER')).toBeVisible({ timeout: 10000 });
  });

  test('refresh button works when sidebar expanded', async ({ page }) => {
    const statusResponse = page.waitForResponse(r => r.url().includes('/api/ps/status'));
    await page.goto('/dashboard');
    await statusResponse;

    // Expand sidebar to see refresh button
    const expandBtn = page.locator('button[title="Expand sidebar"]');
    await expandBtn.click();
    await page.waitForTimeout(500);

    const refreshBtn = page.locator('button[title="Refresh connection"]');
    await expect(refreshBtn).toBeVisible();

    // Set up response waiter before clicking
    const refreshResponse = page.waitForResponse(r => r.url().includes('/api/ps/status'), { timeout: 5000 });
    await refreshBtn.click();

    const response = await refreshResponse;
    expect(response.status()).toBe(200);
  });
});

// ═══════════════════════════════════════════════════════
// Act 3: All 9 Use Case Pages Load (Bayan removed)
// ═══════════════════════════════════════════════════════

test.describe('All Use Case Pages', () => {
  const pages = [
    { path: '/dashboard', name: 'Portfolio Dashboard', check: 'Portfolio' },
    { path: '/strategy', name: 'Strategy & ROI', check: 'Strateg' },
    { path: '/pmo', name: 'PMO Performance', check: 'PMO' },
    { path: '/alignment', name: 'Strategic Alignment', check: 'Alignment' },
    { path: '/risks', name: 'Risk Center', check: 'Risk' },
    { path: '/docs', name: 'Document Generation', check: 'Document' },
    { path: '/predictions', name: 'Executive Predictions', check: 'Predict' },
    { path: '/pm-scores', name: 'PM Scoring', check: 'PM' },
    { path: '/pm-dev', name: 'PM Development', check: 'Development' },
  ];

  for (const p of pages) {
    test(`${p.name} (${p.path}) loads without errors`, async ({ page }) => {
      const errors = [];
      page.on('pageerror', err => errors.push(err.message));

      await page.goto(p.path);
      await page.waitForTimeout(2000);

      const content = await page.textContent('body');
      expect(content).toContain(p.check);

      // Bayan panel should be visible on every page
      await expect(page.locator('.bayan-panel')).toBeVisible();

      const realErrors = errors.filter(e =>
        !e.includes('ResizeObserver') &&
        !e.includes('Failed to fetch')
      );
      expect(realErrors).toHaveLength(0);
    });
  }
});

// ═══════════════════════════════════════════════════════
// Act 4: Root redirect to dashboard
// ═══════════════════════════════════════════════════════

test.describe('Root Redirect', () => {
  test('root path redirects to dashboard', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);

    // Should redirect to /dashboard
    expect(page.url()).toContain('/dashboard');

    // Dashboard content should be visible
    await expect(page.locator('text=Portfolio').first()).toBeVisible();
  });
});

// ═══════════════════════════════════════════════════════
// Act 5: Bayan Context Awareness
// ═══════════════════════════════════════════════════════

test.describe('Bayan Context Awareness', () => {
  test('Bayan provides context-aware suggestions on Risk page', async ({ page }) => {
    await page.goto('/risks');
    await page.waitForTimeout(1000);

    // Bayan should show risk-related quick actions
    const panelContent = await page.locator('.bayan-panel').textContent();
    expect(panelContent.toLowerCase()).toMatch(/risk|mitigation|threat/);
  });

  test('Bayan provides context-aware suggestions on Strategy page', async ({ page }) => {
    await page.goto('/strategy');
    await page.waitForTimeout(1000);

    // Bayan should acknowledge strategy context
    const panelContent = await page.locator('.bayan-panel').textContent();
    expect(panelContent.toLowerCase()).toMatch(/strategy|roi|investment/);
  });
});
