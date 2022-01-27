export class ApplicationError extends Error {
  constructor(error: Error) {
    super(error.message);
    Object.assign(this, error);
  }

  toJSON() {
    {
      const alt = {};
      Object.getOwnPropertyNames(this).forEach(function (key) {
        alt[key] = this[key];
      }, this);
      return alt;
    }
  }
}
