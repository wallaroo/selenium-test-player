import CommandExecutor, { CommandResult } from "./CommandExecutor";
import { Command } from "../TestRunner";
import { WebDriver } from 'selenium-webdriver';

export class type extends CommandExecutor {
  async exec(cmd: Command, result: CommandResult): Promise<CommandResult> {
    let element = await this.resolveElement(cmd.target);
    let value = this.substituteVariables(cmd.value);
    for(const char of value){
      await element.sendKeys(char);
      await this.driver.sleep(200);
    }
    return result.success();
  }
}

export class keyPress extends CommandExecutor {
  async exec(cmd: Command, result: CommandResult): Promise<CommandResult> {
    let element = await this.resolveElement(cmd.target);
    let value = this.substituteVariables(cmd.value);
    for(const char of value){
      await element.sendKeys(char);
      await this.driver.sleep(200);
    }

    return result.success();
  }
}