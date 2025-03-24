import { DynamoDBClient, CreateTableCommand } from "@aws-sdk/client-dynamodb";
import { loadSecrets } from "../utils/loadSecrets";

export async function createCustomerTableForTenant(tenantSubdomain: string) {
    await loadSecrets();

    const client = new DynamoDBClient({
        region: process.env.AWS_REGION,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
    });

    const tableName = `NestCRM-${tenantSubdomain}-Customer`;

    const command = new CreateTableCommand({
        TableName: tableName,
        BillingMode: "PAY_PER_REQUEST",
        AttributeDefinitions: [
            { AttributeName: "CustomerID", AttributeType: "S" }
        ],
        KeySchema: [
            { AttributeName: "CustomerID", KeyType: "HASH" }
        ]
    });

    try {
        await client.send(command);
        console.log(`✅ Table ${tableName} created`);
    } catch (err: any) {
        if (err.name === "ResourceInUseException") {
            console.log(`ℹ️ Table ${tableName} already exists`);
        } else {
            throw err;
        }
    }
}
