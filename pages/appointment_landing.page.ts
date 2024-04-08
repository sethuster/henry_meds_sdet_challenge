import { expect, type Locator, type Page } from '@playwright/test';

export class AppointmentLanding {
  readonly page: Page;
  readonly pageUri: string;
  readonly header: Locator;
  readonly statePrompt: Locator;
  readonly licensedProvider: Locator;
  readonly stateButtons: Locator;
  readonly contact: Locator;


  constructor(page: Page) {
    this.page = page;
    this.pageUri = 'https://onboard-dev.henrymeds.com/app/appointment/weightloss-phen?override_kameleoon'
    this.header = page.locator('h2', { hasText: 'Schedule your Appointment!' })
    this.statePrompt = page.locator('p', { hasText: 'What state do you live in?' })
    this.licensedProvider = page.locator('p', { hasText: 'This helps us connect you with a licensed provider in your state.'})
    this.contact = page.locator('h3', {hasText: 'Questions?'});
    
  }

  async goto() {
    await this.page.goto(this.pageUri);
  }

  stateBtn(state: string) {
    // this is expecting a state to be provided from the API
    return this.page.locator(`button[data-testid="${state}"]`);
  }
  
}