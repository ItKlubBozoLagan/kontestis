import { account } from "./account";
import { admin } from "./admin";
import { auth } from "./auth";
import { common, errors, nav } from "./common";
import { contests } from "./contests";
import { dashboard } from "./dashboard";
import { management } from "./management";
import { managementProblems } from "./managementProblems";
import { oauth } from "./oauth";
import { organisations } from "./organisations";
import { problems } from "./problems";
import * as shared from "./shared";
import { submissions } from "./submissions";

export const en = {
    common,
    errors,
    nav,
    auth,
    ...shared,
    dashboard,
    contests,
    problems,
    submissions,
    account,
    organisations,
    management,
    managementProblems,
    admin,
    oauth,
};
