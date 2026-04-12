import { test, expect } from "@playwright/test";

/** Opens a Radix Select and clicks the matching option. */
async function radixSelect(
  page: import("@playwright/test").Page,
  trigger: import("@playwright/test").Locator,
  optionLabel: string,
) {
  const controlsId = await trigger.getAttribute("aria-controls");
  await trigger.click();
  if (controlsId) {
    // Wait for the specific listbox portal to appear with options inside
    await page.waitForSelector(`#${controlsId} [role="option"]`, {
      timeout: 10000,
    });
    await page
      .locator(`#${controlsId} [role="option"]`)
      .filter({ hasText: optionLabel })
      .first()
      .click();
  } else {
    await page.waitForSelector('[role="option"]', { timeout: 10000 });
    await page.getByRole("option", { name: optionLabel, exact: true }).click();
  }
}

test.describe("TAMS Frontend E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("Student CRUD Operations", async ({ page }) => {
    await page.goto("/students");

    // 1. Create Student
    await page.click('button:has-text("Add Student")');
    const sheet = page.locator('[data-slot="sheet-content"]');
    await expect(sheet).toBeVisible();

    // Personal tab (default)
    await sheet.locator('input[name="firstName"]').fill("Automated");
    await sheet.locator('input[name="lastName"]').fill("Test Student");
    await sheet.locator('input[name="dateOfBirth"]').fill("2010-01-01");
    // Gender defaults to "male" — no need to change it

    // Academic tab
    await sheet.getByRole("tab", { name: "Academic" }).click();
    const academicTab = sheet.getByRole("tab", { name: "Academic" });
    const panelId = await academicTab.getAttribute("aria-controls");
    const academicPanel = page.locator(`#${panelId}`);
    await expect(academicPanel).toBeVisible();

    const batchTrigger = academicPanel
      .locator('[data-slot="select-trigger"]')
      .first();
    await radixSelect(page, batchTrigger, "Matric 2025 - Morning");
    await expect(batchTrigger).toContainText("Matric 2025 - Morning", {
      timeout: 5000,
    });

    // Contact tab
    await sheet.getByRole("tab", { name: "Contact" }).click();
    await sheet.locator('input[name="parentName"]').fill("Test Parent");
    await sheet.locator('input[name="parentPhone"]').fill("03001234567");

    // Financial tab
    await sheet.getByRole("tab", { name: "Financial" }).click();
    await sheet.locator('input[name="admissionFee"]').fill("1000");

    await sheet.locator('button:has-text("Add Student")').click();
    await expect(page.locator("text=Student added successfully")).toBeVisible({
      timeout: 10000,
    });
    await page.waitForSelector("text=Automated Test Student");

    // 2. Edit Student
    const studentRow = page
      .locator("tr")
      .filter({ hasText: "Automated Test Student" })
      .first();
    await studentRow.locator('button[title="Edit student"]').click();

    const editSheet = page.locator('[data-slot="sheet-content"]');
    await expect(editSheet).toBeVisible();
    await editSheet.locator('input[name="firstName"]').fill("Updated");
    await editSheet.locator('button:has-text("Save Changes")').click();

    await expect(page.locator("text=Student updated successfully")).toBeVisible(
      {
        timeout: 10000,
      },
    );
    await page.waitForSelector("text=Updated Test Student");

    // 3. Delete Student
    const updatedRow = page
      .locator("tr")
      .filter({ hasText: "Updated Test Student" })
      .first();
    await updatedRow.locator('button[title="Delete student"]').click();
    await page.click('button:has-text("Delete Student")');

    await expect(page.locator("text=Student deleted successfully")).toBeVisible(
      {
        timeout: 10000,
      },
    );
    await expect(page.locator("text=Updated Test Student")).not.toBeVisible();
  });

  test("Exam CRUD Operations", async ({ page }) => {
    await page.goto("/exams");

    // 1. Create Exam
    await page.click('button:has-text("New Exam")');
    const sheet = page.locator('[data-slot="sheet-content"]');
    await expect(sheet).toBeVisible();

    await sheet.locator('input[name="name"]').fill("E2E Test Exam");

    // Batch select — first trigger in the sheet form
    const batchTrigger = sheet
      .locator('[data-slot="select-trigger"]')
      .filter({ hasText: /select batch/i })
      .first();
    await radixSelect(page, batchTrigger, "Matric 2025 - Morning");

    // Subject — after batch selection, subjects load. Wait briefly then check.
    await page.waitForTimeout(500);
    const subjectCombobox = sheet
      .locator('[data-slot="select-trigger"]')
      .filter({ hasText: /select subject/i });
    const subjectComboboxCount = await subjectCombobox.count();
    if (subjectComboboxCount > 0) {
      // Subjects exist for this batch — pick Mathematics from the dropdown
      await radixSelect(page, subjectCombobox.first(), "Mathematics");
    } else {
      await sheet.locator('input[name="subject"]').fill("Mathematics");
    }

    // Exam Type
    const typeTrigger = sheet
      .locator('[data-slot="select-trigger"]')
      .filter({ hasText: /monthly|weekly|quarterly|annual/i })
      .first();
    await radixSelect(page, typeTrigger, "Monthly");

    await sheet.locator('input[name="examDate"]').fill("2026-04-12");
    await sheet.locator('input[name="maxMarks"]').fill("100");

    await sheet.locator('button:has-text("Create Exam")').click();
    await expect(page.locator("text=Exam created successfully")).toBeVisible({
      timeout: 10000,
    });
    // Backend stores subject; wait for a Mathematics row to appear
    await page.waitForSelector("text=Mathematics", { timeout: 10000 });

    // 2. Delete Exam — find the most recently added Mathematics/Monthly row
    const examRow = page
      .locator("tr")
      .filter({ hasText: "Mathematics" })
      .filter({ hasText: /monthly/i })
      .last();
    await examRow.locator('button[title="Delete Exam"]').click();
    await page.click('button:has-text("Delete Exam")');

    await expect(page.locator("text=Exam deleted successfully")).toBeVisible({
      timeout: 10000,
    });
  });
});
