import CommandExecutor, {CommandResult} from "./CommandExecutor";
import {until} from "selenium-webdriver";
import {Command} from "../TestRunner";

const DEFAULT_TIMEOUT = 180 * 1000;

export class waitForVisible extends CommandExecutor {
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
    await this.driver.wait(until.elementTextContains(element, cmd.value), tout);
    return result.success();
  }
}