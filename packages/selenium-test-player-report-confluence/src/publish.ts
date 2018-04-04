#!/usr/bin/env node
import * as commander from "commander"
import { readdir, readFile, stat } from "fs";
import fetch from "node-fetch";
import { promisify } from "util";
const btoa = require("btoa");

const fileRead = promisify(readFile);
const stats = promisify(stat);
const readDir = promisify(readdir);

commander
  .usage("[options] <pageid> <contentfile>")
  .option(
    "-c, --credentials [credentials]", "Confluence credentials"
  )
  .option(
    "--url [url]", "base url of confluence"
  )
  .parse(process.argv);

const [ pageid, contentFile ] = commander.args;
const {credentials, url} = commander;

console.log("PAGE ID: ", pageid);
console.log("Content File: ", contentFile);
console.log("URL: ", url);
(async () => {
  const response = await fetch(`${url}/rest/api/content/${pageid}`, {
    headers: {
      "Authorization": "Basic " + btoa(credentials)
    }
  });
  if (response.ok) {
    const jsonres = await response.json();
    const newVersion = jsonres.version.number + 1;
    const content = await fileRead(contentFile, "utf8");
    const body = JSON.stringify({
        "id": pageid,
        "type": "page",
        "title": jsonres.title,
        "space": {"key": jsonres.space.key},
        "body": {
          "storage": {
            "value": content,
            "representation":"wiki"
          }
        },
        "version": {
          "number": newVersion
        }
      });
    //console.log("BODY", body);
    const putResponse = await fetch(`${url}/rest/api/content/${pageid}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Basic " + btoa(credentials)
      },
      body
    });
    if(putResponse.ok){
      console.log("OK")
    }else{
      console.error("ERROR UPDATING PAGE");
      console.error(await putResponse.text())
    }
  } else {
    console.error("ERROR READING PAGE");
    console.error(await response.text())
  }
})();

/*
{"id":"3604482","type":"page",
"title":"new page","space":{"key":"TST"},"body":{"storage":{
"value":"<p>This is the updated text for the new page</p>","representation":"storage"}},
"version":{"number":2}}
 */