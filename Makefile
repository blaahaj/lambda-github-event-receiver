bundle.zip: bundle.dir
	rm -f bundle.zip
	with-cwd ./bundle.dir zip -r ../bundle .

bundle.dir: dist/tsconfig.tsbuildinfo package.json yarn.lock
	rm -rf bundle.dir
	mkdir -p bundle.dir/dist
	rsync -av dist/src/ bundle.dir/dist/src/
	yarn install --prod --modules-folder bundle.dir/node_modules
