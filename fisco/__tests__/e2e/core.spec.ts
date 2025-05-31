import { test, expect } from '@playwright/test';
import { getComparator } from 'playwright-core/lib/utils';
import { login, uploadOutfit } from './utils'

const SAMPLE_IMG = './__tests__/e2e/sample.png'

test.describe('MVP user stories', () => {
  test('Upload a photo and view it in feed (As a user, I want to share my outfit with others)', async ({ page }) => {
 
    // Sign in as test user
    await page.goto('http://localhost:3000/');
    await login(page);

    const firstImageBefore = page.getByTestId('Post image').first();
    const srcBefore = await firstImageBefore.getAttribute('src');

    // Upload outfit
    await uploadOutfit(page, SAMPLE_IMG);

    const firstImageAfter = page.getByTestId('Post image').first();
    const srcAfter = await firstImageAfter.getAttribute('src');

    // See new post in feed
    expect(srcAfter).not.toBe(srcBefore);
  });

  test('View posts while signed out (As a signed-out user, I want to explore others’ outfits)', async ({page}) => {
    await page.goto('http://localhost:3000/');

    // See first outfit post in feed
    const firstImageBefore = page.getByTestId('Post image').first();
    const srcBefore = await firstImageBefore.getAttribute('src');

    // Scroll down 
    await page.mouse.wheel(0, 1000);

    // Wait for a new image with a different 'src' to appear
    await page.waitForFunction(
      ([testId, srcBefore]) => {
        const images = Array.from(document.querySelectorAll(`[data-testid="${testId}"]`));
        return images.some(img => img.getAttribute('src') !== srcBefore);
      },
      ['Post image', srcBefore],
      { timeout: 5000 }
    );

    // Scroll up
    await page.mouse.wheel(0, -1000);

    // See first outfit post in feed
    const firstImageAfter = page.getByTestId('Post image').first();
    const srcAfter = await firstImageAfter.getAttribute('src');
    expect(srcAfter).toBe(srcBefore);
  })
});

// test('Sign in as test user', () => {
//   await page.goto('http://localhost:3000/');

//     // Locate the first post 
//     const firstImage = page.getByTestId('Post image').first();
//     await expect(firstImage).toBeVisible();
//     const initialSrc = await firstImage.getAttribute('src');

//     // Scroll to next post
//     await page.mouse.wheel(0, 1000);

//     // Wait for a new image with a different 'src' to appear
//     await page.waitForFunction(
//       ([testId, initialSrc]) => {
//         const images = Array.from(document.querySelectorAll(`[data-testid="${testId}"]`));
//         return images.some(img => img.getAttribute('src') !== initialSrc);
//       },
//       ['Post image', initialSrc],
//       { timeout: 5000 }
//     );
// })


// test.describe('While logged out', () => {
//   test('Scroll through feed, viewing posts', async ({ page }) => {
//     await page.goto('http://localhost:3000/');



//     // Check new image
//     const images = page.getByTestId('Post image');
//     const count = await images.count();
//     for (let i = 0; i < count; i++) {
//       const img = images.nth(i);
//       const src = await img.getAttribute('src');
//       if (src && src !== initialSrc) {
//         await expect(img).toBeVisible();
//         break;
//       }
//     }

//     // Scroll back up and check first image
//     await page.mouse.wheel(0, -1000);
//     await expect(firstImage).toBeVisible();
//   });

//   test('Try liking a post', async ({ page }) => {
//     await page.goto('http://localhost:3000/');

//     const likeButton = page.getByLabel('Like button').first();
//     await likeButton.click();
//     await page.getByText('Welcome back').waitFor()
//   });

//   test('Try commenting on a post', async ({ page }) => {
//     await page.goto('http://localhost:3000/');

//     const commentButton = page.getByLabel('Comment button').first();
//     await commentButton.click();
//     await page.getByText('Welcome back').waitFor()
//   });

    //   test('Upload a photo and view it in feed', async ({ page }) => {
    //     await page.goto('http://localhost:3000/');

    //     const uploadPageButton = page.getByLabel('Upload page button').first();
    //     await uploadPageButton.click();
    //     await page.getByText('Share your outfit!').waitFor();
    //     await page.waitForTimeout(500)

    //     const uploadButton = page.getByLabel('Upload button').first();
    //     await uploadButton.click();

    //     const input = await page.getByTestId('File upload')
    //     await input.setInputFiles('./__tests__/e2e/sample.png');

    //     await page.waitForTimeout(1000)

    //      // Scroll to bottom
    //     for (let i = 0; i < 20; i++) {
    //       await page.mouse.wheel(0, 500);
    //       await page.waitForTimeout(200)
    //     }

    //     // Search for a new image with the same uploaded 'src'
    //     await page.waitForFunction(
    //       ([testId]) => {
    //         const images = Array.from(document.querySelectorAll(`[data-testid="${testId}"]`));
    //         return images.some(img => img.getAttribute('src') == 'sample.png');
    //       },
    //       ['Post image'],
    //       { timeout: 5000 }
    //     );
    // });

//     test('Navigate to login page', async ({ page }) => {
//       await page.goto('http://localhost:3000/');

//       const loginButton = page.getByLabel('Login button').first();
//       await loginButton.click();
//       await page.getByText('Welcome back').waitFor()
//     });
// });
