import childProcess, { ChildProcess } from 'child_process';
import path from 'path';

import { findRailsRoot } from './find-rails-root';
import { listen, CreateListeners } from './listen';
import { RailsConsoleError } from './rails-console-error';

const executable = path.join(__dirname, '../../rails-console.rb');

const PROMPT = Buffer.from(`I|\uFAD0>`);
const RETURN = Buffer.from(`R|\uFAD0>`);
const ERROR = Buffer.from(`E|\uFAD0>`);
const USE_NEW = Buffer.from('Usage:\n  rails new APP_PATH [options]\n\n');
const NOT_A_TERMINAL = Buffer.from(`stty: stdin isn't a terminal`);

export interface RailsConsoleOptions {
  cwd?: string;
}

export interface BaseResult {
  raw: { stdout: Buffer, stderr: Buffer };
}

export interface CommandResult extends BaseResult {
  success: boolean;
  returnValue: string|null;
  error: string|null;
}

export class RailsConsole {
  private process: ChildProcess;
  private listenChain: Promise<any>;

  constructor(private config: RailsConsoleOptions = {}) {}

  async start(): Promise<BaseResult> {
    if (this.process) throw new Error('Already initialized');

    const cwd = this.config.cwd ?? process.cwd();
    const railsRoot = findRailsRoot(cwd);
    if (!railsRoot) {
      if (this.config.cwd) throw new Error(`Cannot find a Rails application in "${this.config.cwd}"`);
      throw new Error(`Cannot find a Rails application in working directory ("${cwd}"). Try specifying the \`cwd\` option to the RailsConsole constructor.`);
    }
    const env = { ...process.env, RAILS_ROOT: railsRoot };

    this.process = childProcess.spawn(executable, [], { cwd, env });
    this.process.on('exit', this.handleExit);

    const stdout = [] as Buffer[];
    const stderr = [] as Buffer[];
    await this.listen((resolve, reject) => ({
      'error': (err) => {
        reject(err);
      },
      'stdout:data': (data) => {
        if (stdout.length === 0 && data.compare(USE_NEW) === 0) {
          reject(new Error(`Rails app not found in "${process.cwd()}"`));
        } else if (data.compare(PROMPT) === 0) {
          resolve();
        } else {
          stdout.push(data);
        }
      },
      'stderr:data': (data) => {
        if (data.compare(NOT_A_TERMINAL) === 0) return;
        stderr.push(data);
      },
      'close': (code) => {
        const errorMsg = `Console process exited unexpectedly with code ${code}`;
        reject(new RailsConsoleError(errorMsg, Buffer.concat(stdout), Buffer.concat(stderr)));
      },
    }));
    return {
      raw: { stdout: Buffer.concat(stdout), stderr: Buffer.concat(stderr)  },
    };
  }

  async send(command: string): Promise<CommandResult> {
    if (this.process === undefined) throw new Error('You need to start Rails console using the `start()` method first.');
    if (this.process === null) throw new Error('Cannot send command to the terminated process.');

    const wrappedCommand = Buffer.from(`begin; ${command}; rescue Exception => e; puts "${ERROR}#{e.full_message}"; end\n`);

    const stdout = [] as Buffer[];
    const stderr = [] as Buffer[];
    let error: string;
    let returnValue: string;
    this.process.stdin.cork();
    this.process.stdin.write(wrappedCommand);
    this.process.stdin.uncork();
    await this.listen((resolve, reject) => ({
      'error': (err) => {
        reject(err);
      },
      'stdout:data': (data) => {
        if (stdout.length === 0 && data.compare(wrappedCommand) === 0) return;
        else if (data.subarray(0, ERROR.length).compare(ERROR) === 0) {
          stdout.push(data);
          error = data
            .subarray(ERROR.length, data.length - 1) // omit prefix and last newline
            .toString();
        }
        else if (data.subarray(0, RETURN.length).compare(RETURN) === 0) {
          stdout.push(data);
          returnValue = data
            .subarray(RETURN.length, data.length - 1) // omit prefix and last newline
            .toString();
          resolve();
        } else {
          stdout.push(data);
        }
      },
      'stderr:data': (data) => {
        if (data.compare(NOT_A_TERMINAL) === 0) return;
        stderr.push(data);
      },
      'close': (code) => {
        if (code !== 0) {
          const errorMsg = `Console process exited with code ${code}`;
          throw new RailsConsoleError(errorMsg, Buffer.concat(stdout), Buffer.concat(stderr));
        }
        resolve();
      },
    }));
    console.log(require('util').inspect(returnValue));
    return {
      success: error === undefined,
      returnValue: returnValue === 'nil' ? null : returnValue,
      error: error ?? null,
      raw: { stdout: Buffer.concat(stdout), stderr: Buffer.concat(stderr)  },
    };
  }

  stop() {
    this.process.kill();
  }

  private listen<T = void>(cb: CreateListeners<T>): Promise<T> {
    if (!this.listenChain) this.listenChain = listen(this.process, cb);
    else this.listenChain = this.listenChain.then(() => listen(this.process, cb));
    return this.listenChain;
  }

  private handleExit = () => {
    this.process.off('exit', this.handleExit);
    this.process = null;
  }
}
