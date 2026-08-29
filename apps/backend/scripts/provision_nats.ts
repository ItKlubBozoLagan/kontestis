import { provisionEvaluationNats } from "../src/nats/provision";

provisionEvaluationNats()
    .then(() => {
        console.log("NATS evaluation resources are ready");
    })
    .catch((error) => {
        console.error("NATS evaluation provisioning failed", error);
        process.exitCode = 1;
    });
