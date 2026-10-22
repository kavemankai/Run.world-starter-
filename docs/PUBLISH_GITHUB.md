# Publish this local Git repository to GitHub

The distributed ZIP includes an initialized Git repository on the `main` branch with the starter committed. No remote is configured and nothing has been pushed.

## Fast route (GitHub CLI)

1. Install GitHub CLI (`gh`), authenticate using `gh auth login`.
2. Extract the ZIP, open a terminal in the `run-world-game-starter` folder.
3. Run:

```bash
gh repo create run-world-game-starter --private --source=. --remote=origin --push
```

This creates a **private** repository in your authenticated GitHub account and pushes the existing main branch. To use it as the source for all future games, open the repository on GitHub and enable **Settings → General → Template repository**. If you prefer an organization, specify `ORG/run-world-game-starter` in the create command.

## Route without GitHub CLI

1. Open https://github.com/new and create an **empty private repository** called `run-world-game-starter`; do not add a README or .gitignore on GitHub, since they already exist here.
2. Copy the new repository's HTTPS clone URL and run:

```bash
git remote add origin <YOUR-NEW-REPOSITORY-URL>
git push -u origin main
```

Do not use the `rundot init` configuration from a game clone to register the template repository as a production game. Each new project should get its own RUN.world game ID.
