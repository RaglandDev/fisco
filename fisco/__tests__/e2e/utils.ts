import { Page } from '@playwright/test';

export async function login(page: Page) {
  // Click navigation menu button   
  await page.getByLabel('Navigation menu').first().click();

  // Click login button   
  await page.getByLabel('Login button').first().click();

  // Enter email
  await page.getByTestId('Email address input').first().fill(`${process.env.EMAIL}`);
  
  // Input password   
  await page.getByLabel('Password input').first().fill(`${process.env.PASS}`);

  // Click login   
  await page.getByLabel('Submit login').first().click();
}
