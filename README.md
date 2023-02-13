## Getting Started
1. Install [NodeJS](https://nodejs.org/en/download/).
2. Run `$ npm install` in the main directory to download all dependencies.


## Locally viewing the website
1. In the main directory run `$ npm start`.
2. You'll probably want to start the backend in a separate terminal session so the webpage can make API calls.
3. Navigate to `localhost:3001` in your browser to view the home page.


## Locally testing the website
1. In the main directory run `$ npm test`


## Project Structure
- Main entry point is `/public/index.html`, which renders `/src/index.js`, which displays a component based on the current route.
- `/public` contains assets for the website.
- JS files in `/src/`, along with their corresponding `.css` file make up a component.
- Components are organized into sub-folders that somewhat resemble their route/path.
- `/src/__tests__` contains [Jest](https://jestjs.io) tests.

## Random Notes:
- You can use relative paths for API calls, as the `proxy` field in `package.json` will handle forwarding the request to your locally running backend.


## If you haven't used React before
- A component is just a javascript file that renders something. Components can be nested in other components.
- Here is a link to all the docs with an explanation of what it's useful for.
  - [Thinking in React](https://reactjs.org/docs/thinking-in-react.html): The way we write React code differs a bit from traditional website dev. A page is often made up of several components nested within each other. When components share some state, we often bubble that state down the hierarchy, rather than bubbling it up.
  - [JSX](https://reactjs.org/docs/introducing-jsx.html): Embedding variables, as well as React components in HTML.
  - [Props](https://reactjs.org/docs/components-and-props.html): You can pass variables to child components. The component will automatically re-render when those props are modified by the parent.
  - [State](https://reactjs.org/docs/state-and-lifecycle.html): Using state variables, you can cause the component to re-render once a non-prop variable's value changes. You can also run code on component lifecycle events. NOTE: Props are for sharing state down the component hierarchy, while state is for the specific object -- ie. props are immutable.
  - [Event Handling](https://reactjs.org/docs/handling-events.html): Ie. for running a function on a button click.
  - [Conditional Rendering](https://reactjs.org/docs/conditional-rendering.html): If statements within your HTML.
  - [Rendering Lists](https://reactjs.org/docs/lists-and-keys.html): You can use a list to create HTML elements for each of the lists values.
  - [Forms](https://reactjs.org/docs/forms.html): You can automatically set a variable to the value of an input.
  - [Routing](https://reactrouter.com/en/main/start/tutorial): You can mostly copy/paste existing `Route` components in the `/src/Router.js` file, but for anything more complex these docs should help.


## Git cheat sheet incase you're new to git:
- Getting started:
  - Download the repo: `$ git clone https://github.com/EECS4481Project/backend.git`
  - Track the origin: `$ git remote add origin https://github.com/EECS4481Project/backend.git`
  - Create & checkout a new branch `$ git checkout -b BRANCH_NAME`
- Syncing from remote (if working on the same branch as someone else):
  - `git pull origin BRANCH_NAME` to pull any changes in the repo to your local workspace.
  - In case of a merge conflict:
    - The easiest way to handle this is probably via [VSCode](https://stackoverflow.com/a/44682439)
    - Otherwise, you'll have to manually fix all the merge conflicts
- Making changes to the remote branch:
  - `git add some_file some_other_file etc` to add the file to your commit
  - `git commit -m "your_commit_msg"` to create the commit
  - `git push origin BRANCH_NAME` to push your changes to the remote branch
- Pushing changes to prod:
  - Using the GitHub UI, make a pull request to merge your changes to the `prod` branch.
  Then other team members can review your code and merge the changes.


## Learn More -- boilerplate from create react app

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
