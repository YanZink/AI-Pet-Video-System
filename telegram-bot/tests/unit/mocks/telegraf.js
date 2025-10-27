module.exports = {
  Telegraf: jest.fn().mockImplementation(() => ({
    start: jest.fn(),
    launch: jest.fn(),
    stop: jest.fn(),
    telegram: {
      getFileLink: jest.fn(),
      sendMessage: jest.fn(),
      callApi: jest.fn(),
    },
    on: jest.fn(),
    action: jest.fn(),
    hears: jest.fn(),
    catch: jest.fn(),
  })),
};
