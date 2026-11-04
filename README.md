# $LLM site
Static site, no build step. After launch: paste the contract address into `config.js` (`contractAddress`), set your X link, push. Vercel redeploys.
Deploy: push this folder to GitHub (drag the whole folder so `assets/` stays a folder), import in Vercel, no build command. If the repo holds the whole LLM folder, set Root Directory to `web`.
