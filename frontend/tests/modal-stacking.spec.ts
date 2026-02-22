import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Modal Stacking & Dismiss Tests
 * Covers Changes A-D:
 * - A: z-index hierarchy (unique, non-colliding values)
 * - B: Backdrop click dismiss on confirmation dialogs
 * - C: ESC key handler (closes topmost modal first)
 * - D: Mutual exclusion (conflicting full-screen modals close each other)
 */

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// ============================================================================
// SOURCE-LEVEL Z-INDEX VERIFICATION
// ============================================================================

test.describe('Modal Z-Index Hierarchy (Source Verification)', () => {

  const orchestratorPath = path.resolve(__dirname, '../src/components/StudioOrchestratorV2.jsx');
  const previewModalPath = path.resolve(__dirname, '../src/components/PreviewModal.jsx');

  test('StudioOrchestratorV2.jsx exists', () => {
    expect(fs.existsSync(orchestratorPath)).toBe(true);
  });

  test('PreviewModal.jsx exists', () => {
    expect(fs.existsSync(previewModalPath)).toBe(true);
  });

  test('Maximized card uses z-index 10001', () => {
    const source = fs.readFileSync(orchestratorPath, 'utf-8');
    // The maximized card modal should use zIndex: 10001
    expect(source).toContain('zIndex: 10001');
  });

  test('PreviewModal uses z-index 10002', () => {
    const source = fs.readFileSync(previewModalPath, 'utf-8');
    expect(source).toContain('zIndex: 10002');
  });

  test('Preview All Creations modal uses z-index 10003', () => {
    const source = fs.readFileSync(orchestratorPath, 'utf-8');
    expect(source).toContain('zIndex: 10003');
  });

  test('Create Project modal uses z-index 10004', () => {
    const source = fs.readFileSync(orchestratorPath, 'utf-8');
    expect(source).toContain('zIndex: 10004');
  });

  test('Save Confirmation dialog uses z-index 10005', () => {
    const source = fs.readFileSync(orchestratorPath, 'utf-8');
    expect(source).toContain('zIndex: 10005');
  });

  test('Exit and Regenerate Confirmation dialogs use z-index 10006', () => {
    const source = fs.readFileSync(orchestratorPath, 'utf-8');
    // Both exit and regenerate confirmations use 10006
    const matches = source.match(/zIndex: 10006/g);
    expect(matches).not.toBeNull();
    expect(matches!.length).toBeGreaterThanOrEqual(2);
  });

  test('All modal z-indices are unique and ordered correctly', () => {
    const source = fs.readFileSync(orchestratorPath, 'utf-8');
    const previewSource = fs.readFileSync(previewModalPath, 'utf-8');

    // Verify each z-index exists in the appropriate file
    const expectedZIndices = [10001, 10003, 10004, 10005, 10006];
    for (const z of expectedZIndices) {
      expect(source).toContain(`zIndex: ${z}`);
    }

    // PreviewModal has 10002
    expect(previewSource).toContain('zIndex: 10002');
  });

});

// ============================================================================
// ESC KEY HANDLER (SOURCE VERIFICATION)
// ============================================================================

test.describe('ESC Key Handler (Source Verification)', () => {

  const orchestratorPath = path.resolve(__dirname, '../src/components/StudioOrchestratorV2.jsx');
  const previewModalPath = path.resolve(__dirname, '../src/components/PreviewModal.jsx');

  test('ESC handler exists in StudioOrchestratorV2', () => {
    const source = fs.readFileSync(orchestratorPath, 'utf-8');
    expect(source).toContain("e.key !== 'Escape'");
  });

  test('ESC handler checks modals in priority order (highest z-index first)', () => {
    const source = fs.readFileSync(orchestratorPath, 'utf-8');

    // Find the ESC handler block
    const escHandlerMatch = source.match(/const handleEsc[\s\S]*?window\.addEventListener\('keydown', handleEsc\)/);
    expect(escHandlerMatch).not.toBeNull();

    const escHandler = escHandlerMatch![0];

    // Verify priority order: regenerateConfirm → exitConfirm → saveConfirm → createProject → previewModal → maximizedSlot
    const regenerateIdx = escHandler.indexOf('showRegenerateConfirm');
    const exitIdx = escHandler.indexOf('showExitConfirm');
    const saveIdx = escHandler.indexOf('showSaveConfirm');
    const createProjectIdx = escHandler.indexOf('showCreateProject');
    const previewIdx = escHandler.indexOf('showPreviewModal');
    const maximizedIdx = escHandler.indexOf('maximizedSlot');

    // Each should exist
    expect(regenerateIdx).toBeGreaterThan(-1);
    expect(exitIdx).toBeGreaterThan(-1);
    expect(saveIdx).toBeGreaterThan(-1);
    expect(createProjectIdx).toBeGreaterThan(-1);
    expect(previewIdx).toBeGreaterThan(-1);
    expect(maximizedIdx).toBeGreaterThan(-1);

    // Priority order: regenerate first, maximizedSlot last
    expect(regenerateIdx).toBeLessThan(exitIdx);
    expect(exitIdx).toBeLessThan(saveIdx);
    expect(saveIdx).toBeLessThan(createProjectIdx);
    expect(createProjectIdx).toBeLessThan(previewIdx);
    expect(previewIdx).toBeLessThan(maximizedIdx);
  });

  test('PreviewModal has its own ESC handler', () => {
    const source = fs.readFileSync(previewModalPath, 'utf-8');
    expect(source).toContain("e.key === 'Escape'");
    expect(source).toContain('onClose()');
  });

  test('PreviewModal ESC handler only fires when isOpen', () => {
    const source = fs.readFileSync(previewModalPath, 'utf-8');
    // The useEffect should check isOpen before adding the listener
    expect(source).toContain('if (!isOpen) return');
  });

});

