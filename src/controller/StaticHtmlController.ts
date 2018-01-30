import cp = require('child_process');
import tmp = require('tmp');
import Log from '../Util';
import fs = require('fs');
import {IConfig, AppConfig} from '../Config';
import {Database} from '../model/Database';
import TestRecord from '../model/results/TestRecord';
import {TestJob} from './TestJobController';
import TestRecordRepo from '../repos/TestRecordRepo';
import ResultRecord, {ResultPayload, Result} from '../model/results/ResultRecord';

const JSZip = require('jszip');
const STATIC_HOST_PATH = '/var/www/classportal-ui-next/app/html/staticHtml/';
const extract = require('extract-zip');


export interface ZipFile {
  name: string;
  data: string;
  content_type: string;
}

export interface ZipFileContainer {
  zipFile: ZipFile;
  newDirPath: string;
}

export default class StaticHtml {
  private zipFile: ZipFile;
  private newDirPath: string;

  /**
   * zipFileContainer includes:
   * @param zipFile: ZipFile object with base64 encoded buffer zip file in .data property
   * @param randomStaticDirPath string of your choice (make it long but a workable FS directory)
   */
  //**
  constructor(zipFileContainer: ZipFileContainer) {
    this.zipFile = zipFileContainer.zipFile;
    this.newDirPath = zipFileContainer.newDirPath;
  }

  public async extractZipToDir(): Promise<string> {
    return new Promise<string>((fulfill, reject) => {
      var zip = new JSZip();
      let that = this;
  
      // zipFile.data sent as base64 encoded
      // unencode base64 payload data to zip file
      let zipFile;
      let path: string = STATIC_HOST_PATH + that.newDirPath + '/';
      let zipFilePath: string = path + 'zipFile.zip';

      try {
        zipFile = Buffer.from(that.zipFile.data, 'base64');
        if (!fs.existsSync(path)){
          fs.mkdirSync(path);
        }
        fs.writeFileSync(zipFilePath, zipFile);
      } catch (err) {
        Log.error('StaticHtmlController:: Base64 Decoding zipFile.data ERROR ' + err);
      }

      return extract(zipFilePath, {dir: path}, function (err) {
        if (err) {
          Log.error('StaticHtmlController:: extractZipToDir() ERROR ' + err);
          reject('Error creating Static Html Hyperlink');
        } else {
          Log.info('StaticHtmlController:: extractZipToDir() SUCCESS Extracted StaticHtml to ' + path);
          fulfill('https://portal.cs.ubc.ca/static/' + that.newDirPath + '/html/');
        }
       });
    });
  }
}
