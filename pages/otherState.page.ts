import { expect, type Locator, type Page } from '@playwright/test';

export class OtherState {
  readonly page: Page;
  readonly pageUri: string
  readonly firstName: Locator;
  readonly lastName: Locator;
  readonly phoneNumber: Locator;
  readonly email: Locator;
  readonly okBtn: Locator;
  readonly thankYou: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageUri = 'https://ft4aaz62fi7.typeform.com/to/KK72Q2GE?typeform-source=onboard-dev.henrymeds.com#treatment=weightloss'
    this.firstName = page.locator('input[name="given-name"]');
    this.lastName = page.locator('input[name="family-name"]');
    this.phoneNumber = page.locator('input[name="tel"]');
    this.email = page.locator('input[name="email"]');
    this.okBtn = page.getByRole('button', { name: 'OK' });
    this.thankYou = page.getByText('Thank you!')
  }

  async goto() {
    await this.page.goto(this.pageUri);
  }

  async fillForm(fnametxt: string, lnametxt: string, phonetxt: string, emailtxt: string, statetxt: string) {
    await this.firstName.waitFor();
    await this.lastName.waitFor();
    await this.firstName.fill(fnametxt);
    await this.lastName.fill(lnametxt);
    await this.phoneNumber.fill(phonetxt);
    await this.email.fill(emailtxt)
    await this.okBtn.click();
    await this.page.getByPlaceholder('Type or select an option').click();
    await this.page.getByPlaceholder('Type or select an option').fill(statetxt);
    await this.page.locator('div').filter({ hasText: statetxt }).first().click();
    await this.page.getByRole('button', { name: 'Submit' }).click();
  }
}