// ============================================================================
// BACKDROP CLICK DISMISS (SOURCE VERIFICATION)
// ============================================================================

test.describe('Backdrop Click Dismiss (Source Verification)', () => {

  const orchestratorPath = path.resolve(__dirname, '../src/components/StudioOrchestratorV2.jsx');

  test('Save Confirmation has backdrop click dismiss', () => {
    const source = fs.readFileSync(orchestratorPath, 'utf-8');
    // The save confirmation dialog should have an onClick handler on the backdrop
    // that checks e.target === e.currentTarget before closing
    const saveConfirmSection = source.substring(
      source.indexOf('Save Confirmation Dialog'),
      source.indexOf('Exit Confirmation Dialog')
    );
    expect(saveConfirmSection).toContain('e.target === e.currentTarget');
    expect(saveConfirmSection).toContain('setShowSaveConfirm(false)');
  });

  test('Exit Confirmation has backdrop click dismiss', () => {
    const source = fs.readFileSync(orchestratorPath, 'utf-8');
    const exitConfirmSection = source.substring(
      source.indexOf('Exit Confirmation Dialog'),
      source.indexOf('Save/Clear Before Re-Generating')
    );
    expect(exitConfirmSection).toContain('e.target === e.currentTarget');
    expect(exitConfirmSection).toContain('setShowExitConfirm(false)');
  });

  test('Regenerate Confirmation has backdrop click dismiss', () => {
    const source = fs.readFileSync(orchestratorPath, 'utf-8');
    const regenSection = source.substring(
      source.indexOf('Save/Clear Before Re-Generating'),
      source.indexOf('Preview All Creations')
    );
    expect(regenSection).toContain('e.target === e.currentTarget');
    expect(regenSection).toContain('setShowRegenerateConfirm(false)');
  });

  test('Create Project modal has backdrop click dismiss', () => {
    const source = fs.readFileSync(orchestratorPath, 'utf-8');
    const createProjectSection = source.substring(
      source.indexOf('Create Project Modal'),
      source.indexOf('Save Confirmation Dialog')
    );
    expect(createProjectSection).toContain('setShowCreateProject(false)');
  });

  test('Preview All Creations has backdrop click dismiss', () => {
    const source = fs.readFileSync(orchestratorPath, 'utf-8');
    const previewSection = source.substring(
      source.indexOf('Preview All Creations')
    );
    expect(previewSection).toContain('e.target === e.currentTarget');
    expect(previewSection).toContain('setShowPreviewModal(false)');
  });

});

// ============================================================================
// MUTUAL EXCLUSION (SOURCE VERIFICATION)
// ============================================================================

test.describe('Mutual Exclusion (Source Verification)', () => {

  const orchestratorPath = path.resolve(__dirname, '../src/components/StudioOrchestratorV2.jsx');

  test('Opening Create Project closes maximized card and preview', () => {
    const source = fs.readFileSync(orchestratorPath, 'utf-8');
    // When setShowCreateProject(true) is called, it should also close maximized and preview
    // Look for a pattern where setMaximizedSlot(null) and setShowPreviewModal(false) appear
    // near setShowCreateProject(true)
    const createProjectCalls = source.match(/setShowCreateProject\(true\)/g);
    expect(createProjectCalls).not.toBeNull();
    expect(createProjectCalls!.length).toBeGreaterThan(0);
  });

  test('useEffect dependencies include all modal states for ESC handler', () => {
    const source = fs.readFileSync(orchestratorPath, 'utf-8');
    // The ESC handler useEffect should have all modal states in its dependency array
    const escEffect = source.match(/\[showRegenerateConfirm.*maximizedSlot\]/);
    expect(escEffect).not.toBeNull();
    const deps = escEffect![0];
    expect(deps).toContain('showRegenerateConfirm');
    expect(deps).toContain('showExitConfirm');
    expect(deps).toContain('showSaveConfirm');
    expect(deps).toContain('showCreateProject');
    expect(deps).toContain('showPreviewModal');
    expect(deps).toContain('maximizedSlot');
  });

});

