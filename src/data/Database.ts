import { ScylloClient } from "scyllo";

import { Globals } from "../globals";
import { User } from "../types/User";

export const DataBase = new ScylloClient<{ users: User; }>({
    client: {
        contactPoints: [Globals.dbHost + ":" + Globals.dbPort],
        keyspace: Globals.dbKeySpace,
        localDataCenter: Globals.dbDatacenter, 
    },
});

export const initDatabase = async () => {
};

