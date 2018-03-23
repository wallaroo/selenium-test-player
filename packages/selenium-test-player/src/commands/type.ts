import CommandExecutor, {CommandResult} from "./CommandExecutor";
import {Command} from "../TestRunner";

export class type extends CommandExecutor {
  async exec(cmd: Command, result:CommandResult): Promise<CommandResult> {
    let element = await this.resolveElement(cmd.target);
    await element.sendKeys(cmd.value);
    return result.success();
  }
}