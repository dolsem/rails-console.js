import type { RailsConsole } from './rails-console';

export class ActiveRecordQuery {
  constructor(public console: RailsConsole, public modelName: string) {

  }

  async exists() {
    const result = await this.console.send(`defined?(${this.modelName}) && ${this.modelName} < ApplicationRecord`);
    if (!result.success) throw new Error();
    return result.returnValue === 'true';
  }
}
