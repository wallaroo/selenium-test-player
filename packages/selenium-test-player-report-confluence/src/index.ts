import { ReportConfig, XTextCaseResult, TestCaseResult, Result } from "selenium-test-player/dist"
import { compile, registerHelper, SafeString } from "handlebars";
import { readFile, writeFile, mkdir } from "fs";
import { promisify } from "util";
import { join } from "path"
import * as moment from "moment"

const fileRead = promisify(readFile);
const fileWrite = promisify(writeFile);
const dirmk = promisify(mkdir);

registerHelper('duration', function (timestamp: number, options: any) {
  return new SafeString(`${moment.duration(timestamp).asSeconds()} seconds`);
});

registerHelper('wiki', function (text: string, options: any) {
  text = text.replace("{", "&#123;");
  text = text.replace("}", "&#125;");
  return new SafeString(text);
});

async function getTemplate(templatename: string): Promise<Function> {
  return compile(await fileRead(join(__dirname, "..", "templates", `${templatename}.hbs`), {encoding: "utf8"}));
}

async function writeSnapshot(basePath: string, name: string, data: string) {
  try {
    await dirmk(join(process.cwd(),basePath, "__img__"));
  } catch (e) {
  }
  return fileWrite(join(process.cwd(), basePath, "__img__", name), data, 'base64');
}

async function writeReport(path: string, content: string) {
  try {
    await dirmk(path);
  } catch (e) {
  }
  return fileWrite(join(process.cwd(), path, "report.cwk"), content);
}

export default async function prepareReport(config: ReportConfig, results: XTextCaseResult[]) {
  const template = await getTemplate("report");
  let snapshotCount = 0;
  let mainresult: Result = Result.SUCCESS;
  for (const result of results) {
    if (result.result === Result.FAIL){
      mainresult = Result.FAIL
    }
    for (const driver of Object.keys(result.byDriver)) {
      const byDriver = (result.byDriver as any)[ driver ] as TestCaseResult;
      for (const cmdResult of byDriver.commandResults) {
        if (cmdResult.resultObject) {
          const name = `snapshot${snapshotCount++}.png`;
          await writeSnapshot(config.outDir, name, cmdResult.resultObject);
          cmdResult.resultObject = name;
        }
      }
    }
  }
  return writeReport(config.outDir, template({title: "test", results, resultOK:(mainresult === Result.SUCCESS)}))
}