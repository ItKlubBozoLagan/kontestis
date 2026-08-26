/* eslint-env jest */
/* eslint-disable sonarjs/no-duplicate-string */

import { Server } from "node:http";

import request from "supertest";

import { createApp } from "../app";
import { Database } from "../database/Database";
import { runPostgresMigrations } from "../database/postgres/runMigrations";

type Method = "get" | "post" | "patch" | "delete";
type RouteCase = [Method, string];

const routes: RouteCase[] = [
    ["post", "/api/auth/google-login"],
    ["get", "/api/auth/info"],
    ["get", "/api/auth/info/1"],
    ["get", "/api/auth/"],
    ["patch", "/api/auth/1"],
    ["get", "/api/auth/aai-edu/url"],
    ["post", "/api/auth/aai-edu/token"],
    ["post", "/api/auth/managed/login"],
    ["post", "/api/auth/managed/register"],
    ["get", "/api/auth/managed/confirm/1/code"],
    ["post", "/api/auth/temporary/login"],
    ["post", "/api/auth/temporary/bulk-create"],
    ["get", "/api/organisation/"],
    ["get", "/api/organisation/members/self"],
    ["get", "/api/organisation/1"],
    ["post", "/api/organisation/"],
    ["patch", "/api/organisation/1"],
    ["get", "/api/organisation/1/member/"],
    ["get", "/api/organisation/1/member/1"],
    ["post", "/api/organisation/1/member/"],
    ["patch", "/api/organisation/1/member/1"],
    ["delete", "/api/organisation/1/member/1"],
    ["post", "/api/contest/1/copy"],
    ["post", "/api/contest/"],
    ["post", "/api/contest/join"],
    ["patch", "/api/contest/1/join"],
    ["patch", "/api/contest/1"],
    ["get", "/api/contest/"],
    ["get", "/api/contest/1/export/1"],
    ["get", "/api/contest/members/self"],
    ["get", "/api/contest/1/leaderboard"],
    ["get", "/api/contest/1"],
    ["post", "/api/contest/1/members/register"],
    ["get", "/api/contest/1/members/"],
    ["get", "/api/contest/1/members/1"],
    ["patch", "/api/contest/1/members/1"],
    ["delete", "/api/contest/1/members/1"],
    ["get", "/api/contest/1/grade/"],
    ["post", "/api/contest/1/grade/"],
    ["patch", "/api/contest/1/grade/1"],
    ["delete", "/api/contest/1/grade/1"],
    ["post", "/api/contest/1/announcement/"],
    ["get", "/api/contest/1/announcement/"],
    ["post", "/api/contest/1/question/"],
    ["get", "/api/contest/1/question/"],
    ["get", "/api/contest/1/question/1/messages"],
    ["post", "/api/contest/1/question/1/messages"],
    ["post", "/api/problem/1"],
    ["delete", "/api/problem/1"],
    ["patch", "/api/problem/1"],
    ["get", "/api/problem/?contest_id=1"],
    ["get", "/api/problem/scores"],
    ["get", "/api/problem/score/1"],
    ["get", "/api/problem/1"],
    ["get", "/api/problem/1/cluster/"],
    ["post", "/api/problem/1/cluster/"],
    ["get", "/api/problem/1/cluster/1"],
    ["post", "/api/problem/1/cluster/1/cache/drop"],
    ["post", "/api/problem/1/cluster/1/cache/regenerate"],
    ["patch", "/api/problem/1/cluster/1"],
    ["delete", "/api/problem/1/cluster/1"],
    ["post", "/api/problem/1/cluster/1/testcase/with-generator"],
    ["post", "/api/problem/1/cluster/1/testcase/"],
    ["get", "/api/problem/1/cluster/1/testcase/"],
    ["get", "/api/problem/1/cluster/1/testcase/1"],
    ["patch", "/api/problem/1/cluster/1/testcase/1"],
    ["get", "/api/problem/1/cluster/1/testcase/1/input"],
    ["get", "/api/problem/1/cluster/1/testcase/1/output"],
    ["post", "/api/problem/1/cluster/1/testcase/1/input"],
    ["delete", "/api/problem/1/cluster/1/testcase/1"],
    ["get", "/api/problem/1/cluster/1/testcase/1/file/input"],
    ["get", "/api/problem/1/generator/"],
    ["post", "/api/problem/1/generator/"],
    ["get", "/api/problem/1/generator/1"],
    ["patch", "/api/problem/1/generator/1"],
    ["delete", "/api/problem/1/generator/1"],
    ["post", "/api/submission/1"],
    ["post", "/api/submission/reevaluate/1"],
    ["get", "/api/submission/?user_id=1"],
    ["get", "/api/submission/by-problem-all/1"],
    ["post", "/api/submission/final/1"],
    ["patch", "/api/submission/final/1"],
    ["get", "/api/submission/final/1"],
    ["get", "/api/submission/final/?user_id=1&contest_id=1"],
    ["get", "/api/submission/by-problem/1"],
    ["get", "/api/submission/1"],
    ["get", "/api/submission/cluster/1"],
    ["get", "/api/submission/testcase/1"],
    ["get", "/api/submission/files/1/1"],
    ["get", "/api/submission/files/1/1/1/input"],
    ["get", "/api/stats/elo?range=30d"],
    ["get", "/api/stats/submissions?accepted=false"],
    ["get", "/api/stats/admin/logins?range=30d"],
    ["get", "/api/stats/admin/activity?range=30d"],
    ["get", "/api/stats/admin/metrics/"],
    ["get", "/api/notifications/"],
    ["post", "/api/notifications/sendMail"],
    ["get", "/api/notifications/mail/modify/not-a-code/all/"],
    ["post", "/api/notifications/read"],
    ["post", "/api/notifications/alert"],
];

describe("HTTP route contract matrix", () => {
    const app = createApp({ rateLimit: false });
    let server: Server;

    beforeAll(async () => {
        await Database.awaitConnection();
        await runPostgresMigrations(Database);

        server = app.listen();
    });
    afterAll(async () => {
        await new Promise<void>((resolve, reject) => {
            server.close((error) => (error ? reject(error) : resolve()));
        });
        await Database.shutdown();
    });

    it("covers every registered backend route", () => {
        expect(routes).toHaveLength(100);
    });

    it.each(routes)("%s %s is reachable without an internal error", async (method, path) => {
        const response = await (request(server)[method](path) as request.Test).send({});

        expect(response.status).toBeLessThan(500);
        expect(response.headers["content-type"] ?? "").toMatch(/json|text|octet-stream/);
    });
});
