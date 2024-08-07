# lambda-github-event-receiver

An AWS Lambda receiver for GitHub webhook events.

# Installation

```
yarn
yarn run build
make
```

Create / find an S3 bucket. Put that bucket's name into `S3Bucket` in `infrastructure.json`.

```
aws s3 cp bundle.zip s3://your-bucket-name/bundle.zip
```

It doesn't have to be `bundle.zip` in S3. If you want to put it somewhere else, update `S3Key` in `infrastructure.json`.

```
aws cloudformation create-stack --stack-name GitHubWebhookReceiver --template-body "$( < infrastructure.json )" --capabilities CAPABILITY_IAM
```

You can give the stack a different name if you wish.

Find the ID of the secret that AWS just created:

```
aws cloudformation describe-stack-resource --stack-name GitHubWebhookReceiver --logical-resource-id Secret
```

and look for the `PhysicalResourceId`, which will start with `arn:aws:secretsmanager:`.

Generate a shared secret, using whatever method you wish.

Put the secret:

```
aws secretsmanager put-secret-value --secret-id arn:aws:secretsmanager:... --secret-string "..."
```

You'll now need to add permission for the function to be invoked via its URL. Cloudformation
[can't do that yet](https://github.com/hashicorp/terraform-provider-aws/issues/24325).
Go to your function in the console, Configuration, Permissions, Resource-based policy statements.
Add a permission from "Function URL" using auth type "NONE".

Make a note of your function's URL.

Set up your GitHub webhook to post JSON to that URL, using the shared secret that you generated.

The ping should deliver successfully. You can then find the event in your SQS queue.
