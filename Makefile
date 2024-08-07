.PHONY: upload update-stack

default: update-stack

bundle.zip: bundle.dir
	rm -f bundle.zip
	with-cwd ./bundle.dir zip -r ../bundle .

bundle.dir: dist/tsconfig.tsbuildinfo package.json yarn.lock
	rm -rf bundle.dir
	mkdir -p bundle.dir/dist
	rsync -av dist/src/ bundle.dir/dist/src/
	yarn install --prod --modules-folder bundle.dir/node_modules

upload: bundle.zip
	aws s3 cp bundle.zip s3://$${BUCKET_NAME:?}/$${BUCKET_KEY_PREFIX:-}bundle.$$( shasum -a 256 bundle.zip | cut -d' ' -f1 ).zip

create-stack: upload
	aws cloudformation create-stack --stack-name GitHubWebhookReceiver \
		--template-body "$$( < infrastructure.json )" \
		--capabilities CAPABILITY_IAM \
		--parameters "$$( env BUNDLE_CHECKSUM=$$( shasum -a 256 bundle.zip | cut -d' ' -f1 ) jq -n -f parameters.jq )"

update-stack: upload
	aws cloudformation update-stack --stack-name GitHubWebhookReceiver \
		--template-body "$$( < infrastructure.json )" \
		--capabilities CAPABILITY_IAM \
		--parameters "$$( env BUNDLE_CHECKSUM=$$( shasum -a 256 bundle.zip | cut -d' ' -f1 ) jq -n -f parameters.jq )"
