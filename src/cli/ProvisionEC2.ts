import { EC2Client, RunInstancesCommand, waitUntilInstanceRunning, DescribeInstancesCommand } from "@aws-sdk/client-ec2";
import dotenv from "dotenv";
dotenv.config();

const ec2 = new EC2Client({
    region: "us-east-2",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

export class ProvisionEC2 {
    static async launchInstance(subdomain: string) {
        try {
            const command = new RunInstancesCommand({
                ImageId: "ami-0d0f28110d16ee7d6",
                InstanceType: "t2.micro",
                MinCount: 1,
                MaxCount: 1,
                SubnetId: "subnet-09ba46adbd977b569",
                SecurityGroupIds: ["sg-0f89eae7985996979"],
                TagSpecifications: [
                    {
                        ResourceType: "instance",
                        Tags: [
                            { Key: "Name", Value: `Tenant-${subdomain}` },
                            { Key: "OwnerSubdomain", Value: subdomain }
                        ],
                    },
                ],
                UserData: Buffer.from(`#!/bin/bash
                    yum update -y
                    yum install -y git nodejs
                    cd /home/ec2-user
                    git clone https://github.com/WellingtonDevBR/NestCRM-Dashboard-Backend.git
                    cd test-frontend
                    npm install
                    sudo npm install cors
                    sudo npm install express
                    nohup node server.js > output.log 2>&1 &
                `).toString("base64"),
            });

            // ✅ Launch EC2 Instance
            const result = await ec2.send(command);
            const instanceId = result.Instances?.[0]?.InstanceId;

            if (!instanceId) throw new Error("Failed to launch EC2 instance");

            console.log(`🕒 Waiting for instance ${instanceId} to be running...`);
            await waitUntilInstanceRunning({ client: ec2, maxWaitTime: 60 }, { InstanceIds: [instanceId] });

            // ✅ Fetch Instance Details
            console.log("🔍 Fetching EC2 Instance Details...");
            const describeCommand = new DescribeInstancesCommand({ InstanceIds: [instanceId] });
            const describeResult = await ec2.send(describeCommand);
            const publicIp = describeResult.Reservations?.[0]?.Instances?.[0]?.PublicIpAddress;

            if (!publicIp) throw new Error("Instance is running but has no public IP assigned");

            console.log(`✅ EC2 Instance Ready: ${instanceId} - ${publicIp}`);

            return { instanceId, publicIp };
        } catch (error: any) {
            console.error("❌ EC2 Provisioning Failed:", error);
            throw error;
        }
    }
}
