# lambda-github-event-receiver

An AWS Lambda receiver for GitHub webhook events.

# Prerequisites

- node v20.x
- yarn
- make
- an AWS account
- aws (e.g. `brew install aws-cli`), and to have authentication set up
- an S3 bucket

# Installation

```sh
yarn
yarn run build
make
```

Create / find an S3 bucket, and set it in BUCKET_NAME:

```sh
export BUCKET_NAME="my bucket"

# Optionally:
# export BUCKET_KEY_PREFIX=some/prefix/
```

Create the stack:

```sh
make create-stack
```

You can give the stack a different name if you wish; see `--stack-name`, in the Makefile.

Find the ID of the secret that AWS just created:

```
aws cloudformation describe-stack-resource --stack-name GitHubWebhookReceiver --logical-resource-id Secret
```

and look for the `PhysicalResourceId`, which will start with `arn:aws:secretsmanager:`.

Generate a shared secret, using whatever method you wish.

Put the secret into AWS Secrets Manager:

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
