## Getting Started
- Main entry point is `/public/index.html`, which renders `/src/App.js`, which displays a component based on the current route.

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

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3001](http://localhost:3001) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

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
