import { test, expect } from '@playwright/test';
import date from 'date-and-time';
import { AppointmentLanding } from '../pages/appointment_landing.page';
import { OtherState } from '../pages/otherState.page';
import { StateAppointmentTimes } from '../pages/noAppointmentTimes.page';
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

console.log(new Date().toISOString())
let now = new Date();
let tom = date.addHours(now, 24)
console.log(tom.toISOString())

test.describe.serial('API Tests', () => {
  let statesAvailable; // used to retrieve states to display on the main page
  let stateProviderSchedules = {}; //used to hold available times for each state
  let stateWithoutSchedules : string[] = []; // used to hold states that have no available times

  test('StatesByProviderTreatment', async ({ page, request }) => {
    const req = await apiContextGraphQL.post('v1/graphql', { data: statesByProviderJSON });
    expect(req.ok()).toBeTruthy();
    const resp = await req.json();
    await expect('data' in resp).toBeTruthy()

    statesAvailable = resp.data.statesByProviderTreatment.map(s => s.state)
    console.log(`statesAvailable: ${statesAvailable}`)
  });

  test('Verify that each available state allows for getting available times', async ({ request }) => {
    for(let i = 0; i < statesAvailable.length; i++){
      let stateReq = stateRequestAvailableTimesJSON
      stateReq.variables['state'] = statesAvailable[i]
      const req = await apiContextGraphQL.post('v1/graphql', { data: stateRequestAvailableTimesJSON })
      await expect(req.ok()).toBeTruthy();
      const resp = await req.json()
      await expect('data' in resp).toBeTruthy();

      // add the response for future tests
      console.log(`Adding info for ${statesAvailable[i]} ${resp.data.cappedAvailableTimes.length}`)
      if (resp.data.cappedAvailableTimes.length > 0){
        stateProviderSchedules[statesAvailable[i]] = resp.data;
      } else {
        stateWithoutSchedules.push(statesAvailable[i])
      }

    }
  });

  test('Verify Checkout queries for each available time', async ({ request }) => {
    // Provider ID comes from available schedules - make 1 request for each state
    let stateWTimes = Object.keys(stateProviderSchedules)
    console.log(`statesWithAvailability: ${stateWTimes}`)
    for(let i = 0; i < stateWTimes.length; i++){
      // provider req
      console.log(stateWTimes[i])
      let providerReq = providerRequestJSON;
      // this could be used to test every single one but for time only validating the first time slot for each state
      providerReq.variables['providerId'] = stateProviderSchedules[stateWTimes[i]].cappedAvailableTimes[0].provider.id
      const req = await apiContextGraphQL.post('v1/graphql', { data: providerReq})
      await expect(req.ok()).toBeTruthy();
      const resp = await req.json();
      await expect('data' in resp).toBeTruthy();
    }
  });

  test.skip('Verfy appointment api response for provider', async ({ request }) => {
    // Test to validate the appointment API is working as intended
  });

  // Stub out the rest of the tests

  test.describe.serial('UI Tests', () => {
    // tests that validate the specific user interfaces availble
    test('UI is available with a GET request', async ({ page, request }) => {
      /* test: make sure the application is responding succesfully over http request
      */
      const req = await request.get(new AppointmentLanding(page).pageUri)
      await expect(req.ok()).toBeTruthy()
    })
    
    test('Appointment Landing: page loads', async ({ page }) => {
      // Verify the landing page loads as expected and the request to GraphQL API is made appropriately
      const graphqlReq = page.waitForRequest(request => 
        request.url() === `${apiUrlGQL}v1/graphql` && request.method() === 'POST',
      );

      const newApp = new AppointmentLanding(page);
      await newApp.goto();
      const request = await graphqlReq;
  
      await expect(newApp.header).toBeVisible();
      await expect(newApp.statePrompt).toBeVisible();
      await expect(newApp.licensedProvider).toBeVisible();
      await expect(newApp.contact).toBeVisible();
    })
    
    test('Appointment Landing: Buttons Present for each state available', async ({ page }) => {
      // page is already pointed at the Appointment Landing page
      const newApp = new AppointmentLanding(page);
      await newApp.goto();
      for (let i = 0; i < statesAvailable.length; i++) {
        await expect(newApp.stateBtn(statesAvailable[i])).toBeVisible()
      }
    });

    test('Appointment Landing: Other State button is available', async ({ page }) => {
      const newApp = new AppointmentLanding(page);
      await newApp.goto();
      await expect(newApp.stateBtn('otherstate')).toBeVisible()
    });

    test('No Appointment: States with no available times show assistance page', async ({ page }) => {
      // Saving states without schedules in local variable stateWithoutSchedules
      for(let i = 0; i < stateWithoutSchedules.length; i++){
        console.log(`Verify page layout for states with no current slots: ${stateWithoutSchedules[i]}...`)
        let noAppPage = new StateAppointmentTimes(page, stateWithoutSchedules[i]);
        await noAppPage.goto();

        await expect(noAppPage.header).toBeVisible()
        await expect(noAppPage.sorryText).toBeVisible()
        await expect(noAppPage.assistenceLink).toBeVisible()
      }
    });

    test('Validate Other data form is able to be submitted', async ({ page }) => {
      // Other is not listed in this expected states list
      const otherState = new OtherState(page);
      await otherState.goto();

      //TODO: change this to validate all states not available
      await otherState.fillForm('test_fname', 'test_lname', '3039991212', 'test@email.com', 'Montana');
      await expect(otherState.thankYou).toBeVisible()
    });

    test('State Appointment: Page Layout', async ({ page }) => {
      const statesWithSchedules = Object.keys(stateProviderSchedules);
      console.log(`States with appointments: ${statesWithSchedules}`);

      for(let i = 0; i < statesWithSchedules.length; i++) {
        let statePage = new StateAppointmentTimes(page, statesWithSchedules[i]);
        await statePage.goto();
        console.log(statePage.page.url())
        console.log(stateProviderSchedules[statesWithSchedules[i]].cappedAvailableTimes.length)

        for(let x = 0; x < stateProviderSchedules[statesWithSchedules[i]].cappedAvailableTimes.length; x++){
          let ts = stateProviderSchedules[statesWithSchedules[i]].cappedAvailableTimes[x].startTime
          console.log(`${statesWithSchedules[i]} - ${ts}`)
          await expect(statePage.appointementBtn(ts)).toBeVisible();
        }
      }
    })


  })

  test.describe.serial('User Navigate Tests', () => {
    // Tests that validate the user flow through the system
    test('Book Provider: Select an appointment each state with available appointments',  async ({ page }) => {
      // for each state with available appointments go through and book 1 appointment
      
      // go to the landing page
      const newApp = new AppointmentLanding(page);
      await newApp.goto();
      // find a state with schedule
      let stateWithApp = Object.keys(stateProviderSchedules)[0]
      console.log(stateWithApp)
      await newApp.stateBtn(stateWithApp).click();
      console.log(newApp.page.url())
      await expect(newApp.page.url()).toContain(stateWithApp)
      // click first availble block

      // validate provider info is present
      // 
    })

  })
})








