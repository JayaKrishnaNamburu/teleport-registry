import { Storage } from "@google-cloud/storage";
import { config } from "./config";
import { APPLICATION_TYPE, CACHE_CONTROL } from "./constants";
import { generatePackageJSON, camelCaseToDash } from "./utils";
import tar from "tar-stream";

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

  public async fetchPackageFromRegistry(packageName) {
    const file = this.bucket.file(
      `${packageName}/cjs/package/${camelCaseToDash(packageName)}.tgz`
    );
    try {
      const exists = await file.exists();
      if (!exists[0]) {
        return null;
      }
      const content = await file.download({ validation: false });
      return content;
    } catch (e) {
      console.error(e);
    }
  }

  public async pushToRegistry(iifeBundle, cjsBundle, packageName) {
    try {
      const iifeFile = this.bucket.file(`${packageName}/cdn/index.js`);
      const iifeBufferStream = Buffer.from(iifeBundle);

      const cjsFile = this.bucket.file(`${packageName}/cjs/index.js`);
      const packageJSONFile = this.bucket.file(
        `${packageName}/cjs/package.json`
      );
      const packagingName = camelCaseToDash(packageName);
      const packageFile = this.bucket.file(
        `${packageName}/cjs/package/${packagingName}.tgz`
      );

      const cjsBuffer = Buffer.from(cjsBundle);
      const packageBuffer = Buffer.from(generatePackageJSON(packagingName));

      // Creating .tgz file to support npm install
      const pack = tar.pack();
      pack.entry(
        {
          name: "package/index.js"
        },
        cjsBundle
      );
      pack.entry(
        {
          name: "package/package.json"
        },
        generatePackageJSON(packagingName)
      );
      pack.finalize();

      // Creating a remote stream and passing the current stream to bucket
      const stream = packageFile.createWriteStream({
        gzip: true,
        resumable: false,
        metadata: {
          contentType: "application/gzip",
          contentEncoding: "gzip"
        }
      });
      pack
        .pipe(stream)
        .on("error", err => console.log(err))
        .on("finish", () => console.log("Package uplaoded to registry"));

      await cjsFile.save(cjsBuffer, {
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

      await packageJSONFile.save(packageBuffer, {
        metadata: {
          contentType: "application/json",
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
