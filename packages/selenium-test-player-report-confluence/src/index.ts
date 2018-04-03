import {ReportConfig,XTextCaseResult} from "selenium-test-player/dist"
import {compile, registerHelper, SafeString} from "handlebars";
import {readFile, writeFile, mkdir} from "fs";
import {promisify} from "util";
import {join} from "path"
import * as moment from "moment"
const fileRead = promisify(readFile);
const fileWrite = promisify(writeFile);
const dirmk = promisify(mkdir);

registerHelper('duration', function(timestamp:number, options:any) {
  return new SafeString(`${moment.duration(timestamp).asSeconds()} seconds`);
});

async function getTemplate(templatename:string):Promise<Function>{
  return compile(await fileRead(join(__dirname,"..","templates",`${templatename}.hbs`), {encoding:"utf8"}));
}

async function writeReport(path:string, content: string){
  try {
    await dirmk(path);
  } catch (e){ }
  return fileWrite(join(process.cwd(), path, "report.html"), content);
}

export default async function prepareReport(config:ReportConfig, results:XTextCaseResult[]) {
  const template = await getTemplate("report");
  return writeReport(config.outDir, template({title:"test", results}))
}