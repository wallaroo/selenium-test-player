import { WebDriver } from "selenium-webdriver";
import * as commandExecutors from "./commands";
import CommandExecutor, { CommandResult } from "./commands/CommandExecutor";
import { captureEntirePageScreenshot } from './commands';
import { Options } from 'selenium-webdriver/ie';

const {Builder, Capabilities} = require("selenium-webdriver")

export enum Result {
  SUCCESS = "SUCCESS",
  FAIL = "FAIL"
}

export type Command = {
  type: string,
  target: string,
  value: string
}

export type TestCase = {
  name: string,
  commands: Command[]
}
export type XTextCaseResult = {
  result: Result,
  testCase: TestCase,
  error?: Error,
  byDriver: {[key in Browser]?: TestCaseResult}
};

export class TestCaseResult {
  browser: Browser;
  testCase: TestCase;
  result: Result;
  commandResults: CommandResult[];
  error?: Error;
  elapsedTime: number;

  constructor(testCase: TestCase, commandResults: CommandResult[], browser: Browser, result: Result = Result.SUCCESS) {
    this.testCase = testCase;
    this.commandResults = commandResults;
    this.result = result;
    this.browser = browser;
    this.elapsedTime = 0;
    for (const res of commandResults) {
      if (res.result === Result.FAIL) {
        this.result = Result.FAIL;
        this.error = res.error;
      }
      this.elapsedTime += res.elapsedTime;
    }
  }

  toJSON() {
    return {
      result: this.result,
      testCase: this.testCase,
      error: this.error ? `[ERROR: ${this.error.name}] ${this.error.message}` : undefined,
      commandResults: this.commandResults.map((cmdRes) => cmdRes.toJSON()),
    }
  }
}


export type Browser = "chrome" | "ie" | "firefox";

export type Config = {
  hubUrl: string,
  browsers: Browser[],
  winSizes: string[],
  hostMappings: Array<{ hosts:{[ hostName: string ]: string}, browsers: Browser[] }>,
  report: ReportConfig[]
}
export type ReportConfig = {
  "preset": string,
  "outDir": string
}

export default class TestRunner {
  protected testCase: TestCase;
  protected config: Config;
  protected drivers: {[key in Browser]?: WebDriver};
  protected results: XTextCaseResult;

  constructor(testCase: TestCase, config: Config) {
    this.testCase = testCase;
    this.config = config;
    this.drivers = {};
    this.results = {
      result: Result.SUCCESS,
      byDriver: {},
      testCase
    };
    this.close = this.close.bind(this)
  }

  protected async connect() {
    process.on('SIGINT', this.close);
    for (let browser of this.config.browsers) {
      try {
        let cap = Capabilities[ browser ]();
        let builder = new Builder()
          .usingServer(this.config.hubUrl)
          .withCapabilities(cap);
        if(browser === "ie"){
          let opt = new Options();
          opt.requireWindowFocus(true);
          opt.enablePersistentHover(false);
          builder = builder.setIeOptions(opt);
        }
        let driver = this.drivers[ browser ] = await builder.build();
        let defSize = this.config.winSizes[ 0 ].split('x');
        console.log(`Set default win size ${defSize[ 0 ]} ${defSize[ 1 ]}`);
        await driver.manage().window().setRect({width: parseInt(defSize[ 0 ]), height: parseInt(defSize[ 1 ])});
        const session = await driver.getSession();
        console.log(`${browser} Session Started (${session.getId()})`);
      } catch (e) {
        console.error(`ERROR: ${e.message}`)
      }
    }
  }

  protected async close() {
    for (let browser of this.config.browsers) {
      let driver = this.drivers[ browser ];
      if (driver) {
        try {
          const session = await driver.getSession();
          await driver.quit();
          process.removeListener('SIGINT', this.close);
          console.log(`${browser} Session Closed (${session.getId()})`);
        }catch (e) {
          console.error(`ERROR closing ${browser} session: ${e.message}`)
        }
      }
    }
  }

  public async runOnDriver(driver: WebDriver, browser: Browser): Promise<TestCaseResult> {
    const cmdResults: CommandResult[] = [];
    for (const cmd of this.testCase.commands) {
      console.log(`[${browser}] executing cmd ${cmd.type} ${cmd.target} ${cmd.value}`);
      let result = new CommandResult(cmd);
      if ((commandExecutors as any)[ cmd.type ]) {
        const cmdEx = new ((commandExecutors as any)[ cmd.type ])({driver, config:this.config, browser});
        try {
          result = await cmdEx.exec(cmd, result);
          cmdResults.push(result);
          console.log(`[${browser}] ${cmd.type}(${cmd.target}, ${cmd.value}) -> ${result.result}`);
        } catch (e) {
          console.log(`[${browser}] ${cmd.type}(${cmd.target}, ${cmd.value}) -> FAIL`);
          cmdResults.push(result.fail(e));
          console.error(e.message);
          console.error(e.stack);
        }
      } else {
        throw new Error(`no executor for command type '${cmd.type}'`);
      }
      if (result.result !== Result.SUCCESS){
        try {
          console.log("taking snapshot of error");
          let cmdSnap = new captureEntirePageScreenshot({driver, config: this.config, browser});
          let result = new CommandResult({type: "captureEntirePageScreenshot", target: "", value: ""});
          result = await cmdSnap.exec(cmd, result);
          cmdResults.push(result);
        } catch (e) {
          console.error(e.message);
          console.error(e.stack);
        }
        break;
      }
    }
    return new TestCaseResult(this.testCase, cmdResults, browser);
  }

  public async run(): Promise<XTextCaseResult> {
    const result: XTextCaseResult = {
      result: Result.SUCCESS,
      byDriver: {},
      testCase: this.testCase
    };
    try {
      await this.connect();
      console.log(`START TESTCASE ${this.testCase.name}`);
      const promises = [];
      for (let browser of this.config.browsers) {
        const driver = this.drivers[ browser ];
        if (driver) {
          promises.push(this.runOnDriver(driver, browser).then((res) => {
            result.byDriver[ browser ] = res;
            result.error = result.error || res.error;
            result.result = result.result === Result.FAIL ? Result.FAIL : res.result;
          }));
        }
        else {
          const res = new TestCaseResult(this.testCase, [], browser, Result.FAIL);
          res.error = new Error(`WebDriver for ${browser} not found!`);
          result.byDriver[ browser ] = res;
        }
      }
      await Promise.all(promises);
      console.log(`END TEST CASE ${this.testCase.name} -> SUCCESS`);
    } catch (e) {
      result.result = Result.FAIL;
      result.error = e;
      console.log(`END TEST CASE ${this.testCase.name} -> FAIL`);
      console.error(`ERROR: ${e.message}`);
    } finally {
      await this.close();
      console.log("CLOSED");
    }
    return result;
  }
}