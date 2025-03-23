import {
    ElasticLoadBalancingV2Client,
    CreateTargetGroupCommand,
    RegisterTargetsCommand,
    CreateRuleCommand,
    CreateRuleCommandOutput,
} from "@aws-sdk/client-elastic-load-balancing-v2";
import dotenv from "dotenv";
dotenv.config();

const elb = new ElasticLoadBalancingV2Client({
    region: "us-east-2",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

const TARGET_GROUP_PROTOCOL = "HTTP";
const TARGET_GROUP_PORT = 3000;

export class CreateTargetGroupAndListenerRule {
    static async setup(subdomain: string, instanceId: string): Promise<{
        targetGroupArn: string;
        listenerRuleArn: string;
    }> {
        const targetGroupName = `tg-${subdomain}`;
        const albArn = process.env.AWS_ALB_ARN!;
        const listenerArn = process.env.AWS_LISTENER_ARN!;

        console.log(`🧱 Creating Target Group for ${subdomain}...`);

        // Step 1: Create Target Group
        const targetGroupResponse = await elb.send(
            new CreateTargetGroupCommand({
                Name: targetGroupName.slice(0, 32),
                Protocol: TARGET_GROUP_PROTOCOL,
                Port: TARGET_GROUP_PORT,
                VpcId: process.env.AWS_VPC_ID!,
                TargetType: "instance",
                HealthCheckProtocol: "HTTP",
                HealthCheckPath: "/api/status",
                HealthCheckPort: "3000",
            })
        );

        const targetGroupArn = targetGroupResponse.TargetGroups?.[0]?.TargetGroupArn;
        if (!targetGroupArn) throw new Error("❌ Failed to create Target Group");

        console.log(`✅ Target Group created: ${targetGroupArn}`);

        // Step 2: Register EC2 instance
        await elb.send(
            new RegisterTargetsCommand({
                TargetGroupArn: targetGroupArn,
                Targets: [{ Id: instanceId, Port: TARGET_GROUP_PORT }],
            })
        );
        console.log(`🔗 EC2 instance ${instanceId} registered to Target Group`);

        // Step 3: Create Listener Rule
        const listenerRuleResult: CreateRuleCommandOutput = await elb.send(
            new CreateRuleCommand({
                ListenerArn: listenerArn,
                Conditions: [
                    {
                        Field: "host-header",
                        Values: [`${subdomain}.nestcrm.com.au`],
                    },
                ],
                Actions: [
                    {
                        Type: "forward",
                        TargetGroupArn: targetGroupArn,
                    },
                ],
                Priority: Math.floor(Math.random() * 10000),
            })
        );

        const listenerRuleArn = listenerRuleResult.Rules?.[0]?.RuleArn;
        if (!listenerRuleArn) throw new Error("❌ Failed to create Listener Rule");

        console.log(`✅ Listener rule created for ${subdomain}.nestcrm.com.au → ${targetGroupArn}`);
        console.log(`🧾 Listener Rule ARN: ${listenerRuleArn}`);

        return {
            targetGroupArn,
            listenerRuleArn,
        };
    }
}
