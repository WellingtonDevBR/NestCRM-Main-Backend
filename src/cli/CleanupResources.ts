import {
    EC2Client,
    TerminateInstancesCommand,
} from "@aws-sdk/client-ec2";
import {
    ElasticLoadBalancingV2Client,
    DeleteTargetGroupCommand,
    RemoveListenerCertificatesCommand,
    DeleteRuleCommand,
} from "@aws-sdk/client-elastic-load-balancing-v2";
import {
    Route53Client,
    ChangeResourceRecordSetsCommand,
} from "@aws-sdk/client-route-53";
import { docClient } from "../infrastructure/database/DynamoDBClient";
import { DeleteCommand } from "@aws-sdk/lib-dynamodb";
import dotenv from "dotenv";
dotenv.config();

const ec2 = new EC2Client({ region: process.env.AWS_REGION });
const elb = new ElasticLoadBalancingV2Client({ region: process.env.AWS_REGION });
const route53 = new Route53Client({ region: process.env.AWS_REGION });

export class CleanupResources {
    static async terminateEC2(instanceId: string) {
        try {
            console.log(`🗑️ Terminating EC2 instance ${instanceId}`);
            await ec2.send(new TerminateInstancesCommand({ InstanceIds: [instanceId] }));
        } catch (error) {
            console.error("⚠️ Failed to terminate EC2:", error);
        }
    }

    static async deleteTargetGroup(targetGroupArn: string) {
        try {
            console.log(`🗑️ Deleting Target Group ${targetGroupArn}`);
            await elb.send(new DeleteTargetGroupCommand({ TargetGroupArn: targetGroupArn }));
        } catch (error) {
            console.error("⚠️ Failed to delete target group:", error);
        }
    }

    static async deleteListenerRule(ruleArn: string) {
        try {
            console.log(`🗑️ Deleting Listener Rule ${ruleArn}`);
            await elb.send(new DeleteRuleCommand({ RuleArn: ruleArn }));
        } catch (error) {
            console.error("⚠️ Failed to delete listener rule:", error);
        }
    }

    static async deleteDNSRecord(subdomain: string) {
        const domainName = `${subdomain}.nestcrm.com.au.`;
        try {
            console.log(`🗑️ Deleting DNS Record ${domainName}`);
            await route53.send(new ChangeResourceRecordSetsCommand({
                HostedZoneId: process.env.AWS_ROUTE53_ZONE_ID!,
                ChangeBatch: {
                    Changes: [{
                        Action: "DELETE",
                        ResourceRecordSet: {
                            Name: domainName,
                            Type: "CNAME",
                            TTL: 300,
                            ResourceRecords: [{ Value: process.env.ALB_DNS! }],
                        }
                    }]
                }
            }));
        } catch (error) {
            console.error("⚠️ Failed to delete DNS record:", error);
        }
    }

    static async deleteTenantRecord(tenantId: string) {
        try {
            console.log(`🗑️ Deleting tenant record ${tenantId}`);
            await docClient.send(new DeleteCommand({
                TableName: process.env.DYNAMODB_TENANT_TABLE!,
                Key: { ID: tenantId }
            }));
        } catch (error) {
            console.error("⚠️ Failed to delete tenant from DB:", error);
        }
    }
}
