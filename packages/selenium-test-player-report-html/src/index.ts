import {ReportConfig,XTextCaseResult} from "selenium-test-player/dist"
import {compile, registerHelper, SafeString} from "handlebars";
import {readFile, writeFile, mkdir} from "fs";
import {promisify} from "util";
import {join} from "path"
import * as moment from "moment"
import Axios from "axios"
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
  const scripts = await Promise.all([
    Axios.get("https://use.fontawesome.com/releases/v5.0.8/js/solid.js"),
    Axios.get("https://use.fontawesome.com/releases/v5.0.8/js/brands.js"),
    Axios.get("https://use.fontawesome.com/releases/v5.0.8/js/fontawesome.js"),
    Axios.get("https://code.jquery.com/jquery-3.2.1.slim.min.js"),
    Axios.get("https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.12.9/umd/popper.min.js"),
    Axios.get("https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/js/bootstrap.min.js")
  ]);
  const styles = await Promise.all([
    Axios.get("https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css")
  ]);
  return writeReport(config.outDir, template({
    title:"test",
    results,
    scripts: scripts.map((res)=>res.data),
    styles: styles.map((res)=>res.data)
  }))
}

/*
defer src="" integrity="
defer src="https://use.fontawesome.com/releases/v5.0.8/js/brands.js" integrity=
defer src="https://use.fontawesome.com/releases/v5.0.8/js/fontawesome.js" integ
src="https://code.jquery.com/jquery-3.2.1.slim.min.js" integrity="sha384-KJ3o2D
src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.12.9/umd/popper.min.js"
src="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/js/bootstrap.min.js" integ
 */