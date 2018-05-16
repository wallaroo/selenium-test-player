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

export class hoverAndClick extends CommandExecutor {
  async exec(cmd: Command, result: CommandResult): Promise<CommandResult> {
    let element = await this.resolveElement(cmd.target);
    let element2 = await this.resolveElement(cmd.value);
    if (this.browser === "ie") {
      await this.driver.executeScript(function(){
        var event = document.createEvent("MouseEvent");
        event.initEvent("mouseup", true, true);
        arguments[0].dispatchEvent(event);
      }, element2)
    }else{
      const action = (this.driver as any).actions({bridge: true});
      await action.move({origin: element})
        .click(element2)
        .perform();
    }
    return result.success();
  }
}

export const mouseOverAndWait = mouseOver;