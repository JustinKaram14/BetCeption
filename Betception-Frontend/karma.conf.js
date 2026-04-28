// Custom Karma configuration used only in CI (ChromeHeadlessCI launcher).
// Development testing still uses the Angular CLI defaults via `ng test`.
module.exports = function (config) {
  config.set({
    customLaunchers: {
      ChromeHeadlessCI: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
      },
    },
  });
};
