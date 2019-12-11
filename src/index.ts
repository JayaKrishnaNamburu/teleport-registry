import express from "express";
import bodyParser from "body-parser";
import GoogleCloud from "./cloud";
import { customGenerator, minify, lowerDashCase } from "./utils";
import { RESPONSE_TYPE } from "./constants";

const port = process.env.PORT || 8080;
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true, limit: "2mb" }));
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

const cloud = new GoogleCloud();

app.get("/", (req, res) => res.send("REGISTRY API server"));

app.get("/package/:package_name", async (req, res) => {
  const { package_name } = req.params;
  if (package_name) {
    const result = await cloud.fetchFromRegistry(package_name, "cjs");
    res
      .header("Content-Type", RESPONSE_TYPE)
      .status(200)
      .send(result);
  } else {
    res.status(400);
  }
});

app.post("/publish", async (req, res) => {
  const { uidl: inputUIDL } = req.body;
  try {
    const uidl = JSON.parse(inputUIDL);
    // const uidl = inputUIDL;
    const packageName = lowerDashCase(uidl.name);
    const component = await customGenerator(uidl);
    const transpiledCJS = await minify(component, packageName);

    await cloud.pushToRegistry(transpiledCJS, packageName);
    res.status(200).json({ message: "Component saved to registry" });
  } catch (e) {
    console.log(e);
    res.status(400).json({ message: "Failed in generating component" });
  }
});

if (process.env.NODE_ENV !== "production") {
  app.listen(port, () => {
    console.log(`Server running on ${port}`);
  });
}

export { app };
