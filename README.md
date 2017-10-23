```
    _    _   _  ____ ____  
   / \  | \ | |/ ___|  _ \
  / _ \ |  \| | |  _| |_) |
 / ___ \| |\  | |_| |  _ <
/_/   \_\_| \_|\____|_| \_\
```

**ANGular-React**?
**Unhappy**?

Gimme three thingies:

1. angular "module"
2. some sassy scss
3. some hatemail

I'll give you back a poor man's React component.

Underlying things:

  * `htmltojsx`
    - handle some of the auto-conversion of html to jsx (`ng-`-attributes retaining utility will likely be a problem)
    - we still need to wrap this with a template:

    ```
    import * as angular from 'angular'
    import * as react2angular from 'react2angular'
    import './{{hyphenCase name}}.scss'
    //import './{{hyphenCase name}}.html'
    // import other stuff here

    // these are the typescript proptypes, effectively
    export interface {{pascalCase name}}PropTypes {
      {{types}}
    }
    // these props are used by react2angular and various other downstream consumers
    export const propTypes = {{JSON propTypes}}

    // this is our react component
    export const {{pascalCase name}}(props: {{pascalCase name}}PropTypes): typeof React.Component => {
      return ({{convertedJSX}})
    }
    // needs propTypes for react2angular to work
    {{pascalCase name}}.propTypes = propTypes

    // let's export the angular nonsense
    export const DistributeAngular{{pascalCase name}} = angular.module(`distribute.components.{{hyphenCase name}}`, [])
      .component(`{{name}}`, react2angular({{pascalCase name}}))
    ```

Future:
* `css-to-json` ->
