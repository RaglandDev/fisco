import { test, expect, chromium } from '@playwright/test';
import { getComparator } from 'playwright-core/lib/utils';
import { login, logout, uploadOutfit } from './utils'

const SAMPLE_IMG = './__tests__/e2e/sample.png'


test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:3000/');
  // Wait for page to be fully loaded
  await page.waitForLoadState('networkidle');
});


test.describe('MVP user stories', () => {

  test('Upload a photo and view it in feed (As a user, I want to share my outfit with others)', async ({ page }) => {
 
    // Sign in as test user
    await login(page);
    await page.waitForLoadState('networkidle');

    const firstImageBefore = page.getByTestId('Post image').first();
    await firstImageBefore.waitFor();
    const srcBefore = await firstImageBefore.getAttribute('src');

    // Upload outfit
    await uploadOutfit(page, SAMPLE_IMG);
    await page.waitForLoadState('networkidle');

    // Wait for the new post to appear and be different
    await page.waitForFunction(
      (srcBefore) => {
        const firstImage = document.querySelector('[data-testid="Post image"]');
        return firstImage && firstImage.getAttribute('src') !== srcBefore;
      },
      srcBefore,
      { timeout: 10000 }
    );

    const firstImageAfter = page.getByTestId('Post image').first();
    const srcAfter = await firstImageAfter.getAttribute('src');

    // See new post in feed
    expect(srcAfter).not.toBe(srcBefore);

    // Clean up - delete the post
    const deleteButtons = page.getByLabel('Delete button');
    await deleteButtons.first().waitFor();
    await deleteButtons.first().click();
    
    const confirmButton = page.getByLabel('Confirm deletion').first();
    await confirmButton.waitFor();
    await confirmButton.click();
    await page.waitForLoadState('networkidle');
  });

  test('View posts while signed out (As a signed-out user, I want to explore others outfits)', async ({page}) => {

    // Wait for initial load
    await page.waitForLoadState('networkidle');

    // See first outfit post in feed
    const firstImageBefore = page.getByTestId('Post image').first();
    await firstImageBefore.waitFor();
    const srcBefore = await firstImageBefore.getAttribute('src');

    // Scroll down 
    await page.mouse.wheel(0, 1000);
    await page.waitForTimeout(1000); // Wait for scroll to complete

    // Wait for a new image with a different 'src' to appear
    await page.waitForFunction(
      ([testId, srcBefore]) => {
        const images = Array.from(document.querySelectorAll(`[data-testid="${testId}"]`));
        return images.some(img => img.getAttribute('src') !== srcBefore);
      },
      ['Post image', srcBefore],
      { timeout: 10000 }
    );

    // Scroll up
    await page.mouse.wheel(0, -1000);
    await page.waitForTimeout(1000); // Wait for scroll to complete

    // See first outfit post in feed
    const firstImageAfter = page.getByTestId('Post image').first();
    await firstImageAfter.waitFor();
    const srcAfter = await firstImageAfter.getAttribute('src');
    expect(srcAfter).toBe(srcBefore);
  })

  test('Like and unlike a post (As a user, I want to show others that I enjoy an outfit.)', async ({ page }) => {
    // Sign in as test user
    await login(page);
    await page.waitForLoadState('networkidle');

    const likeButtonLocator = page.getByLabel('Like button').first();
    await likeButtonLocator.waitFor();

    // Click like button and wait for UI update
    await likeButtonLocator.click();
    await page.waitForTimeout(500); // Wait for like state to update

    // Click like button again to unlike and wait for UI update
    await likeButtonLocator.click();
    await page.waitForTimeout(500); // Wait for unlike state to update
  });

  test('Upload outfits with tags and view them in the feed (As a user, I want to make it easy for others to find the pieces that Im wearing.)', async ({ page }) => {
    // Sign in as test user
    await login(page);
    await page.waitForLoadState('networkidle');

    // Upload photo with tag
    const navMenu = page.getByLabel('Navigation menu').first();
    await navMenu.waitFor();
    await navMenu.click();
    await page.waitForTimeout(1000); // Wait for menu to fully open
    
    const uploadButton = page.getByTestId('Upload button').first();
    await uploadButton.waitFor({ state: 'visible', timeout: 10000 });
    await uploadButton.click();
    await page.waitForTimeout(500); // Wait for upload dialog/page to open
    
    const input = page.getByTestId('File upload');
    // Don't wait for visibility since file inputs are often hidden
    await input.setInputFiles(SAMPLE_IMG);
    await page.waitForTimeout(2000); // Wait for file to upload and process
    
    const tagModeButton = page.getByLabel('Tag mode button').first();
    await tagModeButton.waitFor();
    await tagModeButton.click();
    await page.waitForTimeout(500); // Wait for tag mode to activate
    
    const viewport = page.viewportSize();
    const centerX = viewport.width / 2;
    const centerY = viewport.height / 2;
    await page.mouse.click(centerX, centerY);
    await page.waitForTimeout(500); // Wait for tag placement
    
    const itemNameInput = page.getByLabel('Item name input field').first();
    await itemNameInput.waitFor();
    await itemNameInput.fill('69');
    await page.waitForTimeout(300); // Wait for input to be filled
    
    const saveTagButton = page.getByLabel('Save tag button').first();
    await saveTagButton.waitFor();
    await saveTagButton.click();
    await page.waitForTimeout(500); // Wait for tag to be saved
    
    const submitUploadButton = page.getByTestId('Upload submit button');
    await submitUploadButton.waitFor();
    await submitUploadButton.click();
    await page.waitForLoadState('networkidle'); // Wait for upload to complete and redirect

    // Click tag toggle button on post
    const showTagsButton = page.getByLabel('Show tags button').first();
    await showTagsButton.waitFor();
    await showTagsButton.click();
    await page.waitForTimeout(500); // Wait for tags to be displayed

    const tagText = page.getByText('69').first();
    await expect(tagText).toBeVisible();

    // Clean up - delete the post
    const deleteButtons = page.getByLabel('Delete button');
    await deleteButtons.first().waitFor();
    await deleteButtons.first().click();
    
    const confirmButton = page.getByLabel('Confirm deletion').first();
    await confirmButton.waitFor();
    await confirmButton.click();
    await page.waitForLoadState('networkidle');
  });

  test('Save and unsave a post (As a user, I want to keep track of others outfits that I like)', async ({ page }) => {
    // Sign in as test user
    await login(page);
    await page.waitForLoadState('networkidle');

    // Click save button
    const saveLocator = page.getByLabel('Save button').first();
    await saveLocator.waitFor();
    await saveLocator.click();
    await page.waitForTimeout(500); // Wait for save action to complete

    // Navigate to profile
    const navMenu = page.getByLabel('Navigation menu').first();
    await navMenu.waitFor();
    await navMenu.click();
    await page.waitForTimeout(1000); // Wait for menu to fully open
    
    const profileButton = page.getByLabel('Profile button').first();
    await profileButton.waitFor({ state: 'visible', timeout: 10000 });
    await profileButton.click();
    await page.waitForLoadState('networkidle'); // Wait for profile page to load

    // Wait for saved posts to be visible
    await page.waitForTimeout(1000);

    // Go back to landing page
    const navMenuAgain = page.getByLabel('Navigation menu').first();
    await navMenuAgain.waitFor();
    await navMenuAgain.click();
    await page.waitForTimeout(1000); // Wait for menu to fully open
    
    const homeButton = page.getByTestId('Home button').first();
    await homeButton.waitFor({ state: 'visible', timeout: 10000 });
    await homeButton.click();
    await page.waitForLoadState('networkidle'); // Wait for home page to load

    // Wait for the save button to be available again
    await saveLocator.waitFor();
    // Click save button again to unsave
    await saveLocator.click();
    await page.waitForTimeout(500); // Wait for unsave action to complete
  });

test('Comment on a post and delete it (As a user, I want to discuss outfits with other community members.)', async ({ page }) => {
    // Sign in as test user
    await login(page);
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Click comment button button
    const commentLocator = page.getByRole('button', { name: 'Comment button' }).first()
    await commentLocator.click();

    // Leave a comment
    await page.getByRole('textbox', { name: 'Leave a comment...' }).first().fill('test')
    await page.getByTestId('Submit comment').first().click();

    // Click delete comment button
    await page.getByTestId('Delete comment').first().click();
    page.on('dialog', async dialog => {
    await dialog.accept();         // Clicks "OK"
    });
  });

});