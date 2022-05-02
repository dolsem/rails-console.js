export class RailsConsoleError extends Error {
  constructor(msg: string, public stdout: Buffer, public stderr: Buffer) {
    super(msg);
  }
}
