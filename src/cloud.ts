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
      if (!exists[0]) {
        return null;
      }
      const content = await packageFile.download();
      return content.toString("utf-8", 0, 12);
    } catch (e) {
      console.error(e);
    }
  }

  public async pushToRegistry(iifeBundle, cjsBundle, packageName) {
    try {
      const iifeFile = this.bucket.file(`${packageName}/cdn/index.js`);
      const iifeBufferStream = Buffer.from(iifeBundle);

      const cjsFile = this.bucket.file(`${packageName}/cjs/index.js`);
      const cjsBufferStream = Buffer.from(cjsBundle);

      await cjsFile.save(cjsBufferStream, {
        metadata: {
          contentType: APPLICATION_TYPE,
          cacheControl: CACHE_CONTROL
        }
      });

      await iifeFile.save(iifeBufferStream, {
        metadata: {
          contentType: APPLICATION_TYPE,
          cacheControl: CACHE_CONTROL
        }
      });

      return;
    } catch (e) {
      console.error(e);
      throw Error("Something went wrong");
    }
  }
}

export default GoogleCloud;
