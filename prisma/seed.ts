import "dotenv/config";
import { runDemoSeed } from "../src/lib/seed-demo";

runDemoSeed({ disconnect: true })
  .then((out) => {
    // eslint-disable-next-line no-console
    console.log("Seed OK:", out);
    process.exit(0);
  })
  .catch(async (e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  });
