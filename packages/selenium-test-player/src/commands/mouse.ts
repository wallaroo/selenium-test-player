import CommandExecutor, { CommandResult } from "./CommandExecutor";
import { Command } from "../TestRunner";

export class mouseOver extends CommandExecutor {
  async exec(cmd: Command, result: CommandResult): Promise<CommandResult> {
    let element = await this.resolveElement(cmd.target);
    const action = (this.driver as any).actions({bridge: true});
    await action.move({origin: element}).perform();
    return result.success();
  }
}

export const mouseOverAndWait = mouseOver;