FROM mcr.microsoft.com/playwright:v1.43.0-jammy

RUN mkdir playwright_tests
WORKDIR playwright_tests

COPY ./ /playwright_tests


CMD ["npx", "playwright", "test"]