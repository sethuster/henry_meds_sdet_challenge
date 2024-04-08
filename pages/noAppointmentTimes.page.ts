import { expect, type Locator, type Page } from '@playwright/test';

export class StateAppointmentTimes {
  readonly page: Page;
  readonly state: string;
  readonly pageUri: string
  readonly header: Locator;
  readonly sorryText: Locator;
  readonly assistenceLink: Locator;
  

  constructor(page: Page, state: string) {
    this.page = page;
    this.state = state;
    this.pageUri = `https://onboard-dev.henrymeds.com/app/appointment/weightloss-phen?state=${state}`;
    this.header = page.getByRole('heading', { name: 'Next Available Time' })
    this.sorryText = page.getByText('Sorry! We currently have no')
    this.assistenceLink = page.getByRole('link', {name: 'here' })
  }

  async goto() {
    await this.page.goto(this.pageUri);
  }

  appointementBtn(timestamp: string) {
    // this is expecting a state to be provided from the API
    console.log(`button[data-testid="${timestamp}"]`)
    return this.page.locator(`button[data-testid="${timestamp}"]`);
  }
}