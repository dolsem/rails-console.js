rails-console.js
===========================

Rails interface in Node.js via Rails console

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![License: MIT][license-image]][license-url]

# ⚙ Install

```bash
# npm
npm i rails-console

# yarn
yarn add rails-console
```

# 🔍 Usage

```js
const { RailsConsole } = require('rails-console');

async run() {
  const rc = new RailsConsole();
  // Or:
  const rcWithOptions = new RailsConsole({
    cwd: path.resolve(__dirname, 'rails-app'), // Optionally specify directory where to start rails console
  });

  // Wait for the rails console process to start
  await rc.start();

  // Get application name
  const result = await rc.send('Rails.application.engine_name.gsub(/_application$/,"")');
  if (result.success) {
    console.log(`Name of the Rails app: ${result.returnValue}`);
  } else {
    console.log(`Command returned an error: ${result.error}`);
  }
  if (result.raw.stderr) {
    console.log(`Command output warnings: ${result.raw.stderr}`);
  }

  // Update an ActiveRecord item
  await rc.send('User.find(1).update(name: "First User")');

  // Stop the process
  rc.stop();
}
```

# ️❤️ Contributing

Every contribution is really welcome!

If you feel that something can be improved or should be fixed, feel free to open an issue with the feature or the bug found.

If you want to fork and open a pull request (adding features or fixes), feel free to do it.

Read the [contributing guidelines](./CONTRIBUTING.md)

# 📃 Licence

Read the [licence](./LICENCE)

[npm-image]: https://img.shields.io/npm/v/rails-console.svg
[npm-url]: https://npmjs.org/package/rails-console
[downloads-image]: https://img.shields.io/npm/dm/rails-console.svg
[downloads-url]: https://npmjs.org/package/rails-console
[license-image]: https://img.shields.io/badge/License-MIT-blue.svg
[license-url]: https://opensource.org/licenses/MIT
