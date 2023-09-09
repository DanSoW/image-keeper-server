run:
	npm run dev

doc:
	npm run generate:doc
	
update-win:
	npm run update:packages:windows

kill:
	npx kill-port 5000