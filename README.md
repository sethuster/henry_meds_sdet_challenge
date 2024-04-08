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

## My Process

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
    5. Schedule appointment for California, Illinois, Texas
        - verify appointment slot opens again after 30 minutes (assuming nobody is confirming appointments) 
    6. Other state flow - Same form for states without appointment

## API Flow
1. stateprovidertreatment.json
2. Staterequestavailabletimes
3. providerrequest
4. There appears to be a different API in teh checkout flow
