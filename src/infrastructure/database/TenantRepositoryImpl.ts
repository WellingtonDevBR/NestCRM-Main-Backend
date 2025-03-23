import { docClient } from "../database/DynamoDBClient";
import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { Tenant } from "../../domain/entities/Tenant";
import type { TenantRepository } from "../../domain/repositories/TenantRepository";
const TABLE_NAME = "NestCRM-Tenant";

export class TenantRepositoryImpl implements TenantRepository {
    async create(tenant: Tenant): Promise<Tenant> {
        await docClient.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: tenant,
        }));
        return tenant;
    }

    async findByEmail(email: string): Promise<Tenant | null> {
        if (!email) {
            console.error("❌ ERROR: Email is undefined");
            throw new Error("Email cannot be undefined");
        }

        console.log(`🔎 Searching for Tenant with email: ${email}`);

        const result = await docClient.send(new QueryCommand({
            TableName: TABLE_NAME,
            IndexName: "Email-index", // ✅ Correct index name from AWS CLI response
            KeyConditionExpression: "Email = :Email", // ✅ Use lowercase "email" as per the GSI
            ExpressionAttributeValues: { ":Email": email } // ✅ Must match GSI case exactly
        }));

        console.log("📄 Query Result:", JSON.stringify(result, null, 2));

        if (!result.Items || result.Items.length === 0) {
            console.log("❌ No tenant found with this email.");
            return null;
        }

        console.log(`✅ Tenant Found: ${JSON.stringify(result.Items[0])}`);
        return result.Items[0] as Tenant;
    }



    async findBySubdomain(subdomain: string): Promise<Tenant | null> {
        if (!subdomain) throw new Error("❌ Subdomain must be provided!");

        const result = await docClient.send(new QueryCommand({
            TableName: TABLE_NAME,
            IndexName: "Subdomain-index",
            KeyConditionExpression: "#Subdomain = :subdomain",
            ExpressionAttributeNames: { "#Subdomain": "Subdomain" },
            ExpressionAttributeValues: { ":subdomain": subdomain }
        }));

        return result.Items?.[0] as Tenant || null;
    }


}
