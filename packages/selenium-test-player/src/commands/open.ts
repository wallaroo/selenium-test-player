import CommandExecutor, {CommandResult} from "./CommandExecutor";
import {URL} from "url";
import {Command} from "../TestRunner";
export class open extends CommandExecutor {

  protected resolveHosts(target:string):string{
    let url = new URL(target);

    for(const host of this.config.hostMappings){
      if (host.browsers.includes(this.browser) && host.hosts[url.hostname]){
        url.hostname = host.hosts[url.hostname];
        console.log(`url resolved in ${url.toString()}`);
        target = url.toString();
      }
    }

    return target;

  }

  async exec(cmd:Command, result:CommandResult): Promise<CommandResult> {
    await this.driver.get(this.resolveHosts(cmd.target));
    return result.success();
  }
}