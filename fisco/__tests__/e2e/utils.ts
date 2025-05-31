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

export async function logout(page: Page) {
  // Click navigation menu button   
  await page.getByLabel('Navigation menu').first().click();

  // Click logout button   
  await page.getByRole('button', { name: 'Sign out button' }).first().click();
}

export async function uploadOutfit(page: Page, filePath: string) {
  // Click navigation menu button   
  await page.getByLabel('Navigation menu').first().click();

  // Click upload button
  await page.getByTestId('Upload button').first().click();

  // Upload outfit image
  const input = await page.getByTestId('File upload')
  await input.setInputFiles(filePath);
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Click submit upload button
  const submitUpload = await page.getByTestId('Upload submit button').click();
}