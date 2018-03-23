import CommandExecutor, {CommandResult} from "./CommandExecutor";
import {until} from "selenium-webdriver";
import {Command} from "../TestRunner";

export class waitForVisible extends CommandExecutor {
  async exec(cmd: Command, result:CommandResult): Promise<CommandResult> {
    let tout = parseInt(cmd.value);
    if (isNaN(tout))
      tout = 30000;
    let element = await this.driver.wait(until.elementLocated(this.by(cmd.target)), tout);
    return result.success();
  }
}