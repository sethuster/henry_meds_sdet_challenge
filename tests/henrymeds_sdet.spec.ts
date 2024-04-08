import { test, expect } from '@playwright/test';
import { AppointmentLanding } from '../pages/appointment_landing.page';
import statesByProviderJSON from '../test_data/statesByProviderTreatment.json';
import stateRequestAvailableTimesJSON from '../test_data/stateRequestAvailableTimes.json'
import providerRequestJSON from '../test_data/providerRequest.json'

let apiContextGraphQL;
const apiUrlGQL = 'https://henry-dev.hasura.app/'
let apiContextCheckout;
const apiUrlCeckout = 'https://checkout-api-dev.henrymeds.com/'


test.beforeAll(async ({ playwright }) => {
  apiContextGraphQL = await playwright.request.newContext({
    baseURL: apiUrlGQL
  })
  apiContextCheckout = await playwright.request.newContext({
    baseURL: apiUrlCeckout 
  })
});

test.describe.serial('Validate API is providing provider times', () => {
  let statesAvailable 
  let stateProviderSchedules = {};

  test('StatesByProviderTreatment', async ({ page, request }) => {
    const req = await apiContextGraphQL.post('v1/graphql', { data: statesByProviderJSON });
    expect(req.ok()).toBeTruthy();
    const resp = await req.json();
    await expect('data' in resp).toBeTruthy()

    statesAvailable = resp.data.statesByProviderTreatment.map(s => s.state)
  });

  test('Verify that each available state allows for getting availble times', async ({ request }) => {
    for(let i = 0; i < statesAvailable.length; i++){
      let stateReq = stateRequestAvailableTimesJSON
      stateReq.variables['state'] = statesAvailable[i]
      const req = await apiContextGraphQL.post('v1/graphql', { data: stateRequestAvailableTimesJSON })
      await expect(req.ok()).toBeTruthy();
      const resp = await req.json()
      await expect('data' in resp).toBeTruthy();

      // add the response for future tests
      console.log(`Adding info for ${statesAvailable[i]} ${resp.data.cappedAvailableTimes.length}`)
      stateProviderSchedules[statesAvailable[i]] = resp.data;
    }
  });

  test('Verify Checkout queries for each available time', async ({ request }) => {
    // Provider ID comes from available schedules - make 1 request for each state
    for(let i = 0; i < statesAvailable.length; i++){
      // provider req
      if(stateProviderSchedules[statesAvailable[i]].cappedAvailableTimes.length > 0){
        console.log(statesAvailable[i])
        let providerReq = providerRequestJSON;
        // this could be used to test every single one but for time only validating the first time slot for each state
        providerReq.variables['providerId'] = stateProviderSchedules[statesAvailable[i]].cappedAvailableTimes[0].provider.id
        const req = await apiContextGraphQL.post('v1/graphql', { data: providerReq})
        await expect(req.ok()).toBeTruthy()
        const resp = await req.json()
        await expect('data' in resp).toBeTruthy()
      }
    }
  });

  test('Verfy appointment api response for provider', async ({ request }) => {
    for(let i = 0; i < statesAvailable.length; i++){
      // provider req
      if(stateProviderSchedules[statesAvailable[i]].cappedAvailableTimes.length > 0){
        console.log(statesAvailable[i])
        // go through each appointment time and verify 
      }
    }
  })


})

 


test.describe.serial('Validate UI is hooked up to API', () => {

  test.skip('Verify appllication is available', async ({ page, request }) => {
    /* test: make sure the application is responding succesfully over http request
    */
    const req = await request.get(new AppointmentLanding(page).pageUri)
    await expect(req.ok()).toBeTruthy()
  })
  
  test.skip('Verify the page elements load as expected', async ({ page }) => {
    // Test to make sure the page 
    const graphqlReq = page.waitForRequest(request => 
      request.url() === `${apiUrlGQL}v1/graphql` && request.method() === 'POST',
    );
    const appointmentLanding = new AppointmentLanding(page);
    await appointmentLanding.goto();
    const request = await graphqlReq;
  
    await expect(appointmentLanding.header).toBeVisible();
    await expect(appointmentLanding.statePrompt).toBeVisible();
    await expect(appointmentLanding.licensedProvider).toBeVisible();
    await expect(appointmentLanding.contact).toBeVisible();
  })
  
  test.skip('Validate the buttons returned in response are dispalyed on the page', async ({ page }) => {
    const req = await apiContextGraphQL.post('v1/graphql', { data: statesByProviderJSON });
    expect(req.ok()).toBeTruthy();
    const buttons = await req.json();
  
    const appointmentLanding = new AppointmentLanding(page);
    await appointmentLanding.goto();
  
    let states = buttons.data.statesByProviderTreatment.map((s) => s.state);
    for (let i = 0; i < states.length; i++) {
      await expect(appointmentLanding.page.locator(`button[data-testid="${states[i]}"]`)).toBeVisible()
    }
  });
})
//UI Tests




