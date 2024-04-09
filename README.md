# henry_meds_sdet_challenge
Henry Meds SDET Challenge

## Instructions
https://henrymeds.notion.site/SDET-8ea67c6153e24c649678d034544f1fb6

## Tasks

Given our onboarding flow at https://onboard-dev.henrymeds.com?override_kameleoon
1. Provide an automated test suite that includes the pages for reserving an appointment time and the contact details form. There is no need to continue through the payment screen.
2. The appointment times displayed are retrieved via an API query.  Provide an API level test for that query.

## Scenario

Henry has two kinds of users, **providers** and **clients**. Providers have a schedule where they are available to see clients. Clients want to book time, in advance, on that schedule.

**Providers** have a schedule of availability (e.g. on Friday the 13th of August, Dr. Stephen Strange may have availability between 8am and 3pm). This availability is divided into 15 minutes ‘slots’ available for reservation.

**Clients** want to reserve a 15 minute time slot from a provider’s schedule.  Reservations expire after 30 minutes if not confirmed. Reservations must be made at least 24 hours in advance.

## Evaluation
This will be evaluated similar to a real-world submission, including:

- Will the tests provide ongoing business value?
- What considerations went into the choice of language/framework/methodology for the test suite?
- What trade-offs were made, how wise are they?
- How cleanly structured is the code and tests?
- What ‘extra’ factors are there, that show exceptional talent?

## Install Requirements

1) Make sure you have node v20.12.0 installed on your machine.  
2) Clone this repo locally
3) npm install

Thant should just about do it.  Alternatively you can use the Docker image to run the tests in the repo. 

### Useful Playwright commands

npx playwright test
Runs the end-to-end tests.

npx playwright test --ui
Starts the interactive UI mode.

npx playwright test --project=chromium
Runs the tests only on Desktop Chrome.

npx playwright test example
Runs the tests in a specific file.

npx playwright test --debug
Runs the tests in debug mode.

npx playwright codegen
Auto generate tests with Codegen.

## Docker Install

1) Make sure you have docker installed on your machine
2) `docker build -t henrymedstests .`
3) `docker run henrymedstests`

## My Process
On new system or new application I like to take at least an hour and poke around in the application and get familiar with it.  What are the basic APIs and user flows of the application.
In a real work scenario, I would try and understand the scope of the application under test and the testability of the application. I want to answer the following questions:
    1. What systems does this application use?
    2. What is the deployment process like?
    3. How are feature flags used (if at all) how are they enabled?
    4. What is the deployment process like?
    5. How is the data provided to this application?
    6. How can I setup / teardown test data?

Once those questions are answered suffciently, I start to begin building some test scenarios.

### Test Brainstorming - Initial Review
1. Verify I have access to the application under test - Confirmed
2. Carefully read through the requirements
    - Providers and clients
    - Providers have availability divided into 15 minute 'slots' available for reservation
    - Clients want to reserver 15 minutes time slot from providers schedule
    - reservations expire after 30 minutes if not confirmed
        -- assuming confirmed by provider...
3. Test brainstorm
    - The UI provided seems to be client facing only - i.e. predetermined provider times already exist
    - Times available: California, Illinois, Texas, all the other states have no times
    - Other state button has unique flow - test that
    1. Validate page elements on main page
    2. Validate page makes request to API (https://henry-dev.hasura.app/v1/graphql)
    3. Footer links
    4. Cookie preferences (if time)
    5. Schedule appointment for States with provider schedules
        - verify appointment slot opens again after 30 minutes (assuming nobody is confirming appointments) 
    6. Other state flow - Same form for states without appointment

## API Flow
1. stateprovidertreatment.json
2. Staterequestavailabletimes
3. providerrequest
4. appointmentrequest
5. Checkout API

## Unforseen Challenges / Lesson Learned
1) I did not account for the multiple interactive APIs on the web application.  During my initial pass through the application, i noticed a graphQL api that was being used.  I then filtered the network console for that API and didn't account for the appointment API
2) I have been writing tests in Python for the majority of the last 3-4 years.  Although I know the playwright API, I did not account for the added context swithcing of moving from Python to Node.  That slowed me down a bit.  I should have written the tests out of the gate in Python instead.
3) Managing people for the last few years, and doing code reviews I realize that I am out of practice building automated tests.  writing tests again has been a lot of fun actually, but eye opening in the logisitics of starting something from scatch. This took a bit longer than expected. 


### Timebox
| Time | duration | Notes |
| ----- | ---- | -----| 
| 08:30  | 1 hour | recieved code challenge - read instructions, explored app |
| 09:30  | 2 hours | started new project - installed playwright and node | 
| 11:30 | 3 hours | broke for lunch and other meetings |
| 14:30 | 2 hours | Wrote tests and experimented with UI / API |
| 16:30 | 5.5 hours | Toddler / dadlife |
| 21:00 | 1 hour | Review repo - build notes and submit |

Total Elapsed Time working on project: ~5 Hours