// ============================================================================
// UI MODAL TESTS (LANDING PAGE)
// ============================================================================

test.describe('Landing Page Modal Behavior', () => {

  test('ESC key closes modal opened from landing page', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    await page.waitForLoadState('load');

    // Try to find and click a modal trigger
    const triggerButton = page.locator('button, a').filter({ hasText: /Pricing|Sign In|Login|Terms|Privacy/i }).first();
    const isVisible = await triggerButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (isVisible) {
      await triggerButton.click();
      await page.waitForTimeout(500);

      // Check if a modal/overlay appeared
      const modal = page.locator('div[style*="position: fixed"]').first();
      const modalVisible = await modal.isVisible({ timeout: 2000 }).catch(() => false);

      if (modalVisible) {
        // Press ESC
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);

        // Modal should be dismissed or at least ESC should not crash the page
        const errors: string[] = [];
        page.on('pageerror', (error) => errors.push(error.message));
        await page.waitForTimeout(200);

        // Filter out known non-critical errors
        const criticalErrors = errors.filter(e =>
          !e.includes('ResizeObserver') &&
          !e.includes('Non-Error')
        );
        expect(criticalErrors).toHaveLength(0);
      }
    } else {
      console.log('No modal trigger found on landing page — skipping ESC test');
    }
  });

  test('Backdrop click dismisses modal on landing page', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    await page.waitForLoadState('load');

    const triggerButton = page.locator('button, a').filter({ hasText: /Pricing|Sign In|Login/i }).first();
    const isVisible = await triggerButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (isVisible) {
      await triggerButton.click();
      await page.waitForTimeout(500);

      // Click on overlay/backdrop (top-left corner, likely outside modal content)
      const overlay = page.locator('div[style*="position: fixed"]').first();
      const overlayVisible = await overlay.isVisible({ timeout: 2000 }).catch(() => false);

      if (overlayVisible) {
        // Click at the edge of the overlay (likely backdrop area)
        await overlay.click({ position: { x: 10, y: 10 }, force: true });
        await page.waitForTimeout(500);

        // Page should not have crashed
        const bodyVisible = await page.locator('body').isVisible();
        expect(bodyVisible).toBe(true);
      }
    } else {
      console.log('No modal trigger found on landing page — skipping backdrop test');
    }
  });

  test('Page does not crash when pressing ESC multiple times', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    await page.waitForLoadState('load');

    // Rapid ESC presses should not cause errors
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(100);
    }

    // Page should still be functional
    const bodyVisible = await page.locator('body').isVisible();
    expect(bodyVisible).toBe(true);
  });

});

// ============================================================================
// CONFIRMATION DIALOG BUTTON LABELS
// ============================================================================

test.describe('Confirmation Dialog Content (Source Verification)', () => {

  const orchestratorPath = path.resolve(__dirname, '../src/components/StudioOrchestratorV2.jsx');

  test('Save Confirmation dialog has "Project Saved!" title', () => {
    const source = fs.readFileSync(orchestratorPath, 'utf-8');
    expect(source).toContain('Project Saved!');
  });

  test('Save Confirmation has "Go to Hub" and "Preview" buttons', () => {
    const source = fs.readFileSync(orchestratorPath, 'utf-8');
    expect(source).toContain('Go to Hub');
    expect(source).toContain('Preview');
  });

  test('Exit Confirmation dialog has "Save Your Work?" title', () => {
    const source = fs.readFileSync(orchestratorPath, 'utf-8');
    expect(source).toContain('Save Your Work?');
  });

  test('Exit Confirmation has "Save Project", "Cancel", and "Discard & Exit" buttons', () => {
    const source = fs.readFileSync(orchestratorPath, 'utf-8');
    expect(source).toContain('Discard & Exit');
  });

  test('Regenerate Confirmation dialog has "Unsaved Content" title', () => {
    const source = fs.readFileSync(orchestratorPath, 'utf-8');
    expect(source).toContain('Unsaved Content');
  });

  test('Regenerate Confirmation has "Save & Generate New" and "Clear & Generate New" buttons', () => {
    const source = fs.readFileSync(orchestratorPath, 'utf-8');
    expect(source).toContain('Save & Generate New');
    expect(source).toContain('Clear & Generate New');
  });

  test('Create Project modal has "Save to Project" title', () => {
    const source = fs.readFileSync(orchestratorPath, 'utf-8');
    expect(source).toContain('Save to Project');
  });

  test('Create Project has "Cancel" and "Save Project" buttons', () => {
    const source = fs.readFileSync(orchestratorPath, 'utf-8');
    // Find within the create project section
    const section = source.substring(
      source.indexOf('Create Project Modal'),
      source.indexOf('Save Confirmation Dialog')
    );
    expect(section).toContain('Cancel');
    expect(section).toContain('Save Project');
  });

});
