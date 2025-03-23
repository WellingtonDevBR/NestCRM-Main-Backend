import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { ENV } from "../../env";
import { loadSecrets } from "../../utils/loadSecrets";

await loadSecrets();

// Initialize DynamoDB Client
const dynamoDB = new DynamoDBClient({
    region: ENV.AWS_REGION,
    credentials: {
        accessKeyId: ENV.AWS_ACCESS_KEY_ID,
        secretAccessKey: ENV.AWS_SECRET_ACCESS_KEY,
    },
});

// Use DocumentClient for easier handling of JSON
export const docClient = DynamoDBDocumentClient.from(dynamoDB);
