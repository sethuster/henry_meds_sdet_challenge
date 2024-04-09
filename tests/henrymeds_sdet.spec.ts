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

// setup API contexts to use in each API test
test.beforeAll(async ({ playwright }) => {
  apiContextGraphQL = await playwright.request.newContext({
    baseURL: apiUrlGQL
  })
  apiContextCheckout = await playwright.request.newContext({
    baseURL: apiUrlCeckout 
  })
});

test.describe.serial('API Tests', () => {
    /* 
      Since the API provides data for the UI, these tests are designed to validate the API works
      as designed to supply the UI with the needed data.  This application has a GraphQL api and Rest API.
      in conjucntion with events on the page and embedded JS, each component of the app should be validated
      in isolation with the API level first.  

      All Business logic shoudl be abstracted to the data / network layer as much as possible. Application layer,
      shoudl contains bare minimum validataion logic.
    */

  let statesAvailable; // used to retrieve states to display on the main page
  let stateProviderSchedules = {}; //used to hold available times for each state
  let stateWithoutSchedules : string[] = []; // used to hold states that have no available times

  let now = new Date();
  let minimumDate = date.addHours(now, 48)
  let maximumDate = date.addDays(minimumDate, 11)

  test('API: StatesByProviderTreatment', async ({ page, request }) => {
    /* Test: Validate the states that are available in the application are available
    expected: Expect that the following states are available: alabama, california, colorado, florida,
    georgia, illinois, maryland massachusetts, new hampshire, texas, utah, virginia. washington

    Note: In a real world test these expected states would be pre-determined. 
      This test is used for setup subsequent tests
    */
    const req = await apiContextGraphQL.post('v1/graphql', { data: statesByProviderJSON });
    expect(req.ok()).toBeTruthy();
    const resp = await req.json();
    await expect('data' in resp).toBeTruthy()

    statesAvailable = resp.data.statesByProviderTreatment.map(s => s.state)
    console.log(`statesAvailable: ${statesAvailable}`)
  });

  test('Verify that each available state allows for getting available times', async ({ request }) => {
    /* Test: Verify that the provider's avialable times to book.
    providers in each state register their available times in increments of 15 minutes.

    Note: In a production environment this test would be checked against database records.
      The minimumDate and maximumDate are interpreted from current state of the application under test.
    Variables:
      minimumDate: according to requirements is 24 hours in advance.  It appears the application is asking
      for 48 hours in advance.  This might be a bug in the application
      maximumDate: This appears to be 11 days past the minimumDate.  There were no rules specically implied
      for this variable. 
    */
    //for each available state get the available times from GraphQL API
    for(let i = 0; i < statesAvailable.length; i++){
      let stateReq = stateRequestAvailableTimesJSON // load the default payload
      stateReq.variables['state'] = statesAvailable[i] // set the state from the states available
      stateReq.variables['minimumDate'] = minimumDate.toISOString(); //set the minimum date into the default payload
      stateReq.variables['maximumDate'] = maximumDate.toISOString(); // same for maximum date
      const req = await apiContextGraphQL.post('v1/graphql', { data: stateRequestAvailableTimesJSON })
      await expect(req.ok()).toBeTruthy();
      const resp = await req.json()
      // In real world test - would validate complete schema - could incorporate schema-validator or similar
      await expect('data' in resp).toBeTruthy();
      

      //Setup the data for future tests to use
      console.log(`Adding info for ${statesAvailable[i]} ${resp.data.cappedAvailableTimes.length}`)
      // Sort the available booking times into buckets - states with times slots and states without 
      // used in later tests.
      if (resp.data.cappedAvailableTimes.length > 0){
        stateProviderSchedules[statesAvailable[i]] = resp.data;
      } else {
        stateWithoutSchedules.push(statesAvailable[i])
      }

    }
  });

  test('Verify Checkout queries for each available time', async ({ request }) => {
    /* Test: Verify the provider queries for each available time.  This test verifies the provider information
    is available for each availble booking time.
    Note: The provider information is made available with this API.  The provider information returned is used
    to populate the UI, and setup the appointment in the API with the specific provider.
    */
    let stateWTimes = Object.keys(stateProviderSchedules); // Get all the states with provider slots available
    console.log(`statesWithAvailability: ${stateWTimes}`); // logging for readability
    for(let i = 0; i < stateWTimes.length; i++){
      // provider req
      console.log(`State with provider aviailability: ${stateWTimes[i]}`) // Logging stdout for easier troubleshooting
      let providerReq = providerRequestJSON; // load the default payload
      // this could be used to test every single one but for time only validating the first time slot for each state
      providerReq.variables['providerId'] = stateProviderSchedules[stateWTimes[i]].cappedAvailableTimes[0].provider.id
      const req = await apiContextGraphQL.post('v1/graphql', { data: providerReq})
      await expect(req.ok()).toBeTruthy();
      const resp = await req.json();
      // In real world test - would validate complete schema - could incorporate schema-validator or similar
      await expect('data' in resp).toBeTruthy();
    }
  });

  test.skip('Verfy appointment api response for provider', async ({ request }) => {
    /* Test: to validate the appointment API is working as intended
    Note: this test would ensure the appropriate response with the appointmentID is correct, validating all 
    the appropriate fields are correct.
    */
  });

  test.skip('Verify payment information API', async ({ request }) => {
    /* Test: validate the payment information would process correctly
    Note: This test would use a test credit card on file (provided by the payment processing vendor or finanance department)
    */
  });

  test.skip('Verify the provider and customer booking saved', async ({ request }) => {
    /* Test: verify the customerId and the provider appointment saved appropirately */
  });

 /*
 There are several more tests that I could think of to do at this point depending on access to the AUT. 
 - Verify confirmation emails to provider and customers
 - Verify payment information saved in payment processor
 - Verify timeslot is no longer available for provider
 - Verify customer is not able to book a different provider for the same service/pharmacetical 

 An entire slew of negative tests can be written for the GraphQLAPI section as well.
 - Verify the provider emails are legit
 - verify the customer email is legit
 - verify the credit card number is legit
 - Verify the customer can't make an erroneous request to the appointment API ie:
    -- Book a time slot that doesn't exist
    -- Book a time slot that is already booked
 
 Some these tests would require access to different or specific information from the database or other APIs.
 */

  test.describe.serial('UI Tests', () => {
    /* 
      These tests navigate to specific UIs under certain conditions to validate their page loads the appropriate
      elements and responds correctly based on the application under test underlying data.

      The data presented in these test should be pre determined working correctly based on the API tests. 
      These tests validate specific UI details based on specific conditions understood in the application state.
    */

    // tests that validate the specific user interfaces availble
    test('UI is available with a GET request', async ({ page, request }) => {
      /* Test: make sure the application is responding succesfully over http request
      Note: just make sure the UI is responding
      */
      const req = await request.get(new AppointmentLanding(page).pageUri)
      await expect(req.ok()).toBeTruthy()
    })
    
    test('Appointment Landing: page loads', async ({ page }) => {
      /* Test: Verify the UI elements are present on the AppointmentLanding Page when the page loads
      Note: this test also makes sure the UI makes requests to the appropriate API on page load.  
      */
      // Setup the check to make sure the request happens after the page is loaded.
      const graphqlReq = page.waitForRequest(request => 
        request.url() === `${apiUrlGQL}v1/graphql` && request.method() === 'POST',
      );

      const newApp = new AppointmentLanding(page);
      await newApp.goto();
      const request = await graphqlReq; // wait for the event from the UI to make the request
      //verify the basic contents of the page
      await expect(newApp.header).toBeVisible();
      await expect(newApp.statePrompt).toBeVisible();
      await expect(newApp.licensedProvider).toBeVisible();
      await expect(newApp.contact).toBeVisible();
    })
    
    test('Appointment Landing: Buttons Present for each state available', async ({ page }) => {
      /* Test: Verify the buttons displayed on the landing page correspond to the states available from the API
      Note: The states available here are provided from the API, this test makes sure that only states that 
      are setup in the system and availble in the UI are presented on the page.
      */ 

      // page is already pointed at the Appointment Landing page
      const newApp = new AppointmentLanding(page);
      await newApp.goto();
      for (let i = 0; i < statesAvailable.length; i++) {
        await expect(newApp.stateBtn(statesAvailable[i])).toBeVisible()
      }
    });

    test('Appointment Landing: Other State button is available', async ({ page }) => {
      /* Test: Verify the other state button is present on the page
      Note: the other state button should always be present on the appoinment landing page
      */
      const newApp = new AppointmentLanding(page);
      await newApp.goto();
      await expect(newApp.stateBtn('otherstate')).toBeVisible()
    });

    test('No Appointment: States with no available times show assistance page', async ({ page }) => {
      /* Test: States with no avaialble provider times must display the appropriate page
      Notes: Each state that does not have specific provider times available, load those states provider
      schedules and validate they displaye the correct information
      */
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
      /* Test: The states with no provider schedules available will use this form to fill out information
      Note: this form is loaded when a state is not provided explicity in the uri for the page
      */
      // Other is not listed in this expected states list
      const otherState = new OtherState(page);
      await otherState.goto();

      //TODO: change this to validate all states not available
      await otherState.fillForm('test_fname', 'test_lname', '3039991212', 'test@email.com', 'Montana');
      await expect(otherState.thankYou).toBeVisible()
    });

    test('State Appointment: Page Layout', async ({ page }) => {
      /* Test: Validate that there is a button for each appointment slot available for the selected state
      Note: this test relies on previous tests to gather the expected appointment slot times.
      */
      const statesWithSchedules = Object.keys(stateProviderSchedules);
      console.log(`States with appointments: ${statesWithSchedules}`); // stdout logging for easier debugging

      // for each state with provider times available
      for(let i = 0; i < statesWithSchedules.length; i++) {
        // load the state page
        let statePage = new StateAppointmentTimes(page, statesWithSchedules[i]);
        await statePage.goto();

        // make sure there is a button for each provider time
        for(let x = 0; x < stateProviderSchedules[statesWithSchedules[i]].cappedAvailableTimes.length; x++){
          let ts = stateProviderSchedules[statesWithSchedules[i]].cappedAvailableTimes[x].startTime
          await expect(statePage.appointementBtn(ts)).toBeVisible();
        }
      }
    });

    test.skip('State Appointment: Provider Page laytout', async ({ page }) => {
      // Validate the provider page laytout is expected with an appointment slot selected
    });

    test.skip('State Appointment: payment processing information', async ({ page }) => {
      // validate the payment processing page displays properly and payment information is save appropriately
    })

  })

  test.describe.serial('User Navigate Tests', () => {
    /*
      These tests woudl be considered End-to-End tests.  These test would excercise entire customer user stories or
      process flows through the system.  They would largely be responsible for validating general process and business
      logic without a lot knowledge of application state.  

      The tests here could be used to comprise a sub-set of UAT tests or Smoke tests in specific environments. 
    */


    test.skip('Book Provider: Select an appointment each state with available appointments',  async ({ page }) => {
      // test to validate that at least 1 appointment for each state can go through the entire flow upto payment
    });

    test('Validate state with no provider schedule load without state drop down', async ({ page }) => {
      /* Test: validate that states without provider schedules can have their form filled out circumventing the state selection
      drop down.
      Note: Basic flow: 
        1) states without provider schedule (any state not in expected states)
        2) navigate directly to that state page: `https://onboard-dev.henrymeds.com/app/appointment/weightloss-phen?state=${state}`
        3) validate form can be filled out and saved without state selector drop down
      */
    });

    test('Validate appointment slot taken not displayed', async ({ page }) => {
      /* Test: make sure that an appointment slot already selected is heled for a certain amount of time before being made available
      Expected: when customer select an appointment window - other customer's can not select the same window
      */
    })
  })
})








