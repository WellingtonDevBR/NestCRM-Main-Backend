import { docClient } from "../database/DynamoDBClient";
import {
    PutCommand,
    QueryCommand,
    UpdateCommand
} from "@aws-sdk/lib-dynamodb";
import { Subscription } from "../../domain/entities/Subscription";
import { SubscriptionRepository } from "../../domain/repositories/SubscriptionRepository";

const TABLE_NAME = "NestCRM-Subscription";

export class SubscriptionRepositoryImpl implements SubscriptionRepository {
    async create(subscription: Subscription): Promise<Subscription> {
        await docClient.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: subscription
        }));
        return subscription;
    }

    async findByTenantID(tenantID: string): Promise<Subscription[]> {
        const result = await docClient.send(new QueryCommand({
            TableName: TABLE_NAME,
            IndexName: "TenantID-index",
            KeyConditionExpression: "TenantID = :tenantId",
            ExpressionAttributeValues: {
                ":tenantId": tenantID
            }
        }));

        return result.Items as Subscription[] || [];
    }

    async findByStripeSubscriptionID(stripeId: string): Promise<Subscription | null> {
        const result = await docClient.send(new QueryCommand({
            TableName: TABLE_NAME,
            IndexName: "StripeSubscriptionID-index",
            KeyConditionExpression: "StripeSubscriptionID = :sid",
            ExpressionAttributeValues: {
                ":sid": stripeId
            }
        }));

        return result.Items?.[0] as Subscription || null;
    }

    async updateStatus(stripeId: string, status: string): Promise<void> {
        await docClient.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { StripeSubscriptionID: stripeId }, // Assuming StripeSubscriptionID is part of PK or GSI
            UpdateExpression: "SET #Status = :status, UpdatedAt = :now",
            ExpressionAttributeNames: {
                "#Status": "Status"
            },
            ExpressionAttributeValues: {
                ":status": status,
                ":now": new Date().toISOString()
            }
        }));
    }
}
