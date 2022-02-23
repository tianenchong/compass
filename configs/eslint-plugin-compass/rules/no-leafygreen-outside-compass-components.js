const path = require('path');
/**
 *
 * @param {import('eslint').Rule.RuleContext} context
 * @param {*} node
 * @param {*} source
 */
function reportLeafygreenUsage(context, node, source) {
  context.report({
    node: node,
    message:
      'Using @leafygreen-ui directly outside @mongodb-js/compass-component package is not allowed',
    suggest: [
      {
        desc: 'Replace "{{ source }}" with "@mongodb-js/compass-components"',
        data: { source: source.value },
        fix(fixer) {
          return fixer.replaceText(source, '"@mongodb-js/compass-components"');
        }
      }
    ]
  });
}

const packageNameMap = new Map();

function getPackageNameFromCwd(cwd) {
  if (packageNameMap.has(cwd)) {
    return packageNameMap.get(cwd);
  }
  const packageJson = require(path.join(cwd, 'package.json'));
  packageNameMap.set(cwd, packageJson.name);
  return packageJson.name;
}

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallows using @leafygreen-ui imports outside of compass-components package'
    },
    fixable: 'code',
    hasSuggestions: true,
    schema: [] // no options
  },
  create(context) {
    const packageName = getPackageNameFromCwd(context.getCwd());

    const isCompassComponentsPackage =
      packageName === '@mongodb-js/compass-components';

    if (isCompassComponentsPackage) {
      return {};
    }

    return {
      ImportDeclaration(node) {
        if (node.source.value.startsWith('@leafygreen-ui')) {
          reportLeafygreenUsage(context, node, node.source);
        }
      },
      CallExpression(node) {
        if (node.callee.name === 'require') {
          const [arg] = node.arguments;
          if (arg.value.startsWith('@leafygreen-ui')) {
            reportLeafygreenUsage(context, node, arg);
          }
        }
      }
    };
  }
};
