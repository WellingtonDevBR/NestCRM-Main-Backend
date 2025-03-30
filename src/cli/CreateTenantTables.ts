import { DynamoDBClient, CreateTableCommand, ScalarAttributeType } from "@aws-sdk/client-dynamodb";
import dotenv from "dotenv";
dotenv.config();

const REGION = process.env.AWS_REGION!;
const ACCESS_KEY = process.env.AWS_ACCESS_KEY_ID!;
const SECRET_KEY = process.env.AWS_SECRET_ACCESS_KEY!;

const TABLE_DEFINITIONS: {
    name: string;
    key: { name: string; type: ScalarAttributeType };
}[] = [
        { name: "Customer", key: { name: "id", type: "S" } },
        { name: "Order", key: { name: "id", type: "S" } },
        { name: "Payment", key: { name: "id", type: "S" } },
        { name: "Support", key: { name: "id", type: "S" } },
        { name: "Interaction", key: { name: "id", type: "S" } },
        { name: "CustomFields", key: { name: "PK", type: "S" } },
        { name: "Prediction", key: { name: "id", type: "S" } },
    ];

export const createTablesForTenant = async (subdomain: string) => {
    const client = new DynamoDBClient({
        region: REGION,
        credentials: {
            accessKeyId: ACCESS_KEY,
            secretAccessKey: SECRET_KEY,
        },
    });

    for (const { name, key } of TABLE_DEFINITIONS) {
        const tableName = `NestCRM-${subdomain}-${name}`;
        const command = new CreateTableCommand({
            TableName: tableName,
            BillingMode: "PAY_PER_REQUEST",
            AttributeDefinitions: [{ AttributeName: key.name, AttributeType: key.type }],
            KeySchema: [{ AttributeName: key.name, KeyType: "HASH" }],
        });

        try {
            await client.send(command);
            console.log(`✅ Created table: ${tableName}`);
        } catch (err: any) {
            if (err.name === "ResourceInUseException") {
                console.log(`ℹ️ Table already exists: ${tableName}`);
            } else {
                console.error(`❌ Failed to create table: ${tableName}`, err);
            }
        }
    }
};
