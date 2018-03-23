import {By, WebDriver, WebElement, WebElementPromise} from "selenium-webdriver";
import {Command, Config, Result} from "../TestRunner";
const mapValues:Function = require("lodash.mapvalues");

export class CommandResult<T = any> {
  resultObject?: T;
  error?: Error;
  result: Result;
  command: Command;
  elapsedTime: number;
  startTime: number;

  constructor(command: Command,result: Result = Result.SUCCESS, resultObject?: T) {
    this.command = command;
    this.result = result;
    this.resultObject = resultObject;
    this.elapsedTime = 0;
    this.startTime= Date.now();
  }

  success(resultObject?: T):this{
    this.result = Result.SUCCESS;
    this.resultObject = resultObject;
    this.elapsedTime = Date.now() - this.startTime;
    return this;
  }


  fail(e:Error,resultObject?: T):this{
    this.result = Result.FAIL;
    this.error = e;
    this.resultObject = resultObject;
    this.elapsedTime = Date.now() - this.startTime;
    return this;
  }

  private serializeObject(obj: any){
    if (!obj){
      return undefined;
    }else if (typeof obj === "string" || typeof obj === "number"){
      return obj;
    }else if (typeof obj === "object"){
      if (typeof obj.toJSON === "function"){
        return obj.toJSON();
      }else{
        return mapValues(obj, (o:any) => this.serializeObject(o))
      }
    }
    return undefined;
  }

  toJSON():object{
    return {
      result: this.result,
      command: this.command,
      error: this.error ? `[ERROR: ${this.error.name}] ${this.error.message}` : undefined,
      elapsedTime: this.elapsedTime,
      startTime: this.startTime,
      resultObject: this.serializeObject(this.resultObject)
    }
  }
}

export interface ICommandExecutor {
  exec(cmd: Command,result:CommandResult): Promise<CommandResult>;
}

export default abstract class CommandExecutor implements ICommandExecutor {
  protected driver: WebDriver;
  protected config: Config;

  constructor(driver: WebDriver, config: Config) {
    this.driver = driver;
    this.config = config;
  }

  protected by(target: string) {
    const match = target.match(/(id|name|css)=(.*)/);
    if (match) {
      return (By as any)[match[1]](match[2]);
    } else {
      return By.xpath(target);
    }
  }

  protected async setWinSize(size:string):Promise<void>{
    let sizes = size.split('x');
    return (this.driver.manage().window() as any).setRect({width:parseInt(sizes[0]), height:parseInt(sizes[1])});
  }

  protected async forEachWinSize(fn:(size:string)=>any){
    for(const size of this.config.winSizes){
      await fn(size)
    }
  }

  protected async resolveElement(target: string): Promise<WebElement> {
    return this.driver.findElement(this.by(target));
  }

  abstract async exec(cmd: Command, result:CommandResult): Promise<CommandResult>;
}
