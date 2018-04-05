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

export class waitForText extends CommandExecutor {
  async exec(cmd: Command, result:CommandResult): Promise<CommandResult> {
    let tout = 30000;
    let element = await this.driver.wait(until.elementLocated(this.by(cmd.target)), tout);
    let text = await element.getText();
    if(text === cmd.value){
      return result.success();
    }else{
      throw new Error(`element ${cmd.target} contains text '${text}' instead '${cmd.value}'`);
    }

  }
}