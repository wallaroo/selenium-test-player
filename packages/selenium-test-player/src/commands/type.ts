import CommandExecutor, { CommandResult } from "./CommandExecutor";
import { Command } from "../TestRunner";
import { WebDriver } from 'selenium-webdriver';

export class type extends CommandExecutor {
  async exec(cmd: Command, result: CommandResult): Promise<CommandResult> {
    let element = await this.resolveElement(cmd.target);
    await element.sendKeys(this.substituteVariables(cmd.value));
    return result.success();
  }
}

export class keyPress extends CommandExecutor {
  async exec(cmd: Command, result: CommandResult): Promise<CommandResult> {
    let element = await this.resolveElement(cmd.target);
    await element.sendKeys(this.substituteVariables(cmd.value));
    return result.success();
  }
}