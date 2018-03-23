import CommandExecutor, {CommandResult} from "./CommandExecutor";
import {Command} from "../TestRunner";

export class captureEntirePageScreenshot extends CommandExecutor {
  async exec(cmd:Command, result:CommandResult): Promise<CommandResult> {
    const image = await this.driver.takeScreenshot();
    return result.success(image);
  }
}