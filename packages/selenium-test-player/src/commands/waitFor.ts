import CommandExecutor, {CommandResult} from "./CommandExecutor";
import {until} from "selenium-webdriver";
import {Command} from "../TestRunner";

const DEFAULT_TIMEOUT = 180 * 1000;

export class waitForVisible extends CommandExecutor {
  async exec(cmd: Command, result:CommandResult): Promise<CommandResult> {
    let tout = parseInt(cmd.value);
    if (isNaN(tout))
      tout = DEFAULT_TIMEOUT;
    await this.driver.wait(until.elementIsVisible(this.by(cmd.target)), tout);
    return result.success();
  }
}

export class waitForElementPresent extends CommandExecutor {
  async exec(cmd: Command, result:CommandResult): Promise<CommandResult> {
    let tout = parseInt(cmd.value);
    if (isNaN(tout))
      tout = DEFAULT_TIMEOUT;
    await this.driver.wait(until.elementLocated(this.by(cmd.target)), tout);
    return result.success();
  }
}

export class waitForText extends CommandExecutor {
  async exec(cmd: Command, result:CommandResult): Promise<CommandResult> {
    let tout = DEFAULT_TIMEOUT;
    let element = await this.driver.wait(until.elementLocated(this.by(cmd.target)), tout);
    await this.driver.wait(until.elementTextIs(element, cmd.value), tout);
    return result.success();
  }
}

export class pause extends CommandExecutor {
  async exec(cmd: Command, result:CommandResult): Promise<CommandResult> {
    await this.driver.sleep(parseInt(cmd.value) || DEFAULT_TIMEOUT);
    return result.success();
  }
}