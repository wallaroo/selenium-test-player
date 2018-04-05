import CommandExecutor, {CommandResult} from "./CommandExecutor";
import {Command} from "../TestRunner";

export class click extends CommandExecutor {
  async exec(cmd:Command, result:CommandResult): Promise<CommandResult> {
    let element = await this.resolveElement(cmd.target);
    await element.click();
    return result.success();
  }
}

export const clickAndWait = click;