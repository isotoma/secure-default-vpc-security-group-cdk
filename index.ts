import * as ec2 from '@aws-cdk/aws-ec2';
import * as cfn from '@aws-cdk/aws-cloudformation';
import * as iam from '@aws-cdk/aws-iam';
import * as lambda from '@aws-cdk/aws-lambda';
import * as cdk from '@aws-cdk/core';
import * as customResource from '@aws-cdk/custom-resources';
import * as path from 'path';

export class SecureDefaultVpcSecurityGroupProvider extends cdk.Construct {
    public readonly provider: customResource.Provider;

    public static getOrCreate(scope: cdk.Construct): customResource.Provider {
        const stack = cdk.Stack.of(scope);
        const id = 'com.isotoma.cdk.custom-resources.secure-default-vpc-security-group';
        const x = (stack.node.tryFindChild(id) as SecureDefaultVpcSecurityGroupProvider) || new SecureDefaultVpcSecurityGroupProvider(stack, id);
        return x.provider;
    }

    constructor(scope: cdk.Construct, id: string) {
        super(scope, id);
        this.provider = new customResource.Provider(this, 'secure-default-vpc-security-group', {
            onEventHandler: new lambda.Function(this, 'secure-default-vpc-security-group-event', {
                code: lambda.Code.fromAsset(path.join(__dirname, 'provider')),
                runtime: lambda.Runtime.NODEJS_12_X,
                handler: 'index.onEvent',
                timeout: cdk.Duration.minutes(5),
                initialPolicy: [
                    new iam.PolicyStatement({
                        resources: ['*'],
                        actions: ['ec2:RevokeSecurityGroupEgress', 'ec2:RevokeSecurityGroupIngress'],
                    }),
                ],
            }),
        });
    }
}

export class SecureDefaultVPCSecurityGroupProps {
    readonly vpc: ec2.Vpc;
}

export class SecureDefaultVPCSecurityGroup extends cdk.Construct {
    public readonly vpc: ec2.Vpc;
    private resource: cfn.CustomResource;

    constructor(scope: cdk.Construct, id: string, props: SecureDefaultVPCSecurityGroupProps) {
        super(scope, id);
        if (!props.vpc) {
            throw new Error('No vpc specified');
        }
        this.vpc = props.vpc;
        this.resource = new cfn.CustomResource(this, 'Resource', {
            provider: SecureDefaultVpcSecurityGroupProvider.getOrCreate(this),
            resourceType: 'Custom::SecureDefaultVpcSecurityGroup',
            properties: {
                SecurityGroupId: this.vpc.vpcDefaultSecurityGroup,
            },
        });
    }
}
