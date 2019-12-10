import { Storage } from "@google-cloud/storage";
import { config } from "./config";
import { APPLICATION_TYPE, CACHE_CONTROL } from "./constants";

class GoogleCloud {
  private bucket: any;

  constructor() {
    const storage = new Storage();
    this.bucket = storage.bucket(config.bucketName);
  }

  public async fetchFromRegistry(packageName, packageType) {
    const packageFile = this.bucket.file(
      `${packageName}/${packageType}/index.js`
    );
    try {
      const exists = await packageFile.exists();
      console.log(exists);
      if (!exists[0]) {
        return;
      }
      const content = await packageFile.download();
      return content.toString("utf-8", 0, 12);
    } catch (e) {
      console.error(e);
    }
  }

  public async pushToRegistry(componentESM, componentCJS, packageName) {
    try {
      const esmFile = this.bucket.file(`${packageName}/esm/index.js`);
      const cjsFile = this.bucket.file(`${packageName}/cjs/index.js`);

      const esmBufferStream = Buffer.from(componentESM);
      const cjsBufferStream = Buffer.from(componentCJS);

      await esmFile.save(esmBufferStream, {
        metadata: {
          contentType: APPLICATION_TYPE,
          cacheControl: CACHE_CONTROL
        }
      });

      await cjsFile.save(cjsBufferStream, {
        metadata: {
          contentType: APPLICATION_TYPE,
          cacheControl: CACHE_CONTROL
        }
      });

      await esmFile.makePublic();
      await cjsFile.makePublic();
      return;
    } catch (e) {
      console.error(e);
      throw Error("Something went wrong");
    }
  }
}

export default GoogleCloud;
