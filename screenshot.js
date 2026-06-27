const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  
  // Login
  await page.goto('http://localhost:3000/login');
  await page.fill('input[name="email"]', 'test1@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  
  // Go to cases
  await page.goto('http://localhost:3000/cases');
  await page.waitForSelector('text=Cases');
  
  // Find the first case link and click it
  const firstCaseLink = await page.$('a[href^="/cases/"]');
  if (firstCaseLink) {
    const href = await firstCaseLink.getAttribute('href');
    await page.goto('http://localhost:3000' + href);
    await page.waitForSelector('text=Financials');
    
    // Click financials tab
    await page.click('button[value="financials"]');
    await page.waitForTimeout(1000);
    
    // Log an expense programmatically via the UI? Or just take the empty state.
    // Let's open the dialog
    await page.click('text=Log Expense');
    await page.waitForTimeout(1000);
    
    // Fill the dialog
    await page.click('button:has-text("Select category")');
    await page.click('text=Filing Fee');
    await page.fill('input[name="amount"]', '5000');
    await page.fill('textarea[name="description"]', 'Initial Court Filing Fee');
    await page.click('button:has-text("Save Expense")');
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: '/Users/manirajpandey/.gemini/antigravity-ide/brain/4069108d-8281-4e42-ae89-986bb1bd883e/expense_tracker_1.png' });
  } else {
    console.log("No cases found");
  }

  await browser.close();
})();
