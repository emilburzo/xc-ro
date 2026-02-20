import {drizzle} from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL || "postgres://postgres@localhost:5432/xcontest";

// TODO look into connection pooling
const client = postgres(connectionString, {
    max: 5, // Max number of connections
    idle_timeout: 20, // Max idle time in seconds before closing a connection
    connect_timeout: 2, // Max time in seconds to wait for a connection
});

export const db = drizzle(client, {schema});