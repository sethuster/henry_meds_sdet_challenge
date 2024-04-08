import { test, expect } from '@playwright/test';
import { AppointmentLanding } from '../pages/appointment_landing.page';
import statesByProviderJSON from'../test_data/statesByProviderTreatment.json';

let apiContext;
const apiUrl = 'https://henry-dev.hasura.app/'
let providerStates;

test.beforeAll(async ({ playwright }) => {
  apiContext = await playwright.request.newContext({
    baseURL: apiUrl
  })
});


//API Tests
test('StatesByProviderTreatment', async ({ page, request }) => {
  const req = await apiContext.post('v1/graphql', { data: statesByProviderJSON });
  expect(req.ok()).toBeTruthy();
  const resp = await req.json();
  await expect('data' in resp).toBeTruthy()
  providerStates = resp;
})

//UI Tests
test('Verify appllication is available', async ({ page, request }) => {
  /* test: make sure the application is responding succesfully over http request
  */
  const req = await request.get(new AppointmentLanding(page).pageUri)
  await expect(req.ok()).toBeTruthy()
})

test('Verify the page elements load as expected', async ({ page }) => {
  // Test to make sure the page 
  const graphqlReq = page.waitForRequest(request => 
    request.url() === `${apiUrl}v1/graphql` && request.method() === 'POST',
  );
  const appointmentLanding = new AppointmentLanding(page);
  await appointmentLanding.goto();
  const request = await graphqlReq;

  await expect(appointmentLanding.header).toBeVisible();
  await expect(appointmentLanding.statePrompt).toBeVisible();
  await expect(appointmentLanding.licensedProvider).toBeVisible();
  await expect(appointmentLanding.contact).toBeVisible();
})

test('Validate the buttons returned in response are dispalyed on the page', async ({ page }) => {
  const req = await apiContext.post('v1/graphql', { data: statesByProviderJSON });
  expect(req.ok()).toBeTruthy();
  const buttons = await req.json();

  const appointmentLanding = new AppointmentLanding(page);
  await appointmentLanding.goto();

  let states = buttons.data.statesByProviderTreatment.map((s) => s.state);
  for (let i = 0; i < states.length; i++) {
    await expect(appointmentLanding.page.locator(`button[data-testid="${states[i]}"]`)).toBeVisible()
  }
});



