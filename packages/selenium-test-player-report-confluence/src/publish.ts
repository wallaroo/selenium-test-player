#!/usr/bin/env node
import * as commander from "commander"
import { readdir, readFile, stat, createReadStream } from "fs";
import { join } from "path";
import fetch from "node-fetch";
import { promisify } from "util";
import * as FormData from "form-data";
const btoa = require("btoa");

const fileRead = promisify(readFile);
const stats = promisify(stat);
const readDir = promisify(readdir);
commander
  .usage("[options] <pageid> <contentdir>")
  .option(
    "-c, --credentials [credentials]", "Confluence credentials"
  )
  .option(
    "--url [url]", "base url of confluence"
  )
  .parse(process.argv);

const [ pageid, contentdir ] = commander.args;
const {credentials, url} = commander;

console.log("PAGE ID: ", pageid);
console.log("Content Dir: ", contentdir);
console.log("URL: ", url);
(async () => {
  const response = await fetch(`${url}/rest/api/content/${pageid}`, {
    headers: {
      "Authorization": "Basic " + btoa(credentials)
    }
  });
  // upload images
  for(const file of await readDir(join(contentdir,"__img__"))){
    const existsRes = await fetch(`${url}/rest/api/content/${pageid}/child/attachment?filename=${file}`,{
      headers: {
        "Authorization": "Basic " + btoa(credentials)
      }
    });
    const fileStats = await stats(join(contentdir, "__img__", file));
    const fileContent = createReadStream(join(contentdir, "__img__", file));
    const formData = new FormData();
    formData.append("file", fileContent,{
      filename:file,
      contentType:"image/png",
      knownLength: fileStats.size
    });
    formData.append("minorEdit","true");
    formData.append("hidden","true");
    let uploadres;
    const existingFile = await existsRes.json();
    if (existingFile.size){
      const fileId = existingFile.results[0].id;
      uploadres = await fetch(`${url}/rest/api/content/${pageid}/child/attachment/${fileId}/data`, {
        method: "POST",
        body: formData,
        headers: {
          "Authorization": "Basic " + btoa(credentials),
          "X-Atlassian-Token": "nocheck",
          ...formData.getHeaders()
        }
      });
    }else {
      uploadres = await fetch(`${url}/rest/api/content/${pageid}/child/attachment?allowDuplicated=true`, {
        method: "POST",
        body: formData,
        headers: {
          "Authorization": "Basic " + btoa(credentials),
          "X-Atlassian-Token": "nocheck",
          ...formData.getHeaders()
        }
      });
    }
    if (uploadres.ok){
      console.log(file, "UPLOADED");
    }else{
      console.error(`${file} UPLOAD FAILED`);
      console.error(await uploadres.text())
    }
  }//end upload images

  if (response.ok) {
    const jsonres = await response.json();
    const newVersion = jsonres.version.number + 1;
    const content = await fileRead(join(contentdir,"report.cwk"), "utf8");
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
          "number": newVersion,
          "minorEdit":true,
          "hidden":true
        }
      });
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
