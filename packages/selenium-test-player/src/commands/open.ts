import CommandExecutor, {CommandResult} from "./CommandExecutor";
import {URL} from "url";
import {Command} from "../TestRunner";
export class open extends CommandExecutor {

  protected resolveHosts(target:string):string{
    let url = new URL(target);

    if (this.config.hosts[url.hostname]){
      url.hostname = this.config.hosts[url.hostname];
      console.log(`url resolved in ${url.toString()}`);
      return url.toString();
    }else{
      return target;
    }
  }

  async exec(cmd:Command, result:CommandResult): Promise<CommandResult> {
    await this.driver.get(this.resolveHosts(cmd.target));
    return result.success();
  }
}