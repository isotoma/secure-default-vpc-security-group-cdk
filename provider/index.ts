import {
    CloudFormationCustomResourceCreateEvent,
    CloudFormationCustomResourceDeleteEvent,
    CloudFormationCustomResourceEvent,
    CloudFormationCustomResourceResponse,
    CloudFormationCustomResourceUpdateEvent,
} from 'aws-lambda';
import * as AWS from 'aws-sdk';

export const onCreate = async (event: CloudFormationCustomResourceCreateEvent): Promise<CloudFormationCustomResourceResponse> => {
    const securityGroupId = event.ResourceProperties.SecurityGroupId;
    const ec2 = new AWS.EC2();
    try {
        await ec2
            .revokeSecurityGroupIngress({
                GroupId: securityGroupId,
                IpPermissions: [
                    {
                        IpProtocol: '-1',
                        UserIdGroupPairs: [
                            {
                                GroupId: securityGroupId,
                            },
                        ],
                    },
                ],
            })
            .promise();
    } catch (err) {
        console.error(err);
    }
    try {
        await ec2
            .revokeSecurityGroupEgress({
                GroupId: securityGroupId,
                IpPermissions: [
                    {
                        IpProtocol: '-1',
                        IpRanges: [
                            {
                                CidrIp: '0.0.0.0/0',
                            },
                        ],
                    },
                ],
            })
            .promise();
    } catch (err) {
        console.error(err);
    }
    return {
        Status: 'SUCCESS',
        PhysicalResourceId: securityGroupId,
        StackId: event.StackId,
        RequestId: event.RequestId,
        LogicalResourceId: event.LogicalResourceId,
    };
};

// no-op
export const onUpdate = async (event: CloudFormationCustomResourceUpdateEvent): Promise<CloudFormationCustomResourceResponse> => {
    return {
        Status: 'SUCCESS',
        RequestId: event.RequestId,
        StackId: event.StackId,
        LogicalResourceId: event.LogicalResourceId,
        PhysicalResourceId: event.PhysicalResourceId,
    };
};

// no-op
export const onDelete = async (event: CloudFormationCustomResourceDeleteEvent): Promise<CloudFormationCustomResourceResponse> => {
    return {
        Status: 'SUCCESS',
        RequestId: event.RequestId,
        StackId: event.StackId,
        LogicalResourceId: event.LogicalResourceId,
        PhysicalResourceId: event.PhysicalResourceId,
    };
};

export const onEvent = (event: CloudFormationCustomResourceEvent): Promise<CloudFormationCustomResourceResponse> => {
    console.log(JSON.stringify(event));
    try {
        switch (event.RequestType) {
            case 'Create':
                return onCreate(event as CloudFormationCustomResourceCreateEvent);
            case 'Update':
                return onUpdate(event as CloudFormationCustomResourceUpdateEvent);
            case 'Delete':
                return onDelete(event as CloudFormationCustomResourceDeleteEvent);
            default:
                return Promise.reject(`Unknown event type in event ${event}`);
        }
    } catch (err) {
        console.error(err);
        return Promise.reject('Failed');
    }
};
