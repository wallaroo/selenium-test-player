#!/usr/bin/env node
import * as commander from "commander"
import { readdir, readFile, stat } from "fs";
import { basename, extname, join } from "path";
import { promisify } from "util";
import { parseString } from "xml2js"
import { JSDOM } from "jsdom"
import TestRubber, { Command, default as TestRunner, Result, TestCase, XTextCaseResult } from "./TestRunner"

const flatten = require("lodash.flatten");
const fileRead = promisify(readFile);
const stats = promisify(stat);
const parseXml = promisify(parseString) as Function;
const readDir = promisify(readdir);

commander
  .usage("[options] <testfile...>")
  .option(
    "-c, --config [configFile]", "Selenuim Configuration file [./seleniumConfig.json]",
    "./seleniumConfig.json"
  ).option(
  "-v, --verbose", "run test in verbose mode", false
).parse(process.argv);

async function parseTest(path: string): Promise<TestCase | TestCase[]> {
  const ext = extname(path);
  let res: TestCase | TestCase[];
  switch (ext) {
    case ".xml": {
      const test = await parseXml(await fileRead(path, {"encoding": "utf8"}));
      res = {
        name: path,
        commands: test.TestCase.selenese.map((cmd: any) => ({
          type: cmd.command[ 0 ],
          target: cmd.target[ 0 ],
          value: cmd.value[ 0 ]
        }))
      };
      break;
    }
    case ".html": {
      const dom = new JSDOM(await fileRead(path, {"encoding": "utf8"}));
      const tables = dom.window.document.querySelectorAll("table");
      const suiteName = dom.window.document.title;
      res = [];
      for (const table of tables) {
        const td = table.querySelector<HTMLTableCellElement>("thead tr td");
        if (!td) {
          throw new Error("TestCase Parse Error");
        }
        const name = `${suiteName}: ${td.textContent || ""}`;
        const commandsElements = table.querySelectorAll("tbody tr");
        const commands = [];
        for (const commandEl of commandsElements) {
          const tds = commandEl.querySelectorAll("td");
          const command = {
            type: tds[ 0 ].textContent || "",
            target: tds[ 1 ].childElementCount ? tds[ 1 ].childNodes[ 0 ].textContent || "" : "",
            value: tds[ 2 ].textContent || ""
          };
          commands.push(command);
        }
        res.push({name, commands});
      }
      break;
    }
    default:
      res = [];
      console.log(`${path} is not a test: will be ignored`);
      break;
  }
  return res;
}

async function parseTestCases(args: string[]): Promise<TestCase[]> {
  const promises: Promise<TestCase | TestCase[]>[] = [];
  for (const testPath of args) {
    try {
      const st = await stats(testPath);
      if (st.isDirectory()) {
        const files = await readDir(testPath);
        promises.push(parseTestCases(files.map((path)=>join(testPath, path))));
      } else {
        promises.push(parseTest(testPath));
      }
    } catch (e) {
      console.error(`ERROR ${e.message}`);
    }
  }
  return Promise.all(promises).then((testCases) => flatten(testCases));
}

(async () => {
  try {
    const config = JSON.parse(await fileRead(commander.config, {"encoding": "utf8"}));
    const results: XTextCaseResult[] = [];
    let isFailed = false;
    const testCases: TestCase[] = await parseTestCases(commander.args);
    for (const testCase of testCases) {
      try {
        console.log("start testcase",testCase.name);
        const runner = new TestRunner(testCase, config);
        const res = await runner.run();
        results.push(res);
        if (!isFailed && res.result === Result.FAIL){
          isFailed = true;
        }
      } catch (e) {
        console.error(`ERROR ${e.message}`);
      }
    }
    for (const reportConfig of config.report){
      console.log(`preparing report by ${reportConfig.preset}`);
      const prepareReport = (await import(`selenium-test-player-report-${reportConfig.preset}`)).default;
      await prepareReport(reportConfig, results);
      console.log(`report prepared by ${reportConfig.preset}`);
    }
    if (isFailed){
      process.exit(1);
    }
  } catch (e) {
    console.error(`ERROR ${e.message}`);
    console.error(`STACK\n${e.stack}`);
    process.exit(1);
  }
})();
