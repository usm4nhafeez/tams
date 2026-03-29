import { test, expect } from '@playwright/test';

test.describe('TAMS Frontend E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure we are on a clean state or just navigate
    await page.goto('/');
  });

  test('Student CRUD Operations', async ({ page }) => {
    await page.goto('/students');

    // 1. Create Student
    await page.click('button:has-text("New Student")');
    await page.fill('input[name="firstName"]', 'Automated');
    await page.fill('input[name="lastName"]', 'Test Student');
    await page.fill('input[name="dateOfBirth"]', '2010-01-01');
    
    // Select Gender (Radix Select)
    await page.click('label:has-text("Gender") + button');
    await page.click('div[role="option"]:has-text("Male")');

    // Select Batch (Matric 2025 - Morning)
    await page.click('label:has-text("Batch") + button');
    await page.click('div[role="option"]:has-text("Matric 2025 - Morning")');

    await page.fill('input[name="parentName"]', 'Test Parent');
    await page.fill('input[name="parentPhone"]', '03001234567');
    await page.fill('input[name="admissionFee"]', '1000');
    
    await page.click('button:has-text("Add Student")');
    
    // Verify toast and list
    await expect(page.locator('text=Student added successfully')).toBeVisible();
    await page.waitForSelector('text=Automated Test Student');

    // 2. Edit Student
    const studentRow = page.locator('tr').filter({ hasText: 'Automated Test Student' });
    await studentRow.locator('button[title="Edit student"]').click();
    
    await page.fill('input[name="firstName"]', 'Updated');
    await page.click('button:has-text("Update Student")');
    
    await expect(page.locator('text=Student updated successfully')).toBeVisible();
    await page.waitForSelector('text=Updated Test Student');

    // 3. Delete Student
    await studentRow.locator('button[title="Delete student"]').click();
    await page.click('button:has-text("Delete Student")');
    
    await expect(page.locator('text=Student deleted successfully')).toBeVisible();
    await expect(page.locator('text=Updated Test Student')).not.toBeVisible();
  });

  test('Exam CRUD Operations', async ({ page }) => {
    await page.goto('/exams');

    // 1. Create Exam
    await page.click('button:has-text("New Exam")');
    await page.fill('input[name="name"]', 'E2E Test Exam');
    
    // Select Batch
    await page.click('label:has-text("Batch") + button');
    await page.click('div[role="option"]:has-text("Matric 2025 - Morning")');

    await page.fill('input[name="subject"]', 'Mathematics');
    
    // Select Type
    await page.click('label:has-text("Exam Type") + button');
    await page.click('div[role="option"]:has-text("Monthly")');

    await page.fill('input[name="examDate"]', '2026-03-29');
    await page.fill('input[name="maxMarks"]', '100');
    
    await page.click('button:has-text("Create Exam")');
    
    await expect(page.locator('text=Exam created successfully')).toBeVisible();
    await page.waitForSelector('text=E2E Test Exam');

    // 2. Delete Exam
    const examRow = page.locator('tr').filter({ hasText: 'E2E Test Exam' });
    await examRow.locator('button[title="Delete Exam"]').click();
    await page.click('button:has-text("Delete Exam")');
    
    await expect(page.locator('text=Exam deleted successfully')).toBeVisible();
    await expect(page.locator('text=E2E Test Exam')).not.toBeVisible();
  });
});
